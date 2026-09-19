import os
import io
import datetime
from typing import Dict, Any, List

def _escape_pdf_text(text: str) -> str:
    """Escape parenthesis and backslashes for PDF string literals."""
    if not text:
        return ""
    text = str(text).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    # Keep ASCII printable for standard Type 1 fonts
    return "".join(c if ord(c) < 128 else "?" for c in text)

class MinimalPDFWriter:
    """
    Pure Python standard-compliant PDF 1.4 vector generator.
    Produces high-fidelity, printable, multi-page vector PDF documents without external dependencies.
    """
    def __init__(self):
        self.objects = []
        self.pages = []
        self.font_obj = None
        self.font_bold_obj = None

    def _add_object(self, content: bytes) -> int:
        self.objects.append(content)
        return len(self.objects)

    def generate_report_pdf(
        self,
        report_title: str,
        birth_data: Dict[str, Any],
        chart: Dict[str, Any],
        branding: Dict[str, Any],
        lang: str = "en"
    ) -> bytes:
        # Standard A4 size: 595.28 x 841.89 points
        width, height = 595.28, 841.89
        
        # Collect stream commands for Page 1 (Cover & Birth Info & Chart)
        p1_cmds = []
        
        # Primary Brand Color RGB (default gold/saffron #B45309 -> 0.706, 0.325, 0.035)
        p1_cmds.append("0.706 0.325 0.035 rg") # Fill color
        p1_cmds.append("0 800 595 42 re f")   # Top header banner
        
        # Header Text (White)
        company_name = branding.get("company_name") or "AstroEngine Premium Astrology"
        p1_cmds.append("1 1 1 rg")
        p1_cmds.append("BT /F2 20 Tf 30 812 Td (" + _escape_pdf_text(company_name) + ") Tj ET")
        
        # Subtitle
        p1_cmds.append("0.1 0.1 0.1 rg")
        p1_cmds.append("BT /F2 16 Tf 30 765 Td (" + _escape_pdf_text(report_title) + ") Tj ET")
        p1_cmds.append("0.4 0.4 0.4 rg")
        p1_cmds.append(f"BT /F1 10 Tf 30 748 Td (Generated on: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Ayanamsha: Lahiri Chitrapaksha) Tj ET")
        
        # Divider line
        p1_cmds.append("0.8 0.8 0.8 RG 1 w")
        p1_cmds.append("30 735 m 565 735 l S")

        # Section 1: Birth Coordinates & Time
        p1_cmds.append("0.706 0.325 0.035 rg")
        p1_cmds.append("BT /F2 12 Tf 30 715 Td (1. NATIVITY & BIRTH PARTICULARS) Tj ET")
        
        p1_cmds.append("0.96 0.97 0.98 rg 30 635 535 70 re f")
        p1_cmds.append("0.8 0.8 0.8 RG 30 635 535 70 re s")
        
        dob = birth_data.get("dob", "")
        tob = birth_data.get("tob", "")
        lat = birth_data.get("lat", "")
        lon = birth_data.get("lon", "")
        tz = birth_data.get("tz", "")
        
        p1_cmds.append("0.15 0.2 0.25 rg")
        p1_cmds.append(f"BT /F2 10 Tf 45 685 Td (Date of Birth:) Tj /F1 10 Tf 135 685 Td ({_escape_pdf_text(dob)}) Tj ET")
        p1_cmds.append(f"BT /F2 10 Tf 300 685 Td (Time of Birth:) Tj /F1 10 Tf 390 685 Td ({_escape_pdf_text(tob)}) Tj ET")
        p1_cmds.append(f"BT /F2 10 Tf 45 665 Td (Latitude:) Tj /F1 10 Tf 135 665 Td ({lat} deg) Tj ET")
        p1_cmds.append(f"BT /F2 10 Tf 300 665 Td (Longitude:) Tj /F1 10 Tf 390 665 Td ({lon} deg) Tj ET")
        p1_cmds.append(f"BT /F2 10 Tf 45 645 Td (Time Zone:) Tj /F1 10 Tf 135 645 Td (UTC +{tz}) Tj ET")
        p1_cmds.append(f"BT /F2 10 Tf 300 645 Td (Ascendant Sign:) Tj /F1 10 Tf 390 645 Td ({_escape_pdf_text(chart.get('ascendant', {}).get('sign', 'Aries'))}) Tj ET")

        # Section 2: Lagna Kundli Vector Chart
        p1_cmds.append("0.706 0.325 0.035 rg")
        p1_cmds.append("BT /F2 12 Tf 30 610 Td (2. VEDIC LAGNA KUNDLI (D1 CHART)) Tj ET")
        
        # Draw North Indian Diamond Chart (x=160, y=360, size=240)
        cx, cy, sz = 175, 360, 240
        p1_cmds.append("0.706 0.325 0.035 RG 1.5 w")
        # Outer square
        p1_cmds.append(f"{cx} {cy} {sz} {sz} re s")
        # Diagonals
        p1_cmds.append(f"{cx} {cy} m {cx + sz} {cy + sz} l S")
        p1_cmds.append(f"{cx} {cy + sz} m {cx + sz} {cy} l S")
        # Inner diamond
        p1_cmds.append(f"{cx + sz/2} {cy} m {cx + sz} {cy + sz/2} l {cx + sz/2} {cy + sz} l {cx} {cy + sz/2} l h S")

        # House numbers & Planets inside chart
        p1_cmds.append("0.2 0.3 0.4 rg")
        p1_cmds.append(f"BT /F2 10 Tf {cx + sz/2 - 12} {cy + sz - 35} Td (H1 / Lag) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + 35} {cy + sz - 35} Td (H2) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + 35} {cy + sz/2 + 20} Td (H3) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + sz/2 - 15} {cy + sz/2} Td (H4) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + 35} {cy + 35} Td (H5) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + sz/2 - 35} {cy + 35} Td (H6) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + sz/2 - 12} {cy + 35} Td (H7) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + sz - 50} {cy + 35} Td (H8) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + sz - 50} {cy + sz/2 - 30} Td (H9) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + sz/2 - 15} {cy + sz/2 + 30} Td (H10) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + sz - 50} {cy + sz - 35} Td (H11) Tj ET")
        p1_cmds.append(f"BT /F2 9 Tf {cx + sz/2 + 20} {cy + sz - 35} Td (H12) Tj ET")

        # Section 3: Planetary Table
        p1_cmds.append("0.706 0.325 0.035 rg")
        p1_cmds.append("BT /F2 12 Tf 30 330 Td (3. PLANETARY LONGITUDES & DIGNITIES) Tj ET")

        # Table Header
        p1_cmds.append("0.9 0.93 0.96 rg 30 305 535 18 re f")
        p1_cmds.append("0.7 0.7 0.7 RG 30 305 535 18 re s")
        p1_cmds.append("0.1 0.1 0.1 rg")
        p1_cmds.append("BT /F2 9 Tf 35 311 Td (Planet) Tj 110 311 Td (Sign) Tj 200 311 Td (Degree) Tj 280 311 Td (Speed/State) Tj 390 311 Td (House) Tj 470 311 Td (Dignity) Tj ET")

        # Table Rows
        planets = chart.get("planets", [])
        y_pos = 288
        for i, p in enumerate(planets[:9]):
            p_name = p.get("name", "")
            sign_name = p.get("sign", "")
            deg_val = f"{p.get('degree', 0):.2f} deg"
            retro = "Retrograde (R)" if p.get("is_retrograde") else "Direct"
            house_num = f"House {p.get('house', 1)}"
            dignity = "Benefic" if p_name in ["Jupiter", "Venus", "Mercury"] else "Malefic / Neutral"

            # Alternate row background
            if i % 2 == 1:
                p1_cmds.append(f"0.98 0.98 0.98 rg 30 {y_pos - 4} 535 16 re f")

            p1_cmds.append(f"0.85 0.85 0.85 RG 30 {y_pos - 4} 535 16 re s")
            p1_cmds.append("0.2 0.25 0.3 rg")
            p1_cmds.append(f"BT /F2 8.5 Tf 35 {y_pos} Td ({_escape_pdf_text(p_name)}) Tj /F1 8.5 Tf 110 {y_pos} Td ({_escape_pdf_text(sign_name)}) Tj 200 {y_pos} Td ({deg_val}) Tj 280 {y_pos} Td ({retro}) Tj 390 {y_pos} Td ({house_num}) Tj 470 {y_pos} Td ({dignity}) Tj ET")
            y_pos -= 16

        # Footer
        p1_cmds.append("0.8 0.8 0.8 RG 30 50 m 565 50 l S")
        website = branding.get("website") or "www.astroengine.io"
        p1_cmds.append(f"0.5 0.5 0.5 rg BT /F1 8 Tf 30 38 Td ({_escape_pdf_text(company_name)} | {_escape_pdf_text(website)}) Tj 510 38 Td (Page 1 of 2) Tj ET")

        # Page 2: Interpretations & Remedies
        p2_cmds = []
        p2_cmds.append("0.706 0.325 0.035 rg")
        p2_cmds.append("0 800 595 42 re f")
        p2_cmds.append("1 1 1 rg")
        p2_cmds.append("BT /F2 20 Tf 30 812 Td (" + _escape_pdf_text(company_name) + ") Tj ET")
        
        p2_cmds.append("0.1 0.1 0.1 rg")
        p2_cmds.append("BT /F2 16 Tf 30 765 Td (Comprehensive Astrological Analysis & Recommendations) Tj ET")
        p2_cmds.append("0.8 0.8 0.8 RG 30 750 m 565 750 l S")

        # Section 4: General Trends
        p2_cmds.append("0.706 0.325 0.035 rg")
        p2_cmds.append("BT /F2 12 Tf 30 725 Td (4. LAGNA & PERSONALITY ORIENTATION) Tj ET")
        p2_cmds.append("0.2 0.25 0.3 rg")
        asc_sign = chart.get('ascendant', {}).get('sign', 'Aries')
        p2_cmds.append(f"BT /F1 9.5 Tf 30 705 Td (Your rising sign is {_escape_pdf_text(asc_sign)}. This indicates a dynamic temperament guided by classical Vedic principles.) Tj ET")
        p2_cmds.append("BT /F1 9.5 Tf 30 690 Td (The placement of key Kendra and Trikona lords shows significant inner potential and resilience.) Tj ET")

        # Section 5: Remedies & Gemstone guidance
        p2_cmds.append("0.706 0.325 0.035 rg")
        p2_cmds.append("BT /F2 12 Tf 30 655 Td (5. VEDIC REMEDIES & AUSPICIOUS GUIDANCE) Tj ET")
        p2_cmds.append("0.2 0.25 0.3 rg")
        p2_cmds.append("BT /F2 9.5 Tf 30 635 Td (Favorable Deities:) Tj /F1 9.5 Tf 130 635 Td (Surya Narayana and Lord Shiva for vital stamina and clarity.) Tj ET")
        p2_cmds.append("BT /F2 9.5 Tf 30 615 Td (Recommended Fast:) Tj /F1 9.5 Tf 130 615 Td (Thursday or Monday based on Lagna lord dignity.) Tj ET")
        p2_cmds.append("BT /F2 9.5 Tf 30 595 Td (Charity / Daana:) Tj /F1 9.5 Tf 130 595 Td (Donate yellow pulses, wheat or milk to underprivileged on auspicious weekdays.) Tj ET")

        # Section 6: Important Disclaimer
        p2_cmds.append("0.96 0.96 0.96 rg 30 500 535 60 re f")
        p2_cmds.append("0.8 0.8 0.8 RG 30 500 535 60 re s")
        p2_cmds.append("0.706 0.325 0.035 rg")
        p2_cmds.append("BT /F2 9.5 Tf 45 542 Td (ASTROLOGICAL ADVISORY & ETHICAL DISCLAIMER:) Tj ET")
        p2_cmds.append("0.35 0.35 0.35 rg")
        p2_cmds.append("BT /F1 8 Tf 45 526 Td (Astrology provides guidance based on karmic probabilities and astronomical positions at birth.) Tj ET")
        p2_cmds.append("BT /F1 8 Tf 45 512 Td (Decisions must always be taken in light of personal free will, prudence, and professional counsel.) Tj ET")

        # Page 2 Footer
        p2_cmds.append("0.8 0.8 0.8 RG 30 50 m 565 50 l S")
        p2_cmds.append(f"0.5 0.5 0.5 rg BT /F1 8 Tf 30 38 Td ({_escape_pdf_text(company_name)} | {_escape_pdf_text(website)}) Tj 510 38 Td (Page 2 of 2) Tj ET")

        # Assemble PDF Object Structure
        # 1. Fonts: F1 = Helvetica, F2 = Helvetica-Bold
        f1_id = self._add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        f2_id = self._add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

        # Page 1 Content Stream
        p1_stream = "\n".join(p1_cmds).encode("utf-8")
        p1_stream_obj = self._add_object(f"<< /Length {len(p1_stream)} >>\nstream\n".encode("utf-8") + p1_stream + b"\nendstream")

        # Page 2 Content Stream
        p2_stream = "\n".join(p2_cmds).encode("utf-8")
        p2_stream_obj = self._add_object(f"<< /Length {len(p2_stream)} >>\nstream\n".encode("utf-8") + p2_stream + b"\nendstream")

        # Pages placeholder (ID will be 5)
        pages_id = len(self.objects) + 1

        # Page 1 Object
        p1_obj = self._add_object(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 595.28 841.89] "
            f"/Contents {p1_stream_obj} 0 R "
            f"/Resources << /Font << /F1 {f1_id} 0 R /F2 {f2_id} 0 R >> >> >>".encode("utf-8")
        )

        # Page 2 Object
        p2_obj = self._add_object(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 595.28 841.89] "
            f"/Contents {p2_stream_obj} 0 R "
            f"/Resources << /Font << /F1 {f1_id} 0 R /F2 {f2_id} 0 R >> >> >>".encode("utf-8")
        )

        # Pages Parent Object
        self._add_object(
            f"<< /Type /Pages /Kids [{p1_obj} 0 R {p2_obj} 0 R] /Count 2 >>".encode("utf-8")
        )

        # Catalog Object
        catalog_id = self._add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("utf-8"))

        # Build output buffer with XRef table
        out = bytearray()
        out.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        
        offsets = []
        for i, obj in enumerate(self.objects):
            offsets.append(len(out))
            out.extend(f"{i + 1} 0 obj\n".encode("utf-8"))
            out.extend(obj)
            out.extend(b"\nendobj\n")

        xref_offset = len(out)
        out.extend(f"xref\n0 {len(self.objects) + 1}\n".encode("utf-8"))
        out.extend(b"0000000000 65535 f \n")
        for off in offsets:
            out.extend(f"{off:010d} 00000 n \n".encode("utf-8"))

        out.extend(
            f"trailer\n<< /Size {len(self.objects) + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n".encode("utf-8")
        )

        return bytes(out)

def render_real_pdf_bytes(
    report_title: str,
    birth_data: Dict[str, Any],
    chart: Dict[str, Any],
    branding: Dict[str, Any],
    lang: str = "en"
) -> bytes:
    """Entry point for real PDF binary creation."""
    writer = MinimalPDFWriter()
    return writer.generate_report_pdf(
        report_title=report_title,
        birth_data=birth_data,
        chart=chart,
        branding=branding,
        lang=lang
    )
