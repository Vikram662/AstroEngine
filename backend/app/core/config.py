import os
import time
from typing import Optional, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Core Server & Environment (Strictly read from ENV / .env)
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "")
    INTERNAL_SECRET_KEY: str = os.getenv("INTERNAL_SECRET_KEY", "")
    INTERNAL_SECRET_KEY_PREVIOUS: Optional[str] = None
    EPHE_PATH: str = os.getenv("EPHE_PATH", "./ephe")
    
    # Cache & Datastore
    REDIS_HOST: Optional[str] = None
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    DATABASE_URL: Optional[str] = None
    
    # Cloudflare R2 / S3 Storage (Supports fallback or DB SystemSetting)
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: Optional[str] = None
    R2_PUBLIC_DOMAIN: Optional[str] = None
    
    # Telemetry & Microservice URLs
    SENTRY_DSN: Optional[str] = None
    NEXT_APP_URL: Optional[str] = None
    CORS_ORIGINS: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

# Dynamic Database SystemSetting Cache
_dynamic_db_cache: Dict[str, Any] = {}
_dynamic_db_cache_expiry: float = 0.0
_CACHE_TTL_SECONDS = 60.0  # Refreshes automatically every 60s without server restart


def get_dynamic_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    """
    Fetch a system setting dynamically from the Next.js internal API (backed by MySQL SystemSetting table).
    Falls back to environment variables or the provided default if unavailable.
    """
    global _dynamic_db_cache, _dynamic_db_cache_expiry
    now = time.time()

    if now > _dynamic_db_cache_expiry:
        try:
            import urllib.request
            import json

            base_url = (settings.NEXT_APP_URL or os.getenv("NEXT_APP_URL") or "http://localhost:3000").rstrip("/")
            secret = settings.INTERNAL_SECRET_KEY or os.getenv("INTERNAL_SECRET_KEY", "")
            req = urllib.request.Request(
                f"{base_url}/api/internal/settings",
                headers={"x-internal-secret": secret}
            )
            with urllib.request.urlopen(req, timeout=2.0) as response:
                if response.status == 200:
                    payload = json.loads(response.read().decode("utf-8"))
                    data = payload.get("data", {})
                    if isinstance(data, dict):
                        _dynamic_db_cache = data
                        _dynamic_db_cache_expiry = now + _CACHE_TTL_SECONDS
        except Exception:
            # If Next.js service is unavailable or cold booting, continue to use cached or env
            pass

    if key in _dynamic_db_cache and _dynamic_db_cache[key] is not None:
        return _dynamic_db_cache[key]

    # Fallback to backend environment variable
    env_val = os.getenv(key)
    if env_val is not None:
        return env_val

    return default

