import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

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
      transactions: user.transactions
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
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
    const { amount, action } = body;

    // Action: create_order (Creates real server-side order with verified amount)
    if (action === "create_order") {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ status: "error", message: "Invalid order amount." }, { status: 400 });
      }
      
      // 1. Fetch Razorpay Key and Secret with Database (SystemSetting table) taking first priority
      const dbKeySetting = await prisma.systemSetting.findUnique({
        where: { key: "RAZORPAY_KEY_ID" }
      });
      const razorpayKey = dbKeySetting?.value || process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
      
      const dbSecretSetting = await prisma.systemSetting.findUnique({
        where: { key: "RAZORPAY_KEY_SECRET" }
      });
      let razorpaySecret = dbSecretSetting?.value || process.env.RAZORPAY_KEY_SECRET || "";
      if (razorpaySecret.includes("placeholder")) {
        razorpaySecret = dbSecretSetting?.value || "";
      }

      if (!razorpayKey || !razorpaySecret) {
        return NextResponse.json({
          status: "error",
          message: "Razorpay Key ID and Secret must be configured to generate payment orders."
        }, { status: 500 });
      }

      let orderId = "";
      try {
        // Create real server-side order on Razorpay Orders API
        const authHeader = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString("base64");
        const orderPayload = {
          amount: Math.round(parsedAmount * 100), // amount in paise
          currency: "INR",
          receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now().toString().slice(-6)}`,
          notes: {
            userId: user.id,
            userEmail: user.email,
            purpose: "wallet_recharge"
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
        const error = err as { message?: string };
        return NextResponse.json({
          status: "error",
          message: `Network error connecting to Razorpay Orders API: ${error.message || "Unknown"}`
        }, { status: 502 });
      }

      // Record pending transaction with exact server-side amount to prevent client tampering
      await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: parsedAmount,
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
        amount: parsedAmount,
        currency: "INR",
        key: razorpayKey
      });
    }

    // Action: verify_and_credit (Strictly verifies Razorpay HMAC SHA-256 signature)
    if (action === "verify_and_credit") {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
      const parsedAmount = parseFloat(amount);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ status: "error", message: "Invalid recharge amount." }, { status: 400 });
      }

      // Fetch Razorpay Secret: Database (SystemSetting) takes priority
      const dbSecretSetting = await prisma.systemSetting.findUnique({
        where: { key: "RAZORPAY_KEY_SECRET" }
      });
      let razorpaySecret = dbSecretSetting?.value || process.env.RAZORPAY_KEY_SECRET || "";
      if (razorpaySecret.includes("placeholder")) {
        razorpaySecret = dbSecretSetting?.value || "";
      }
      if (!razorpaySecret) {
        return NextResponse.json({
          status: "error",
          message: "Razorpay Secret is not configured. Payment verification impossible."
        }, { status: 500 });
      }

      // 1. Signature, paymentId, and orderId are strictly mandatory
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json({
          status: "error",
          message: "Missing Razorpay payment verification parameters."
        }, { status: 400 });
      }

      // Cryptographic HMAC SHA-256 Signature Verification:
      const bodyToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", razorpaySecret)
        .update(bodyToSign)
        .digest("hex");

      const isSigValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(razorpaySignature, "utf-8")
      );

      if (!isSigValid) {
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
      const verifiedAmount = pendingOrder.amount;
      if (verifiedAmount <= 0) {
        return NextResponse.json({
          status: "error",
          message: "Invalid registered order amount."
        }, { status: 400 });
      }

      // Calculate tier bonus credits strictly based on server-verified amount
      const creditsToAdd = verifiedAmount >= 10000 ? verifiedAmount * 1.25 : verifiedAmount >= 5000 ? verifiedAmount * 1.16 : verifiedAmount >= 2000 ? verifiedAmount * 1.10 : verifiedAmount;
      const finalPaymentId = razorpayPaymentId || `pay_${crypto.randomBytes(8).toString("hex")}`;

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
        message: `Successfully credited ₹${creditsToAdd.toFixed(2)} to wallet.`,
        transaction: result.settledTx,
        newBalance: result.updatedUser.walletBalance
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
