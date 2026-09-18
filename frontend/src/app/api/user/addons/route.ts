import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface AddonItem {
  id: string;
  name: string;
  category: string;
  priceMonthly: number;
  description: string;
  features: string[];
  icon: string;
}

// Helper to get active user
async function getAuthUser() {
  const cookieStore = await cookies();
  const sessionEmail = cookieStore.get("astro_session_email")?.value;
  if (sessionEmail) {
    const user = await prisma.user.findUnique({ where: { email: sessionEmail } });
    if (user) return user;
  }
  return await prisma.user.findFirst({
    where: { isBlocked: false },
    orderBy: { createdAt: "asc" }
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
        await prisma.transaction.create({
          data: {
            userId: user.id,
            amount: addon.priceMonthly,
            creditsAdded: 0,
            paymentGateway: "RAZORPAY",
            gatewayPaymentId: gatewayPaymentId || `pay_addon_${Date.now()}`,
            gatewayOrderId: gatewayOrderId,
            webhookVerified: true,
            status: "SUCCESS"
          }
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
          await prisma.transaction.create({
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
      }

      activeAddons.push(addonId);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          activeAddons: activeAddons,
          walletBalance: newBalance
        }
      });

      return NextResponse.json({
        status: "success",
        message: `Successfully activated ${addon.name} Add-on via ${paymentMethod === "GATEWAY" ? "Razorpay Gateway" : "Wallet Balance"}!`,
        activeAddons,
        walletBalance: updatedUser.walletBalance
      });

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
