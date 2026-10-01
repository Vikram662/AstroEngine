import { NextRequest, NextResponse } from "next/server";
import { hasValidInternalSecret } from "@/lib/internalAuth";
import { applyRefund } from "@/lib/billingRefund";

// POST /api/internal/refund
// Called by the Python engine when a billed API call did not produce a result
// (HTTP >= 400, or an async PDF job that failed). Idempotent per receipt.
export async function POST(req: NextRequest) {
  try {
    if (!hasValidInternalSecret(req)) {
      return NextResponse.json({ status: "error", message: "Forbidden internal handshake" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const result = await applyRefund(
      {
        receiptId: String(body?.receiptId ?? ""),
        deductionType: String(body?.deductionType ?? ""),
        addonId: typeof body?.addonId === "string" ? body.addonId : null,
      },
      Number(body?.httpStatus)
    );

    if (!result.ok) {
      return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
    }
    return NextResponse.json({ status: "success", refunded: result.refunded, creditsReturned: result.creditsReturned });
  } catch (error: unknown) {
    console.error("[internal/refund]", error);
    return NextResponse.json({ status: "error", message: "Refund failed." }, { status: 500 });
  }
}
