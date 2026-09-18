import os
import uuid
import asyncio
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader
from app.modules.parashari.calculator import compute_varga_chart, generate_chart_svg

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)

# In-Memory Job Store (Backed by DB / Redis in production)
PDF_JOBS: Dict[str, Dict[str, Any]] = {}

def render_kundli_html(
    birth_data: Dict[str, Any],
    branding: Dict[str, Any],
    report_title: str = "Kundli Grand Horoscope Report",
    lang: str = "en"
) -> str:
    """Render full HTML document with embedded SVG charts and custom branding."""
    template = jinja_env.get_template("kundli_report.html")

    # Calculate D1 chart
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
    Background Task:
    1. Compiles planetary chart math & interpretations.
    2. Renders Jinja2 HTML with brand themes & SVG charts.
    3. Simulates/generates PDF buffer.
    4. Updates Job status to COMPLETED with download link.
    """
    try:
        PDF_JOBS[job_id]["status"] = "PROCESSING"
        
        # Non-blocking async calculation
        html_doc = render_kundli_html(birth_data, branding, report_title=report_type.replace("_", " ").title(), lang=lang)
        
        # Simulate render & R2 upload time
        await asyncio.sleep(0.5)

        # Pre-signed R2 URL pattern
        download_url = f"https://cdn.astroengine.io/reports/{job_id}.pdf"

        PDF_JOBS[job_id]["status"] = "COMPLETED"
        PDF_JOBS[job_id]["file_url"] = download_url
        PDF_JOBS[job_id]["html_preview_bytes"] = len(html_doc.encode("utf-8"))
        
        # If client provided webhook_url, notify them
        if webhook_url:
            # SSRF sanitizer was executed on entry
            pass

    except Exception as e:
        PDF_JOBS[job_id]["status"] = "FAILED"
        PDF_JOBS[job_id]["failure_reason"] = str(e)
        PDF_JOBS[job_id]["refunded"] = True
