"""Refund of billed API calls that did not produce a result."""
import asyncio
import logging
import os
from typing import Any, Dict, Optional, Set

import httpx

from app.core.config import settings

logger = logging.getLogger("astroengine.billing")

# Strong references so fire-and-forget refund tasks are not garbage collected.
_pending: Set["asyncio.Task[Any]"] = set()


def build_receipt(auth_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Billing receipt from the verify-key response (None if the call was not metered)."""
    receipt_id = auth_data.get("receiptId")
    if not receipt_id:
        return None
    return {
        "receiptId": str(receipt_id),
        "deductionType": auth_data.get("deductionType"),
        "addonId": auth_data.get("addonId"),
    }


async def refund_receipt(receipt: Optional[Dict[str, Any]], http_status: int = 500) -> bool:
    """Ask the billing service to return the quota / wallet credit. Idempotent on
    the server (one refund per receipt), so retrying is always safe."""
    if not receipt or not receipt.get("receiptId"):
        return False
    base_url = (settings.NEXT_APP_URL or "").rstrip("/")
    if not base_url:
        return False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{base_url}/api/internal/refund",
                json={**receipt, "httpStatus": http_status},
                headers={"x-internal-secret": settings.INTERNAL_SECRET_KEY},
            )
        if resp.status_code == 200:
            return bool(resp.json().get("refunded"))
        logger.warning("Refund for receipt %s rejected: HTTP %s", receipt["receiptId"], resp.status_code)
    except Exception as exc:  # never break the response path over a refund
        logger.error("Refund for receipt %s failed: %s", receipt.get("receiptId"), exc)
    return False


def schedule_refund(receipt: Optional[Dict[str, Any]], http_status: int) -> None:
    """Fire-and-forget refund so the client response is not delayed."""
    if not receipt:
        return
    task = asyncio.create_task(refund_receipt(receipt, http_status))
    _pending.add(task)
    task.add_done_callback(_pending.discard)


async def complete_receipt(receipt: Optional[Dict[str, Any]], response_time_ms: int) -> None:
    """Report the real latency of a successful metered call (best effort)."""
    if not receipt or not receipt.get("receiptId"):
        return
    base_url = (settings.NEXT_APP_URL or "").rstrip("/")
    if not base_url:
        return
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{base_url}/api/internal/complete",
                json={"receiptId": receipt["receiptId"], "responseTimeMs": response_time_ms},
                headers={"x-internal-secret": settings.INTERNAL_SECRET_KEY},
            )
    except Exception as exc:
        logger.debug("Completion report for receipt %s failed: %s", receipt.get("receiptId"), exc)


def schedule_complete(receipt: Optional[Dict[str, Any]], response_time_ms: int) -> None:
    """Fire-and-forget. Disable with BILLING_LOG_LATENCY=false to save one internal call per request."""
    if not receipt or os.getenv("BILLING_LOG_LATENCY", "true").lower() == "false":
        return
    task = asyncio.create_task(complete_receipt(receipt, response_time_ms))
    _pending.add(task)
    task.add_done_callback(_pending.discard)
