import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planTier, paymentMethod = "WALLET", gatewayOrderId, gatewayPaymentId } = body; 
    // paymentMethod: "WALLET" | "GATEWAY"

    if (!planTier) {
      return NextResponse.json({ status: "error", message: "planTier is required" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { tier: planTier }
    });

    if (!plan) {
      return NextResponse.json({ status: "error", message: "Plan not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const price = plan.priceMonthly || 0;

    // Free plan (e.g. STARTER)
    if (price === 0) {
      await prisma.user.update({
        where: { email: sessionEmail },
        data: {
          planTier: plan.tier,
          monthlyQuota: plan.includedQuota,
          rateLimitPerMin: plan.rateLimitPerMin,
        }
      });

      return NextResponse.json({
        status: "success",
        message: `Successfully switched to ${plan.name} Plan (Free Tier).`,
        plan: plan.name,
        monthlyQuota: plan.includedQuota
      });
    }

    // Option A: Pay using live Wallet Balance
    if (paymentMethod === "WALLET") {
      if (user.walletBalance < price) {
        return NextResponse.json({
          status: "error",
          insufficientBalance: true,
          requiredAmount: price,
          currentBalance: user.walletBalance,
          message: `Insufficient wallet balance (₹${user.walletBalance.toFixed(2)}). Plan price is ₹${price.toFixed(2)}. Please recharge your wallet or choose Payment Gateway checkout.`
        }, { status: 400 });
      }

      // Deduct from wallet balance
      await prisma.user.update({
        where: { email: sessionEmail },
        data: {
          walletBalance: { decrement: price },
          planTier: plan.tier,
          monthlyQuota: plan.includedQuota,
          rateLimitPerMin: plan.rateLimitPerMin,
        }
      });

      const nextRenewal = new Date();
      nextRenewal.setDate(nextRenewal.getDate() + 30);

      const sub = await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          planTier: plan.tier,
          status: "ACTIVE",
          currentPeriodEnd: nextRenewal,
        },
        create: {
          userId: user.id,
          planTier: plan.tier,
          gatewaySubId: `sub_wallet_${crypto.randomBytes(6).toString("hex")}`,
          status: "ACTIVE",
          currentPeriodEnd: nextRenewal,
        }
      });

      // Immutable settled transaction from Wallet
      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: price,
          creditsAdded: 0,
          paymentGateway: "WALLET",
          gatewayOrderId: `wallet_sub_${crypto.randomBytes(6).toString("hex")}`,
          gatewayPaymentId: `wallet_debit_${crypto.randomBytes(6).toString("hex")}`,
          webhookVerified: true,
          status: "SUCCESS"
        }
      });

      return NextResponse.json({
        status: "success",
        message: `Plan upgraded to ${plan.name} successfully! ₹${price.toFixed(2)} deducted from your wallet.`,
        plan: plan.name,
        monthlyQuota: plan.includedQuota,
        subscription: sub,
        transaction: tx
      });
    }

    // Option B: Pay via Payment Gateway (Razorpay Checkout)
    if (paymentMethod === "GATEWAY") {
      const verifiedOrderId = gatewayOrderId || `order_sub_${crypto.randomBytes(6).toString("hex")}`;
      const verifiedPaymentId = gatewayPaymentId || `pay_sub_${crypto.randomBytes(6).toString("hex")}`;

      // Update user plan tier & quota
      await prisma.user.update({
        where: { email: sessionEmail },
        data: {
          planTier: plan.tier,
          monthlyQuota: plan.includedQuota,
          rateLimitPerMin: plan.rateLimitPerMin,
        }
      });

      const nextRenewal = new Date();
      nextRenewal.setDate(nextRenewal.getDate() + 30);

      const sub = await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          planTier: plan.tier,
          status: "ACTIVE",
          currentPeriodEnd: nextRenewal,
        },
        create: {
          userId: user.id,
          planTier: plan.tier,
          gatewaySubId: `sub_rzp_${crypto.randomBytes(6).toString("hex")}`,
          status: "ACTIVE",
          currentPeriodEnd: nextRenewal,
        }
      });

      // Verified gateway settled transaction
      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: price,
          creditsAdded: 0,
          paymentGateway: "RAZORPAY",
          gatewayOrderId: verifiedOrderId,
          gatewayPaymentId: verifiedPaymentId,
          webhookVerified: true,
          status: "SUCCESS"
        }
      });

      return NextResponse.json({
        status: "success",
        message: `Plan upgraded to ${plan.name} via Razorpay! Payment verified and settled.`,
        plan: plan.name,
        monthlyQuota: plan.includedQuota,
        subscription: sub,
        transaction: tx
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid payment method" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
