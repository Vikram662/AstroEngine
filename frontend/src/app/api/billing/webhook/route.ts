import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { toMoney } from "@/lib/money";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ status: "error", message: "Missing x-razorpay-signature header" }, { status: 400 });
    }

    // 1. Fetch Razorpay Webhook Secret (Priority: MySQL SystemSetting -> env)
    const secretSetting = await prisma.systemSetting.findUnique({
      where: { key: "RAZORPAY_WEBHOOK_SECRET" },
    });
    const webhookSecret =
      secretSetting?.value ||
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      "whsec_astro_enterprise_live2026";

    // 2. Cryptographic signature verification
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    let isSigValid = false;
    try {
      isSigValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signature, "utf-8")
      );
    } catch {
      isSigValid = false;
    }

    if (!isSigValid) {
      console.warn("[Razorpay Webhook] Invalid signature rejected");
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 400 });
    }

    // 3. Parse JSON event payload
    const event = JSON.parse(rawBody);
    const eventType = event?.event;
    const payload = event?.payload;

    console.log(`[Razorpay Webhook] Received verified event: ${eventType}`);

    // Handle payment.captured or order.paid
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        return NextResponse.json({ status: "ignored", message: "No order_id in event payload" }, { status: 200 });
      }

      // Check if transaction exists
      const transaction = await prisma.transaction.findFirst({
        where: { gatewayOrderId: orderId },
        include: { user: true },
      });

      if (!transaction) {
        console.warn(`[Razorpay Webhook] No transaction found for gatewayOrderId: ${orderId}`);
        return NextResponse.json({ status: "ignored", message: "Transaction record not found" }, { status: 200 });
      }

      // Idempotency: If already settled, return 200 OK immediately
      if (transaction.status === "SUCCESS") {
        return NextResponse.json({ status: "success", message: "Already processed" }, { status: 200 });
      }

      const verifiedAmount = toMoney(transaction.amount);

      // Check if this transaction is for a subscription or wallet recharge
      // Check if user has an associated pending subscription or notes
      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const planTier = notes.planTier || notes.plan;

      if (planTier && (planTier === "STARTER" || planTier === "PRO" || planTier === "ENTERPRISE")) {
        // Handle Subscription upgrade via Webhook
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { tier: planTier },
        });

        if (plan) {
          await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const updateCount = await tx.transaction.updateMany({
              where: { id: transaction.id, status: "PENDING" },
              data: {
                status: "SUCCESS",
                gatewayPaymentId: paymentId || transaction.gatewayPaymentId,
                webhookVerified: true,
              },
            });

            if (updateCount.count === 1) {
              const now = new Date();
              const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

              await tx.user.update({
                where: { id: transaction.userId },
                data: {
                  planTier: plan.tier,
                  monthlyQuota: plan.includedQuota,
                  rateLimitPerMin: plan.rateLimitPerMin,
                },
              });

              await tx.subscription.upsert({
                where: { userId: transaction.userId },
                update: {
                  planTier: plan.tier,
                  status: "ACTIVE",
                  currentPeriodEnd: periodEnd,
                  gatewaySubId: orderId,
                  updatedAt: now,
                },
                create: {
                  userId: transaction.userId,
                  planTier: plan.tier,
                  status: "ACTIVE",
                  currentPeriodEnd: periodEnd,
                  gatewaySubId: orderId,
                },
              });
            }
          });
          return NextResponse.json({ status: "success", message: "Subscription activated" }, { status: 200 });
        }
      }

      // Default: Wallet Recharge
      // Calculate bonus credits based on amount tiers
      const creditsToAdd =
        verifiedAmount >= 10000
          ? verifiedAmount * 1.25
          : verifiedAmount >= 5000
          ? verifiedAmount * 1.16
          : verifiedAmount >= 2000
          ? verifiedAmount * 1.1
          : verifiedAmount;

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updateCount = await tx.transaction.updateMany({
          where: { id: transaction.id, status: "PENDING" },
          data: {
            creditsAdded: creditsToAdd,
            gatewayPaymentId: paymentId || transaction.gatewayPaymentId,
            webhookVerified: true,
            status: "SUCCESS",
          },
        });

        // If updated, credit wallet balance
        if (updateCount.count === 1) {
          await tx.user.update({
            where: { id: transaction.userId },
            data: {
              walletBalance: { increment: creditsToAdd },
            },
          });
          console.log(`[Razorpay Webhook] Successfully credited ₹${creditsToAdd} to user ${transaction.userId}`);
        }
      });

      return NextResponse.json({ status: "success", message: "Payment processed successfully" }, { status: 200 });
    }

    // Handle payment.failed event
    if (eventType === "payment.failed") {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        await prisma.transaction.updateMany({
          where: { gatewayOrderId: orderId, status: "PENDING" },
          data: {
            status: "FAILED",
            gatewayPaymentId: paymentId,
            webhookVerified: true,
          },
        });
        console.log(`[Razorpay Webhook] Marked transaction ${orderId} as FAILED`);
      }
      return NextResponse.json({ status: "success", message: "Failed payment noted" }, { status: 200 });
    }

    return NextResponse.json({ status: "ignored", message: `Event ${eventType} not handled` }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Razorpay Webhook Error]:", err);
    return NextResponse.json({ status: "error", message: err.message || "Internal server error" }, { status: 500 });
  }
}
