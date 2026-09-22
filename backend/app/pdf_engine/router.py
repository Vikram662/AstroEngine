import uuid
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from fastapi.responses import HTMLResponse, FileResponse
import os
from app.schemas.common import StandardResponse
from app.schemas.pdf import PdfReportRequest, PdfJobResponse
from app.core.security import verify_api_key
from app.core.ssrf import validate_safe_webhook_url
from app.pdf_engine.generator import (
    PDF_JOBS,
    process_pdf_job_async,
    render_kundli_html
)
from app.pdf_engine.jobs_db import jobs_store

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

@router.get("/jobs", response_model=StandardResponse)
async def list_all_pdf_jobs(
    limit: int = 50,
    key_hash: str = Depends(verify_api_key)
):
    """List recent PDF generation jobs from persistent database."""
    jobs = jobs_store.get_all_jobs(limit=limit)
    return StandardResponse(status="success", language="en", data={"total": len(jobs), "jobs": jobs})

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
        job = jobs_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF Job not found.")
    return StandardResponse(status="success", language=job.get("language", "en"), data=job)

@router.get("/download/{job_id}")
async def download_pdf_file(job_id: str):
    """
    Download rendered PDF document by job_id.
    Streamed directly from local disk storage or redirected.
    """
    safe_job_id = os.path.basename(job_id)
    job = PDF_JOBS.get(safe_job_id)
    if not job:
        # Fallback to persistent SQLite DB
        job = jobs_store.get_job(safe_job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report job not found.")
    
    file_path = job.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not ready or expired.")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"{safe_job_id}.pdf"
    )

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
    if req.webhook_url:
        validate_safe_webhook_url(req.webhook_url)

    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    selected_lang = (req.lang or "en").lower().strip()
    birth_data = {
        "dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz,
        "girl_dob": req.girl_dob, "girl_tob": req.girl_tob, "girl_lat": req.girl_lat, "girl_lon": req.girl_lon, "girl_tz": req.girl_tz
    }
    branding_dict = req.branding.dict() if req.branding else {}

    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "report_type": "matching_report",
        "language": selected_lang,
        "status": "PENDING",
        "file_url": None,
        "credits_cost": 6.0,
        "refunded": False
    }

    background_tasks.add_task(
        process_pdf_job_async,
        job_id=job_id,
        birth_data=birth_data,
        branding=branding_dict,
        report_type="matching_report",
        lang=selected_lang,
        webhook_url=req.webhook_url
    )

    return PdfJobResponse(job_id=job_id, report_type="matching_report", poll_url=f"/api/v1/pdf/status/{job_id}", message="Matchmaking PDF queued successfully.")

@router.post("/varshphal/annual", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_varshphal_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 96: 25–35 Page Varshphal (Annual Solar Return) PDF Report."""
    if req.webhook_url:
        validate_safe_webhook_url(req.webhook_url)

    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    selected_lang = (req.lang or "en").lower().strip()
    birth_data = {
        "dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz,
        "target_year": req.target_year or 2026
    }
    branding_dict = req.branding.dict() if req.branding else {}

    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "report_type": "varshphal_annual",
        "language": selected_lang,
        "status": "PENDING",
        "file_url": None,
        "credits_cost": 8.0,
        "refunded": False
    }

    background_tasks.add_task(
        process_pdf_job_async,
        job_id=job_id,
        birth_data=birth_data,
        branding=branding_dict,
        report_type="varshphal_annual",
        lang=selected_lang,
        webhook_url=req.webhook_url
    )

    return PdfJobResponse(job_id=job_id, report_type="varshphal_annual", poll_url=f"/api/v1/pdf/status/{job_id}", message="Varshphal PDF queued successfully.")

@router.post("/lalkitab/full", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_lalkitab_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 97: 35–45 Page Lal Kitab Remedial & Farman PDF Report."""
    if req.webhook_url:
        validate_safe_webhook_url(req.webhook_url)

    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    selected_lang = (req.lang or "en").lower().strip()
    birth_data = {"dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz}
    branding_dict = req.branding.dict() if req.branding else {}

    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "report_type": "lalkitab_full",
        "language": selected_lang,
        "status": "PENDING",
        "file_url": None,
        "credits_cost": 9.0,
        "refunded": False
    }

    background_tasks.add_task(
        process_pdf_job_async,
        job_id=job_id,
        birth_data=birth_data,
        branding=branding_dict,
        report_type="lalkitab_full",
        lang=selected_lang,
        webhook_url=req.webhook_url
    )

    return PdfJobResponse(job_id=job_id, report_type="lalkitab_full", poll_url=f"/api/v1/pdf/status/{job_id}", message="Lal Kitab PDF queued successfully.")

@router.post("/dosha/sade-sati", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_sadesati_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 98: 12–15 Page Shani Sade Sati Life Guide PDF Report."""
    if req.webhook_url:
        validate_safe_webhook_url(req.webhook_url)

    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    selected_lang = (req.lang or "en").lower().strip()
    birth_data = {"dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz}
    branding_dict = req.branding.dict() if req.branding else {}

    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "report_type": "sadesati_guide",
        "language": selected_lang,
        "status": "PENDING",
        "file_url": None,
        "credits_cost": 4.0,
        "refunded": False
    }

    background_tasks.add_task(
        process_pdf_job_async,
        job_id=job_id,
        birth_data=birth_data,
        branding=branding_dict,
        report_type="sadesati_guide",
        lang=selected_lang,
        webhook_url=req.webhook_url
    )

    return PdfJobResponse(job_id=job_id, report_type="sadesati_guide", poll_url=f"/api/v1/pdf/status/{job_id}", message="Sade Sati PDF queued successfully.")

@router.post("/numerology/report", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_numerology_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    key_hash: str = Depends(verify_api_key)
):
    """Module 12 — Endpoint 99: 15–25 Page Complete Numerology Blueprint PDF Report."""
    if req.webhook_url:
        validate_safe_webhook_url(req.webhook_url)

    job_id = f"pdf_job_{uuid.uuid4().hex[:12]}"
    selected_lang = (req.lang or "en").lower().strip()
    birth_data = {"dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz}
    branding_dict = req.branding.dict() if req.branding else {}

    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "report_type": "numerology_report",
        "language": selected_lang,
        "status": "PENDING",
        "file_url": None,
        "credits_cost": 5.0,
        "refunded": False
    }

    background_tasks.add_task(
        process_pdf_job_async,
        job_id=job_id,
        birth_data=birth_data,
        branding=branding_dict,
        report_type="numerology_report",
        lang=selected_lang,
        webhook_url=req.webhook_url
    )

    return PdfJobResponse(job_id=job_id, report_type="numerology_report", poll_url=f"/api/v1/pdf/status/{job_id}", message="Numerology PDF queued successfully.")

