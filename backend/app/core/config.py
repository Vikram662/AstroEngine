from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    INTERNAL_SECRET_KEY: str = "c9f82d1a6e3b5c7f8a9e0d1b2"
    INTERNAL_SECRET_KEY_PREVIOUS: Optional[str] = None
    EPHE_PATH: str = "./ephe"
    REDIS_HOST: Optional[str] = None
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: str = "astro-pdf-reports"
    R2_PUBLIC_DOMAIN: Optional[str] = None
    DATABASE_URL: Optional[str] = None
    SENTRY_DSN: Optional[str] = None
    NEXT_APP_URL: Optional[str] = None
    CORS_ORIGINS: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
