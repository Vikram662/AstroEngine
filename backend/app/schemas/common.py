from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, Dict, Any, List

class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "error",
                "code": "AUTH_HEADER_MISSING",
                "message": "Missing or invalid 'x-api-key' authentication header.",
                "detail": "API keys must strictly be passed via the x-api-key HTTP header."
            }
        }
    )
    status: Literal["error"] = Field("error", description="Status identifier, always 'error'")
    code: str = Field(..., description="Machine-readable unique error code", example="AUTH_HEADER_MISSING")
    message: str = Field(..., description="Human-readable explanation of what went wrong", example="Missing or invalid 'x-api-key' authentication header.")
    detail: Optional[Any] = Field(None, description="Detailed context or parameter explanation", example="API keys must strictly be passed via the x-api-key HTTP header.")

class ValidationErrorDetail(BaseModel):
    loc: List[str] = Field(..., description="Location of the invalid field in the request", example=["body", "dob"])
    msg: str = Field(..., description="Validation failure reason", example="Field required")
    type: str = Field(..., description="Validation error rule code", example="value_error.missing")

class HTTPValidationErrorResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "error",
                "code": "VALIDATION_ERROR",
                "message": "Request body or parameter schema validation failed.",
                "errors": [
                    {
                        "loc": ["body", "dob"],
                        "msg": "Field required",
                        "type": "value_error.missing"
                    },
                    {
                        "loc": ["body", "lat"],
                        "msg": "Input should be less than or equal to 90.0",
                        "type": "value_error.number.not_le"
                    }
                ]
            }
        }
    )
    status: Literal["error"] = Field("error", description="Status identifier, always 'error'")
    code: str = Field("VALIDATION_ERROR", description="Machine-readable validation error code")
    message: str = Field("Request body or parameter schema validation failed.", description="General summary of the validation error")
    errors: List[ValidationErrorDetail] = Field(..., description="Array of specific parameter validation failures")

class RateLimitErrorResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "error",
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Sliding-window request quota exceeded (60 calls/min).",
                "retry_after_seconds": 15
            }
        }
    )
    status: Literal["error"] = Field("error", description="Status identifier, always 'error'")
    code: str = Field("RATE_LIMIT_EXCEEDED", description="Rate limit error code")
    message: str = Field("Sliding-window request quota exceeded (60 calls/min).", description="Explanation")
    retry_after_seconds: int = Field(15, description="Number of seconds to wait before retrying request", example=15)

class AstronomicalCalculationErrorResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "error",
                "code": "EPHEMERIS_CALCULATION_ERROR",
                "message": "Swiss Ephemeris core calculation failed or coordinates out of ephemeris bounds.",
                "detail": "Ephemeris file missing or Julian day out of range (1800-2100 CE)."
            }
        }
    )
    status: Literal["error"] = Field("error", description="Status identifier, always 'error'")
    code: str = Field("EPHEMERIS_CALCULATION_ERROR", description="Internal calculation error code")
    message: str = Field("Swiss Ephemeris core calculation failed or coordinates out of ephemeris bounds.", description="Calculation failure summary")
    detail: Optional[str] = Field(None, description="Low-level Swiss Ephemeris C-routine return message", example="Ephemeris file missing or Julian day out of range (1800-2100 CE).")

class BirthDataRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "dob": "1995-10-05",
                "tob": "14:30",
                "lat": 24.5854,
                "lon": 73.7125,
                "tz": 5.5,
                "lang": "en"
            }
        }
    )
    dob: str = Field(..., description="Date of birth in ISO format (YYYY-MM-DD)", example="1995-10-05")
    tob: str = Field(..., description="Local time of birth (HH:MM or HH:MM:SS, 24-hour clock)", example="14:30")
    lat: float = Field(..., description="Geographic latitude in decimal degrees (-90.0 to +90.0)", ge=-90.0, le=90.0, example=24.5854)
    lon: float = Field(..., description="Geographic longitude in decimal degrees (-180.0 to +180.0)", ge=-180.0, le=180.0, example=73.7125)
    tz: float = Field(5.5, description="Timezone offset in hours from UTC (e.g. 5.5 for IST, -5.0 for EST)", example=5.5)
    ayanamsa: Optional[str] = Field(default="LAHIRI", description="Internal calculation mode (defaults to LAHIRI)")
    lang: Optional[str] = Field("en", description="Localization output language: en, hi, gu, mr, ta, te", example="en")

class QuotaInfo(BaseModel):
    plan: str = Field(..., description="Active subscription plan tier (STARTER, PRO, ENTERPRISE)", example="STARTER")
    monthly_quota: int = Field(..., description="Total included calls in the monthly plan", example=35000)
    monthly_usage: int = Field(..., description="Calls consumed in current billing month", example=1240)
    remaining_quota: int = Field(..., description="Calls remaining before wallet overage applies", example=33760)
    deduction_type: str = Field("QUOTA", description="Deduction source for this call: QUOTA or WALLET_CREDIT", example="QUOTA")
    wallet_balance: Optional[float] = Field(None, description="Prepaid wallet credit balance in INR", example=250.00)

class StandardResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "success",
                "language": "en",
                "quota": {
                    "plan": "STARTER",
                    "monthly_quota": 35000,
                    "monthly_usage": 1240,
                    "remaining_quota": 33760,
                    "deduction_type": "QUOTA",
                    "wallet_balance": 250.00
                },
                "data": {
                    "ayanamsa": {
                        "name": "LAHIRI",
                        "value_degrees": 23.8214
                    },
                    "planets": {
                        "Sun": {
                            "longitude": 168.32,
                            "sign": "Virgo",
                            "sign_num": 6,
                            "house": 10,
                            "speed": 0.985,
                            "is_retrograde": False,
                            "nakshatra": {
                                "name": "Hasta",
                                "pada": 3,
                                "lord": "Moon"
                            }
                        }
                    }
                }
            }
        }
    )
    status: Literal["success", "error"] = Field("success", description="Indicates call success status ('success')")
    language: str = Field("en", description="Active response language locale code ('en', 'hi', 'gu', 'mr', 'ta', 'te')", example="en")
    quota: Optional[QuotaInfo] = Field(None, description="Real-time subscription quota balance and plan usage breakdown")
    data: Dict[str, Any] = Field(..., description="High-precision astrological payload corresponding to the endpoint")

# Endpoint response schemas for ReDoc documentation
ENDPOINT_RESPONSES = {
    400: {
        "model": ErrorResponse,
        "description": "Bad Request — Invalid astronomical inputs or parameter bounds."
    },
    401: {
        "model": ErrorResponse,
        "description": "Unauthorized — Missing or invalid 'x-api-key' authentication header."
    },
    403: {
        "model": ErrorResponse,
        "description": "Forbidden — Account suspended or monthly quota exhausted."
    },
    422: {
        "model": HTTPValidationErrorResponse,
        "description": "Unprocessable Entity — Pydantic request payload structural validation failure."
    },
    429: {
        "model": RateLimitErrorResponse,
        "description": "Too Many Requests — Sliding-window rate limit breach (60 calls/min)."
    },
    500: {
        "model": AstronomicalCalculationErrorResponse,
        "description": "Internal Engine Error — Swiss Ephemeris C-binding computation fault."
    }
}
