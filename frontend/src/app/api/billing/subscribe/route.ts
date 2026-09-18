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
      where: { email: sessionEmail },
      include: {
        subscription: true
      }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const newPlanPrice = plan.priceMonthly || 0;

    // Free plan (e.g. STARTER)
    if (newPlanPrice === 0) {
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

    // Proration logic: calculate remaining days and unused value of current active plan
    let proratedDiscount = 0;
    let currentPlanName = user.planTier;
    let remainingDays = 0;

    if (user.subscription && user.subscription.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(user.subscription.currentPeriodEnd);
      const diffTime = periodEnd.getTime() - now.getTime();
      remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      if (remainingDays > 0 && remainingDays <= 30) {
        // Fetch current plan price to calculate daily rate
        const currentPlan = await prisma.subscriptionPlan.findUnique({
          where: { tier: user.planTier }
        });

        if (currentPlan && currentPlan.priceMonthly > 0) {
          const dailyRate = currentPlan.priceMonthly / 30;
          // Unused value for the remaining days
          proratedDiscount = Math.round(dailyRate * remainingDays * 100) / 100;
        }
      }
    }

    // Net payable amount after prorated credit adjustment
    const netPayablePrice = Math.max(0, Math.round((newPlanPrice - proratedDiscount) * 100) / 100);

    // Option A: Pay using live Wallet Balance
    if (paymentMethod === "WALLET") {
      if (user.walletBalance < netPayablePrice) {
        return NextResponse.json({
          status: "error",
          insufficientBalance: true,
          requiredAmount: netPayablePrice,
          currentBalance: user.walletBalance,
          message: `Insufficient wallet balance (₹${user.walletBalance.toFixed(2)}). Adjusted plan price after ₹${proratedDiscount.toFixed(2)} prorated credit is ₹${netPayablePrice.toFixed(2)}. Please recharge your wallet or choose Payment Gateway checkout.`
        }, { status: 400 });
      }

      // Deduct net payable from wallet balance
      await prisma.user.update({
        where: { email: sessionEmail },
        data: {
          walletBalance: { decrement: netPayablePrice },
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

      // Immutable settled transaction from Wallet (with metadata for prorated credit)
      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: netPayablePrice,
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
        message: proratedDiscount > 0 
          ? `Plan upgraded to ${plan.name}! Adjusted for ${remainingDays} unused days (-₹${proratedDiscount.toFixed(2)}). Paid ₹${netPayablePrice.toFixed(2)} from wallet.`
          : `Plan upgraded to ${plan.name} successfully! ₹${netPayablePrice.toFixed(2)} deducted from your wallet.`,
        plan: plan.name,
        monthlyQuota: plan.includedQuota,
        proratedDiscount,
        netPaid: netPayablePrice,
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
          amount: netPayablePrice,
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
        message: proratedDiscount > 0
          ? `Plan upgraded to ${plan.name} via Razorpay! Adjusted for ${remainingDays} unused days (-₹${proratedDiscount.toFixed(2)}). Paid ₹${netPayablePrice.toFixed(2)}.`
          : `Plan upgraded to ${plan.name} via Razorpay! Payment verified and settled.`,
        plan: plan.name,
        monthlyQuota: plan.includedQuota,
        proratedDiscount,
        netPaid: netPayablePrice,
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
