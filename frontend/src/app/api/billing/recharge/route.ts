import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { Prisma } from "@prisma/client";
import { toMoney, toJsonSafe } from "@/lib/money";
import { toApiError } from "@/lib/apiTypes";
import {
  creditsForAmount,
  getRazorpayCredentials,
  getRazorpayKeySecret,
  isPlanTier,
  verifyHmacHex,
} from "@/lib/razorpay";

const MIN_ORDER_AMOUNT = 1;
const MAX_ORDER_AMOUNT = 500000;

export async function GET() {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      transactions: toJsonSafe(user.transactions)
    });
  } catch (error: unknown) {
    console.error("[recharge GET]", error);
    return NextResponse.json({ status: "error", message: "Failed to load transactions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { amount, action, planTier } = body;

    // Action: create_order (Creates real server-side order with verified amount)
    if (action === "create_order") {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_ORDER_AMOUNT || parsedAmount > MAX_ORDER_AMOUNT) {
        return NextResponse.json({
          status: "error",
          message: `Order amount must be between ₹${MIN_ORDER_AMOUNT} and ₹${MAX_ORDER_AMOUNT}.`
        }, { status: 400 });
      }
      // Paise precision only
      const orderAmount = Math.round(parsedAmount * 100) / 100;

      if (planTier !== undefined && planTier !== null && !isPlanTier(planTier)) {
        return NextResponse.json({ status: "error", message: "Invalid plan tier." }, { status: 400 });
      }

      // Credentials come from DB/env; known dummy or placeholder values are rejected.
      const creds = await getRazorpayCredentials();
      if (!creds) {
        return NextResponse.json({
          status: "error",
          message: "Payment gateway not configured. Please set Razorpay Key ID and Secret in Admin → Settings → Payments."
        }, { status: 500 });
      }
      const razorpayKey = creds.keyId;
      const razorpaySecret = creds.keySecret;

      let orderId = "";
      try {
        // Create real server-side order on Razorpay Orders API
        const authHeader = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString("base64");
        const orderPayload = {
          amount: Math.round(orderAmount * 100), // amount in paise
          currency: "INR",
          receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now().toString().slice(-6)}`,
          notes: {
            userId: user.id,
            userEmail: user.email,
            purpose: planTier ? "subscription_upgrade" : "wallet_recharge",
            ...(planTier ? { planTier } : {})
          }
        };

        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(orderPayload)
        });

        if (!rzpRes.ok) {
          const rzpErr = await rzpRes.json();
          return NextResponse.json({
            status: "error",
            message: `Razorpay Order creation failed: ${rzpErr?.error?.description || rzpRes.statusText}`
          }, { status: 502 });
        }

        const rzpData = await rzpRes.json();
        orderId = rzpData.id;
      } catch (err: unknown) {
        console.error("[recharge] Razorpay order network error:", err);
        return NextResponse.json({
          status: "error",
          message: "Network error connecting to the payment gateway."
        }, { status: 502 });
      }

      // Record pending transaction with exact server-side amount to prevent client tampering
      await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: orderAmount,
          creditsAdded: 0,
          paymentGateway: "RAZORPAY",
          gatewayOrderId: orderId,
          status: "PENDING",
          webhookVerified: false
        }
      });

      return NextResponse.json({
        status: "success",
        orderId,
        amount: orderAmount,
        currency: "INR",
        key: razorpayKey
      });
    }

    // Action: verify_and_credit (Strictly verifies Razorpay HMAC SHA-256 signature)
    if (action === "verify_and_credit") {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
      // The amount is taken from the server-side pending order, never from the client.
      const razorpaySecret = await getRazorpayKeySecret();
      if (!razorpaySecret) {
        return NextResponse.json({
          status: "error",
          message: "Razorpay Secret is not configured. Payment verification impossible."
        }, { status: 500 });
      }

      if (
        typeof razorpayOrderId !== "string" || typeof razorpayPaymentId !== "string" ||
        typeof razorpaySignature !== "string" || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature
      ) {
        return NextResponse.json({
          status: "error",
          message: "Missing Razorpay payment verification parameters."
        }, { status: 400 });
      }

      if (!verifyHmacHex(`${razorpayOrderId}|${razorpayPaymentId}`, razorpaySignature, razorpaySecret)) {
        return NextResponse.json({
          status: "error",
          message: "Cryptographic payment verification failed. Invalid Razorpay signature."
        }, { status: 400 });
      }

      // 2. Prevent replay attacks: ensure paymentId hasn't already been processed
      if (razorpayPaymentId) {
        const existingSuccessTx = await prisma.transaction.findFirst({
          where: { gatewayPaymentId: razorpayPaymentId, status: "SUCCESS" }
        });
        if (existingSuccessTx) {
          return NextResponse.json({
            status: "error",
            message: "This payment has already been credited."
          }, { status: 400 });
        }
      }

      // 3. MANDATORY Server-side Order Verification:
      // Prevent attackers from presenting a valid signature for order X (e.g. ₹10) but claiming amount Y (e.g. ₹100,000)
      if (!razorpayOrderId) {
        return NextResponse.json({
          status: "error",
          message: "razorpayOrderId is strictly mandatory for payment crediting."
        }, { status: 400 });
      }

      const pendingOrder = await prisma.transaction.findFirst({
        where: { 
          gatewayOrderId: razorpayOrderId, 
          userId: user.id,
          status: "PENDING"
        }
      });

      if (!pendingOrder) {
        return NextResponse.json({
          status: "error",
          message: "No pending payment order found matching this order ID for your account. Replay or unverified order rejected."
        }, { status: 400 });
      }

      // Exact server-verified amount from the pending order created during create_order
      const verifiedAmount = toMoney(pendingOrder.amount);
      if (verifiedAmount <= 0) {
        return NextResponse.json({
          status: "error",
          message: "Invalid registered order amount."
        }, { status: 400 });
      }

      // Calculate tier bonus credits strictly based on server-verified amount
      const creditsToAdd = creditsForAmount(verifiedAmount);
      const finalPaymentId = razorpayPaymentId;

      // ATOMIC RACE-CONDITION SAFE SETTLEMENT:
      // Interactive transaction rolls back automatically if count !== 1, preventing double credits
      let result;
      try {
        result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const updateResult = await tx.transaction.updateMany({
            where: {
              id: pendingOrder.id,
              status: "PENDING"
            },
            data: {
              creditsAdded: creditsToAdd,
              gatewayPaymentId: finalPaymentId,
              webhookVerified: true,
              status: "SUCCESS"
            }
          });

          if (updateResult.count !== 1) {
            throw new Error("ORDER_ALREADY_SETTLED");
          }

          const updatedUser = await tx.user.update({
            where: { email: session.email },
            data: {
              walletBalance: { increment: creditsToAdd }
            }
          });

          const settledTx = await tx.transaction.findUnique({
            where: { id: pendingOrder.id }
          });

          return { updatedUser, settledTx };
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
        message: `Successfully credited ₹${creditsToAdd.toFixed(2)} to wallet.`,
        transaction: toJsonSafe(result.settledTx),
        newBalance: toMoney(result.updatedUser.walletBalance)
      });
    }

    // Action: mark_failed (When payment modal is dismissed or gateway payment fails on frontend)
    if (action === "mark_failed") {
      const { razorpayOrderId, razorpayPaymentId, reason } = body;
      if (razorpayOrderId) {
        await prisma.transaction.updateMany({
          where: { gatewayOrderId: razorpayOrderId, userId: user.id, status: "PENDING" },
          data: {
            status: "FAILED",
            gatewayPaymentId: razorpayPaymentId || null,
            webhookVerified: true
          }
        });
      }
      return NextResponse.json({ status: "success", message: "Transaction marked as failed." });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("[recharge POST]", error);
    return NextResponse.json({ status: "error", message: "Payment request failed. Please try again." }, { status: 500 });
  }
}
