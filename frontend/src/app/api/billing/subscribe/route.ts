import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session) {
      return NextResponse.json({ status: "error", message: "Unauthorized. Please sign in." }, { status: 401 });
    }
    const sessionEmail = session.email;

    const body = await req.json();
    const { planTier, paymentMethod = "WALLET", gatewayOrderId, gatewayPaymentId, gatewaySignature } = body; 
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
      const dbSecretSetting = await prisma.systemSetting.findUnique({
        where: { key: "RAZORPAY_KEY_SECRET" }
      });
      const razorpaySecret = dbSecretSetting?.value || process.env.RAZORPAY_KEY_SECRET;
      if (!razorpaySecret) {
        return NextResponse.json({
          status: "error",
          message: "Razorpay Secret is not configured. Payment verification impossible."
        }, { status: 500 });
      }

      if (!gatewayOrderId || !gatewayPaymentId || !gatewaySignature) {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json({
            status: "error",
            message: "Missing Razorpay payment verification parameters."
          }, { status: 400 });
        }
      } else {
        const bodyToSign = `${gatewayOrderId}|${gatewayPaymentId}`;
        const expectedSignature = crypto
          .createHmac("sha256", razorpaySecret)
          .update(bodyToSign)
          .digest("hex");

        const isSigValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, "utf-8"),
          Buffer.from(gatewaySignature, "utf-8")
        );

        if (!isSigValid) {
          return NextResponse.json({
            status: "error",
            message: "Cryptographic payment verification failed. Invalid Razorpay signature."
          }, { status: 400 });
        }
      }

      // Check for replay attacks
      if (gatewayPaymentId) {
        const existingTx = await prisma.transaction.findFirst({
          where: { gatewayPaymentId }
        });
        if (existingTx) {
          return NextResponse.json({
            status: "error",
            message: "This payment has already been processed."
          }, { status: 400 });
        }
      }

      // Verify server-side pending order to bind exact amount and prevent tampering
      if (!gatewayOrderId) {
        return NextResponse.json({
          status: "error",
          message: "gatewayOrderId is required for gateway subscription upgrade."
        }, { status: 400 });
      }

      const pendingOrder = await prisma.transaction.findFirst({
        where: {
          gatewayOrderId,
          userId: user.id,
          status: "PENDING"
        }
      });

      if (!pendingOrder) {
        return NextResponse.json({
          status: "error",
          message: "No pending payment order found matching this order ID for your account."
        }, { status: 400 });
      }

      if (pendingOrder.amount < netPayablePrice) {
        return NextResponse.json({
          status: "error",
          message: `Order amount (₹${pendingOrder.amount}) does not match net payable price (₹${netPayablePrice}).`
        }, { status: 400 });
      }

      const verifiedPaymentId = gatewayPaymentId || `pay_sub_${crypto.randomBytes(6).toString("hex")}`;
      const nextRenewal = new Date();
      nextRenewal.setDate(nextRenewal.getDate() + 30);

      // Interactive transaction rolls back automatically if count !== 1, preventing double activation/upgrades
      let subResult;
      try {
        subResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const updateResult = await tx.transaction.updateMany({
            where: {
              id: pendingOrder.id,
              status: "PENDING"
            },
            data: {
              gatewayPaymentId: verifiedPaymentId,
              webhookVerified: true,
              status: "SUCCESS"
            }
          });

          if (updateResult.count !== 1) {
            throw new Error("ORDER_ALREADY_SETTLED");
          }

          const updatedUser = await tx.user.update({
            where: { email: sessionEmail },
            data: {
              planTier: plan.tier,
              monthlyQuota: plan.includedQuota,
              rateLimitPerMin: plan.rateLimitPerMin,
            }
          });

          const sub = await tx.subscription.upsert({
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

          const settledTx = await tx.transaction.findUnique({
            where: { id: pendingOrder.id }
          });

          return { updatedUser, sub, settledTx };
        });
      } catch (txErr: any) {
        if (txErr?.message === "ORDER_ALREADY_SETTLED") {
          return NextResponse.json({
            status: "error",
            message: "Payment order has already been processed or settled concurrently."
          }, { status: 409 });
        }
        throw txErr;
      }

      return NextResponse.json({
        status: "success",
        message: proratedDiscount > 0
          ? `Plan upgraded to ${plan.name} via Razorpay! Adjusted for ${remainingDays} unused days (-₹${proratedDiscount.toFixed(2)}). Paid ₹${netPayablePrice.toFixed(2)}.`
          : `Plan upgraded to ${plan.name} via Razorpay successfully! Paid ₹${netPayablePrice.toFixed(2)}.`,
        plan: plan.name,
        monthlyQuota: plan.includedQuota,
        proratedDiscount,
        netPaid: netPayablePrice,
        subscription: subResult.sub,
        transaction: subResult.settledTx
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid payment method" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
