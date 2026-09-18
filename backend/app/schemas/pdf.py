from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class BrandingConfig(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "company_name": "Divine Jyotish Kendra",
                "logo_url": "https://cdn.example.com/branding/logo.png",
                "website": "www.divinejyotish.com",
                "contact_number": "+91 98765 43210",
                "primary_color": "#b45309"
            }
        }
    )
    company_name: Optional[str] = Field("AstroEngine Vedic Portal", description="Customer's enterprise company name", example="Divine Jyotish Kendra")
    logo_url: Optional[str] = Field(None, description="Direct HTTPS URL to brand logo", example="https://cdn.example.com/branding/logo.png")
    website: Optional[str] = Field("www.divineastro.com", description="Company portal link", example="www.divinejyotish.com")
    contact_number: Optional[str] = Field("+91 98765 43210", description="Support phone number printed on report footer", example="+91 98765 43210")
    primary_color: Optional[str] = Field("#b45309", description="Hex accent color code for charts & headers", example="#b45309")

class PdfReportRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "dob": "1995-10-05",
                "tob": "14:30",
                "lat": 24.5854,
                "lon": 73.7125,
                "tz": 5.5,
                "lang": "en",
                "branding": {
                    "company_name": "Divine Jyotish Kendra",
                    "logo_url": "https://cdn.example.com/branding/logo.png",
                    "website": "www.divinejyotish.com",
                    "contact_number": "+91 98765 43210",
                    "primary_color": "#b45309"
                },
                "webhook_url": "https://api.yourdomain.com/webhooks/pdf-completed"
            }
        }
    )
    dob: str = Field(..., description="Date of birth (YYYY-MM-DD)", example="1995-10-05")
    tob: str = Field(..., description="Time of birth (HH:MM or HH:MM:SS)", example="14:30")
    lat: float = Field(..., description="Latitude (-90.0 to +90.0)", example=24.5854)
    lon: float = Field(..., description="Longitude (-180.0 to +180.0)", example=73.7125)
    tz: float = Field(5.5, description="Timezone offset (e.g. 5.5 for IST)", example=5.5)
    lang: Optional[str] = Field("en", description="Output language: en, hi, gu, mr, ta, te", example="en")
    branding: Optional[BrandingConfig] = Field(default_factory=BrandingConfig, description="White-label custom header/footer metadata")
    webhook_url: Optional[str] = Field(None, description="Optional HTTPS callback URL on completion", example="https://api.yourdomain.com/webhooks/pdf-completed")

class PdfJobResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "PENDING",
                "job_id": "pdf_job_a1b2c3d4e5f6",
                "report_type": "kundli_basic",
                "poll_url": "/api/v1/pdf/status/pdf_job_a1b2c3d4e5f6",
                "message": "PDF generation job started in background."
            }
        }
    )
    status: str = Field("PENDING", description="Current asynchronous job state: PENDING, COMPLETED, FAILED", example="PENDING")
    job_id: str = Field(..., description="Unique asynchronous job identifier", example="pdf_job_a1b2c3d4e5f6")
    report_type: str = Field(..., description="Report category (kundli_basic or kundli_brihat)", example="kundli_basic")
    poll_url: str = Field(..., description="Polling URL to query job status and download link", example="/api/v1/pdf/status/pdf_job_a1b2c3d4e5f6")
    message: str = Field("PDF generation job started in background.", description="Status message")

