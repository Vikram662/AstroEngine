import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { Prisma } from "@prisma/client";
import { OfferValidationError, recordOfferRedemption, resolveOfferForUser } from "@/lib/offers";
import { toMoney, toJsonSafe } from "@/lib/money";
import { ApiData, toApiError } from "@/lib/apiTypes";

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
    const dbAddons = await (prisma as ApiData).addonPackage.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" }
    });

    return NextResponse.json({
      status: "success",
      walletBalance: toMoney(user.walletBalance),
      planTier: user.planTier,
      activeAddons,
      catalog: toJsonSafe((dbAddons || []).map((addon: ApiData) => ({
        ...addon,
        isActive: activeAddons.includes(addon.id) || user.planTier === "ENTERPRISE"
      })))
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
    const { addonId, action, paymentMethod = "WALLET", gatewayPaymentId, gatewayOrderId, offerCode } = body; // action: "activate" | "deactivate"

    // Fetch addon details strictly from MySQL database
    const addon = await (prisma as ApiData).addonPackage.findUnique({
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

      const currentWalletBalance = toMoney(user.walletBalance);
      let newBalance: number = currentWalletBalance;
      const addonPrice = toMoney(addon.priceMonthly);
      const appliedOffer = await resolveOfferForUser({
        userId: user.id,
        code: offerCode,
        targetType: "ADDON",
        targetId: addon.id,
        amount: addonPrice,
      });
      const payablePrice = appliedOffer?.finalAmount ?? addonPrice;

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

        if (toMoney(pendingOrder.amount) < payablePrice) {
          return NextResponse.json({
            status: "error",
            message: `Order amount (₹${toMoney(pendingOrder.amount)}) does not match add-on payable price (₹${payablePrice}).`
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

            await recordOfferRedemption(tx, user.id, appliedOffer, gatewayOrderId);

            activeAddons.push(addonId);
            await tx.user.update({
              where: { id: user.id },
              data: {
                activeAddons: activeAddons,
                walletBalance: newBalance
              }
            });
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
          message: `Successfully activated ${addon.name} Add-on via Razorpay Gateway!`,
          activeAddons,
          walletBalance: currentWalletBalance,
          offerDiscount: appliedOffer?.discountAmount || 0,
          offerCode: appliedOffer?.code || null,
        });
      }
      // OPTION 2: Pay from Wallet
      else {
        if (currentWalletBalance < payablePrice && user.planTier !== "ENTERPRISE") {
          return NextResponse.json({
            status: "error",
            error_code: "INSUFFICIENT_FUNDS",
            message: `Insufficient wallet balance. Activating ${addon.name} requires ₹${payablePrice.toFixed(2)}. Current wallet balance: ₹${currentWalletBalance.toFixed(2)}.`,
            requiredAmount: payablePrice,
            walletBalance: currentWalletBalance
          }, { status: 400 });
        }

        if (user.planTier !== "ENTERPRISE") {
          newBalance = Math.max(0, currentWalletBalance - payablePrice);
        }

        activeAddons.push(addonId);

        const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await recordOfferRedemption(tx, user.id, appliedOffer, `addon_${addonId}_${Date.now()}`);
          if (user.planTier !== "ENTERPRISE") {
            await tx.transaction.create({
              data: {
                userId: user.id,
                amount: -payablePrice,
                creditsAdded: -payablePrice,
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
          walletBalance: toMoney(updatedUser.walletBalance),
          offerDiscount: appliedOffer?.discountAmount || 0,
          offerCode: appliedOffer?.code || null,
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
        walletBalance: toMoney(updatedUser.walletBalance)
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: error instanceof OfferValidationError ? 400 : 500 },
    );
  }
}
