import os
import uuid
from typing import Dict, Any, Optional
import httpx
from jinja2 import Environment, FileSystemLoader
from app.modules.parashari.calculator import compute_varga_chart, generate_chart_svg
from app.pdf_engine.jobs_db import jobs_store, PersistentJobStore
from app.pdf_engine.renderer import render_real_pdf_bytes
from app.pdf_engine.storage import store_report_pdf

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)

# Backward-compatible alias for existing router references (now SQLite persistent)
PDF_JOBS = jobs_store

def render_kundli_html(
    birth_data: Dict[str, Any],
    branding: Dict[str, Any],
    report_title: str = "Kundli Grand Horoscope Report",
    lang: str = "en"
) -> str:
    """Render full HTML document with embedded SVG charts and custom branding."""
    template = jinja_env.get_template("kundli_report.html")

    # Calculate real D1 chart using Swiss Ephemeris
    chart = compute_varga_chart(
        dob=birth_data["dob"],
        tob=birth_data["tob"],
        lat=birth_data["lat"],
        lon=birth_data["lon"],
        tz=birth_data["tz"],
        varga="D1",
        lang=lang
    )
    svg_chart = generate_chart_svg(chart)

    rendered_html = template.render(
        birth_data=birth_data,
        branding=branding,
        chart=chart,
        svg_chart=svg_chart,
        report_title=report_title,
        lang=lang
    )
    return rendered_html

async def process_pdf_job_async(
    job_id: str,
    birth_data: Dict[str, Any],
    branding: Dict[str, Any],
    report_type: str,
    lang: str = "en",
    webhook_url: Optional[str] = None
):
    """
    Real Asynchronous PDF Pipeline:
    1. Computes genuine planetary positions and D1 chart via Swiss Ephemeris.
    2. Builds real binary PDF document with branding and vector chart.
    3. Persists file to server disk and optionally uploads to Cloudflare R2 if configured.
    4. Updates SQLite persistent job store to COMPLETED.
    5. Dispatches webhook notification if requested.
    """
    try:
        jobs_store.update_status(job_id=job_id, status="PROCESSING")

        # 1. Real Astrological Calculation, localized to the requested report language
        # (planet/sign names come back pre-translated via translate_entity()).
        chart = compute_varga_chart(
            dob=birth_data["dob"],
            tob=birth_data["tob"],
            lat=birth_data["lat"],
            lon=birth_data["lon"],
            tz=birth_data["tz"],
            varga="D1",
            lang=lang
        )

        title_readable = report_type.replace("_", " ").title()

        # 2. Real PDF Rendering (Tailored Multi-Page Binary PDF 1.4 vector stream)
        pdf_bytes = render_real_pdf_bytes(
            report_title=f"{title_readable} Horoscope",
            birth_data=birth_data,
            chart=chart,
            branding=branding,
            report_type=report_type,
            lang=lang
        )

        # 3. Persistent Storage: Local disk + Optional R2 Cloudflare Upload (organized subfolders)
        file_path, download_url = await store_report_pdf(job_id=job_id, pdf_bytes=pdf_bytes, report_type=report_type)

        # 4. Mark Job Completed in SQLite
        jobs_store.update_status(
            job_id=job_id,
            status="COMPLETED",
            file_url=download_url,
            file_path=file_path
        )

        # 5. Webhook delivery if configured
        if webhook_url:
            try:
                payload = {
                    "event": "pdf.completed",
                    "job_id": job_id,
                    "report_type": report_type,
                    "download_url": download_url,
                    "file_size_bytes": len(pdf_bytes)
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(webhook_url, json=payload)
            except Exception:
                # Webhook failure should not fail the completed PDF job
                pass

    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs_store.update_status(
            job_id=job_id,
            status="FAILED",
            failure_reason=str(e),
            refunded=True
        )
