import os
import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query, status
from fastapi.responses import FileResponse, HTMLResponse

from app.core.security import hash_api_key, verify_api_key
from app.core.ssrf import validate_safe_webhook_url
from app.pdf_engine.generator import PDF_JOBS, process_pdf_job_async, render_kundli_html
from app.pdf_engine.jobs_db import jobs_store
from app.schemas.common import StandardResponse
from app.schemas.pdf import PdfJobResponse, PdfReportRequest

router = APIRouter(prefix="/api/v1/pdf", tags=["White-Label PDF Reports"])

ADMIN_ROLES = ("ADMIN", "SUPER_ADMIN")
# Fields that must never be returned to API consumers (server paths / ownership hash).
_PRIVATE_JOB_FIELDS = ("file_path", "owner_key_hash")


def _owner_hash(x_api_key: Optional[str]) -> Optional[str]:
    return hash_api_key(x_api_key) if x_api_key else None


def _is_admin(auth: Optional[dict]) -> bool:
    return (auth or {}).get("role") in ADMIN_ROLES


def _can_access_job(job: dict, x_api_key: Optional[str], auth: Optional[dict]) -> bool:
    """A job is visible to the API key that created it, or to an admin account.
    Jobs with no recorded owner (created before ownership tracking) are admin-only."""
    if _is_admin(auth):
        return True
    owner_hash = job.get("owner_key_hash")
    return bool(owner_hash) and owner_hash == _owner_hash(x_api_key)


def _public_job(job: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in job.items() if k not in _PRIVATE_JOB_FIELDS}


def _load_job(job_id: str) -> Optional[dict]:
    safe_job_id = os.path.basename(job_id)
    return PDF_JOBS.get(safe_job_id) or jobs_store.get_job(safe_job_id)


