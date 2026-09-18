import hashlib
import httpx
from fastapi import Header, HTTPException, Request, status
from app.core.config import settings

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
    payload = {
        "apiKey": x_api_key.strip(),
        "endpoint": endpoint,
        "module": module_name
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(next_service_url, json=payload, headers=headers)
            data = resp.json()

            if resp.status_code != 200 or not data.get("valid"):
                # Handle quota and credits exhausted scenario
                if data.get("error_code") == "QUOTA_AND_CREDITS_EXHAUSTED":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail={
                            "status": "error",
                            "error_code": "QUOTA_AND_CREDITS_EXHAUSTED",
                            "message": data.get("message"),
                            "details": data.get("details")
                        }
                    )

                # Handle account suspended or blocked
                if data.get("error_code") == "ACCOUNT_SUSPENDED":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail={
                            "status": "error",
                            "error_code": "ACCOUNT_SUSPENDED",
                            "message": data.get("message")
                        }
                    )

                # Invalid API key
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "status": "error",
                        "error_code": data.get("error_code", "INVALID_API_KEY"),
                        "message": data.get("message", "Invalid API key provided.")
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "status": "error",
                "message": f"Authentication & quota verification service error: {str(ex)}"
            }
        )

