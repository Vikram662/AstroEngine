import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { toMoney } from "@/lib/money";
import { issueSaleInvoice } from "@/lib/invoicing";
import { safeEnqueue } from "@/lib/notifications";
import {
  creditsForAmount,
  getRazorpayWebhookSecret,
  isPlanTier,
  verifyHmacHex,
} from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ status: "error", message: "Missing x-razorpay-signature header" }, { status: 400 });
    }

    // No hardcoded fallback: if the secret is not configured (or is one of the
    // known public dummy values) every webhook is refused.
    const webhookSecret = await getRazorpayWebhookSecret();
    if (!webhookSecret) {
      console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured; rejecting event");
      return NextResponse.json({ status: "error", message: "Webhook not configured" }, { status: 503 });
    }

    if (!verifyHmacHex(rawBody, signature, webhookSecret)) {
      console.warn("[Razorpay Webhook] Invalid signature rejected");
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event;
    const payload = event?.payload;

    console.log(`[Razorpay Webhook] Received verified event: ${eventType}`);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        return NextResponse.json({ status: "ignored", message: "No order_id in event payload" }, { status: 200 });
      }

      const transaction = await prisma.transaction.findFirst({
        where: { gatewayOrderId: orderId },
      });

      if (!transaction) {
        console.warn(`[Razorpay Webhook] No transaction found for gatewayOrderId: ${orderId}`);
        return NextResponse.json({ status: "ignored", message: "Transaction record not found" }, { status: 200 });
      }

      if (transaction.status === "SUCCESS") {
        return NextResponse.json({ status: "success", message: "Already processed" }, { status: 200 });
      }

      const verifiedAmount = toMoney(transaction.amount);

      // The paid amount must match what we recorded when the order was created.
      const paidPaise = paymentEntity?.amount ?? orderEntity?.amount_paid;
      if (typeof paidPaise === "number" && Math.round(verifiedAmount * 100) !== paidPaise) {
        console.error(`[Razorpay Webhook] Amount mismatch for ${orderId}: recorded ${verifiedAmount}, paid ${paidPaise / 100}`);
        return NextResponse.json({ status: "error", message: "Amount mismatch" }, { status: 400 });
      }

      // A plan is activated from the webhook only if the amount actually paid
      // covers it. The notes are client-influenced, so they are never trusted
      // on their own: an underpaid "plan" order is treated as a wallet top-up.
      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const requestedTier = notes.planTier || notes.plan;

      if (isPlanTier(requestedTier)) {
        const [plan, user] = await Promise.all([
          prisma.subscriptionPlan.findUnique({ where: { tier: requestedTier } }),
          prisma.user.findUnique({ where: { id: transaction.userId }, select: { planTier: true } }),
        ]);
        const currentPlan = user ? await prisma.subscriptionPlan.findUnique({ where: { tier: user.planTier } }) : null;

        if (plan) {
          // Proration can credit at most the current plan's full price.
          const floor = Math.max(0, toMoney(plan.priceMonthly) - toMoney(currentPlan?.priceMonthly));

          if (verifiedAmount + 0.005 >= floor && verifiedAmount > 0) {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
              const updateCount = await tx.transaction.updateMany({
                where: { id: transaction.id, status: { in: ["PENDING", "FAILED"] } }, // FAILED: client-side dismissal before a late capture
                data: {
                  status: "SUCCESS",
                  gatewayPaymentId: paymentId || transaction.gatewayPaymentId,
                  webhookVerified: true,
                },
              });

              if (updateCount.count === 1) {
                await issueSaleInvoice(tx, { ...transaction, status: "SUCCESS" });
                await safeEnqueue(tx, transaction.userId, "PAYMENT_RECEIVED", { amount: verifiedAmount, description: `${plan.name} plan` }, { dedupeKey: `PAYMENT:${transaction.id}` });
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
          console.warn(`[Razorpay Webhook] Order ${orderId} paid ₹${verifiedAmount} < plan floor ₹${floor}; crediting wallet instead`);
        }
      }

      // Default: wallet recharge
      const creditsToAdd = creditsForAmount(verifiedAmount);

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updateCount = await tx.transaction.updateMany({
          where: { id: transaction.id, status: { in: ["PENDING", "FAILED"] } }, // FAILED: client-side dismissal before a late capture
          data: {
            creditsAdded: creditsToAdd,
            gatewayPaymentId: paymentId || transaction.gatewayPaymentId,
            webhookVerified: true,
            status: "SUCCESS",
          },
        });

        if (updateCount.count === 1) {
          await tx.user.update({
            where: { id: transaction.userId },
            data: { walletBalance: { increment: creditsToAdd } },
          });
          await safeEnqueue(tx, transaction.userId, "PAYMENT_RECEIVED", { amount: verifiedAmount, creditsAdded: creditsToAdd, description: "wallet top-up" }, { dedupeKey: `PAYMENT:${transaction.id}` });
          console.log(`[Razorpay Webhook] Credited ₹${creditsToAdd} to user ${transaction.userId}`);
        }
      });

      return NextResponse.json({ status: "success", message: "Payment processed successfully" }, { status: 200 });
    }

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
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
