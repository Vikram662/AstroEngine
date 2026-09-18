import hashlib
from fastapi import Header, HTTPException, status
from app.core.config import settings

def hash_api_key(raw_key: str) -> str:
    """Generate SHA-256 hash of raw API key for secure lookup."""
    return hashlib.sha256(raw_key.strip().encode("utf-8")).hexdigest()

def extract_api_key_prefix(raw_key: str) -> str:
    """Extract display-safe prefix e.g. ak_live_a1b2."""
    raw = raw_key.strip()
    return raw[:12] if len(raw) >= 12 else raw

async def verify_api_key(x_api_key: str = Header(None, alias="x-api-key")) -> str:
    """
    Validate that API key is sent strictly via the x-api-key header.
    Never accept API keys from query parameters or request body.
    """
    if not x_api_key:
        # In development mode, allow localhost testing with demo token
        if settings.ENVIRONMENT == "development":
            return "dev_mode_bypass"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "error",
                "message": "Missing required 'x-api-key' header. API keys must only be supplied via HTTP header."
            }
        )

    key_hash = hash_api_key(x_api_key)
    # When MySQL DB integration is active, lookup key_hash against User.apiKeyHash.
    return key_hash
