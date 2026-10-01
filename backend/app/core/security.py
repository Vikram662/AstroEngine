import hashlib
import logging
import httpx
from fastapi import Header, HTTPException, Request, status
from app.core.config import settings
from app.core.billing import build_receipt

logger = logging.getLogger("astroengine.security")

ADMIN_ROLES = ("ADMIN", "SUPER_ADMIN")
# Error codes from the Next.js verifier that map to HTTP 403 and are passed through verbatim.
_FORBIDDEN_CODES = ("PLAN_UPGRADE_REQUIRED", "PLAN_UPGRADE_OR_ADDON_REQUIRED", "QUOTA_AND_CREDITS_EXHAUSTED", "ADDON_QUOTA_EXHAUSTED", "INSUFFICIENT_WALLET_FOR_REPORT", "ACCOUNT_SUSPENDED")

def hash_api_key(raw_key: str) -> str:
    """Generate SHA-256 hash of raw API key for secure lookup."""
    return hashlib.sha256(raw_key.strip().encode("utf-8")).hexdigest()

def extract_api_key_prefix(raw_key: str) -> str:
    """Extract display-safe prefix e.g. ak_live_a1b2."""
    raw = raw_key.strip()
    return raw[:16] if len(raw) >= 16 else raw

async def verify_api_key(
    request: Request,
    x_api_key: str = Header(None, alias="x-api-key")
) -> dict:
    """
    Validate that API key is sent strictly via the x-api-key header.
    Enforces:
      1. Mandatory x-api-key check (never allowed in query params or body).
      2. Active subscription monthly quota check (quota decrement).
      3. If quota exhausted -> deduct overage from wallet credits.
      4. If both quota AND wallet credits are exhausted -> return 403 Forbidden with recharge link!
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "error",
                "error_code": "AUTH_HEADER_MISSING",
                "message": "Missing required 'x-api-key' header. All API calls must supply an active API key in HTTP headers."
            }
        )

    endpoint = request.url.path
    # Extract module name from path, e.g. /api/v1/core/planets -> core_astronomy
    path_parts = [p for p in endpoint.split("/") if p]
    module_name = path_parts[2] if len(path_parts) > 2 else "GENERAL"

    # Call Next.js internal verification service (persists usage, checks quota & wallet)
    base_url = (settings.NEXT_APP_URL or "").rstrip('/')
    if not base_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "status": "error",
                "message": "NEXT_APP_URL is not configured in backend environment variables."
            }
        )
    next_service_url = f"{base_url}/api/internal/verify-key"
    headers = {
        "x-internal-secret": settings.INTERNAL_SECRET_KEY,
        "Content-Type": "application/json"
    }
    cleaned_api_key = x_api_key.strip().strip('"').strip("'")
    payload = {
        "apiKey": cleaned_api_key,
        "endpoint": endpoint,
        "module": module_name
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(next_service_url, json=payload, headers=headers)
            # The billing service itself failed (database down, bug...): that is not the
            # caller's fault, so never present it as an invalid key.
            if resp.status_code >= 500:
                logger.error("verify-key service returned HTTP %s", resp.status_code)
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={
                        "status": "error",
                        "error_code": "AUTH_SERVICE_UNAVAILABLE",
                        "message": "Authentication service is temporarily unavailable. Please retry shortly."
                    }
                )
            data = resp.json()
            if resp.status_code != 200 or not data.get("valid"):
                error_code = data.get("error_code")
                if error_code == "MAINTENANCE_MODE":
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail={"status": "error", "error_code": error_code, "message": data.get("message")}
                    )
                if error_code in _FORBIDDEN_CODES:
                    detail = {"status": "error", "error_code": error_code, "message": data.get("message")}
                    if data.get("details") is not None:
                        detail["details"] = data.get("details")
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

                # Invalid API key
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "status": "error",
                        "error_code": data.get("error_code", "INVALID_API_KEY"),
                        "message": data.get("message", "Invalid API key provided.")
                    }
                )

            # Billing receipt: lets the response middleware (or an async job) refund
            # this call if it ends in an error. Attached BEFORE the rate-limit check
            # because a throttled request has already been metered.
            receipt = build_receipt(data)
            if receipt:
                request.state.billing_receipt = receipt
                data["receipt"] = receipt

            # Rate Limiting check (sliding window RPM)
            from app.core.rate_limiter import check_sliding_window_rate_limit
            quota_obj = data.get("quota") or {}
            plan_tier = data.get("planTier") or quota_obj.get("plan") or "STARTER"
            db_rpm = quota_obj.get("rateLimitPerMin") or data.get("rateLimitPerMin") or 60
            
            # Only accounts the verifier reports as ADMIN/SUPER_ADMIN are exempt from throttling.
            # (Never decide this from the key string itself.)
            is_internal_master = data.get("role") in ADMIN_ROLES
            if not is_internal_master:
                # Hash, not the 16-char prefix: distinct keys never share a bucket.
                allowed, retry_after = check_sliding_window_rate_limit(hash_api_key(cleaned_api_key)[:32], dynamic_rpm=db_rpm)
                if not allowed:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        headers={"Retry-After": str(retry_after)},
                        detail={
                            "status": "error",
                            "error_code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Rate limit exceeded for {plan_tier} tier ({db_rpm or 60} RPM). Please retry after {retry_after} seconds.",
                            "retry_after_seconds": retry_after
                        }
                    )

            # Attach dynamic quota details returned directly from MySQL SubscriptionPlan
            request.state.auth_data = data
            request.state.quota = data.get("quota") or {}

            return data

    except HTTPException:
        raise
    except Exception as ex:
        # If Next.js internal auth service is momentarily unreachable in dev
        if settings.ENVIRONMENT == "development" and "test" in x_api_key.lower():
            dev_data = {
                "valid": True,
                "planTier": "DEVELOPMENT",
                "deductionType": "DEV_TEST_BYPASS",
                "remainingQuota": 99999,
                "quota": {
                    "plan": "DEVELOPMENT",
                    "monthlyQuota": 99999,
                    "remainingQuota": 99999,
                    "deductionType": "DEV_TEST_BYPASS"
                }
            }
            request.state.auth_data = dev_data
            request.state.quota = dev_data["quota"]
            return dev_data
        logger.error("Authentication & quota verification service error: %s", ex)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "error",
                "message": "Authentication service is temporarily unavailable. Please retry shortly."
            }
        )

