import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { OfferValidationError, recordOfferRedemption, resolveOfferForUser } from "@/lib/offers";
import { toMoney, toJsonSafe } from "@/lib/money";
import { toApiError } from "@/lib/apiTypes";

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session) {
      return NextResponse.json({ status: "error", message: "Unauthorized. Please sign in." }, { status: 401 });
    }
    const sessionEmail = session.email;

    const body = await req.json();
    const { planTier, paymentMethod = "WALLET", gatewayOrderId, gatewayPaymentId, gatewaySignature, offerCode } = body;
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

    const newPlanPrice = toMoney(plan.priceMonthly);

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
    const currentPlanName = user.planTier;
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

        const currentPlanPrice = toMoney(currentPlan?.priceMonthly);
        if (currentPlanPrice > 0) {
          const dailyRate = currentPlanPrice / 30;
          // Unused value for the remaining days
          proratedDiscount = Math.round(dailyRate * remainingDays * 100) / 100;
        }
      }
    }

    // Net payable amount after prorated credit adjustment
    const adjustedPlanPrice = Math.max(0, Math.round((newPlanPrice - proratedDiscount) * 100) / 100);
    const appliedOffer = await resolveOfferForUser({
      userId: user.id,
      code: offerCode,
      targetType: "PLAN",
      targetId: plan.tier,
      amount: adjustedPlanPrice,
    });
    const netPayablePrice = appliedOffer?.finalAmount ?? adjustedPlanPrice;

    // Option A: Pay using live Wallet Balance
    if (paymentMethod === "WALLET") {
      const currentWalletBalance = toMoney(user.walletBalance);
      if (currentWalletBalance < netPayablePrice) {
        return NextResponse.json({
          status: "error",
          insufficientBalance: true,
          requiredAmount: netPayablePrice,
          currentBalance: currentWalletBalance,
          message: `Insufficient wallet balance (₹${currentWalletBalance.toFixed(2)}). Adjusted plan price after ₹${proratedDiscount.toFixed(2)} prorated credit is ₹${netPayablePrice.toFixed(2)}. Please recharge your wallet or choose Payment Gateway checkout.`
        }, { status: 400 });
      }

      const nextRenewal = new Date();
      nextRenewal.setDate(nextRenewal.getDate() + 30);
      const orderReference = `wallet_sub_${crypto.randomBytes(6).toString("hex")}`;
      const walletResult = await prisma.$transaction(async (db: Prisma.TransactionClient) => {
        await recordOfferRedemption(db, user.id, appliedOffer, orderReference);
        await db.user.update({
          where: { email: sessionEmail },
          data: {
            walletBalance: { decrement: netPayablePrice },
            planTier: plan.tier,
            monthlyQuota: plan.includedQuota,
            rateLimitPerMin: plan.rateLimitPerMin,
          },
        });
        const sub = await db.subscription.upsert({
          where: { userId: user.id },
          update: { planTier: plan.tier, status: "ACTIVE", currentPeriodEnd: nextRenewal },
          create: {
            userId: user.id,
            planTier: plan.tier,
            gatewaySubId: `sub_wallet_${crypto.randomBytes(6).toString("hex")}`,
            status: "ACTIVE",
            currentPeriodEnd: nextRenewal,
          },
        });
        const transaction = await db.transaction.create({
          data: {
            userId: user.id,
            amount: netPayablePrice,
            creditsAdded: 0,
            paymentGateway: "WALLET",
            gatewayOrderId: orderReference,
            gatewayPaymentId: `wallet_debit_${crypto.randomBytes(6).toString("hex")}`,
            webhookVerified: true,
            status: "SUCCESS",
          },
        });
        return { sub, transaction };
      });

      return NextResponse.json({
        status: "success",
        message: `Plan upgraded to ${plan.name}. Paid ₹${netPayablePrice.toFixed(2)} from wallet${appliedOffer ? ` after offer ${appliedOffer.code} saved ₹${appliedOffer.discountAmount.toFixed(2)}` : ""}.`,
        plan: plan.name,
        monthlyQuota: plan.includedQuota,
        proratedDiscount,
        offerDiscount: appliedOffer?.discountAmount || 0,
        offerCode: appliedOffer?.code || null,
        netPaid: netPayablePrice,
        subscription: toJsonSafe(walletResult.sub),
        transaction: toJsonSafe(walletResult.transaction),
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

      const pendingOrderAmount = toMoney(pendingOrder.amount);
      if (pendingOrderAmount < netPayablePrice) {
        return NextResponse.json({
          status: "error",
          message: `Order amount (₹${pendingOrderAmount.toFixed(2)}) does not match net payable price (₹${netPayablePrice.toFixed(2)}).`
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

          await recordOfferRedemption(tx, user.id, appliedOffer, gatewayOrderId);

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
      } catch (txErrCaught) { const txErr = toApiError(txErrCaught);
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
        message: `Plan upgraded to ${plan.name} via Razorpay. Paid ₹${netPayablePrice.toFixed(2)}${appliedOffer ? ` after offer ${appliedOffer.code} saved ₹${appliedOffer.discountAmount.toFixed(2)}` : ""}.`,
        plan: plan.name,
        monthlyQuota: plan.includedQuota,
        proratedDiscount,
        offerDiscount: appliedOffer?.discountAmount || 0,
        offerCode: appliedOffer?.code || null,
        netPaid: netPayablePrice,
        subscription: toJsonSafe(subResult.sub),
        transaction: toJsonSafe(subResult.settledTx)
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid payment method" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: error instanceof OfferValidationError ? 400 : 500 },
    );
  }
}
