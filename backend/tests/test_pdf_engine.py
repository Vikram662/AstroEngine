import pytest
from app.pdf_engine.generator import render_kundli_html, PDF_JOBS

def test_render_kundli_html():
    birth_data = {
        "dob": "1995-10-05",
        "tob": "14:30",
        "lat": 24.5854,
        "lon": 73.7125,
        "tz": 5.5
    }
    branding = {
        "company_name": "Test Vedic Studio",
        "website": "www.teststudio.com",
        "primary_color": "#0284c7"
    }
    html = render_kundli_html(birth_data, branding, report_title="Kundli Test Report", lang="en")
    assert "<!DOCTYPE html>" in html
    assert "Test Vedic Studio" in html
    assert "#0284c7" in html
    assert "<svg" in html # Check embedded inline SVG chart
    assert "Native Profile &amp; Birth Details" in html or "Native Profile" in html
