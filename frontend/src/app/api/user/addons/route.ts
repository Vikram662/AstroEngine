import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { Prisma } from "@prisma/client";

export interface AddonItem {
  id: string;
  name: string;
  category: string;
  priceMonthly: number;
  description: string;
  features: string[];
  icon: string;
}

// Helper to get strictly authenticated user
async function getAuthUser() {
  const session = await getVerifiedSession();
  if (!session || !session.email) return null;
  return await prisma.user.findUnique({
    where: { email: session.email }
  });
}

// GET /api/user/addons - Fetch active addons & complete catalog directly from MySQL
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const activeAddons: string[] = Array.isArray(user.activeAddons) ? (user.activeAddons as string[]) : [];

    // 1. Fetch live addon catalog directly from MySQL AddonPackage table
    const dbAddons = await (prisma as any).addonPackage.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" }
    });

    return NextResponse.json({
      status: "success",
      walletBalance: user.walletBalance,
      planTier: user.planTier,
      activeAddons,
      catalog: (dbAddons || []).map((addon: any) => ({
        ...addon,
        isActive: activeAddons.includes(addon.id) || user.planTier === "ENTERPRISE"
      }))
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// POST /api/user/addons - Activate or cancel an addon
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { addonId, action, paymentMethod = "WALLET", gatewayPaymentId, gatewayOrderId } = body; // action: "activate" | "deactivate"

    // Fetch addon details strictly from MySQL database
    const addon = await (prisma as any).addonPackage.findUnique({
      where: { id: addonId }
    });
    if (!addon) {
      return NextResponse.json({ status: "error", message: "Invalid addon specified" }, { status: 400 });
    }

    let activeAddons: string[] = Array.isArray(user.activeAddons) ? (user.activeAddons as string[]) : [];

    if (action === "activate") {
      if (activeAddons.includes(addonId)) {
        return NextResponse.json({ status: "success", message: `${addon.name} is already active on your account.` });
      }

      let newBalance = user.walletBalance;

      // OPTION 1: Pay via Razorpay Gateway directly
      if (paymentMethod === "GATEWAY") {
        const { gatewaySignature } = body;
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
          const crypto = await import("crypto");
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

        // Prevent replay attacks
        if (gatewayPaymentId) {
          const existingTx = await prisma.transaction.findFirst({
            where: { gatewayPaymentId, status: "SUCCESS" }
          });
          if (existingTx) {
            return NextResponse.json({
              status: "error",
              message: "This payment has already been credited."
            }, { status: 400 });
          }
        }

        // Verify server-side pending order to bind exact amount and prevent tampering
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

        if (pendingOrder.amount < addon.priceMonthly) {
          return NextResponse.json({
            status: "error",
            message: `Order amount (₹${pendingOrder.amount}) does not match addon price (₹${addon.priceMonthly}).`
          }, { status: 400 });
        }

        // ATOMIC RACE-CONDITION SAFE SETTLEMENT:
        try {
          await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const updateResult = await tx.transaction.updateMany({
              where: {
                id: pendingOrder.id,
                status: "PENDING"
              },
              data: {
                gatewayPaymentId: gatewayPaymentId || `pay_addon_${Date.now()}`,
                webhookVerified: true,
                status: "SUCCESS"
              }
            });

            if (updateResult.count !== 1) {
              throw new Error("ORDER_ALREADY_SETTLED");
            }

            activeAddons.push(addonId);
            await tx.user.update({
              where: { id: user.id },
              data: {
                activeAddons: activeAddons,
                walletBalance: newBalance
              }
            });
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
          message: `Successfully activated ${addon.name} Add-on via Razorpay Gateway!`,
          activeAddons,
          walletBalance: user.walletBalance
        });
      }
      // OPTION 2: Pay from Wallet
      else {
        if (user.walletBalance < addon.priceMonthly && user.planTier !== "ENTERPRISE") {
          return NextResponse.json({
            status: "error",
            error_code: "INSUFFICIENT_FUNDS",
            message: `Insufficient wallet balance. Activating ${addon.name} requires ₹${addon.priceMonthly}. Current wallet balance: ₹${user.walletBalance.toFixed(2)}.`,
            requiredAmount: addon.priceMonthly,
            walletBalance: user.walletBalance
          }, { status: 400 });
        }

        if (user.planTier !== "ENTERPRISE") {
          newBalance = Math.max(0, user.walletBalance - addon.priceMonthly);
        }

        activeAddons.push(addonId);

        const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          if (user.planTier !== "ENTERPRISE") {
            await tx.transaction.create({
              data: {
                userId: user.id,
                amount: -addon.priceMonthly,
                creditsAdded: -addon.priceMonthly,
                paymentGateway: "WALLET_INTERNAL",
                gatewayPaymentId: `addon_${addonId}_${Date.now()}`,
                webhookVerified: true,
                status: "SUCCESS"
              }
            });
          }

          return await tx.user.update({
            where: { id: user.id },
            data: {
              activeAddons: activeAddons,
              walletBalance: newBalance
            }
          });
        });

        return NextResponse.json({
          status: "success",
          message: `Successfully activated ${addon.name} Add-on via Wallet Balance!`,
          activeAddons,
          walletBalance: updatedUser.walletBalance
        });
      }

    } else if (action === "deactivate") {
      activeAddons = activeAddons.filter((id) => id !== addonId);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          activeAddons: activeAddons
        }
      });

      return NextResponse.json({
        status: "success",
        message: `Deactivated ${addon.name} Add-on.`,
        activeAddons,
        walletBalance: updatedUser.walletBalance
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
