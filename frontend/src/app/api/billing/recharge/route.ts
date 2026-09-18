import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
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
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { amount, action } = body;

    // Action: create_order (simulates Razorpay order creation)
    if (action === "create_order") {
      const orderId = `order_${crypto.randomBytes(8).toString("hex")}`;
      return NextResponse.json({
        status: "success",
        orderId,
        amount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_enterprise_key"
      });
    }

    // Action: verify_and_credit (simulates verified payment webhook / checkout completion)
    if (action === "verify_and_credit") {
      const creditsToAdd = amount >= 10000 ? amount * 1.25 : amount >= 5000 ? amount * 1.16 : amount >= 2000 ? amount * 1.10 : amount;
      const gatewayPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
      const orderId = body.orderId || `order_${crypto.randomBytes(6).toString("hex")}`;

      const updatedUser = await prisma.user.update({
        where: { email: sessionEmail },
        data: {
          walletBalance: { increment: creditsToAdd }
        }
      });

      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: parseFloat(amount),
          creditsAdded: creditsToAdd,
          paymentGateway: "RAZORPAY",
          gatewayOrderId: orderId,
          gatewayPaymentId: gatewayPaymentId,
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