def _enqueue_report(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str],
    report_type: str,
    credits_cost: float,
    message: str,
    extra_birth_data: Optional[Dict[str, Any]] = None,
) -> PdfJobResponse:
    """Shared body of every report endpoint: validate, register the job, queue it."""
    if req.webhook_url:
        validate_safe_webhook_url(req.webhook_url)  # SSRF guard (re-checked at send time)

    job_id = f"pdf_job_{uuid.uuid4().hex}"  # 128-bit id: not guessable
    selected_lang = (req.lang or "en").lower().strip()

    birth_data: Dict[str, Any] = {"dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz}
    if extra_birth_data:
        birth_data.update(extra_birth_data)
    branding_dict = req.branding.model_dump() if req.branding else {}

    PDF_JOBS[job_id] = {
        "job_id": job_id,
        "report_type": report_type,
        "language": selected_lang,
        "status": "PENDING",
        "file_url": None,
        "credits_cost": credits_cost,
        "refunded": False,
        "owner_key_hash": _owner_hash(x_api_key),
    }

    background_tasks.add_task(
        process_pdf_job_async,
        job_id=job_id,
        birth_data=birth_data,
        branding=branding_dict,
        report_type=report_type,
        lang=selected_lang,
        webhook_url=req.webhook_url,
    )

    return PdfJobResponse(
        status="PENDING",
        job_id=job_id,
        report_type=report_type,
        poll_url=f"/api/v1/pdf/status/{job_id}",
        message=message,
    )


@router.post("/kundli/basic", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_basic_kundli_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Module 12 — Endpoint 93: Asynchronous 15 Page Basic Kundli PDF Generator with White-Label Branding.
    Returns HTTP 202 Accepted with job_id for polling."""
    return _enqueue_report(req, background_tasks, x_api_key, "kundli_basic", 5.0,
                           "Basic Kundli PDF generation job queued successfully.")


@router.post("/kundli/brihat", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_brihat_kundli_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Module 12 — Endpoint 94: Asynchronous 60 Page Grand Brihat Kundli PDF Generator."""
    return _enqueue_report(req, background_tasks, x_api_key, "kundli_brihat", 12.0,
                           "Brihat Kundli PDF generation job queued successfully.")


@router.get("/jobs", response_model=StandardResponse)
async def list_all_pdf_jobs(
    limit: int = Query(50, ge=1, le=200),
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """List recent PDF jobs created by the calling API key (admin accounts see all jobs)."""
    owner = None if _is_admin(auth) else _owner_hash(x_api_key)
    if owner is None and not _is_admin(auth):
        jobs = []
    else:
        jobs = [_public_job(j) for j in jobs_store.get_all_jobs(limit=limit, owner_key_hash=owner)]
    return StandardResponse(status="success", language="en", data={"total": len(jobs), "jobs": jobs})


@router.get("/status/{job_id}", response_model=StandardResponse)
async def get_pdf_job_status(
    job_id: str,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Module 12 — Endpoint 100: Poll PDF Generation Job Status (PENDING / PROCESSING / COMPLETED / FAILED + R2 URL).
    Only the API key that created the job (or an admin account) may read it."""
    job = _load_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF Job not found.")
    if not _can_access_job(job, x_api_key, auth):
        # Same response as "missing" so job ids cannot be probed.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF Job not found.")
    return StandardResponse(status="success", language=job.get("language", "en"), data=_public_job(job))


@router.get("/download/{job_id}")
async def download_pdf_file(
    job_id: str,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Download rendered PDF by job_id. Only the creating API key (or an admin account) may download."""
    safe_job_id = os.path.basename(job_id)
    job = _load_job(safe_job_id)
    if not job or not _can_access_job(job, x_api_key, auth):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report job not found.")

    file_path = job.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not ready or expired.")

    return FileResponse(path=file_path, media_type="application/pdf", filename=f"{safe_job_id}.pdf")


@router.post("/preview/html")
async def preview_report_html(req: PdfReportRequest, auth: dict = Depends(verify_api_key)):
    """Instant HTML preview of branded Kundli report with inline SVG chart."""
    selected_lang = (req.lang or "en").lower().strip()
    birth_data = {"dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz}
    branding_dict = req.branding.model_dump() if req.branding else {}
    html = render_kundli_html(birth_data, branding_dict, report_title="Kundli Preview", lang=selected_lang)
    return HTMLResponse(content=html, status_code=200)


@router.post("/matching/report", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_matching_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Module 12 — Endpoint 95: 20 Page Matchmaking & Compatibility PDF Report."""
    partner = {
        "girl_dob": req.girl_dob, "girl_tob": req.girl_tob, "girl_lat": req.girl_lat,
        "girl_lon": req.girl_lon, "girl_tz": req.girl_tz,
    }
    return _enqueue_report(req, background_tasks, x_api_key, "matching_report", 6.0,
                           "Matchmaking PDF queued successfully.", partner)


@router.post("/varshphal/annual", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_varshphal_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Module 12 — Endpoint 96: 20 Page Varshphal (Annual Solar Return) PDF Report."""
    return _enqueue_report(req, background_tasks, x_api_key, "varshphal_annual", 8.0,
                           "Varshphal PDF queued successfully.", {"target_year": req.target_year or 2026})


@router.post("/lalkitab/full", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_lalkitab_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Module 12 — Endpoint 97: 30 Page Lal Kitab Remedial & Farman PDF Report."""
    return _enqueue_report(req, background_tasks, x_api_key, "lalkitab_full", 9.0,
                           "Lal Kitab PDF queued successfully.")


@router.post("/dosha/sade-sati", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_sadesati_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Module 12 — Endpoint 98: 15 Page Shani Sade Sati Life Guide PDF Report."""
    return _enqueue_report(req, background_tasks, x_api_key, "sadesati_guide", 4.0,
                           "Sade Sati PDF queued successfully.")


@router.post("/numerology/report", response_model=PdfJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_numerology_pdf_job(
    req: PdfReportRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_api_key),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Module 12 — Endpoint 99: 12 Page Complete Numerology Blueprint PDF Report."""
    return _enqueue_report(req, background_tasks, x_api_key, "numerology_report", 5.0,
                           "Numerology PDF queued successfully.")
