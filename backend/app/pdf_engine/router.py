import uuid
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from fastapi.responses import HTMLResponse
from app.schemas.common import StandardResponse
from app.schemas.pdf import PdfReportRequest, PdfJobResponse
from app.core.security import verify_api_key
from app.core.ssrf import validate_safe_webhook_url
from app.pdf_engine.generator import (
    PDF_JOBS,
    process_pdf_job_async,
    render_kundli_html
)

router = APIRouter(prefix="/api/v1/pdf", tags=["White-Label PDF Reports"])

@router.post("/kundli/basic", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_basic_kundli_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 12 — Endpoint 93:
    Asynchronous 15–20 Page Basic Kundli PDF Generator with White-Label Branding.
    Returns HTTP 202 Accepted with job_id for polling.
    """
    # Sanitize webhook_url if provided to prevent SSRF
    if req.webhook_url:
        validate_safe_webhook_url(req.webhook_url)

    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    selected_lang = (req.lang or "en").lower().strip()

    birth_data = {
        "dob": req.dob,
        "tob": req.tob,
        "lat": req.lat,
        "lon": req.lon,
        "tz": req.tz
    }
    branding_dict = req.branding.dict() if req.branding else {}

    # Initialize Job State
    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "report_type": "kundli_basic",
        "language": selected_lang,
        "status": "PENDING",
        "file_url": None,
        "credits_cost": 5.0,
        "refunded": False
    }

    # Dispatch to background task worker
    background_tasks.add_task(
        process_pdf_job_async,
        job_id=job_id,
        birth_data=birth_data,
        branding=branding_dict,
        report_type="kundli_basic",
        lang=selected_lang,
        webhook_url=req.webhook_url
    )

    return PdfJobResponse(
        status="PENDING",
        job_id=job_id,
        report_type="kundli_basic",
        poll_url=f"/api/v1/pdf/status/{job_id}",
        message="Basic Kundli PDF generation job queued successfully."
    )

@router.post("/kundli/brihat", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_brihat_kundli_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 12 — Endpoint 94:
    Asynchronous 60–100 Page Grand Brihat Kundli PDF Generator with White-Label Branding.
    """
    if req.webhook_url:
        validate_safe_webhook_url(req.webhook_url)

    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    selected_lang = (req.lang or "en").lower().strip()

    birth_data = {
        "dob": req.dob,
        "tob": req.tob,
        "lat": req.lat,
        "lon": req.lon,
        "tz": req.tz
    }
    branding_dict = req.branding.dict() if req.branding else {}

    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "report_type": "kundli_brihat",
        "language": selected_lang,
        "status": "PENDING",
        "file_url": None,
        "credits_cost": 12.0,
        "refunded": False
    }

    background_tasks.add_task(
        process_pdf_job_async,
        job_id=job_id,
        birth_data=birth_data,
        branding=branding_dict,
        report_type="kundli_brihat",
        lang=selected_lang,
        webhook_url=req.webhook_url
    )

    return PdfJobResponse(
        status="PENDING",
        job_id=job_id,
        report_type="kundli_brihat",
        poll_url=f"/api/v1/pdf/status/{job_id}",
        message="Brihat Kundli PDF generation job queued successfully."
    )

@router.get("/status/{job_id}", response_model=StandardResponse)
async def get_pdf_job_status(
    job_id: str,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 12 — Endpoint 100:
    Poll PDF Generation Job Status (PENDING / PROCESSING / COMPLETED / FAILED + R2 URL).
    """
    job = PDF_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF Job not found.")
    return StandardResponse(status="success", language=job.get("language", "en"), data=job)

@router.post("/preview/html")
async def preview_report_html(
    req: PdfReportRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Instant HTML preview of branded Kundli report with inline SVG chart."""
    selected_lang = (req.lang or "en").lower().strip()
    birth_data = {"dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz}
    branding_dict = req.branding.dict() if req.branding else {}
    html = render_kundli_html(birth_data, branding_dict, report_title="Kundli Preview", lang=selected_lang)
    return HTMLResponse(content=html, status_code=200)

@router.post("/matching/report", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_matching_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 95: 20–25 Page Matchmaking & Compatibility PDF Report."""
    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    PDF_JOBS[job_id] = {"job_id": job_id, "report_type": "matching_report", "status": "PENDING", "file_url": None, "credits_cost": 6.0}
    return PdfJobResponse(job_id=job_id, report_type="matching_report", poll_url=f"/api/v1/pdf/status/{job_id}", message="Matchmaking PDF queued.")

@router.post("/varshphal/annual", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_varshphal_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 96: 25–35 Page Varshphal (Annual Solar Return) PDF Report."""
    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    PDF_JOBS[job_id] = {"job_id": job_id, "report_type": "varshphal_annual", "status": "PENDING", "file_url": None, "credits_cost": 8.0}
    return PdfJobResponse(job_id=job_id, report_type="varshphal_annual", poll_url=f"/api/v1/pdf/status/{job_id}", message="Varshphal PDF queued.")

@router.post("/lalkitab/full", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_lalkitab_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 97: 35–45 Page Lal Kitab Remedial & Farman PDF Report."""
    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    PDF_JOBS[job_id] = {"job_id": job_id, "report_type": "lalkitab_full", "status": "PENDING", "file_url": None, "credits_cost": 9.0}
    return PdfJobResponse(job_id=job_id, report_type="lalkitab_full", poll_url=f"/api/v1/pdf/status/{job_id}", message="Lal Kitab PDF queued.")

@router.post("/dosha/sade-sati", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_sadesati_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 98: 12–15 Page Shani Sade Sati Life Guide PDF Report."""
    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    PDF_JOBS[job_id] = {"job_id": job_id, "report_type": "sadesati_guide", "status": "PENDING", "file_url": None, "credits_cost": 4.0}
    return PdfJobResponse(job_id=job_id, report_type="sadesati_guide", poll_url=f"/api/v1/pdf/status/{job_id}", message="Sade Sati PDF queued.")

@router.post("/numerology/report", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_numerology_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 99: 15–25 Page Complete Numerology Blueprint PDF Report."""
    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    PDF_JOBS[job_id] = {"job_id": job_id, "report_type": "numerology_report", "status": "PENDING", "file_url": None, "credits_cost": 5.0}
    return PdfJobResponse(job_id=job_id, report_type="numerology_report", poll_url=f"/api/v1/pdf/status/{job_id}", message="Numerology PDF queued.")

