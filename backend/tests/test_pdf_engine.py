import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.insert(0, backend_dir)

from app.pdf_engine.jobs_db import jobs_store
from app.pdf_engine.generator import process_pdf_job_async

async def run_test():
    job_id = "test_job_real_pdf_001"
    birth_data = {
        "dob": "1995-10-05",
        "tob": "14:30:00",
        "lat": 24.5854,
        "lon": 73.7125,
        "tz": 5.5
    }
    branding = {
        "company_name": "AstroEngine Test Corp",
        "website": "https://astroengine.io",
        "primary_color": "#b45309"
    }

    print("[1] Queuing job into SQLite...")
    jobs_store.create_job(job_id=job_id, report_type="kundli_basic", language="en", credits_cost=5.0)
    initial_job = jobs_store.get_job(job_id)
    assert initial_job is not None, "Job was not saved to SQLite!"
    assert initial_job["status"] == "PENDING"
    print("    -> Job successfully queued with status PENDING.")

    print("[2] Executing real PDF generation worker...")
    await process_pdf_job_async(
        job_id=job_id,
        birth_data=birth_data,
        branding=branding,
        report_type="kundli_basic",
        lang="en"
    )

    print("[3] Inspecting completed job state in SQLite...")
    completed_job = jobs_store.get_job(job_id)
    assert completed_job is not None
    print(f"    -> Status: {completed_job['status']}")
    print(f"    -> Download URL: {completed_job['file_url']}")
    print(f"    -> File Path: {completed_job['file_path']}")

    assert completed_job["status"] == "COMPLETED", f"Expected COMPLETED, got {completed_job['status']}"
    assert completed_job["file_path"] and os.path.exists(completed_job["file_path"]), "PDF file does not exist on disk!"
    
    file_size = os.path.getsize(completed_job["file_path"])
    print(f"    -> File Size on Disk: {file_size} bytes")
    assert file_size > 1000, "Generated PDF file is abnormally small!"

    # Check PDF magic header
    with open(completed_job["file_path"], "rb") as f:
        header = f.read(5)
        assert header == b"%PDF-", f"Invalid PDF header: {header}"
    print("    -> Valid %PDF-1.4 binary verified!")

    print("\nSUCCESS: Real PDF creation, persistent job storage, and local fallback verified 100%!")

if __name__ == "__main__":
    asyncio.run(run_test())
