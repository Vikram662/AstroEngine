import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
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

      const orderId = `order_${crypto.randomBytes(8).toString("hex")}`;
      
      const dbKeySetting = await prisma.systemSetting.findUnique({
        where: { key: "RAZORPAY_KEY_ID" }
      });
      const razorpayKey = dbKeySetting?.value || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        return NextResponse.json({
          status: "error",
          message: "Razorpay Key ID is not configured in Database SystemSettings or environment variables."
        }, { status: 500 });
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

      // Fetch Razorpay Secret from Database or Environment (Strict check, no hardcoded fallback)
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

      // 1. In production, signature, paymentId, and orderId are strictly mandatory
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json({
            status: "error",
            message: "Missing Razorpay payment verification parameters."
          }, { status: 400 });
        }
      } else {
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

      // 3. Verify server-side order amount from database to prevent client tampering
      let verifiedAmount = parsedAmount;
      if (razorpayOrderId) {
        const pendingOrder = await prisma.transaction.findFirst({
          where: { gatewayOrderId: razorpayOrderId, userId: user.id }
        });
        if (pendingOrder && pendingOrder.amount > 0) {
          verifiedAmount = pendingOrder.amount;
        }
      }

      // Calculate tier bonus credits
      const creditsToAdd = verifiedAmount >= 10000 ? verifiedAmount * 1.25 : verifiedAmount >= 5000 ? verifiedAmount * 1.16 : verifiedAmount >= 2000 ? verifiedAmount * 1.10 : verifiedAmount;
      const finalPaymentId = razorpayPaymentId || `pay_${crypto.randomBytes(8).toString("hex")}`;
      const finalOrderId = razorpayOrderId || body.orderId || `order_${crypto.randomBytes(6).toString("hex")}`;

      const updatedUser = await prisma.user.update({
        where: { email: session.email },
        data: {
          walletBalance: { increment: creditsToAdd }
        }
      });

      // Update existing pending transaction or create settled transaction record
      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: verifiedAmount,
          creditsAdded: creditsToAdd,
          paymentGateway: "RAZORPAY",
          gatewayOrderId: finalOrderId,
          gatewayPaymentId: finalPaymentId,
          webhookVerified: true,
          status: "SUCCESS"
        }
      });

      return NextResponse.json({
        status: "success",
        message: `Successfully credited ₹${creditsToAdd.toFixed(2)} to wallet.`,
        transaction: tx,
        newBalance: updatedUser.walletBalance
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
