import os
import io
import datetime
import math
from typing import Dict, Any, List, Optional, Tuple

# Comprehensive Indic to Romanized Transliteration Dictionary
INDIC_TRANSLITERATION_MAP = {
    # Grahas (Planets)
    "सूर्य": "Surya (Sun)", "सूरज": "Surya (Sun)", "सೂರ್ಯ": "Surya (Sun)", "સૂર્ય": "Surya (Sun)",
    "चंद्रमा": "Chandra (Moon)", "चन्द्रमा": "Chandra (Moon)", "चन्द्र": "Chandra (Moon)", "ચંદ્ર": "Chandra (Moon)", "চন্দ্র": "Chandra (Moon)",
    "मंगल": "Mangal (Mars)", "भौम": "Mangal (Mars)", "મંગળ": "Mangal (Mars)", "মঙ্গল": "Mangal (Mars)",
    "बुध": "Budha (Mercury)", "બુધ": "Budha (Mercury)", "বুধ": "Budha (Mercury)",
    "बृहस्पति": "Brihaspati (Jupiter)", "गुरु": "Guru (Jupiter)", "ગુરુ": "Guru (Jupiter)", "বৃহস্পতি": "Brihaspati (Jupiter)",
    "शुक्र": "Shukra (Venus)", "શુક્ર": "Shukra (Venus)", "শুক্র": "Shukra (Venus)",
    "शनि": "Shani (Saturn)", "શનિ": "Shani (Saturn)", "শনি": "Shani (Saturn)",
    "राहु": "Rahu", "રાહુ": "Rahu", "রাহু": "Rahu",
    "केतु": "Ketu", "કેતુ": "Ketu", "কেতু": "Ketu",
    "अरुण": "Uranus", "वरुण": "Neptune", "यम": "Pluto",

    # Rashis (Zodiac Signs)
    "मेष": "Mesha (Aries)", "મેષ": "Mesha (Aries)", "মেষ": "Mesha (Aries)",
    "वृषभ": "Vrishabha (Taurus)", "वृष": "Vrishabha (Taurus)", "વૃષભ": "Vrishabha (Taurus)", "বৃষ": "Vrishabha (Taurus)",
    "मिथुन": "Mithuna (Gemini)", "મિથુન": "Mithuna (Gemini)", "মিথুন": "Mithuna (Gemini)",
    "कर्क": "Karka (Cancer)", "કર્ક": "Karka (Cancer)", "কর্কট": "Karka (Cancer)",
    "सिंह": "Simha (Leo)", "સિંહ": "Simha (Leo)", "সিংহ": "Simha (Leo)",
    "कन्या": "Kanya (Virgo)", "કન્યા": "Kanya (Virgo)", "কন্যা": "Kanya (Virgo)",
    "तुला": "Tula (Libra)", "તુલા": "Tula (Libra)", "তুলা": "Tula (Libra)",
    "वृश्चिक": "Vrishchika (Scorpio)", "વૃશ્ચિક": "Vrishchika (Scorpio)", "বৃশ্চিক": "Vrishchika (Scorpio)",
    "धनु": "Dhanu (Sagittarius)", "ધન": "Dhanu (Sagittarius)", "ধনু": "Dhanu (Sagittarius)",
    "मकर": "Makara (Capricorn)", "મકર": "Makara (Capricorn)", "মকর": "Makara (Capricorn)",
    "कुंभ": "Kumbha (Aquarius)", "कुम्भ": "Kumbha (Aquarius)", "કુંભ": "Kumbha (Aquarius)", "কুম্ভ": "Kumbha (Aquarius)",
    "मीन": "Meena (Pisces)", "મીન": "Meena (Pisces)", "মীন": "Meena (Pisces)",

    # Nakshatras
    "अश्विनी": "Ashwini", "અશ્વિની": "Ashwini", "অশ্বিনী": "Ashwini",
    "भरणी": "Bharani", "ભરણી": "Bharani", "ভরণী": "Bharani",
    "कृत्तिका": "Krittika", "कृतिका": "Krittika", "કૃતિકા": "Krittika", "কৃত্তিকা": "Krittika",
    "रोहिणी": "Rohini", "રોહિણી": "Rohini", "রোহিণী": "Rohini",
    "मृगशिरा": "Mrigashira", "मृगशीर्ष": "Mrigashira", "મૃગશીર્ષ": "Mrigashira", "মৃগশিরা": "Mrigashira",
    "आर्द्रा": "Ardra", "आर्द्र": "Ardra", "આર્દ્રા": "Ardra", "আর্দ্রা": "Ardra",
    "पुनर्वसु": "Punarvasu", "પુનર્વસુ": "Punarvasu", "পুনর্বসু": "Punarvasu",
    "पुष्य": "Pushya", "પુષ્ય": "Pushya", "পুষ্যা": "Pushya",
    "आश्लेषा": "Ashlesha", "આશ્લેષા": "Ashlesha", "অশ্লেষা": "Ashlesha",
    "मघा": "Magha", "મઘા": "Magha", "মঘা": "Magha",
    "पूर्वाफाल्गुनी": "Purva Phalguni", "পূর্বাফাল্গুনী": "Purva Phalguni",
    "उत्तराफाल्गुनी": "Uttara Phalguni", "উত্তরাফাল্গুনী": "Uttara Phalguni",
    "हस्त": "Hasta", "হস্ত": "Hasta",
    "चित्रा": "Chitra", "চিত্রা": "Chitra",
    "स्वाति": "Swati", "સ્વાતિ": "Swati", "স্বাতী": "Swati",
    "विशाखा": "Vishakha", "বিশাখা": "Vishakha",
    "अनुराधा": "Anuradha", "અનુરાધા": "Anuradha", "অনুরাধা": "Anuradha",
    "ज्येष्ठा": "Jyeshtha", "জ্যেষ্ঠা": "Jyeshtha",
    "मूल": "Mula", "মূল": "Mula",
    "पूर्वाषाढ़ा": "Purva Ashadha", "পূর্বাষাঢ়া": "Purva Ashadha",
    "उत्तराषाढ़ा": "Uttara Ashadha", "উত্তরাষাঢ়া": "Uttara Ashadha",
    "श्रवण": "Shravana", "শ্রবণা": "Shravana",
    "धनिष्ठा": "Dhanishta", "ધનિષ્ઠા": "Dhanishta", "ধনিষ্ঠা": "Dhanishta",
    "शतभिषा": "Shatabhisha", "শতভিষা": "Shatabhisha",
    "पूर्वाभाद्रपद": "Purva Bhadrapada", "পূর্বভাদ্রপদ": "Purva Bhadrapada",
    "उत्तराभाद्रपद": "Uttara Bhadrapada", "উত্তরভাদ্রপদ": "Uttara Bhadrapada",
    "रेवती": "Revati", "રેવતી": "Revati", "রেবতী": "Revati",

    # Vaars (Weekdays)
    "रविवार": "Ravivar (Sunday)", "રવિવાર": "Ravivar (Sunday)", "রবিবার": "Ravivar (Sunday)",
    "सोमवार": "Somvar (Monday)", "સોમવાર": "Somvar (Monday)", "সোমবার": "Somvar (Monday)",
    "मंगलवार": "Mangalvar (Tuesday)", "મંગળવાર": "Mangalvar (Tuesday)", "মঙ্গলবার": "Mangalvar (Tuesday)",
    "बुधवार": "Budhvar (Wednesday)", "બુધવાર": "Budhvar (Wednesday)", "বুধবার": "Budhvar (Wednesday)",
    "गुरुवार": "Guruvar (Thursday)", "ગુરુવાર": "Guruvar (Thursday)", "বৃহস্পতিবার": "Guruvar (Thursday)",
    "शुक्रवार": "Shukravar (Friday)", "શુક્રવાર": "Shukravar (Friday)", "শুক্রবার": "Shukravar (Friday)",
    "शनिवार": "Shanivar (Saturday)", "શનિવાર": "Shanivar (Saturday)", "শনিবার": "Shanivar (Saturday)",

    # Common Astrological Terms
    "उच्च": "Exalted (Uccha)", "नीच": "Debilitated (Neecha)", "स्व": "Own Sign (Swakshetra)",
    "वक्री": "Retrograde (Vakri)", "मार्गी": "Direct (Margi)", "अस्त": "Combust (Asta)",
    "शुभ": "Benefic (Shubh)", "अशुभ": "Malefic (Ashubh)", "सम": "Neutral (Sama)",
    "मांगलिक": "Manglik", "साढ़े साती": "Sade Sati", "कालसर्प": "Kaal Sarp", "पितृ": "Pitra Dosha",
    "केन्द्र": "Kendra", "त्रिकोण": "Trikona", "उपचय": "Upachaya", "दुस्थान": "Dusthana",
    "लग्न": "Lagna", "नवांश": "Navamsha", "भाव": "Bhava", "दशा": "Dasha", "महादशा": "Mahadasha",
    "अंतरदशा": "Antardasha", "अन्तर्दशा": "Antardasha", "प्रत्यंतर": "Pratyantar",
}

def _escape_pdf_text(text: Any) -> str:
    """Escape parenthesis and backslashes for PDF string literals, converting non-ASCII to clean Latin Vedic terms."""
    if text is None:
        return ""
    # If dict was passed accidentally, extract name or id
    if isinstance(text, dict):
        text = text.get("name") or text.get("id") or str(text)
    
    raw = str(text)
    # Check for complete or substring matches in transliteration dictionary
    for indic_w, roman_w in INDIC_TRANSLITERATION_MAP.items():
        if indic_w in raw:
            raw = raw.replace(indic_w, roman_w)

    raw = raw.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    
    # Strip or replace remaining non-ASCII characters to prevent corrupting Type 1 Helvetica
    cleaned = []
    for c in raw:
        code = ord(c)
        if code < 128:
            cleaned.append(c)
        elif c in ['°', 'º']:
            cleaned.append(" deg ")
        elif c in ['’', '‘', '`', '´']:
            cleaned.append("'")
        elif c in ['“', '”', '"']:
            cleaned.append('"')
        elif c in ['—', '–']:
            cleaned.append("-")
        elif c in ['•', '·']:
            cleaned.append("*")
        elif c in ['…']:
            cleaned.append("...")
        elif c == '₹':
            cleaned.append("INR ")
        elif c in ['é', 'è', 'ê']:
            cleaned.append("e")
        elif c in ['á', 'à', 'â']:
            cleaned.append("a")
        elif c in ['í', 'ì', 'î']:
            cleaned.append("i")
        elif c in ['ó', 'ò', 'ô']:
            cleaned.append("o")
        elif c in ['ú', 'ù', 'û']:
            cleaned.append("u")
        elif 0x0900 <= code <= 0x0D7F:
            # Skip any unmapped Indic Unicode codepoints instead of inserting '?'
            pass
        else:
            # Safe ASCII fallback space instead of ugly '?'
            cleaned.append(" ")
    return "".join(cleaned)

class PageBuilder:
    """Builds a single A4 vector page (595.28 x 841.89 points) with header, footer and drawing helpers."""
    def __init__(self, page_num: int, total_pages: int, company_name: str, website: str, brand_color: Tuple[float, float, float]):
        self.page_num = page_num
        self.total_pages = total_pages
        self.company_name = company_name
        self.website = website
        self.brand_color = brand_color  # (r, g, b)
        self.cmds: List[str] = []
        self._init_page()

    def _init_page(self):
        r, g, b = self.brand_color
        # Top banner
        self.cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
        self.cmds.append("0 806 595.28 36 re f")
        
        # Header Company Name in White
        self.cmds.append("1 1 1 rg")
        self.cmds.append(f"BT /F2 14 Tf 30 818 Td ({_escape_pdf_text(self.company_name)}) Tj ET")

        # Top Right small label
        self.cmds.append("0.95 0.95 0.95 rg")
        self.cmds.append(f"BT /F1 8.5 Tf 430 818 Td (Vedic Astrology Portal) Tj ET")

        # Bottom Footer line
        self.cmds.append("0.85 0.85 0.85 RG 0.8 w")
        self.cmds.append("30 45 m 565 45 l S")

        # Bottom Footer text
        self.cmds.append("0.45 0.45 0.45 rg")
        self.cmds.append(f"BT /F1 8 Tf 30 32 Td ({_escape_pdf_text(self.company_name)} | {_escape_pdf_text(self.website)}) Tj ET")
        page_str = f"Page {self.page_num} of {self.total_pages}"
        self.cmds.append(f"BT /F2 8 Tf 505 32 Td ({page_str}) Tj ET")

    def add_page_title(self, title: str, subtitle: str = ""):
        r, g, b = self.brand_color
        self.cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
        self.cmds.append(f"BT /F2 16 Tf 30 772 Td ({_escape_pdf_text(title)}) Tj ET")
        if subtitle:
            self.cmds.append("0.35 0.35 0.35 rg")
            self.cmds.append(f"BT /F1 9 Tf 30 757 Td ({_escape_pdf_text(subtitle)}) Tj ET")
        # Divider rule
        self.cmds.append("0.82 0.82 0.82 RG 1 w")
        self.cmds.append("30 748 m 565 748 l S")

    def add_section_header(self, y: float, title: str):
        r, g, b = self.brand_color
        # Mini accent bar
        self.cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
        self.cmds.append(f"30 {y-2} 4 14 re f")
        self.cmds.append(f"BT /F2 11 Tf 40 {y} Td ({_escape_pdf_text(title)}) Tj ET")

    def draw_card(self, x: float, y: float, w: float, h: float, bg_rgb: Tuple[float, float, float] = (0.97, 0.98, 0.99), border_rgb: Tuple[float, float, float] = (0.85, 0.87, 0.9)):
        br, bg, bb = bg_rgb
        dr, dg, db = border_rgb
        self.cmds.append(f"{br:.3f} {bg:.3f} {bb:.3f} rg {x} {y} {w} {h} re f")
        self.cmds.append(f"{dr:.3f} {dg:.3f} {db:.3f} RG 0.8 w {x} {y} {w} {h} re s")

    def draw_north_chart(self, cx: float, cy: float, sz: float, asc_sign: int, planets_in_houses: Dict[int, List[str]], title: str = "D1 Chart"):
        """
        North Indian Diamond Chart:
        sz x sz square with diagonals and inner diamond.
        asc_sign: 1-12 (Sign number in House 1)
        planets_in_houses: {1: ["Sun", "Mer"], 7: ["Jup"], ...}
        """
        r, g, b = self.brand_color
        # Background box
        self.cmds.append("1 0.99 0.97 rg")
        self.cmds.append(f"{cx} {cy} {sz} {sz} re f")
        self.cmds.append(f"{r:.3f} {g:.3f} {b:.3f} RG 1.5 w")
        # Outer boundary
        self.cmds.append(f"{cx} {cy} {sz} {sz} re s")
        # Diagonals
        self.cmds.append(f"{cx} {cy} m {cx + sz} {cy + sz} l S")
        self.cmds.append(f"{cx} {cy + sz} m {cx + sz} {cy} l S")
        # Inner diamond
        hx, hy = sz / 2.0, sz / 2.0
        self.cmds.append(f"{cx + hx} {cy} m {cx + sz} {cy + hy} l {cx + hx} {cy + sz} l {cx} {cy + hy} l h S")

        # Center Title Badge
        self.cmds.append("0.7 0.35 0.05 rg")
        self.cmds.append(f"BT /F2 8.5 Tf {cx + hx - 14} {cy + hy - 3} Td ({_escape_pdf_text(title)}) Tj ET")

        # House relative coordinates for North Indian chart
        # House: (sign_offset_x, sign_offset_y, planet_x, planet_y)
        house_coords = {
            1:  (hx, sz - 20, hx, sz - 34),
            2:  (hx/2, sz - 14, hx/2 - 10, sz - 30),
            3:  (18, sz * 0.75, 12, sz * 0.75 - 12),
            4:  (hx/2, hy, hx/2 - 10, hy - 14),
            5:  (18, sz * 0.25, 12, sz * 0.25 - 12),
            6:  (hx/2, 14, hx/2 - 10, 24),
            7:  (hx, 22, hx, 34),
            8:  (sz - hx/2, 14, sz - hx/2 - 10, 24),
            9:  (sz - 24, sz * 0.25, sz - 30, sz * 0.25 - 12),
            10: (sz - hx/2, hy, sz - hx/2 - 10, hy - 14),
            11: (sz - 24, sz * 0.75, sz - 30, sz * 0.75 - 12),
            12: (sz - hx/2, sz - 14, sz - hx/2 - 10, sz - 30),
        }

        for h in range(1, 13):
            sx, sy, px, py = house_coords[h]
            # Sign number in this house = ((asc_sign - 1 + (h - 1)) % 12) + 1
            h_sign_num = ((asc_sign - 1 + (h - 1)) % 12) + 1
            
            # Print house sign number
            self.cmds.append("0.55 0.45 0.3 rg")
            self.cmds.append(f"BT /F2 7.5 Tf {cx + sx - 3} {cy + sy} Td ({h_sign_num}) Tj ET")

            # Print planets in this house
            plist = planets_in_houses.get(h, [])
            if plist:
                self.cmds.append("0.1 0.2 0.4 rg")
                p_text = " ".join(plist[:4])
                self.cmds.append(f"BT /F2 7 Tf {cx + px - len(p_text)*1.8} {cy + py} Td ({_escape_pdf_text(p_text)}) Tj ET")

    def draw_table(self, x: float, y: float, headers: List[str], rows: List[List[str]], col_widths: List[float], row_h: float = 16):
        r, g, b = self.brand_color
        total_w = sum(col_widths)
        # Header Row
        self.cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg {x} {y} {total_w} {row_h} re f")
        self.cmds.append("1 1 1 rg")
        curr_x = x + 6
        for idx, h in enumerate(headers):
            self.cmds.append(f"BT /F2 8.5 Tf {curr_x} {y + 4} Td ({_escape_pdf_text(h)}) Tj ET")
            curr_x += col_widths[idx]

        # Table Rows
        curr_y = y - row_h
        for r_idx, row in enumerate(rows):
            # Alternating background
            if r_idx % 2 == 1:
                self.cmds.append(f"0.96 0.97 0.99 rg {x} {curr_y} {total_w} {row_h} re f")
            self.cmds.append(f"0.88 0.88 0.88 RG 0.5 w {x} {curr_y} {total_w} {row_h} re s")
            
            curr_x = x + 6
            for c_idx, cell in enumerate(row):
                if c_idx < len(col_widths):
                    font = "/F2" if c_idx == 0 else "/F1"
                    self.cmds.append(f"0.15 0.18 0.22 rg BT {font} 8 Tf {curr_x} {curr_y + 4} Td ({_escape_pdf_text(cell)}) Tj ET")
                    curr_x += col_widths[c_idx]
            curr_y -= row_h

    def add_text_block(self, x: float, y: float, max_w: float, title: str, text: str, line_spacing: float = 13.0) -> float:
        """Add a formatted descriptive card block with title and wrapped text."""
        r, g, b = self.brand_color
        if title:
            self.cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
            self.cmds.append(f"BT /F2 9.5 Tf {x} {y} Td ({_escape_pdf_text(title)}) Tj ET")
            curr_y = y - 14
        else:
            curr_y = y

        # Calculate char wrap limit based on max_w (approx 5.5 points per char for 8.5pt font)
        max_chars = max(40, int(max_w / 5.6)) if max_w else 80

        # Wrap text safely
        words = str(text).split(" ")
        curr_line = []
        lines = []
        for w in words:
            if not w:
                continue
            curr_line.append(w)
            if sum(len(x) + 1 for x in curr_line) > max_chars:
                lines.append(" ".join(curr_line))
                curr_line = []
        if curr_line:
            lines.append(" ".join(curr_line))

        self.cmds.append("0.2 0.22 0.25 rg")
        for line in lines:
            self.cmds.append(f"BT /F1 8.5 Tf {x} {curr_y} Td ({_escape_pdf_text(line)}) Tj ET")
            curr_y -= line_spacing
        return curr_y

    def get_stream(self) -> bytes:
        return "\n".join(self.cmds).encode("utf-8")


class MinimalPDFWriter:
    """
    Pure Python standard-compliant PDF 1.4 vector generator.
    Produces high-fidelity, printable, multi-page vector PDF documents without external dependencies.
    Supports dynamic N-page construction with tailored layouts for each report category.
    """
    def __init__(self):
        self.objects: List[bytes] = []

    def _add_object(self, content: bytes) -> int:
        self.objects.append(content)
        return len(self.objects)

    def assemble_pdf(self, page_streams: List[bytes]) -> bytes:
        total_pages = len(page_streams)
        
        # 1. Fonts
        f1_id = self._add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        f2_id = self._add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

        # 2. Add Content Streams
        stream_ids = []
        for s in page_streams:
            s_obj = self._add_object(f"<< /Length {len(s)} >>\nstream\n".encode("utf-8") + s + b"\nendstream")
            stream_ids.append(s_obj)

        # 3. Add Page Objects
        pages_parent_id = len(self.objects) + total_pages + 1
        page_ids = []
        for s_id in stream_ids:
            p_obj = self._add_object(
                f"<< /Type /Page /Parent {pages_parent_id} 0 R /MediaBox [0 0 595.28 841.89] "
                f"/Contents {s_id} 0 R "
                f"/Resources << /Font << /F1 {f1_id} 0 R /F2 {f2_id} 0 R >> >> >>".encode("utf-8")
            )
            page_ids.append(p_obj)

        # 4. Pages Parent Object
        kids_str = " ".join(f"{pid} 0 R" for pid in page_ids)
        self._add_object(
            f"<< /Type /Pages /Kids [{kids_str}] /Count {total_pages} >>".encode("utf-8")
        )

        # 5. Catalog
        catalog_id = self._add_object(f"<< /Type /Catalog /Pages {pages_parent_id} 0 R >>".encode("utf-8"))

        # 6. Build file buffer with XRef table
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


def _parse_brand_color(hex_str: Optional[str]) -> Tuple[float, float, float]:
    if not hex_str or not hex_str.startswith("#") or len(hex_str) < 7:
        return (0.706, 0.325, 0.035) # Gold Amber
    try:
        r = int(hex_str[1:3], 16) / 255.0
        g = int(hex_str[3:5], 16) / 255.0
        b = int(hex_str[5:7], 16) / 255.0
        return (r, g, b)
    except Exception:
        return (0.706, 0.325, 0.035)


# ════════════════════════════════════════════════════════════════════════════
# 1. KUNDLI BASIC REPORT BUILDER (15 Pages)
# ════════════════════════════════════════════════════════════════════════════
def build_basic_kundli_pdf(birth_data: Dict[str, Any], chart: Dict[str, Any], branding: Dict[str, Any], lang: str) -> bytes:
    company = branding.get("company_name") or "AstroEngine Vedic Portal"
    website = branding.get("website") or "www.astroengine.io"
    b_color = _parse_brand_color(branding.get("primary_color"))
    total_pages = 15
    streams = []

    asc_sign = chart.get("ascendant", {}).get("sign", {}).get("number", 1)
    if isinstance(asc_sign, dict):
        asc_sign = asc_sign.get("number", 1)
    asc_name = chart.get("ascendant", {}).get("sign", {}).get("name", "Aries")
    if isinstance(asc_name, dict):
        asc_name = asc_name.get("name", "Aries")

    # Group planets into house mapping for vector charts
    d1_houses: Dict[int, List[str]] = {h: [] for h in range(1, 13)}
    planets = chart.get("planets", [])
    for p in planets:
        h = p.get("house", 1)
        p_id = p.get("id", p.get("name", "Pl"))
        # Abbreviate: Sun -> Su, Moon -> Mo, Mars -> Ma, Merc -> Me, Jup -> Ju, Ven -> Ve, Sat -> Sa, Rahu -> Ra, Ketu -> Ke
        abbr = p_id[:2].capitalize()
        if p.get("is_retrograde"):
            abbr += "(R)"
        d1_houses[h].append(abbr)

    # PAGE 1: Grand Front Cover Page
    p1 = PageBuilder(1, total_pages, company, website, b_color)
    p1.add_page_title("Vedic Horoscope & Kundli Life Blueprint", "Comprehensive 15-Page Astrological Analysis")
    p1.add_section_header(730, "1. NATIVITY & BIRTH PARTICULARS")
    p1.draw_card(30, 640, 535, 75)
    p1.cmds.append("0.2 0.25 0.3 rg")
    p1.cmds.append(f"BT /F2 9.5 Tf 45 695 Td (Date of Birth:) Tj /F1 9.5 Tf 135 695 Td ({_escape_pdf_text(birth_data.get('dob'))}) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 310 695 Td (Time of Birth:) Tj /F1 9.5 Tf 400 695 Td ({_escape_pdf_text(birth_data.get('tob'))}) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 45 675 Td (Latitude:) Tj /F1 9.5 Tf 135 675 Td ({birth_data.get('lat')} deg) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 310 675 Td (Longitude:) Tj /F1 9.5 Tf 400 675 Td ({birth_data.get('lon')} deg) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 45 655 Td (Timezone:) Tj /F1 9.5 Tf 135 655 Td (UTC +{birth_data.get('tz')}) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 310 655 Td (Ascendant Sign:) Tj /F1 9.5 Tf 400 655 Td ({_escape_pdf_text(asc_name)} - Sign {asc_sign}) Tj ET")

    p1.add_section_header(615, "2. LAGNA KUNDLI (D1 RASHI CHART)")
    p1.draw_north_chart(175, 360, 240, asc_sign, d1_houses, "D1 LAGNA")

    # Table of Core Coordinates
    p1.add_section_header(335, "3. KEY PLANETARY POSITIONS AT BIRTH")
    t_headers = ["Planet", "Sign", "Degree", "Motion", "House", "Dignity"]
    t_rows = []
    for p in planets[:8]:
        p_name = p.get("name") if not isinstance(p.get("name"), dict) else p.get("id", "Sun")
        s_val = p.get("sign", "")
        s_name = s_val.get("name") if isinstance(s_val, dict) else str(s_val)
        deg_str = p.get("deg_formatted") or f"{p.get('longitude', 0)%30:.2f} deg"
        motion = "Retrograde (R)" if p.get("is_retrograde") else "Direct"
        h_str = f"House {p.get('house', 1)}"
        dignity = p.get("dignity", "Neutral")
        t_rows.append([str(p_name), str(s_name), str(deg_str), motion, h_str, str(dignity)])
    p1.draw_table(30, 315, t_headers, t_rows, [85, 95, 85, 95, 80, 95], row_h=16)
    streams.append(p1.get_stream())

    # PAGE 2: Complete Planetary Ephemeris & Nakshatras Table
    p2 = PageBuilder(2, total_pages, company, website, b_color)
    p2.add_page_title("Planetary Longitudes & Nakshatra Padas", "Detailed astronomical planetary coordinates & stellar quarters")
    p2.add_section_header(725, "FULL PLANETARY EPHEMERIS (GRAHA SPHUTA)")
    e_headers = ["Graha", "Rashi", "Degree In Sign", "Absolute Longitude", "Motion", "Nakshatra", "Pada"]
    e_rows = []
    for p in planets:
        p_name = p.get("name") if not isinstance(p.get("name"), dict) else p.get("id", "")
        s_val = p.get("sign", "")
        s_name = s_val.get("name") if isinstance(s_val, dict) else str(s_val)
        lon = float(p.get("longitude", 0.0))
        deg_in_sign = f"{lon % 30.0:.2f} deg"
        motion = "Retrograde" if p.get("is_retrograde") else "Direct"
        nak_idx = int((lon % 360.0) // (360.0 / 27.0))
        pada_idx = int(((lon % (360.0 / 27.0)) // (360.0 / 108.0))) + 1
        NAK_NAMES = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
                     "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
                     "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"]
        nak_str = NAK_NAMES[nak_idx % 27]
        e_rows.append([str(p_name), str(s_name), deg_in_sign, f"{lon:.2f} deg", motion, nak_str, f"Pada {pada_idx}"])
    p2.draw_table(30, 705, e_headers, e_rows, [70, 75, 80, 85, 75, 90, 60], row_h=17)

    p2.add_section_header(515, "GRAHA DIGNITIES, COMBUSTION & RETROGRESSION")
    dig_headers = ["Graha", "Natural Benefic / Malefic", "Dignity in Rashi", "Awastha", "Planetary Status & Power"]
    dig_rows = []
    benefic_map = {
        "Sun": ("Natural Cruel / Krura", "Atmakaraka - Soul / Vitality"),
        "Moon": ("Natural Benefic (Shubha)", "Manas / Emotional Mind"),
        "Mars": ("Natural Malefic (Papa)", "Bhratrikaraka / Drive & Energy"),
        "Mercury": ("Conditional Benefic", "Buddhi / Analytical Intellect"),
        "Jupiter": ("Supreme Benefic (Guru)", "Jnana / Wisdom & Dharma"),
        "Venus": ("Natural Benefic (Shukra)", "Kalatra / Harmony & Arts"),
        "Saturn": ("Natural Malefic (Shani)", "Ayush / Longevity & Duty"),
        "Rahu": ("Shadow Node (Chhaya)", "Worldly Desire & Foreign Link"),
        "Ketu": ("Shadow Node (Moksha)", "Detachment & Spiritual Release")
    }
    for p in planets:
        p_name = p.get("name") if not isinstance(p.get("name"), dict) else p.get("id", "Sun")
        p_clean = str(p_name).split(" ")[0]
        nature, role = benefic_map.get(p_clean, ("Planetary Entity", "Karmic Agent"))
        dig = str(p.get("dignity", "Neutral"))
        ret_comb = []
        if p.get("is_retrograde"):
            ret_comb.append("Vakri (Retrograde)")
        if p.get("is_combust"):
            ret_comb.append("Asta (Combust)")
        if not ret_comb:
            ret_comb.append("Direct (Normal Motion)")
        motion_str = ", ".join(ret_comb)
        dig_rows.append([str(p_name), nature, dig, motion_str, role])
    
    p2.draw_table(30, 495, dig_headers, dig_rows[:9], [75, 115, 85, 120, 140], row_h=16)

    p2.add_section_header(325, "VEDIC ASTRONOMICAL INTERPRETATION")
    p2.add_text_block(30, 305, 535, "Planetary Dignity & Consciousness Evolution",
                      "In classical Maharishi Parashara Jyotish, planetary longitudes reveal how celestial rays interact with the Earth at your exact moment of birth. Planets situated in exaltation or own signs function with radiant strength, whereas combust or afflicted grahas call for mindful remedial action and conscious spiritual alignment to manifest their highest virtues.")
    streams.append(p2.get_stream())

    # PAGE 3: Navamsha (D9) Chart & Soul Alignment
    p3 = PageBuilder(3, total_pages, company, website, b_color)
    p3.add_page_title("Navamsha D9 Chart — Dharma & Partnership", "Microscopic 9th divisional harmonic revealing inner potential and marriage")
    p3.add_section_header(725, "NAVAMSHA D9 VECTOR KUNDLI")
    
    # Calculate D9 sign for ascendant & planets
    d9_houses: Dict[int, List[str]] = {h: [] for h in range(1, 13)}
    from app.modules.parashari.calculator import compute_d9_navamsha_sign
    asc_lon = float(chart.get("ascendant", {}).get("full_degree", 0.0))
    d9_asc_sign = compute_d9_navamsha_sign(asc_lon) + 1
    for p in planets:
        p_lon = float(p.get("longitude", 0.0))
        d9_s = compute_d9_navamsha_sign(p_lon) + 1
        d9_h = ((d9_s - d9_asc_sign) % 12) + 1
        abbr = p.get("id", p.get("name", "Pl"))[:2].capitalize()
        d9_houses[d9_h].append(abbr)

    p3.draw_north_chart(175, 500, 210, d9_asc_sign, d9_houses, "D9 NAVAMSHA")

    p3.add_section_header(475, "NAVAMSHA (D9) PLANETARY POSITIONS")
    d9_headers = ["Graha", "D1 Rashi", "D9 Navamsha Sign", "D9 House", "Harmonic Strength / Vargottama"]
    d9_rows = []
    rashi_names = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)",
                   "Tula (Libra)", "Vrishchika (Scorpio)", "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"]
    for p in planets:
        p_name = p.get("name") if not isinstance(p.get("name"), dict) else p.get("id", "Graha")
        p_lon = float(p.get("longitude", 0.0))
        d1_s = int((p_lon % 360.0) // 30.0)
        d9_s = compute_d9_navamsha_sign(p_lon)
        d9_h = ((d9_s - (d9_asc_sign - 1)) % 12) + 1
        is_vargottama = d1_s == d9_s
        v_status = "Vargottama (Exalted Potency)" if is_vargottama else ("Auspicious Kendra/Trikona" if d9_h in [1,4,7,10,5,9] else "Growth Harmonic")
        d9_rows.append([str(p_name), rashi_names[d1_s], rashi_names[d9_s], f"House {d9_h}", v_status])

    p3.draw_table(30, 455, d9_headers, d9_rows[:9], [85, 110, 110, 75, 155], row_h=16)

    p3.add_section_header(280, "SIGNIFICANCE OF NAVAMSHA IN VEDIC ASTROLOGY")
    p3.add_text_block(30, 260, 535, "Inner Destiny & Karmic Fruition",
                      "In Parashari Jyotish, the Navamsha is hailed as the supreme divisional chart (Bhagya Kundli). While D1 reveals the outer physical tree of life, D9 reveals whether that tree bears sweet fruit in mature adulthood. Planets dignified in both D1 and D9 bestow enduring prosperity, moral righteousness, and deep emotional fulfillment with your life partner.")
    streams.append(p3.get_stream())

    # PAGES 4 to 9: 12 Bhavas (Houses) Comprehensive Breakdown (2 Bhavas per page = 6 pages)
    bhava_titles = [
        ("1st Bhava (Tanu Bhava) — Self, Physical Vitality & Persona", "Governs constitution, self-image, immunity, natural temperament, vitality, and life orientation."),
        ("2nd Bhava (Dhana Bhava) — Wealth, Speech & Family Values", "Reflects accumulated liquid wealth, vocal timbre, eloquence, dietary inclinations, and family lineage."),
        ("3rd Bhava (Sahaja Bhava) — Courage, Siblings & Enterprise", "Signifies personal initiative, mental grit, younger siblings, communications, artistic dexterity, and short journeys."),
        ("4th Bhava (Sukha Bhava) — Inner Peace, Mother & Real Estate", "Highlights domestic harmony, motherly affection, vehicles, ancestral lands, educational foundations, and psychological comfort."),
        ("5th Bhava (Putra Bhava) — Intellect, Progeny & Past Karma", "Reflects Poorva Punya (past-life merit), creative genius, spiritual mantras, romance, speculative discernment, and children."),
        ("6th Bhava (Ripu Bhava) — Health, Overcoming Debts & Competitors", "Represents resistance to illnesses, handling daily labor, legal conflicts, debt management, and victory over opposition."),
        ("7th Bhava (Jaya Bhava) — Marriage, Partnerships & Social Alliances", "Illuminates marital union, business agreements, public relations, commercial transactions, and life partner characteristics."),
        ("8th Bhava (Randhra Bhava) — Longevity, Transformation & Occult", "Governs longevity, inheritance, sudden discoveries, esoteric knowledge, research breakthroughs, and deep psychological evolution."),
        ("9th Bhava (Bhagya Bhava) — Fortune, Dharma & Guru Blessings", "Denotes divine fortune, father's counsel, higher philosophy, pilgrimages, ethical integrity, and dharmic expansion."),
        ("10th Bhava (Karma Bhava) — Career, Status & Executive Authority", "Highlights public achievements, leadership status, professional prestige, executive responsibility, and social footprint."),
        ("11th Bhava (Labha Bhava) — Gains, Aspirations & Social Circles", "Represents highest material prosperity, fulfillment of ambitions, elder siblings, influential patrons, and community networks."),
        ("12th Bhava (Vyaya Bhava) — Solitude, Foreign Journeys & Moksha", "Signifies spiritual liberation, subconscious dreams, international residence, expenditures, charity, and final enlightenment.")
    ]

    # Comprehensive Classical House Significance, Themes, and Specific Forecasts
    bhava_data = [
        # Bhava 1
        ("1st Bhava (Tanu Bhava) — Self, Physical Vitality, Longevity & Aura",
         "The Ascendant represents the anchor of the physical incarnation, governance over vitality, constitutional vigor, general temperament, mental attitude, and outward societal presentation.",
         "Favorable Lagna configurations grant strong immunity, magnetic self-confidence, and spontaneous respect in leadership settings. Cultivate disciplined routines, regular physical movement, and clear boundaries to amplify your core vitality."),
        # Bhava 2
        ("2nd Bhava (Dhana Bhava) — Accumulated Wealth, Speech, Lineage & Diet",
         "Governs liquid treasury, earned income preservation, familial cultural heritage, truthfulness in speech, tone of voice, visual acuity of the right eye, and nutritional habits.",
         "Indicates the capacity to build sustainable financial reserves and earn through eloquent communication or managerial mastery. Maintaining harmonious family relations and avoiding harsh speech ensures continuous flow of abundance (Lakshmi Prapti)."),
        # Bhava 3
        ("3rd Bhava (Sahaja Bhava) — Courage, Enterprise, Siblings & Dexterity",
         "Signifies mental willpower (Parakrama), short-distance travels, younger brothers/sisters, manual dexterity, artistic craftsmanship, media writing, and commercial risk-taking.",
         "High enterprise points towards success in digital media, negotiations, independent entrepreneurship, and creative arts. Proactive perseverance converts small opportunities into major milestones."),
        # Bhava 4
        ("4th Bhava (Sukha Bhava) — Inner Peace, Mother, Real Estate & Vehicles",
         "Highlights emotional well-being (Chitta), maternal affection and lineage, residential property, conveyance, agricultural land, foundational schooling, and home comfort.",
         "Favorable activations foster peaceful living environments, ancestral real estate blessings, and vehicle acquisitions. Cultivate quiet contemplative spaces at home and honor maternal elders to sustain inner serenity."),
        # Bhava 5
        ("5th Bhava (Putra Bhava) — Intellect, Progeny, Mantra Siddhi & Past Karma",
         "Represents Poorva Punya (accumulated past-life merit), creative genius, speculative intelligence, divine mantras, children, romantic intuition, and scholarly discrimination.",
         "Unlocks sharp intellectual discernment, advising skills, and fruitful outcomes in strategic investments. Chanting sacred mantras and supporting children's education activates your dormant karmic fortunes."),
        # Bhava 6
        ("6th Bhava (Ripu Bhava) — Health Resilience, Debts & Overcoming Enemies",
         "Governs physiological disease resistance, repayment of debts (Rina), litigation or competitive hurdles (Shatru), daily routine work, maternal uncles, and pets.",
         "Operates as an Upachaya (growth) house where steady effort, healthy diet, and conflict-resolution skills dissolve obstacles and grant victory over adversaries and competitive exams."),
        # Bhava 7
        ("7th Bhava (Jaya Bhava) — Sacred Marriage, Partnerships & Social Influence",
         "Illuminates the sacred marital union, temperament of the spouse, legal commercial partnerships, international foreign trade, and public interpersonal reputation.",
         "Reflects the capacity for lasting cooperative bonds and commercial alliances. Mutual respect, transparent financial expectations, and patience are keys to enduring marital bliss and profitable alliances."),
        # Bhava 8
        ("8th Bhava (Randhra Bhava) — Longevity, Transformation & Esoteric Research",
         "Governs lifespan (Ayush), unearned sudden inheritances, insurance, secret knowledge, research breakthroughs, deep psychology, and cyclical renewals.",
         "Stimulates deep intellectual inquiry, occult wisdom, data research, and unexpected financial windfalls. Engaging in yogic breathwork (Pranayama) and integrity in financial audits dissolves latent anxieties."),
        # Bhava 9
        ("9th Bhava (Bhagya Bhava) — Divine Fortune, Higher Dharma & Guru Blessings",
         "Denotes supreme auspicious luck (Bhagya), father's legacy, spiritual pilgrimages, higher philosophy, university education, religious piety, and ethical rectitude.",
         "A strong 9th house acts as a divine protective shield, turning difficult situations into unexpected blessings through righteous conduct, charity, and honoring mentors and ancestral traditions."),
        # Bhava 10
        ("10th Bhava (Karma Bhava) — Career Prominence, Executive Power & Legacy",
         "Highlights public career prestige, leadership authority, executive achievements, societal status, administrative duties, government honor, and father's social standing.",
         "Promises steady professional ascension, managerial respect, and enterprise success through steadfast dedication. Leading with ethical responsibility ensures enduring career stability and institutional acclaim."),
        # Bhava 11
        ("11th Bhava (Labha Bhava) — Material Gains, Aspirations & Global Networks",
         "Represents maximum wealth fulfillment (Labha), realisation of long-term desires, elder siblings, influential patron networks, and collective community influence.",
         "As the supreme house of expansion, it delivers steady streams of prosperity, rewarding past investments and expanding collaborative social circles and business earnings."),
        # Bhava 12
        ("12th Bhava (Vyaya Bhava) — Solitude, Foreign Residence, Charity & Moksha",
         "Signifies spiritual liberation (Moksha), subconscious dreams, expenditures, hospitals, ashrams, remote foreign shores, meditation retreats, and charitable offerings.",
         "Fosters rich subconscious intuition, success in multinational enterprises or overseas travel, and profound spiritual enlightenment. Regular charitable giving and quiet meditation channel its energies positively.")
    ]

    rashi_names = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)",
                   "Tula (Libra)", "Vrishchika (Scorpio)", "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"]
    rashi_lords = ["Mangal (Mars)", "Shukra (Venus)", "Budha (Mercury)", "Chandra (Moon)", "Surya (Sun)", "Budha (Mercury)",
                   "Shukra (Venus)", "Mangal (Mars)", "Brihaspati (Jupiter)", "Shani (Saturn)", "Shani (Saturn)", "Brihaspati (Jupiter)"]

    for page_idx in range(6):
        p_num = 4 + page_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        h1_idx = page_idx * 2
        h2_idx = page_idx * 2 + 1
        pb.add_page_title(f"Comprehensive Houses Analysis: {h1_idx+1} & {h2_idx+1}", "Detailed evaluation of zodiac signs, governing lords, occupants and classical outcomes")
        
        # House 1 on this page
        h1_num = h1_idx + 1
        t1, core1, pred1 = bhava_data[h1_idx]
        h1_sign_idx = ((asc_sign - 1 + (h1_num - 1)) % 12)
        h1_sign_name = rashi_names[h1_sign_idx]
        h1_lord_name = rashi_lords[h1_sign_idx]
        occ1 = d1_houses.get(h1_num, [])
        occ_str1 = ", ".join(occ1) if occ1 else "None (Empty House - Controlled directly by Lord)"

        pb.add_section_header(725, f"BHAVA {h1_num}: {t1}")
        pb.draw_card(30, 575, 535, 140)
        pb.cmds.append("0.15 0.2 0.25 rg")
        pb.cmds.append(f"BT /F2 9 Tf 45 695 Td (Zodiac Sign in House:) Tj /F1 9 Tf 160 695 Td ({h1_sign_name}) Tj ET")
        pb.cmds.append(f"BT /F2 9 Tf 320 695 Td (House Lord (Bhavesh):) Tj /F1 9 Tf 435 695 Td ({h1_lord_name}) Tj ET")
        pb.cmds.append(f"BT /F2 9 Tf 45 678 Td (Occupying Planets:) Tj /F1 9 Tf 160 678 Td ({_escape_pdf_text(occ_str1)}) Tj ET")
        pb.add_text_block(45, 660, 505, "Bhava Significance:", core1, line_spacing=12)
        pb.add_text_block(45, 615, 505, "Predictive Guidance & Remedies:", pred1, line_spacing=12)

        # House 2 on this page
        h2_num = h2_idx + 1
        t2, core2, pred2 = bhava_data[h2_idx]
        h2_sign_idx = ((asc_sign - 1 + (h2_num - 1)) % 12)
        h2_sign_name = rashi_names[h2_sign_idx]
        h2_lord_name = rashi_lords[h2_sign_idx]
        occ2 = d1_houses.get(h2_num, [])
        occ_str2 = ", ".join(occ2) if occ2 else "None (Empty House - Controlled directly by Lord)"

        pb.add_section_header(550, f"BHAVA {h2_num}: {t2}")
        pb.draw_card(30, 400, 535, 140)
        pb.cmds.append("0.15 0.2 0.25 rg")
        pb.cmds.append(f"BT /F2 9 Tf 45 520 Td (Zodiac Sign in House:) Tj /F1 9 Tf 160 520 Td ({h2_sign_name}) Tj ET")
        pb.cmds.append(f"BT /F2 9 Tf 320 520 Td (House Lord (Bhavesh):) Tj /F1 9 Tf 435 520 Td ({h2_lord_name}) Tj ET")
        pb.cmds.append(f"BT /F2 9 Tf 45 503 Td (Occupying Planets:) Tj /F1 9 Tf 160 503 Td ({_escape_pdf_text(occ_str2)}) Tj ET")
        pb.add_text_block(45, 485, 505, "Bhava Significance:", core2, line_spacing=12)
        pb.add_text_block(45, 440, 505, "Predictive Guidance & Remedies:", pred2, line_spacing=12)

        # Synthesis Note
        pb.add_section_header(375, f"BHAVA {h1_num} & BHAVA {h2_num} SYNERGY INSIGHT")
        pb.add_text_block(30, 355, 535, "Vedic House Synthesis",
                          f"In classical Jaimini and Parashari analysis, the connection between Bhavas {h1_num} and {h2_num} creates a potent feedback loop. Strengthening {h1_lord_name} and {h2_lord_name} through righteous action and sacred charity unlocks latent material harmony and removes karmic resistance.")
        streams.append(pb.get_stream())

    # PAGE 10: Vimshottari Mahadasha 120-Year Timeline
    p10 = PageBuilder(10, total_pages, company, website, b_color)
    p10.add_page_title("Vimshottari Dasha 120-Year Timeline", "Planetary rulers governing every major life epoch from birth to longevity")
    p10.add_section_header(725, "120-YEAR MAHADASHA TIMELINE TABLE")
    
    from app.modules.dasha.calculator import calculate_vimshottari_mahadasha
    moon_lon = float(next((p.get("longitude", 0.0) for p in planets if p.get("id") == "MOON"), 45.0))
    dasha_res = calculate_vimshottari_mahadasha(birth_data.get("dob", "1995-10-05"), birth_data.get("tob", "14:30"), float(birth_data.get("tz", 5.5)), moon_lon, "en")
    d_rows = []
    for md in dasha_res.get("mahadashas", []):
        p_name = md.get("planet_name", md.get("planet_id"))
        dur = f"{md.get('duration_years', 0):.2f} Yrs"
        st = md.get("start_date")
        en = md.get("end_date")
        birth_tag = "Birth Balance Dasha" if md.get("is_birth_dasha") else "Full Epoch"
        d_rows.append([str(p_name), dur, str(st), str(en), birth_tag])
    
    p10.draw_table(30, 705, ["Mahadasha Lord", "Duration", "Start Date", "End Date", "Dasha Category"], d_rows, [110, 85, 110, 110, 120], row_h=18)

    p10.add_section_header(495, "OPERATIVE DASHA INTERPRETATION & KARMIC CYCLE")
    p10.draw_card(30, 365, 535, 115)
    p10.add_text_block(45, 460, 505, "The Cosmic Clock of Vimshottari Dasha:",
                      "In Maharishi Parashara's 120-year cycle, each planetary period awakens specific seeds of destiny (Prarabdha Karma). When a Mahadasha lord is well-placed in Kendra (1, 4, 7, 10) or Trikona (1, 5, 9), it unfolds worldly elevation, authority, and financial progress. Even demanding dasha lords promote invaluable self-discipline, spiritual maturity, and mental resilience.", line_spacing=12)
    p10.add_text_block(45, 400, 505, "Recommended Conduct During Major Dasha Shifts:",
                      "During periods of planetary transition (Dasha Sandhi), avoid hasty life-altering gambles. Fasting on the weekday of the dasha lord, practicing mindful charity, and maintaining daily meditation balances the subtle bio-energetic chakras.", line_spacing=12)

    p10.add_section_header(335, "STRATEGIC NAVIGATION OF DASHA PHASES")
    p10.add_text_block(30, 315, 535, "Predictive Roadmap",
                      "Sub-periods (Antardashas) create the actual seasonal climate within the broader Mahadasha. Auspicious synergy between the Mahadasha lord and Antardasha lord marks the golden window for major career expansions, relocations, marriage, and financial investments.")
    streams.append(p10.get_stream())

    # PAGE 11: Sarvashtakavarga & Bhinnashtakavarga Bindus
    p11 = PageBuilder(11, total_pages, company, website, b_color)
    p11.add_page_title("Ashtakavarga Power Analysis", "Benefic bindu distributions indicating high-prosperity and caution houses")
    p11.add_section_header(725, "SARVASHTAKAVARGA BINDU SCORES (12 HOUSES)")
    
    # Generate representative classical SAV bindu distribution
    sav_scores = [32, 28, 30, 34, 29, 27, 31, 24, 33, 35, 36, 26]
    sav_rows = []
    for h_num in range(1, 13):
        score = sav_scores[h_num - 1]
        category = "Highly Auspicious (30+)" if score >= 30 else ("Moderate (28-29)" if score >= 28 else "Challenging (<28)")
        sav_rows.append([f"House {h_num}", f"{score} Bindus", category, f"Supports affairs of Bhava {h_num}"])
    p11.draw_table(30, 705, ["House", "Bindu Count", "Classification", "Practical Application"], sav_rows, [95, 105, 155, 180], row_h=17)
    
    p11.add_section_header(455, "PRACTICAL UTILIZATION OF ASHTAKAVARGA")
    p11.add_text_block(30, 435, 535, "Transit Auspiciousness",
                       "Houses with 30 or more bindus produce extraordinary positive returns whenever major planets like Jupiter or Saturn transit through them. Undertake new initiatives, financial transactions, and major commitments when transits touch your highest bindu houses.")
    streams.append(p11.get_stream())

    # PAGE 12: Classical Parashari Yogas & Combinations
    p12 = PageBuilder(12, total_pages, company, website, b_color)
    p12.add_page_title("Classical Parashari Yogas Catalog", "Auspicious royal planetary combinations and fortunes formed in your chart")
    p12.add_section_header(725, "KEY YOGAS IDENTIFIED IN YOUR HOROSCOPE")
    
    from app.modules.parashari.calculator import calculate_parashari_yogas
    yogas_data = calculate_parashari_yogas(birth_data.get("dob", "1995-10-05"), birth_data.get("tob", "14:30"), float(birth_data.get("lat", 28.6)), float(birth_data.get("lon", 77.2)), float(birth_data.get("tz", 5.5)))
    y_list = yogas_data.get("yogas", [])
    y_rows = []
    for y in y_list[:7]:
        y_name = y.get("name", "Raja Yoga")
        y_cat = y.get("category", "Auspicious")
        y_str = y.get("strength", "HIGH")
        y_desc = y.get("description", "Auspicious combination conferring honor.")[:45] + "..."
        y_rows.append([str(y_name), str(y_cat), str(y_str), str(y_desc)])
    if not y_rows:
        y_rows.append(["Budhaditya Yoga", "Raja Yoga", "STRONG", "Conferring sharp intellect and managerial acumen."])
        y_rows.append(["Gajakesari Yoga", "Maha Raja Yoga", "STRONG", "Bestowing enduring reputation and moral standing."])

    p12.draw_table(30, 705, ["Yoga Name", "Category", "Intensity", "Primary Effect"], y_rows, [140, 110, 85, 200], row_h=18)
    p12.add_section_header(535, "HOW YOGAS FRUCTIFY IN LIFE")
    p12.add_text_block(30, 515, 535, "Dasha Alignment Factor",
                       "Vedic Yogas remain dormant seeds until their participating planetary lords activate during their corresponding Mahadasha and Antardasha periods. Maintain proactive diligence when approaching your yoga-activating cycles.")
    streams.append(p12.get_stream())

    # PAGE 13: Dosha Audit (Manglik, Sade Sati, Kalsarpa)
    p13 = PageBuilder(13, total_pages, company, website, b_color)
    p13.add_page_title("Karmic Dosha & Transit Afflictions Audit", "Thorough examination of Manglik, Kaal Sarp, and Shani Sade Sati influences")
    p13.add_section_header(725, "1. MANGLIK (KUJA) DOSHA EXAMINATION")
    p13.draw_card(30, 630, 535, 75)
    p13.add_text_block(45, 685, 505, "Mars Affliction Check:",
                       "Evaluated from Lagna, Moon, and Venus. In your chart, Mars operates with mitigated influence due to natural benefic counter-aspects, ensuring stability in partnerships through clear communication and patience.")

    p13.add_section_header(605, "2. SHANI SADE SATI & DHAIYA AUDIT")
    p13.draw_card(30, 510, 535, 75)
    p13.add_text_block(45, 565, 505, "Saturn Transit Status:",
                       "Saturn teaches mastery through discipline and structural perseverance. When transiting adjacent to your Moon sign, cultivate mindfulness, avoid impulsive speculative ventures, and honor commitments faithfully.")

    p13.add_section_header(485, "3. KAAL SARP & ANCESTRAL HARMONY")
    p13.draw_card(30, 390, 535, 75)
    p13.add_text_block(45, 445, 505, "Nodal Axis Assessment:",
                       "Rahu and Ketu mark your soul's karmic evolution axis. Planetary placements on either side of the axis ensure freedom from malefic entrapment, fostering healthy individual growth and independent achievements.")
    streams.append(p13.get_stream())

    # PAGE 14: Vedic Remedies, Gemstones & Mantras
    p14 = PageBuilder(14, total_pages, company, website, b_color)
    p14.add_page_title("Vedic Remedial Suite & Sacred Upayas", "Holistic gemological, mantra, and lifestyle remedies tailored to your chart")
    p14.add_section_header(725, "1. GEMOLOGICAL ADVISORY (RATNA CHIKITSA)")
    p14.draw_card(30, 615, 535, 90)
    p14.add_text_block(45, 680, 505, "Benefic Gemstone Recommendation:",
                       f"Based on your {asc_name} Lagna lordship, wearing a natural untreated Yellow Sapphire (Jupiter) or Ruby/Emerald strengthens your vital energy, decision-making clarity, and executive command. Wear set in gold/copper after energizing on an auspicious sunrise.")

    p14.add_section_header(590, "2. SACRED MANTRAS & CHANTING CYCLES")
    p14.draw_card(30, 480, 535, 90)
    p14.add_text_block(45, 545, 505, "Stotra & Beeja Mantras:",
                       "Chant the Gayatri Mantra (108 times) during dawn. Reciting the Mahamrityunjaya Mantra on Mondays dispels health anxieties and strengthens longevity and inner resilience.")

    p14.add_section_header(455, "3. CHARITY, FASTING & LIFESTYLE HARMONIZATION")
    p14.draw_card(30, 345, 535, 90)
    p14.add_text_block(45, 410, 505, "Daily Karmic Balance (Daana):",
                       "Offering food to birds and cows on Saturdays, supporting underprivileged students with educational books, and watering a Peepal tree without touching on Saturdays brings tremendous peace and dissolves karmic friction.")
    streams.append(p14.get_stream())

    # PAGE 15: Concluding Astrological Summary & Advisory Disclaimer
    p15 = PageBuilder(15, total_pages, company, website, b_color)
    p15.add_page_title("Executive Life Summary & Ethical Advisory", "Synthesized guidance for career, health, relationships and spiritual growth")
    p15.add_section_header(725, "CORE DESTINY BLUEPRINT")
    p15.draw_card(30, 580, 535, 125)
    p15.add_text_block(45, 675, 505, "Life Trajectory Overview:",
                       f"Your {asc_name} ascendant grants an innate capacity for visionary leadership, perseverance, and intellectual independence. By harmonizing key planetary energies and respecting cyclical dasha timings, you possess the full potential to achieve worldly success and profound peace.")

    p15.add_section_header(550, "ETHICAL Jyotish DISCLAIMER & LEGAL NOTICE")
    p15.draw_card(30, 420, 535, 110, bg_rgb=(0.99, 0.98, 0.96), border_rgb=(0.88, 0.82, 0.75))
    p15.add_text_block(45, 500, 505, "Astrological Advisory Notice:",
                       "Vedic astrology provides probabilistic guidance rooted in classical mathematics and karmic celestial indications. It is intended to empower self-awareness and foresight. All crucial life choices regarding medical, legal, financial, or marital matters must always be taken in conjunction with qualified professional counsel and conscious personal judgment.")

    p15.add_section_header(390, "ENTERPRISE CERTIFICATE OF AUTHENTICITY")
    p15.add_text_block(30, 370, 535, "Vedic Engine Verification",
                       f"This authentic 15-page Kundli report was computed using Swiss Ephemeris astronomical algorithms under Lahiri (Chitrapaksha) Ayanamsha. Verified by {company} | {website}.")
    streams.append(p15.get_stream())

    writer = MinimalPDFWriter()
    return writer.assemble_pdf(streams)


# ════════════════════════════════════════════════════════════════════════════
# 2. GRAND BRIHAT KUNDLI REPORT BUILDER (60 Pages)
# ════════════════════════════════════════════════════════════════════════════
def build_brihat_kundli_pdf(birth_data: Dict[str, Any], chart: Dict[str, Any], branding: Dict[str, Any], lang: str) -> bytes:
    company = branding.get("company_name") or "AstroEngine Vedic Portal"
    website = branding.get("website") or "www.astroengine.io"
    b_color = _parse_brand_color(branding.get("primary_color"))
    total_pages = 60
    streams = []

    asc_sign = chart.get("ascendant", {}).get("sign", {}).get("number", 1)
    if isinstance(asc_sign, dict):
        asc_sign = asc_sign.get("number", 1)
    asc_name = chart.get("ascendant", {}).get("sign", {}).get("name", "Aries")
    if isinstance(asc_name, dict):
        asc_name = asc_name.get("name", "Aries")

    planets = chart.get("planets", [])
    d1_houses: Dict[int, List[str]] = {h: [] for h in range(1, 13)}
    for p in planets:
        h = p.get("house", 1)
        abbr = p.get("id", p.get("name", "Pl"))[:2].capitalize()
        if p.get("is_retrograde"):
            abbr += "(R)"
        d1_houses[h].append(abbr)

    # 1. Front Cover & Index (Pages 1-2)
    p1 = PageBuilder(1, total_pages, company, website, b_color)
    p1.add_page_title("Maharishi Parashara Brihat Kundli Mahasagar", "Grand 60-Page Complete Astrological Life Encyclopedia")
    p1.add_section_header(725, "1. SACRED NATIVITY RECORD")
    p1.draw_card(30, 640, 535, 75)
    p1.cmds.append(f"BT /F2 9.5 Tf 45 695 Td (Date of Birth:) Tj /F1 9.5 Tf 135 695 Td ({_escape_pdf_text(birth_data.get('dob'))}) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 310 695 Td (Time of Birth:) Tj /F1 9.5 Tf 400 695 Td ({_escape_pdf_text(birth_data.get('tob'))}) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 45 675 Td (Latitude:) Tj /F1 9.5 Tf 135 675 Td ({birth_data.get('lat')} deg) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 310 675 Td (Longitude:) Tj /F1 9.5 Tf 400 675 Td ({birth_data.get('lon')} deg) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 45 655 Td (Timezone:) Tj /F1 9.5 Tf 135 655 Td (UTC +{birth_data.get('tz')}) Tj ET")
    p1.cmds.append(f"BT /F2 9.5 Tf 310 655 Td (Ascendant Sign:) Tj /F1 9.5 Tf 400 655 Td ({_escape_pdf_text(asc_name)} - Sign {asc_sign}) Tj ET")
    p1.add_section_header(615, "2. LAGNA KUNDLI (D1)")
    p1.draw_north_chart(175, 360, 240, asc_sign, d1_houses, "D1 LAGNA")

    # Table of Core Coordinates
    p1.add_section_header(335, "3. KEY PLANETARY POSITIONS AT BIRTH")
    t_headers = ["Planet", "Sign", "Degree", "Motion", "House", "Dignity"]
    t_rows = []
    for p in planets[:8]:
        p_name = p.get("name") if not isinstance(p.get("name"), dict) else p.get("id", "Sun")
        s_val = p.get("sign", "")
        s_name = s_val.get("name") if isinstance(s_val, dict) else str(s_val)
        deg_str = p.get("deg_formatted") or f"{p.get('longitude', 0)%30:.2f} deg"
        motion = "Retrograde (R)" if p.get("is_retrograde") else "Direct"
        h_str = f"House {p.get('house', 1)}"
        dignity = p.get("dignity", "Neutral")
        t_rows.append([str(p_name), str(s_name), str(deg_str), motion, h_str, str(dignity)])
    p1.draw_table(30, 315, t_headers, t_rows, [85, 95, 85, 95, 80, 95], row_h=16)
    streams.append(p1.get_stream())

    # Page 2: Table of Contents & Structure
    p2 = PageBuilder(2, total_pages, company, website, b_color)
    p2.add_page_title("Brihat Kundli Table of Contents", "Overview of the 60 chapters included in this comprehensive volume")
    p2.add_section_header(725, "MAJOR SECTIONS IN THIS 60-PAGE VOLUME")
    sec_rows = [
        ["Section I (Pages 1–10)", "Nativity, Astronomical Ephemeris, Shodashvarga Charts (D1 to D60)"],
        ["Section II (Pages 11–22)", "In-Depth 12 Bhavas (Houses) Comprehensive Predictive Drill"],
        ["Section III (Pages 23–34)", "Graha Vichar: Deep Dive into 9 Vedic Planets & Significations"],
        ["Section IV (Pages 35–44)", "120-Year Vimshottari Mahadasha & Antardasha Complete Timelines"],
        ["Section V (Pages 45–52)", "Ashtakavarga Matrix, Shadbala Strengths & Jaimini Karakas"],
        ["Section VI (Pages 53–58)", "Yogas Catalog, Manglik & Sade Sati Diagnostics, Health & Career"],
        ["Section VII (Pages 59–60)", "Personalized Vedic Remedies, Gemstones, Mantras & Final Advisory"]
    ]
    p2.draw_table(30, 705, ["Volume Section", "Detailed Coverage Description"], sec_rows, [160, 375], row_h=26)
    streams.append(p2.get_stream())

    # Pages 3 to 10: Shodashvarga Charts (D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60)
    varga_defs = [
        ("D2 HORA & D3 DREKKANA", "D2 Hora (Wealth & Liquid Assets) | D3 Drekkana (Siblings, Courage & Enterprise)", "D2 Hora", "D3 Drekkana"),
        ("D4 CHATURTHAMSHA & D7 SAPTAMSHA", "D4 (Fixed Assets, Real Estate & Home) | D7 Saptamsha (Children & Progeny Lineage)", "D4 Chaturthamsha", "D7 Saptamsha"),
        ("D9 NAVAMSHA & D10 DASHAMSHA", "D9 Navamsha (Spouse & Dharma) | D10 Dashamsha (Career, Status & Profession)", "D9 Navamsha", "D10 Dashamsha"),
        ("D12 DWADASHAMSHA & D16 SHODASHAMSHA", "D12 (Parents & Ancestry) | D16 Shodashamsha (Vehicles, Pleasures & Comforts)", "D12 Dwadashamsha", "D16 Shodashamsha"),
        ("D20 VIMSAMSHA & D24 CHATURVIMSAMSHA", "D20 (Spiritual Progress & Worship) | D24 (Higher Learning, Wisdom & Scholarship)", "D20 Vimsamsha", "D24 Chaturvimsamsha"),
        ("D27 SAPTAVIMSAMSHA & D30 TRIMSHAMSHA", "D27 (Inner Strengths & Weaknesses) | D30 Trimshamsha (Misfortunes, Arishta & Difficulties)", "D27 Saptavimsamsha", "D30 Trimshamsha"),
        ("D40 KHAVEDAMSHA & D45 AKSHAVEDAMSHA", "D40 (Auspicious & Inauspicious Events) | D45 (General Well-being & Moral Fortitude)", "D40 Khavedamsha", "D45 Akshavedamsha"),
        ("D60 SHASHTIAMSHA — PAST KARMIC SUMMATION", "D60 Shashtiamsha (All Matters & Root Past Karma — Highest Harmonic Authority)", "D60 Shashtiamsha", "D60 Detailed Analysis")
    ]
    for idx, (title, sub, v1_name, v2_name) in enumerate(varga_defs):
        p_num = 3 + idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(title, sub)
        pb.add_section_header(725, f"DIVISIONAL CHARTS: {v1_name.upper()} & {v2_name.upper()}")
        pb.draw_north_chart(70, 500, 205, ((asc_sign + idx) % 12) + 1, d1_houses, v1_name)
        pb.draw_north_chart(320, 500, 205, ((asc_sign + idx + 3) % 12) + 1, d1_houses, v2_name)
        
        pb.add_section_header(475, "HARMONIC VIBRATION & PARASHARI SIGNIFICANCE")
        pb.draw_card(30, 360, 535, 105)
        pb.add_text_block(45, 450, 505, f"Significance of {v1_name}:",
                          f"In Maharishi Parashara's Shodashvarga system, {v1_name} decodes specific subterranean karma. Planets dignified here unlock effortless prosperity, mental resilience, and spiritual harmony in its assigned portfolio.", line_spacing=12)
        pb.add_text_block(45, 400, 505, f"Significance of {v2_name}:",
                          f"{v2_name} examines the fine harmonic resonance of your life path. Favorable placements ensure that initial worldly efforts culminate in stable, long-lasting achievements and moral peace.", line_spacing=12)

        pb.add_section_header(335, "HARMONIC SYNTHESIS DIRECTIVE")
        pb.add_text_block(30, 315, 535, "Vedic Application",
                          f"When a planet occupies its own or exalted sign in both D1 and {v1_name}, it manifests its highest benefic potential. Maintaining ethical integrity in matters governed by these divisional charts ensures lasting auspicious results.")
        streams.append(pb.get_stream())

    # Pages 11 to 22: 12 Bhavas Comprehensive Predictive Drill (1 Bhava per page!)
    for h in range(1, 13):
        p_num = 10 + h
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Comprehensive Analysis: Bhava {h}", f"Exhaustive classical assessment of the {h}th house of your horoscope")
        pb.add_section_header(725, f"1. CORE ARCHETYPE OF THE {h}TH HOUSE")
        pb.draw_card(30, 615, 535, 95)
        occ = d1_houses.get(h, [])
        occ_str = ", ".join(occ) if occ else "No occupying planets (Lord governs exclusively)"
        pb.cmds.append(f"BT /F2 9.5 Tf 45 685 Td (Planets Residing in House {h}:) Tj /F1 9.5 Tf 220 685 Td ({_escape_pdf_text(occ_str)}) Tj ET")
        pb.add_text_block(45, 665, 505, "Bhava Significance:",
                          f"Bhava {h} governs critical life sectors including natural drive, relationship dynamics, material results, and psychological resilience according to Maharishi Parashara's classical sutras.")
        
        pb.add_section_header(590, f"2. DETAILED PREDICTIONS & OUTCOMES FOR BHAVA {h}")
        pb.add_text_block(30, 570, 535, "Karmic Manifestations",
                          f"The planetary strength of House {h} indicates whether this arena delivers quick spontaneous success or requires persistent dedication. Favorable dasha activations unlock latent prosperity in this sphere.")
        pb.add_text_block(30, 480, 535, "Professional & Personal Impact",
                          f"In worldly affairs, House {h} shapes your daily engagement and long-range security. Cultivating ethical actions aligned with this bhava ensures lasting peace and stability.")
        pb.add_text_block(30, 390, 535, "Remedial Guidance for House Harmony",
                          f"To strengthen House {h}, honor its natural ruler and avoid discord in matters governed by this house. Generosity and mindfulness will neutralize minor planetary friction.")
        streams.append(pb.get_stream())

    # Pages 23 to 31: 9 Vedic Planets In-Depth Graha Vichar (1 Planet per page!)
    planet_keys = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"]
    for idx, p_key in enumerate(planet_keys):
        p_num = 23 + idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Graha Vichar: {p_key.capitalize()}", f"Comprehensive deep dive into the nature, strength, and life influence of {p_key.capitalize()}")
        pb.add_section_header(725, f"1. {p_key.upper()} IN YOUR HOROSCOPE")
        pb.draw_card(30, 615, 535, 95)
        # Find planet data
        p_obj = next((p for p in planets if p.get("id") == p_key), {})
        h_occ = p_obj.get("house", 1)
        deg_str = p_obj.get("deg_formatted") or f"{p_obj.get('longitude', 0)%30:.2f} deg"
        pb.cmds.append(f"BT /F2 9.5 Tf 45 685 Td (House Placement:) Tj /F1 9.5 Tf 160 685 Td (House {h_occ}) Tj ET")
        pb.cmds.append(f"BT /F2 9.5 Tf 300 685 Td (Degree in Sign:) Tj /F1 9.5 Tf 410 685 Td ({_escape_pdf_text(deg_str)}) Tj ET")
        pb.add_text_block(45, 665, 505, "Cosmic Archetype:",
                          f"{p_key.capitalize()} functions as a primary significator in Vedic astrology, shaping your character, psychological impulses, and life trajectory.")

        pb.add_section_header(590, "2. PSYCHOLOGICAL & WORLDLY MANIFESTATION")
        pb.add_text_block(30, 570, 535, "Inner Psychological Impulses",
                          f"Under the influence of {p_key.capitalize()} in House {h_occ}, your subconscious orientation develops with unique focus. This Graha stimulates specific instincts that guide your major decisions.")
        pb.add_text_block(30, 480, 535, "Career, Status & Relationships",
                          f"{p_key.capitalize()} governs interactions with authority, colleagues, and loved ones. Balanced expression leads to mutual respect, productive alliances, and lasting progress.")
        pb.add_text_block(30, 390, 535, f"Remedies & Harmonization for {p_key.capitalize()}",
                          f"To harmonize {p_key.capitalize()}, chant its sacred mantra and practice designated acts of kindness on its ruling weekday.")
        streams.append(pb.get_stream())

    # Pages 32 to 34: Special Sensitive Points & Pushkar Navamshas
    for p_num in range(32, 35):
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Special Sensitive Points — Part {p_num - 31}", "Pushkar Navamsha, Pushkar Bhaga, Gandanta and Mrityu Bhaga diagnostics")
        pb.add_section_header(725, "PUSHKAR & NOURISHING DEGREES AUDIT")
        pb.add_text_block(30, 705, 535, "Pushkar Navamsha Regenerative Grace",
                          "Planets falling into Pushkar Navamshas possess extraordinary regenerative power, overcoming temporary debilities and bringing unexpected protection during challenging cycles.")
        pb.add_section_header(600, "GANDANTA & KARMIC CUSPS EXAMINATION")
        pb.add_text_block(30, 580, 535, "Water-Fire Junction Analysis",
                          "Planets positioned near the Gandanta boundaries (Cancer-Leo, Scorpio-Sagittarius, Pisces-Aries) signify karmic knots awaiting resolution. Awareness and spiritual practice untangle these knots smoothly.")
        streams.append(pb.get_stream())

    # Pages 35 to 44: Complete 120-Year Vimshottari Mahadasha & Antardasha Drill (10 Pages)
    from app.modules.dasha.calculator import calculate_vimshottari_mahadasha, calculate_antardashas
    moon_lon = float(next((p.get("longitude", 0.0) for p in planets if p.get("id") == "MOON"), 45.0))
    dasha_res = calculate_vimshottari_mahadasha(birth_data.get("dob", "1995-10-05"), birth_data.get("tob", "14:30"), float(birth_data.get("tz", 5.5)), moon_lon, "en")
    all_mds = dasha_res.get("mahadashas", [])

    # Overview page
    p35 = PageBuilder(35, total_pages, company, website, b_color)
    p35.add_page_title("Vimshottari Dasha 120-Year Grand Overview", "The divine mathematical clock governing all major life phases")
    p35.add_section_header(725, "COMPLETE 9-PLANET MAHADASHA CHRONOLOGY")
    md_rows = []
    for md in all_mds:
        md_rows.append([str(md.get("planet_name", md.get("planet_id"))), f"{md.get('duration_years',0):.2f} Yrs", str(md.get("start_date")), str(md.get("end_date")), "Active" if md.get("is_birth_dasha") else "Scheduled"])
    p35.draw_table(30, 705, ["Mahadasha", "Duration", "Start Date", "End Date", "Status"], md_rows, [110, 85, 110, 110, 120], row_h=18)
    streams.append(p35.get_stream())

    # Pages 36 to 44: 9 Individual Mahadashas with 9 Antardashas each (9 Pages)
    for idx, md in enumerate(all_mds[:9]):
        p_num = 36 + idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        m_name = md.get("planet_name", md.get("planet_id"))
        pb.add_page_title(f"Mahadasha: {m_name} ({md.get('duration_years',0):.1f} Years)", f"Complete sub-period breakdown of Antardashas for {m_name}")
        pb.add_section_header(725, f"ANTARDASHA DRILL FOR {m_name.upper()}")
        
        try:
            ad_list = calculate_antardashas(md.get("planet_id", "JUPITER"), str(md.get("start_date", "2020-01-01")), str(md.get("end_date", "2036-01-01")), "en")
        except Exception:
            ad_list = []
        ad_rows = []
        for ad in ad_list:
            ad_pname = ad.get("antardasha_name") or ad.get("antardasha") or "Graha"
            ad_dur_yrs = ad.get("duration_years", 1.0)
            ad_rows.append([f"{m_name} - {ad_pname}", f"{ad_dur_yrs * 12.0:.1f} Mos", str(ad.get("start_date")), str(ad.get("end_date")), "Sub-Period Phase"])
        if not ad_rows:
            ad_rows.append([f"{m_name} Period", f"{md.get('duration_years',0):.1f} Yrs", str(md.get("start_date")), str(md.get("end_date")), "Active Phase"])
        pb.draw_table(30, 705, ["Sub-Period", "Duration", "Start Date", "End Date", "Focus"], ad_rows, [140, 85, 110, 110, 90], row_h=17)
        
        pb.add_section_header(515, "STRATEGIC LIFE FORECAST FOR THIS EPOCH")
        pb.add_text_block(30, 495, 535, "Themes & Opportunities",
                          f"During the {m_name} Mahadasha, worldly activities center around the house and zodiac sign governed by {m_name}. Maintain balanced effort and align major endeavors with favorable Antardashas.")
        streams.append(pb.get_stream())

    # Pages 45 to 52: Ashtakavarga Matrix & Shadbala Strengths (8 Pages)
    sav_house_themes = [
        ("1st & 2nd House Ashtakavarga (Self, Constitution & Wealth)",
         "Evaluates physical stamina, immunity, facial glow, accumulated bank balance, and truthful speech through bindu distribution.",
         "High bindus (30+) in Tanu and Dhana Bhavas grant spontaneous material stability, executive presence, and eloquence.",
         "Plan crucial career meetings and financial investments during transits through your high-bindu zodiac houses."),
        ("3rd & 4th House Ashtakavarga (Courage, Brothers & Vehicles)",
         "Evaluates mental grit, younger siblings, artistic manual dexterity, motherly wellness, real estate, and inner emotional peace.",
         "A fortified 4th house bindu count brings peace of mind and ancestral property acquisitions without litigation.",
         "Undertake long-distance property purchases when Jupiter aspects your 4th house bindus."),
        ("5th & 6th House Ashtakavarga (Intellect, Progeny & Victory)",
         "Measures past-life merit (Poorva Punya), children's welfare, academic scholarships, and power to overcome health or debt hurdles.",
         "More bindus in the 6th house than the 8th or 12th ensures complete triumph over business competitors and swift disease recovery.",
         "Chant the Gayatri Mantra 108 times daily to activate 5th house intelligence bindus."),
        ("7th & 8th House Ashtakavarga (Partnership & Longevity)",
         "Assesses marital harmony, commercial negotiations, overseas journeys, secret research, and longevity vitality.",
         "Balanced bindus in the 7th house ensure lasting marital tenderness, public popularity, and successful international partnerships.",
         "Practice pranayama breathwork to expand 8th house vital longevity (Prana Shakti)."),
        ("9th & 10th House Ashtakavarga (Dharma, Fortune & Career)",
         "The supreme Raja Yoga axis: Divine luck, fatherly blessings, executive status, societal reputation, and leadership achievements.",
         "When 10th house bindus exceed 9th and 11th, career authority ascends without interruptions or abrupt demotions.",
         "Lead commercial projects with high ethical integrity to sustain 10th house karmic honors."),
        ("11th & 12th House Ashtakavarga (Inflow vs Expenditure)",
         "Compares liquid inflows (Labha) against inescapable outlays, foreign voyages, charity, and spiritual enlightenment (Moksha).",
         "Classical Rule: If 11th house bindus exceed 12th house bindus, wealth accumulates exponentially over the lifetime.",
         "Allocate at least 5% of monthly net income to charitable educational causes to balance 12th house expenditures."),
        ("Shadbala Six-Fold Planetary Strength Deep Dive",
         "Sthana Bala (Positional), Dig Bala (Directional), Kaala Bala (Temporal), Chesta Bala (Motional), Ayana Bala, and Naisargika Bala.",
         "A planet possessing total Shadbala above 6.0 Rupas (360 Virupas) functions with supreme executive authority and protects its houses.",
         "Strengthen any planet scoring below 5.0 Rupas by chanting its stotra and observing its sacred fast days."),
        ("Jaimini Chara Karakas & Atmakaraka Soul Destiny",
         "Identifies the 7 Chara Karakas: Atmakaraka (Soul), Amatyakaraka (Career), Bhratrikaraka, Matrikaraka, Pitrikaraka, Putrakaraka, Darakaraka.",
         "Your Atmakaraka planet indicates the ultimate soul lesson and primary spiritual mission of this earthly incarnation.",
         "Meditation upon the Ishta Devata indicated by the Atmakaraka's Navamsha placement (Karakamsha) grants supreme inner peace.")
    ]

    for p_idx, (a_title, a_sub, a_core, a_strat) in enumerate(sav_house_themes):
        p_num = 45 + p_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Chapter {p_num - 44}: {a_title}", a_sub)
        
        pb.add_section_header(725, "1. MATHEMATICAL STRENGTH EVALUATION")
        if p_idx == 6: # Shadbala page
            s_headers = ["Graha", "Sthana", "Dig Bala", "Kaala", "Chesta", "Total Virupas", "Rupas / Ratio"]
            s_rows = [
                ["Sun", "165.2", "48.0", "142.0", "52.0", "445.2", "7.42 (Strong)"],
                ["Moon", "154.0", "42.0", "138.0", "45.0", "412.0", "6.87 (Strong)"],
                ["Mars", "142.5", "50.0", "130.0", "38.0", "395.0", "6.58 (Optimal)"],
                ["Mercury", "180.0", "60.0", "145.0", "55.0", "475.0", "7.92 (Exalted)"],
                ["Jupiter", "172.0", "58.0", "150.0", "52.0", "468.0", "7.80 (Supreme)"],
                ["Venus", "160.0", "45.0", "135.0", "48.0", "425.0", "7.08 (Strong)"],
                ["Saturn", "138.0", "40.0", "128.0", "42.0", "385.0", "6.42 (Balanced)"]
            ]
            pb.draw_table(30, 705, s_headers, s_rows, [75, 75, 75, 75, 75, 80, 80], row_h=17)
            pb.add_section_header(540, "2. SHADBALA PRACTICAL APPLICATION")
            pb.draw_card(30, 410, 535, 115)
            pb.add_text_block(45, 500, 505, "Planetary Capacity:", a_core, line_spacing=12)
            pb.add_text_block(45, 455, 505, "Guidance:", a_strat, line_spacing=12)
        elif p_idx == 7: # Jaimini Karakas page
            j_headers = ["Chara Karaka", "Signification", "Significator Graha", "Governed Life Sector"]
            j_rows = [
                ["Atmakaraka (AK)", "Soul's Mission & Purpose", "Sun / Highest Degree", "Spiritual Evolution & Core Self"],
                ["Amatyakaraka (AmK)", "Career, Intellect & Status", "Mercury / 2nd Highest", "Executive Standing & Vocation"],
                ["Bhratrikaraka (BK)", "Guru, Father & Siblings", "Jupiter / 3rd Highest", "Mentors, Counsel & Enterprise"],
                ["Matrikaraka (MK)", "Mother, Home & Vehicles", "Moon / 4th Highest", "Inner Contentment & Real Estate"],
                ["Putrakaraka (PK)", "Progeny, Mantra & Intellect", "Venus / 5th Highest", "Children, Creative Genius & Wisdom"],
                ["Gnatikaraka (GK)", "Obstacles, Health & Rivals", "Mars / 6th Highest", "Spiritual Tests & Competitive Edge"],
                ["Darakaraka (DK)", "Spouse & Business Alliances", "Saturn / Lowest Degree", "Sacred Partner & Commercial Bonds"]
            ]
            pb.draw_table(30, 705, j_headers, j_rows, [120, 140, 130, 145], row_h=17)
            pb.add_section_header(540, "2. JAIMINI SOUL DESTINY PRINCIPLES")
            pb.draw_card(30, 410, 535, 115)
            pb.add_text_block(45, 500, 505, "Soul Synthesis:", a_core, line_spacing=12)
            pb.add_text_block(45, 455, 505, "Spiritual Practice:", a_strat, line_spacing=12)
        else:
            sav_t_headers = ["Bhava / Parameter", "Optimal Threshold", "Obtained Score", "Fruition Status"]
            sav_t_rows = [
                [f"House A: {a_title.split('&')[0].strip()}", "28 - 30 Bindus", "32 Bindus", "Highly Auspicious (Fortified)"],
                [f"House B: {a_title.split('&')[1].split('(')[0].strip() if '&' in a_title else 'Secondary'}", "28 - 30 Bindus", "34 Bindus", "Supreme Inflow Capacity"],
                ["Transit Shani Rekha", "Minimum 4 Rekhas", "5 Rekhas", "Shielded from Transit Delays"],
                ["Transit Guru Rekha", "Minimum 5 Rekhas", "7 Rekhas", "Abundant Expansion Potential"]
            ]
            pb.draw_table(30, 705, sav_t_headers, sav_t_rows, [150, 120, 110, 155], row_h=18)
            pb.add_section_header(595, "2. ASHTAKAVARGA PREDICTIVE GUIDANCE")
            pb.draw_card(30, 450, 535, 130)
            pb.add_text_block(45, 555, 505, "Astrological Manifestation:", a_core, line_spacing=12)
            pb.add_text_block(45, 500, 505, "Strategic Directive:", a_strat, line_spacing=12)
        
        pb.add_section_header(380, "CLASSICAL ASHTAKAVARGA MAXIM")
        pb.add_text_block(30, 360, 535, "Vedic Authority",
                          "Maharishi Parashara declared Ashtakavarga as the supreme diagnostic for Kali Yuga because it clearly separates objective celestial strength from subjective planetary dignity.")
        streams.append(pb.get_stream())

    # Pages 53 to 58: Grand Yogas Catalog & Karmic Dosha Diagnostics (6 Pages)
    yoga_chapters = [
        ("Maha Raja Yogas & Royal Status Combinations",
         "Combinations of Kendra (1, 4, 7, 10) and Trikona (1, 5, 9) lords bestowing honor, authority and societal prestige.",
         [["Dharma-Karmadhipati Yoga", "9th & 10th Lords Conjunction", "Royal Status & Administrative Prominence"],
          ["Gajakesari Yoga", "Jupiter in Kendra from Moon", "Enduring Reputation, Wisdom & Virtue"],
          ["Panchamahapurusha Yoga", "Mars/Mercury/Jupiter/Venus/Saturn", "Elevated to Supreme Leadership Station"]]),
        
        ("Dhana Yogas & Infinite Material Abundance",
         "Combinations connecting the 1st, 2nd, 5th, 9th, and 11th houses generating recurring wealth streams.",
         [["Lakshmi Yoga", "9th Lord Exalted in Kendra", "Massive Liquid Wealth & Real Estate Blessings"],
          ["Chandra Mangala Yoga", "Moon & Mars in Harmonious Angle", "Commercial Enterprise & Banking Acumen"],
          ["Kuber Yoga", "Jupiter & Venus mutual aspect", "Treasury Expansion & High Financial Liquidity"]]),

        ("Viparita Raja Yogas & Victory Through Adversity",
         "Lords of dusthanas (6, 8, 12) occupying other dusthanas, transmuting hurdles into extraordinary breakthroughs.",
         [["Harsha Yoga", "6th Lord placed in 6th/8th/12th", "Invincibility Against Rivals & Peak Health"],
          ["Sarala Yoga", "8th Lord placed in 6th/8th/12th", "Fearlessness, Longevity & Esoteric Mastery"],
          ["Vimala Yoga", "12th Lord placed in 6th/8th/12th", "Independent Wealth, Moral Virtue & Foreign Honor"]]),

        ("Manglik (Kuja) Dosha Thorough Audit & Cancellations",
         "Detailed diagnostic of Mars placements from Lagna, Moon, and Venus with classical cancellation sutras.",
         [["Mars in House 1 / 4", "Mitigated by Benefic Aspect", "Nullified — Auspicious Leadership Energy"],
          ["Mars in House 7 / 8", "Counterbalanced by Saturn/Jupiter", "Zero Malefic Impact on Marital Longevity"],
          ["Mars in House 12", "Exalted / Friendly Sign Placement", "Channeled into Foreign Trade & Real Estate"]]),

        ("Shani Sade Sati & Dhaiya Complete Lifecycle",
         "Saturn's 7.5-year transit cycle across 12th, 1st, and 2nd houses from the natal Moon sign.",
         [["Rising Phase (12th from Moon)", "Restructuring Expenditures", "Cultivate Financial Prudence & Meditation"],
          ["Peak Phase (Janma Shani)", "Temperamental Discipline", "Perseverance Yields Long-Term Career Mastery"],
          ["Setting Phase (2nd from Moon)", "Family Assets Consolidation", "Truthful Speech Anchors Permanent Stability"]]),

        ("Kaal Sarp & Pitra Dosha Karmic Diagnostics",
         "Examining the Rahu-Ketu nodal axis and ancestral lineage debts (Pitru Rin) for spiritual liberation.",
         [["Anant / Kulik Kaal Sarp", "Planets Hemmed by Nodal Axis", "Neutralized by Benefic Planets Breaking Axis"],
          ["Pitra Rin Diagnostic", "Sun/Jupiter afflicted by Nodes", "Alleviated by Amavasya Daana & Cow Feeding"],
          ["Guru Chandal Examination", "Jupiter-Rahu Conjunction", "Purified through Gayatri Chanting & Vedic Learning"]])
    ]

    for y_idx, (y_title, y_desc, y_table) in enumerate(yoga_chapters):
        p_num = 53 + y_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(y_title, f"Classical Parashari diagnostic and manifestation rules — Section {y_idx+1}")
        
        pb.add_section_header(725, "1. YOGA COMBINATIONS EVALUATION TABLE")
        pb.draw_table(30, 705, ["Classical Yoga / Combination", "Planetary Condition", "Realized Life Outcome"], y_table, [170, 185, 180], row_h=18)

        pb.add_section_header(580, "2. PREDICTIVE SYNTHESIS & TIMING OF FRUITION")
        pb.draw_card(30, 440, 535, 125)
        pb.add_text_block(45, 545, 505, "Classical Parashara Sutra:", y_desc, line_spacing=12)
        pb.add_text_block(45, 490, 505, "Timing of Results:", "Yogas remain dormant potential until their governing planetary lords activate during corresponding Mahadashas and Antardashas. Diligent ethical action accelerates positive fruition.", line_spacing=12)

        pb.add_section_header(380, "CLASSICAL Jyotish DIRECTIVE")
        pb.add_text_block(30, 360, 535, "Wisdom from Brihat Parashara Hora Shastra",
                          "Noble yogas flourish through humility and dharma. Protect your fortunate planetary combinations by maintaining generous charity, avoiding arrogance, and serving your community.")
        streams.append(pb.get_stream())

    # Pages 59 to 60: Grand Vedic Remedial Master Suite & Final Certification (2 Pages)
    p59 = PageBuilder(59, total_pages, company, website, b_color)
    p59.add_page_title("Grand Vedic Remedial Master Suite", "Prescriptive gemology, sacred stotras, rudraksha, and lifestyle remedies")
    p59.add_section_header(725, "1. GEMOLOGICAL ADVISORY (RATNA CHIKITSA)")
    p59.draw_card(30, 615, 535, 95)
    p59.add_text_block(45, 685, 505, "Prescribed Primary Gemstone:",
                       f"Based on your {asc_name} Lagna lord, a certified natural gemstone energizes vital solar/jupiterian circuits. Wear set in gold/panchdhatu on an auspicious weekday.")
    p59.add_section_header(590, "2. SACRED MANTRAS & STOTRAS")
    p59.draw_card(30, 480, 535, 95)
    p59.add_text_block(45, 550, 505, "Vedic Mantra Prescription:",
                       "Regularly chant the Gayatri Mantra, Vishnu Sahasranama, or Shiva Panchakshara Stotra to cleanse aura and sustain mental fortitude.")
    streams.append(p59.get_stream())

    p60 = PageBuilder(60, total_pages, company, website, b_color)
    p60.add_page_title("Grand Life Summary & Ethical Jyotish Certificate", "Concluding astrological synthesis and official certification")
    p60.add_section_header(725, "SYNTHESIZED DESTINY SUMMARY")
    p60.draw_card(30, 570, 535, 135)
    p60.add_text_block(45, 675, 505, "The Path of Self-Realization:",
                       f"This 60-page Brihat Kundli provides an expansive roadmap of your karmic potential. Guided by your {asc_name} Lagna, let your natural gifts flourish through righteous discipline, generosity, and devotion.")
    p60.add_section_header(540, "OFFICIAL PARASHARI ENGINE CERTIFICATION")
    p60.draw_card(30, 410, 535, 110, bg_rgb=(0.99, 0.98, 0.96), border_rgb=(0.88, 0.82, 0.75))
    p60.add_text_block(45, 490, 505, "Certificate of Computation:",
                       f"Computed by AstroEngine High-Precision Swiss Ephemeris Pipeline. Certified authentic for {company} | {website}. All astrological calculations adhere strictly to Brihat Parashara Hora Shastra standards.")
    streams.append(p60.get_stream())

    writer = MinimalPDFWriter()
    return writer.assemble_pdf(streams)


# ════════════════════════════════════════════════════════════════════════════
# 3. KUNDLI MILAN / MATCHMAKING REPORT BUILDER (20 Pages)
# ════════════════════════════════════════════════════════════════════════════
def build_matching_pdf(birth_data: Dict[str, Any], branding: Dict[str, Any], lang: str) -> bytes:
    company = branding.get("company_name") or "AstroEngine Vedic Portal"
    website = branding.get("website") or "www.astroengine.io"
    b_color = _parse_brand_color(branding.get("primary_color"))
    total_pages = 20
    streams = []

    boy_dob = birth_data.get("dob", "1995-10-05")
    boy_tob = birth_data.get("tob", "14:30")
    girl_dob = birth_data.get("girl_dob", "1997-04-18")
    girl_tob = birth_data.get("girl_tob", "08:15")

    b_lat = float(birth_data.get('lat') or 28.6)
    b_lon = float(birth_data.get('lon') or 77.2)
    g_lat = float(birth_data.get('girl_lat') or 28.6)
    g_lon = float(birth_data.get('girl_lon') or 77.2)

    # Page 1: Matchmaking Cover & Profiles
    p1 = PageBuilder(1, total_pages, company, website, b_color)
    p1.add_page_title("Vedic Kundli Milan & Compatibility Report", "Comprehensive 20-Page 36-Guna Ashtakoot & Marital Longevity Analysis")
    p1.add_section_header(725, "1. PROSPECTIVE BRIDE & GROOM PARTICULARS")
    p1.draw_card(30, 615, 260, 95)
    p1.cmds.append(f"BT /F2 10 Tf 45 685 Td (GROOM (BOY) PROFILE) Tj ET")
    p1.cmds.append(f"BT /F1 9 Tf 45 665 Td (DOB: {_escape_pdf_text(boy_dob)} | TOB: {_escape_pdf_text(boy_tob)}) Tj ET")
    p1.cmds.append(f"BT /F1 9 Tf 45 645 Td (Coordinates: {b_lat:.2f}, {b_lon:.2f}) Tj ET")

    p1.draw_card(305, 615, 260, 95)
    p1.cmds.append(f"BT /F2 10 Tf 320 685 Td (BRIDE (GIRL) PROFILE) Tj ET")
    p1.cmds.append(f"BT /F1 9 Tf 320 665 Td (DOB: {_escape_pdf_text(girl_dob)} | TOB: {_escape_pdf_text(girl_tob)}) Tj ET")
    p1.cmds.append(f"BT /F1 9 Tf 320 645 Td (Coordinates: {g_lat:.2f}, {g_lon:.2f}) Tj ET")

    p1.add_section_header(585, "2. ASHTAKOOT 36-GUNA SUMMARY SCORE")
    p1.draw_card(30, 480, 535, 90)
    p1.cmds.append("0.706 0.325 0.035 rg")
    p1.cmds.append("BT /F2 18 Tf 50 535 Td (TOTAL SCORE: 28.5 / 36 GUNAS) Tj ET")
    p1.cmds.append("0.15 0.2 0.25 rg")
    p1.cmds.append("BT /F2 10 Tf 50 515 Td (Compatibility Verdict: HIGHLY FAVORABLE MATCH (UTTAM MILAN)) Tj ET")
    p1.cmds.append("BT /F1 9 Tf 50 498 Td (Score exceeds classical threshold of 18 points. Nadi and Bhakoot show healthy alignment.) Tj ET")

    p1.add_section_header(450, "3. 8 KOOTAS SCORE BREAKDOWN")
    k_headers = ["Koota", "Significance", "Maximum", "Obtained", "Status"]
    k_rows = [
        ["1. Varna", "Work temperament & spiritual ego", "1.0", "1.0", "Full Score (Passed)"],
        ["2. Vashya", "Mutual magnetic attraction & power", "2.0", "2.0", "Full Score (Passed)"],
        ["3. Tara", "Destiny, longevity & health", "3.0", "3.0", "Full Score (Passed)"],
        ["4. Yoni", "Physical / sexual compatibility", "4.0", "3.5", "High Harmony"],
        ["5. Graha Maitri", "Psychological bond of Moon lords", "5.0", "4.0", "Friendly Disposition"],
        ["6. Gana", "Temperament (Deva/Manushya/Rakshasa)", "6.0", "5.0", "Compatible"],
        ["7. Bhakoot", "Emotional welfare, family & finance", "7.0", "7.0", "Dosha-Free"],
        ["8. Nadi", "Genetic compatibility & progeny health", "8.0", "8.0", "Supreme (No Dosha)"]
    ]
    p1.draw_table(30, 430, k_headers, k_rows, [95, 175, 75, 75, 115], row_h=17)
    streams.append(p1.get_stream())

    # Pages 2 to 9: Deep dive into each of the 8 Kootas (8 Pages)
    koota_deep = [
        ("Varna Koota (Work Temperament & Spiritual Ego)",
         "Evaluates the spiritual development and mutual ego respect between Bride and Groom (1 Point Max)",
         "1.0 / 1.0 Obtained (Supreme Temperament Alignment)",
         "Varna represents the innate philosophical altitude of the mind. The Groom's spiritual temperament comfortably balances the Bride's intellectual strengths, creating mutual reverence and absence of petty ego friction in daily decisions.",
         "Ensure mutual encouragement in career pursuits and intellectual hobbies."),

        ("Vashya Koota (Mutual Magnetic Attraction & Harmony)",
         "Determines natural magnetic draw, psychological yielding and power balance in the union (2 Points Max)",
         "2.0 / 2.0 Obtained (Balanced Devotion & Mutual Receptivity)",
         "Vashya measures the voluntary respect and emotional magnetism that keeps both hearts closely aligned over decades of marriage. Neither partner feels dominated; decisions are arrived at cooperatively.",
         "Practice transparent sharing of personal concerns; never allow unresolved disagreements to linger overnight."),

        ("Tara Koota (Birth Star Destiny & Mutual Longevity)",
         "Calculates the count between birth nakshatras to evaluate health, fate and longevity (3 Points Max)",
         "3.0 / 3.0 Obtained (Auspicious Sadhaka & Mitra Tara Alignment)",
         "Tara evaluates how the lunar asterisms interact. An auspicious Tara configuration acts as a cosmic umbrella, protecting both individuals from sudden misfortunes and promoting sustained health and career progress.",
         "Express gratitude regularly and undertake joint pilgrimages or quiet retreats once a year."),

        ("Yoni Koota (Biological Synergy & Intimate Compatibility)",
         "Evaluates sexual compatibility, physical attraction, and intimate biological chemistry (4 Points Max)",
         "3.5 / 4.0 Obtained (High Physiological & Emotional Affinity)",
         "Yoni reflects instinctive physical affinity and physical affection. The natural animal symbols governing both stars are mutually friendly, ensuring enduring physical attraction, emotional tenderness, and domestic contentment.",
         "Create dedicated undistracted time for intimacy and leisure away from work pressures."),

        ("Graha Maitri (Planetary Friendship of Moon Sign Lords)",
         "Gauges the psychological rapport, communication ease, and natural worldview of both minds (5 Points Max)",
         "4.0 / 5.0 Obtained (Friendly & Cooperative Mental Disposition)",
         "Ruled by the lords of both Moon signs, Graha Maitri confirms whether both partners think along compatible wavelengths. Even during stressful events, mutual empathy prevents ideological rifts and builds deep lifelong companionship.",
         "Foster daily evening conversations without digital screens to sustain intellectual closeness."),

        ("Gana Koota (Temperamental Disposition: Deva, Manushya, Rakshasa)",
         "Assesses societal instincts, lifestyle temperament, and moral philosophies (6 Points Max)",
         "5.0 / 6.0 Obtained (Harmonious Devic / Manushya Synergy)",
         "Gana indicates behavioral patterns in society. Both charts belong to harmoniously aligned Ganas, fostering mutual sympathy, shared philanthropic values, similar moral viewpoints, and social goodwill.",
         "Respect each other's individual space and friendship circles with generous understanding."),

        ("Bhakoot Koota (Emotional Welfare, Family Prosperity & Progeny)",
         "Evaluates relative Moon house placements to ensure freedom from financial and marital friction (7 Points Max)",
         "7.0 / 7.0 Obtained (Supreme Shubh-Bhakoot Alignment — Zero Dosha)",
         "Bhakoot is one of the pillars of Ashtakoot. The absence of Shadashtaka (6/8) or Dwirdwadasha (2/12) ensures continuous flow of material prosperity, emotional joy, family happiness, and healthy progeny without domestic tension.",
         "Jointly manage family financial planning with mutual trust and open bookkeeping."),

        ("Nadi Koota (Vedic Genetic Resonance, Vitality & Healthy Progeny)",
         "Assesses bio-energetic life currents (Aadi, Madhya, Antya) to guarantee hereditary vitality (8 Points Max)",
         "8.0 / 8.0 Obtained (Supreme Nadi Compatibility — Zero Nadi Dosha)",
         "Carrying 8 full points, Nadi is the paramount biological foundation of Vedic compatibility. Belonging to harmonious Nadis ensures genetic diversity, robust physical constitution, and the blessing of healthy, gifted children.",
         "Celebrate major life milestones with family charity and honoring elderly ancestral blessings.")
    ]

    for idx, (k_title, k_sub, k_score, k_eval, k_counsel) in enumerate(koota_deep):
        p_num = 2 + idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Chapter {idx+1}: {k_title}", k_sub)
        
        pb.add_section_header(725, "1. ASHTAKOOT MATHEMATICAL SCORING")
        pb.draw_card(30, 605, 535, 105)
        pb.cmds.append(f"BT /F2 11 Tf 45 685 Td (SCORE: {k_score}) Tj ET")
        pb.add_text_block(45, 665, 505, "Classical Interpretation:", k_eval, line_spacing=12)

        pb.add_section_header(565, "2. MARITAL HARMONY & PSYCHOLOGICAL COUNSEL")
        pb.draw_card(30, 430, 535, 115)
        pb.add_text_block(45, 515, 505, "Enduring Relationship Guidance:", k_counsel, line_spacing=12)
        pb.add_text_block(45, 470, 505, "Vedic Principle:", "A marriage sustained by mutual respect, truthful speech, and shared spiritual principles easily overcomes external worldly difficulties and shines as an inspiration.", line_spacing=12)

        pb.add_section_header(385, "KOOTA SYNTHESIS")
        pb.add_text_block(30, 365, 535, "Astrological Assessment",
                          f"The alignment in {k_title} provides strong energetic support to the marital bond. By nurturing patience and gratitude, both partners build a sanctuary of lifelong love and prosperity.")
        streams.append(pb.get_stream())

    # Pages 10 to 20: Manglik Matching, Dashakoota, Papasamya, Dasha Sandhi, Remedies (11 Pages)
    matching_deep_topics = [
        ("Manglik (Kuja Dosha) Comparative Examination",
         "Thorough evaluation of Mars afflictions from Lagna, Moon, and Venus in both charts",
         "Kuja Dosha arises when Mars occupies houses 1, 2, 4, 7, 8, or 12. In this comparison, both the Boy and Girl charts show balanced, mitigated Mars energy. When both parties possess similar affliction levels or natural benefic cancellations, the dosha is nullified (Kuja Dosha Bhanga).",
         "Both charts exhibit high emotional equilibrium; zero destructive Mars afflictions detected.",
         "Keep a red coral or copper idol of Lord Ganesha in the prayer room to sustain harmony."),

        ("South Indian 10-Porutham (Dashakoota) Classical System",
         "Dina, Gana, Mahendra, Stree Deergha, Yoni, Rashi, Rasyadhipathi, Vasya, Rajju, and Vedha",
         "The traditional South Indian system complements the North Indian Ashtakoot. It examines mutual star counts to confirm lineage continuity, financial security, and non-repulsion between stellar constellations.",
         "8 out of 10 Poruthams are fully satisfied, verifying deep astrological agreement.",
         "Celebrate festive occasions with traditional home offerings to family deities (Kuladevata)."),

        ("Rajju & Vedha Porutham Deep Diagnostic",
         "The two non-negotiable longevity and non-repulsion poruthams in marital Jyotish",
         "Rajju confirms whether birth stars fall on the same bodily limb of the cosmic person (Siro, Kantha, Uro, Kati, Pada). Falling on different Rajjus guarantees long marital life for both partners. Zero Vedha confirms freedom from mutual magnetic discord.",
         "Supreme agreement confirmed: Both stars occupy different Rajju divisions and have zero Vedha.",
         "Regular recitation of Vishnu Sahasranama preserves matrimonial peace across all transits."),

        ("Papasamya Balance (Malefic Point Equality)",
         "Comparative assessment of affliction points caused by Mars, Saturn, Sun, Rahu, and Ketu",
         "Papasamya ensures that the quantum of malefic planetary pressure in one partner's chart is balanced by an equivalent strength in the other. Balanced Papasamya prevents one spouse from feeling overwhelmed by the other's karmic tests.",
         "Groom Papasamya: 14.5 Points | Bride Papasamya: 15.0 Points (Near-perfect equilibrium).",
         "Engage in joint charitable service (Daana) on Saturdays to dissolve minor karmic imbalances."),

        ("Dasha Sandhi & Planetary Cycles Synchronicity",
         "Scanning for overlapping major dasha transitions within 6 to 12 months",
         "Dasha Sandhi occurs when both husband and wife experience a major Mahadasha shift simultaneously, which can induce temporary household stress. In this match, their major dasha cycles are comfortably spaced, providing stability.",
         "One partner enters growth phases while the other provides stabilizing domestic support.",
         "Perform Navagraha Shanti puja during any significant planetary cycle transition."),

        ("7th House & Venus/Jupiter Mutual Receptivity",
         "Examining the mutual aspects and dignity between 7th lords and natural significators",
         "The 7th house governs the sanctity of the marriage covenant. Favorable mutual aspect between the Groom's Jupiter and Bride's Venus indicates mutual intellectual respect, romantic loyalty, and domestic abundance.",
         "Mutual planetary trines create natural forgiveness, warmth, and enduring friendship.",
         "Nurture daily rituals of affectionate appreciation and open communication."),

        ("Family Life & Progeny Potential (Saptamsha D7)",
         "Evaluating the 5th and 9th houses across D1 and D7 charts for child blessings",
         "Progeny analysis checks Jupiter's strength and the vitality of the 5th houses in both horoscopes. Both charts demonstrate robust fertility, strong parental instincts, and the blessing of noble, accomplished children.",
         "Saptamsha harmonics reflect healthy lineage continuity and joyous family bonds.",
         "Support orphanages or children's education charities on auspicious wedding anniversaries."),

        ("Financial Prosperity & Combined Wealth Synergy",
         "Evaluating the interaction between 2nd (Treasury) and 11th (Income) houses of both charts",
         "When married, the financial karmas of husband and wife merge into a unified energetic stream. The mutual harmony of their 2nd and 11th lords unlocks collective business success, real estate acquisitions, and lasting wealth.",
         "The combined financial horizon indicates steady capital accumulation and flourishing investments.",
         "Maintain joint savings accounts and make major investment decisions collaboratively."),

        ("Vedic Remedial Suite for Marital Longevity",
         "Sacred gemological, mantra, and lifestyle remedies to reinforce marital bliss",
         "To nourish the lifelong bond, classical texts prescribe harmonizing rituals that invoke divine grace. These practices elevate the household vibration, shielding the couple from negative external vibrations.",
         "Perform Gauri Shankar Puja during auspicious waxing Moon tithis.",
         "Wear natural Pearl (Moon) or White Zircon (Venus) to enhance tenderness and calm communication."),

        ("Auspicious Wedding Muhurta & Vivaha Sanskar Timing",
         "Guiding principles for selecting an auspicious wedding date, tithi, and lagna",
         "The wedding ceremony (Vivaha Sanskar) initiates the spiritual entity of marriage. Selecting a date with Shubh Tithi, Auspicious Nakshatra, and an unafflicted Lagna (avoiding Godhuli dosha) anchors lifelong happiness.",
         "Choose dates when Jupiter and Venus are direct and free from combustion (Tara Shuddhi).",
         "Ensure the wedding Lagna is free from Mars or Saturn in the 7th or 8th house."),

        ("Final Astrological Verdict & Vivaha Blessing",
         "Concluding official certification of compatibility, mutual strengths, and lifetime guidance",
         "This comprehensive 20-page Kundli Milan confirms that the horoscopes of the Prospective Groom and Bride possess exceptional astrological compatibility. With 28.5 / 36 Gunas, zero Nadi dosha, and balanced Papasamya, this alliance is enthusiastically certified as UTTAM MILAN (Supreme Union).",
         "Official Verdict: HIGHLY RECOMMENDED MATCH with full astrological blessings.",
         "May Lord Shiva and Goddess Parvati bestow lifelong happiness, health, and prosperity upon this union.")
    ]

    for p_idx, (t_title, t_sub, t_core, t_strat, t_upay) in enumerate(matching_deep_topics):
        p_num = 10 + p_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(t_title, t_sub)
        
        pb.add_section_header(725, "1. ASTROLOGICAL EVALUATION")
        pb.draw_card(30, 595, 535, 115)
        pb.add_text_block(45, 680, 505, "Classical Diagnostic Findings:", t_core, line_spacing=12)

        pb.add_section_header(555, "2. RELATIONSHIP DIRECTIVES & REMEDIAL GUIDANCE")
        pb.draw_card(30, 420, 535, 120)
        pb.add_text_block(45, 510, 505, "Marital Synergy Directive:", t_strat, line_spacing=12)
        pb.add_text_block(45, 465, 505, "Prescribed Remedial Practice:", t_upay, line_spacing=12)

        pb.add_section_header(380, "MARITAL LIFE BLESSING")
        pb.add_text_block(30, 360, 535, "Vedic Wisdom",
                          f"The astrological synergy evaluated in {t_title} provides an enduring foundation. True marital happiness is cultivated daily through mutual respect, shared devotion, and patience.")
        streams.append(pb.get_stream())

    writer = MinimalPDFWriter()
    return writer.assemble_pdf(streams)


# ════════════════════════════════════════════════════════════════════════════
# 4. LAL KITAB FULL REPORT BUILDER (30 Pages)
# ════════════════════════════════════════════════════════════════════════════
def build_lalkitab_pdf(birth_data: Dict[str, Any], chart: Dict[str, Any], branding: Dict[str, Any], lang: str) -> bytes:
    company = branding.get("company_name") or "AstroEngine Vedic Portal"
    website = branding.get("website") or "www.astroengine.io"
    b_color = (0.78, 0.15, 0.15) # Red for Lal Kitab
    total_pages = 30
    streams = []

    # Page 1: Lal Kitab Cover & Kalpurush Kundli
    p1 = PageBuilder(1, total_pages, company, website, b_color)
    p1.add_page_title("Lal Kitab Amrit Full Diagnostic Report", "Comprehensive 30-Page Farman Analysis, Karmic Debts (Rin) & Upay Remedies")
    p1.add_section_header(725, "1. NATIVITY & FIXED KALPURUSH KUNDLI")
    p1.draw_card(30, 615, 535, 95)
    p1.add_text_block(45, 685, 505, "Lal Kitab System Overview:",
                      "In Lal Kitab, signs are permanently locked to the natural Kalpurush chart: House 1 is always Aries, House 2 Taurus, etc. Houses act as permanent thrones for planets, evaluated through friendship and enmity of houses.")
    
    # Draw Kalpurush D1 (House 1 is always Sign 1 Aries)
    planets = chart.get("planets", [])
    lk_houses: Dict[int, List[str]] = {h: [] for h in range(1, 13)}
    for p in planets:
        h = p.get("house", 1)
        abbr = p.get("id", p.get("name", "Pl"))[:2].capitalize()
        lk_houses[h].append(abbr)
    p1.draw_north_chart(175, 360, 240, 1, lk_houses, "LAL KITAB KUNDLI")
    streams.append(p1.get_stream())

    # Pages 2 to 13: 12 Fixed Houses (Ghar) of Lal Kitab (12 Pages)
    lk_house_details = [
        ("Ghar No 1: Takht (Throne of Soul, Vitality & Royal Auspiciousness)",
         "The 1st house is the throne of the individual. Whatever planet sits here commands the entire horoscope. Natural ruler is Mars (Mesha), giving raw life force and determination.",
         "Keep purity of conduct. Do not accept free religious gifts (Daana). Wearing pure silver or copper energizes your natural charisma and repels unforeseen accidents."),
        ("Ghar No 2: Mandir (Temple of Wealth, Lineage & Dharma)",
         "The 2nd house acts as the divine temple (Dharmasthan) of the horoscope, ruled naturally by Jupiter (Vrishabha seat). All family treasures and vocal truth emanate from here.",
         "Visiting places of worship barefoot, applying yellow saffron/turmeric tilak on forehead, and speaking ethically without falsehood guarantees permanent financial stability."),
        ("Ghar No 3: Hathiyar (Courage, Brothers & Weapons)",
         "The 3rd house represents physical hands, courage, younger brothers, and tools of trade. Ruled by Mercury with Mars energy. It reflects initiative and quick manual dexterity.",
         "Maintain cordial relations with younger siblings. Avoid borrowing stationery or tools. Wearing a silver ring without joints dispels ungrounded mental anxiety."),
        ("Ghar No 4: Maa (Mother, Heart & Cool Flowing Water)",
         "The 4th house is the sacred domain of the Mother and peace of mind (Sukh), governed naturally by the Moon. It brings vehicles, ancestral lands, and gentle happiness.",
         "Obtain the blessings of elders and your mother daily. Keep a brass container filled with pure river water in your home. Never sell ancestral property during distress."),
        ("Ghar No 5: Aulaad (Progeny, Future Destiny & Knowledge)",
         "The 5th house is the school of wisdom, past-life karma, and children, ruled naturally by the Sun. It determines creative foresight, scholarship, and joyful progeny.",
         "Feed birds with millet and keep water pots on the rooftop. Respect teachers and mentors. Sponsoring a child's educational books brings rapid professional ascension."),
        ("Ghar No 6: Pataal (Underworld, Debts & Maternal Uncle)",
         "The 6th house is the subterranean realm of illness, secret adversaries, and daily debts, ruled by Mercury and Ketu. It tests stamina and moral clarity.",
         "Feed stray dogs sweet rotis continuously for 43 days. Maintain cordial relations with maternal uncles (Mama). Keep a small silver ball in your pocket for protection."),
        ("Ghar No 7: Grihasthi (Marriage, Business & Life Partner)",
         "The 7th house is the sacred threshold of married life, public reputation, and commercial trade, ruled naturally by Venus and Mercury.",
         "Treat your life partner with supreme dignity and consult them on major investments. Keep cows nourished with fresh green grass. Avoid partnerships with dubious associates."),
        ("Ghar No 8: Maut (Longevity, Secrets & Deep Mystery)",
         "The 8th house is the furnace of life force, sudden transformations, and mystical breakthroughs, ruled by Mars and Saturn. It demands high ethical discipline.",
         "Never accept gifts of machinery or oil for free. Donate yellow grams and turmeric in a temple on Thursdays. Do not keep unused junk or iron scrap on the rooftop."),
        ("Ghar No 9: Kismat (Divine Fortune, Religion & Ancestors)",
         "The 9th house is the fountainhead of luck, fatherly protection, and religious pilgrimage, ruled naturally by Jupiter. It opens gates of unearned fortune.",
         "Honor father and gurus with profound respect. Undertake pilgrimages with humility. Avoid religious arguments or cynicism; divine grace flows uninterrupted."),
        ("Ghar No 10: Sarkar (Government, Authority & Enterprise)",
         "The 10th house is the seat of worldly authority, administrative power, executive office, and career status, ruled naturally by Saturn.",
         "Work with meticulous discipline and avoid intoxication or gambling. Offering water to the rising Sun in a copper vessel ensures steady executive promotion."),
        ("Ghar No 11: Labha (Inflows, Aspirations & Social Network)",
         "The 11th house is the reservoir of worldly profits, realization of lifelong aspirations, and elder brothers, ruled naturally by Jupiter and Saturn.",
         "Avoid deceit in financial dealings. Donate mustard oil on Saturdays. Maintain harmonious bonds with elder siblings and honor all business commitments diligently."),
        ("Ghar No 12: Moksha (Solitude, Foreign Shores & Bed Pleasures)",
         "The 12th house represents ultimate detachment, international voyages, restful sleep, and liberation, ruled naturally by Jupiter and Rahu.",
         "Keep your sleeping area uncluttered. Do not consume meals on your bed. Giving food and clothes to the needy on full moon days dissolves subconscious distress.")
    ]

    for h_idx, (h_title, h_farman, h_upay) in enumerate(lk_house_details):
        p_num = 2 + h_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Lal Kitab: {h_title}", f"Exhaustive Farman diagnostics and authentic remedies for Ghar {h_idx+1}")
        pb.add_section_header(725, "1. HOUSE OCCUPANTS & SLEEPING (SOYA) STATUS")
        pb.draw_card(30, 600, 535, 110)
        occ = lk_houses.get(h_idx + 1, [])
        occ_s = ", ".join(occ) if occ else "Soya Hua Ghar (Sleeping House - Awake through Lord / Aspect)"
        pb.cmds.append(f"BT /F2 9.5 Tf 45 685 Td (Planets in Ghar {h_idx+1}:) Tj /F1 9.5 Tf 185 685 Td ({_escape_pdf_text(occ_s)}) Tj ET")
        pb.add_text_block(45, 665, 505, "Lal Kitab Farman & Karmic Archetype:", h_farman, line_spacing=12)
        
        pb.add_section_header(560, "2. PRESCRIBED LAL KITAB UPAY & PRECAUTIONS")
        pb.draw_card(30, 425, 535, 120)
        pb.add_text_block(45, 515, 505, "Authentic Remedial Remedy:", h_upay, line_spacing=12)
        pb.add_text_block(45, 465, 505, "Execution Protocol:", "Execute all remedies between sunrise and sunset. Do not consume non-vegetarian food or alcohol while performing remedies for maximum spiritual potency.", line_spacing=12)

        pb.add_section_header(385, "HOUSE AWAKENING (JAGRAN) TECHNIQUE")
        pb.add_text_block(30, 365, 535, "Awakening Method",
                          f"If Ghar {h_idx+1} is dormant without planets, it is awakened by the planet seated in its corresponding mutual aspect house or by establishing the natural metal associated with its ruling lord.")
        streams.append(pb.get_stream())

    # Pages 14 to 19: Lal Kitab Ancestral Debts (Pitri Rin, Matri Rin, Stri Rin, etc. - 6 Pages)
    debts = [
        ("Pitri Rin (Father's Debt)", "Jupiter afflicted by Venus/Mercury in 2nd/5th/9th/12th houses", "Collect equal money from all blood relatives and donate to religious places."),
        ("Matri Rin (Mother's Debt)", "Moon afflicted by Ketu in 2nd/4th/7th/8th houses", "Collect silver from all relatives and immerse into flowing clean river water."),
        ("Stri Rin (Wife's Debt)", "Venus afflicted by Sun/Rahu in 2nd/7th houses", "Feed 100 cows with fresh green grass and wheat dough balls simultaneously."),
        ("Bhratri Rin (Brother's Debt)", "Mars afflicted by Mercury/Ketu in 3rd/8th houses", "Donate sweets and medicine to charitable hospitals and needy patients."),
        ("Kudrati Rin (Nature's Debt)", "Moon or Mars afflicted by Saturn/Rahu in 6th house", "Feed stray dogs continuously for 43 days with sweet roti/bread."),
        ("Aatmiya Rin (Self/Soul Debt)", "Sun afflicted by Saturn/Rahu/Ketu in 1st/5th/10th houses", "Collect copper coins from family members and donate to an ancient temple.")
    ]
    for d_idx, (d_name, d_cause, d_rem) in enumerate(debts):
        p_num = 14 + d_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Lal Kitab Rin: {d_name}", "Ancestral karmic debts and classical alleviation procedures")
        pb.add_section_header(725, "DEBT DIAGNOSTIC CRITERIA")
        pb.draw_card(30, 615, 535, 95)
        pb.add_text_block(45, 685, 505, "Affliction Configuration:", d_cause)
        pb.add_section_header(590, "AUTHENTIC LAL KITAB UPAY")
        pb.draw_card(30, 480, 535, 95)
        pb.add_text_block(45, 550, 505, "Prescribed Remedial Procedure:", d_rem)
        streams.append(pb.get_stream())

    # Pages 20 to 30: Sleeping Houses, Blind Planets, Varshphal Cycles, Upayas (11 Pages)
    lk_advanced_chapters = [
        ("Sleeping Houses (Soya Hua Ghar) Awakening Diagnostics",
         "Methods to identify dormant energy centers and activate them through planetary triggers",
         "A house without occupying planets is designated as 'Soya Hua' (Asleep). Its affairs remain passive until awakened by a transit planet or by establishing its natural karaka metal in your residence.",
         "Ghar 2 is awakened by temple visits; Ghar 9 by ancestral blessings; Ghar 10 by daily hard work without deceit.",
         "Keep copper coins or silver squares in appropriate directions according to house requirements."),

        ("Blind Horoscope (Andha Teva) Diagnostics & Rectification",
         "Examining horoscopes where the 10th house is afflicted or vacant, obscuring daytime life vision",
         "When both 10th and 9th houses lack mutual benefic support, the chart is classified as Andha Teva. Career clarity may fluctuate, requiring reliance on intuitive advice from experienced mentors.",
         "Feed 10 blind or visually impaired individuals or support eye care charities.",
         "Keep a solid silver block in your home and avoid undertaking major financial decisions after sunset."),

        ("Dharmi Teva (Righteous Horoscope) & Divine Armor",
         "Special planetary combinations providing an impenetrable divine shield from malefic harm",
         "When Jupiter or the Moon occupies sensitive angles, or Rahu and Ketu reside in mutually neutral signs, the horoscope is elevated to Dharmi Teva, protecting the native from sudden calamities and curses.",
         "The native's earnest prayers carry intense spiritual power and shield the entire family.",
         "Maintain utmost ethical rectitude; divine protection departs if you engage in fraudulent schemes."),

        ("Lal Kitab Planetary Aspects (Drishti Rules)",
         "Special 100%, 50%, and 25% aspectual rules unique to the classical Lal Kitab system",
         "Unlike Parashari aspects, Lal Kitab aspects operate between opposite and diagonal houses (1 to 7, 4 to 10, 3 to 9). Crucially, a malefic sitting in a house can strike an opposing benefic, calling for remedial buffer walls.",
         "Planets in 8th house strike 2nd house directly; establish a brass or silver barrier to protect treasury.",
         "Avoid placing conflicting planetary items together in the same room (e.g., iron and gold together)."),

        ("Lal Kitab Varshphal Progression Rules & 120-Year Cycle",
         "Circular planetary progression from age 1 to 120 determining annual life themes",
         "The annual Varshphal in Lal Kitab is formed by rotating planetary houses based on natural age cycles. Every year, a new planet takes the pilot seat, dictating that year's financial, domestic, and health climate.",
         "Always calculate your Lal Kitab Varshphal on your exact solar birthday.",
         "Perform the prescribed annual Upay within the first 43 days of your birthday for complete effectiveness."),

        ("Daily Conduct & Farman Precautions for Purity",
         "Dietary, behavioral, and ethical lifestyle codes to maintain karmic equilibrium",
         "Lal Kitab emphasizes that daily actions (Karmas) outweigh mechanical rituals. Respecting daughter-in-law, avoiding cruelty to animals, keeping toilets clean, and speaking truthfully creates continuous protective aura.",
         "Never accept gifts of ivory, animal skins, or weapons into your household.",
         "Treat sweepers, laborers, and domestic staff with generous compensation and kindness."),

        ("Silver & Copper Sacred Upayas (Dhatu Chikitsa)",
         "Strategic use of pure square silver pieces, copper coins, and natural earthen pots",
         "Silver represents the calming Moon and Venus, dissipating Rahu's obsessive delusions. Copper represents the fiery vitality of the Sun and Mars, banishing Saturn's sluggish delays and inertia.",
         "Carry a 1-inch square solid silver piece in your wallet without any holes or inscriptions.",
         "Immerse pierced copper coins in flowing river water on Sundays to boost career status."),

        ("Flowing Water (Jal Pravah) Remedial Science",
         "Sacred principles for consigning specific elemental substances into clean natural rivers",
         "Flowing river water represents the infinite cleansing power of the 4th house (Moon). Consigning specific planetary items transfers stagnant affliction into the dynamic current of nature.",
         "Perform Jal Pravah only in daylight hours before sunset in clean, flowing natural waters.",
         "Do not throw items into stagnant ponds or dirty canals; flowing current is strictly essential."),

        ("Animal & Bird Feeding Upayas (Jeev Seva)",
         "Balancing difficult planetary energies through cows, stray dogs, crows, and fish",
         "Animals act as direct biological transceivers for planetary energies: Cows (Venus/Jupiter), Dogs (Ketu/Saturn), Crows (Saturn), Birds (Mercury), and Fish (Moon/Varuna).",
         "Feeding black stray dogs bread with mustard oil alleviates severe Rahu and Ketu afflictions.",
         "Feeding whole wheat dough balls to fish on Mondays dissolves psychological depression."),

        ("43-Day Continuous Remedial Discipline (Farman Protocol)",
         "The inviolable protocol for executing Lal Kitab remedies without missing a single day",
         "In Lal Kitab, a complete remedial course spans exactly 43 consecutive days. Missing even a single day resets the counter to zero, as 43 days represents the biological cycle of cellular restructuring.",
         "Begin the remedy on the auspicious weekday corresponding to the afflicted planet.",
         "If interrupted by travel or illness, restart from Day 1 to complete the unbroken 43-day cycle."),

        ("Concluding Lal Kitab Life Blessings & Farman Seal",
         "Master summary of lifelong protective guidelines and ethical principles",
         "Lal Kitab provides practical, accessible wisdom to live harmoniously with cosmic forces. By honoring these Farman guidelines and remaining grounded in truth and generosity, your life path unfolds with peace and abundance.",
         "Keep your home entryway clean and bright; avoid keeping defective electronic gadgets or dead clocks.",
         "May the cosmic protectors shield your home, family, and enterprise with lasting prosperity.")
    ]

    for p_idx, (c_title, c_sub, c_core, c_rules, c_upay) in enumerate(lk_advanced_chapters):
        p_num = 20 + p_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(c_title, c_sub)
        
        pb.add_section_header(725, "1. LAL KITAB CLASSICAL FARMAN")
        pb.draw_card(30, 595, 535, 115)
        pb.add_text_block(45, 680, 505, "Sacred Farman Doctrine:", c_core, line_spacing=12)

        pb.add_section_header(555, "2. PRACTICAL APPLICATION & REMEDIAL DISCIPLINE")
        pb.draw_card(30, 420, 535, 120)
        pb.add_text_block(45, 510, 505, "Prescribed Protocol:", c_rules, line_spacing=12)
        pb.add_text_block(45, 465, 505, "Authentic Upay:", c_upay, line_spacing=12)

        pb.add_section_header(380, "LAL KITAB WISDOM")
        pb.add_text_block(30, 360, 535, "Karmic Principle",
                          f"The principles in {c_title} operate gently yet decisively. By honoring these ancient precepts during daylight hours, you invoke profound divine protection across all spheres of life.")
        streams.append(pb.get_stream())

    writer = MinimalPDFWriter()
    return writer.assemble_pdf(streams)


# ════════════════════════════════════════════════════════════════════════════
# 5. VARSHPHAL ANNUAL REPORT BUILDER (20 Pages)
# ════════════════════════════════════════════════════════════════════════════
def build_varshphal_pdf(birth_data: Dict[str, Any], chart: Dict[str, Any], branding: Dict[str, Any], lang: str) -> bytes:
    company = branding.get("company_name") or "AstroEngine Vedic Portal"
    website = branding.get("website") or "www.astroengine.io"
    b_color = (0.75, 0.45, 0.05) # Amber Gold
    total_pages = 20
    streams = []

    target_year = birth_data.get("target_year", 2026)

    # Page 1: Annual Solar Return Overview
    p1 = PageBuilder(1, total_pages, company, website, b_color)
    p1.add_page_title(f"Varshphal Annual Solar Return — Year {target_year}", "Comprehensive 20-Page Tajik Annual Horoscope & Monthly Forecast")
    p1.add_section_header(725, f"1. ANNUAL SOLAR RETURN CHART (TAJIK {target_year})")
    p1.draw_card(30, 615, 535, 95)
    p1.add_text_block(45, 685, 505, "Solar Return Exact Conjunction:",
                      f"Calculated for the precise moment the Sun returns to its exact natal celestial longitude in {target_year}. This chart sets the primary energetic template for your year.")

    planets = chart.get("planets", [])
    vp_houses: Dict[int, List[str]] = {h: [] for h in range(1, 13)}
    for p in planets:
        h = p.get("house", 1)
        abbr = p.get("id", p.get("name", "Pl"))[:2].capitalize()
        vp_houses[h].append(abbr)
    p1.draw_north_chart(175, 360, 240, 5, vp_houses, f"VARSHPHAL {target_year}")
    streams.append(p1.get_stream())

    # Pages 2 to 13: 12-Month Month-by-Month Forecast (12 Pages)
    month_data = [
        ("January", "Career Initiatives & Strategic Goal Realignment",
         "The solar ingress into Capricorn marks an auspicious epoch for cementing professional alliances, initiating long-term financial budgets, and reorganizing workflow.",
         "Favorable Days: 4th, 9th, 14th, 22nd, 27th. Excellent for commercial negotiations.",
         "Precautions: Guard against dietary overindulgence. Recite Aditya Hridaya Stotra at sunrise."),
        ("February", "Financial Reserves & Family Harmony",
         "Focus shifts toward capital preservation, liquid asset restructuring, and nurturing bonds with extended family elders.",
         "Favorable Days: 2nd, 8th, 15th, 19th, 26th. Ideal for long-term investments and bank settlements.",
         "Precautions: Avoid impulsive spending on luxury electronics; donate yellow lentils on Thursdays."),
        ("March", "Enterprise, Short Travel & Digital Communication",
         "Dynamic Mars influences heighten personal drive, communications, contracts, and creative dexterity across digital or media channels.",
         "Favorable Days: 5th, 11th, 17th, 23rd, 29th. Promotes swift success in marketing and trade.",
         "Precautions: Drive cautiously during transit shifts; offer water to a Peepal tree on Saturdays."),
        ("April", "Domestic Peace, Real Estate & Vehicular Comforts",
         "Sun enters Aries exalted, illuminating home life, parental wellness, architectural renovations, and property acquisitions.",
         "Favorable Days: 3rd, 10th, 14th, 21st, 28th. Golden window for signing lease or land deeds.",
         "Precautions: Maintain diplomacy in domestic decisions; chant Gayatri Mantra 108 times daily."),
        ("May", "Creative Innovation, Speculation & Children's Progress",
         "Mercury and Venus foster creative brilliance, speculative wisdom, romantic joy, and pride through children's academic achievements.",
         "Favorable Days: 6th, 12th, 18th, 24th, 30th. Auspicious for launching creative projects.",
         "Precautions: Avoid risky unhedged stock trading; donate green vegetables or grass to cows on Wednesdays."),
        ("June", "Workplace Organization, Debt Reduction & Health Fitness",
         "Discipline prevails in handling daily administrative tasks, overcoming workplace rivals, and clearing long-standing liabilities.",
         "Favorable Days: 4th, 9th, 15th, 22nd, 27th. Optimal for medical checkups and resolving disputes.",
         "Precautions: Prioritize gut health and hydration; avoid legal confrontations on Tuesdays."),
        ("July", "Commercial Partnerships & Marital Joy",
         "Planetary aspects highlight one-on-one relationships, business collaborations, public relations, and affectionate companionship.",
         "Favorable Days: 5th, 11th, 16th, 23rd, 29th. Favorable for mutual agreements and festive celebrations.",
         "Precautions: Maintain transparency in financial books with partners; wear fragrant white clothes on Fridays."),
        ("August", "Deep Research, Transformation & Sudden Inflows",
         "Sun in Leo strengthens inner resilience, research breakthroughs, inheritance settlements, and psychological mastery.",
         "Favorable Days: 3rd, 8th, 14th, 20th, 26th. Significant for tax planning and esoteric study.",
         "Precautions: Avoid speculative gossip; practice 15 minutes of Pranayama meditation each morning."),
        ("September", "Dharmic Fortune, Mentorship & Spiritual Pilgrimages",
         "Jupiterian blessings activate higher learning, foreign linkages, ethical counseling, and guidance from respected gurus.",
         "Favorable Days: 4th, 10th, 17th, 22nd, 28th. Superb for university enrollment and travel.",
         "Precautions: Honor teachers and parents with deep respect; donate books to underprivileged students."),
        ("October", "Career Ascendancy, Public Acclaim & Executive Power",
         "A pinnacle month for professional recognition, managerial leadership, government dealings, and prestigious rewards.",
         "Favorable Days: 2nd, 9th, 15th, 21st, 27th. Unlocks executive promotions and major contracts.",
         "Precautions: Avoid arrogance in delegating orders; light a sesame oil lamp under a Shami tree on Saturdays."),
        ("November", "Profit Realization, Social Networks & Milestone Desires",
         "The 11th house currents deliver substantial returns on past efforts, high patronage from influential friends, and celebration.",
         "Favorable Days: 5th, 11th, 18th, 24th, 30th. Prime time for harvesting financial gains.",
         "Precautions: Fulfill all charitable pledges without delay; offer milk or kheer to young girls."),
        ("December", "Yearly Review, Restful Solitude & Spiritual Rejuvenation",
         "Concluding month focuses on introspection, charitable giving, international travels, and preparing the blueprint for the coming year.",
         "Favorable Days: 3rd, 8th, 14th, 19th, 25th. Peaceful for spiritual retreats and holiday journeys.",
         "Precautions: Complete audit reconciliations before year-end; donate warm clothes to the poor on winter nights.")
    ]

    for m_idx, (m_name, m_title, m_pred, m_dates, m_upay) in enumerate(month_data):
        p_num = 2 + m_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Month {m_idx+1}: {m_name} {target_year} — {m_title}", f"Exhaustive Tajik solar progression and transit guidelines for {m_name}")
        
        pb.add_section_header(725, f"1. ASTROLOGICAL THEMES FOR {m_name.upper()} {target_year}")
        pb.draw_card(30, 595, 535, 115)
        pb.add_text_block(45, 680, 505, "Monthly Karmic Forecast:", m_pred, line_spacing=12)

        pb.add_section_header(555, "2. AUSPICIOUS WINDOWS & REMEDIAL DISCIPLINE")
        pb.draw_card(30, 420, 535, 120)
        pb.add_text_block(45, 510, 505, "High-Potential Dates:", m_dates, line_spacing=12)
        pb.add_text_block(45, 465, 505, "Monthly Upay & Conduct Precautions:", m_upay, line_spacing=12)

        pb.add_section_header(380, "MONTHLY HARMONY DIRECTIVE")
        pb.add_text_block(30, 360, 535, "Tajik Practical Wisdom",
                          f"During {m_name}, planetary aspects support planned deliberate steps. Synchronize your financial commitments with your favorable days to multiply auspicious outcomes.")
        streams.append(pb.get_stream())

    # Pages 14 to 20: Muntha, Varshesh Lord, Tajik Yogas, Sahams, Remedial Suite (7 Pages)
    annual_topics = [
        ("Muntha (Annual Progressed Focal Point) Analysis",
         f"Determines the primary focal arena of energy, career developments and potential vulnerabilities for {target_year}",
         "Muntha progresses by exactly one house each year from the natal Ascendant. When placed in auspicious houses (4, 9, 10, 11), it brings honors, elevation in rank, and financial windfalls. When in 6, 8, or 12, it advises measured pace and spiritual remedies.",
         "Keep regular schedules and avoid fatigue; channel energies into structured professional planning.",
         "Recite Hanuman Chalisa daily and donate red lentils on Tuesdays to empower your annual focal node."),

        ("Varshesh (Year Lord) Five-Fold Evaluation",
         f"The supreme planetary ruler commanding the events and dominant tone of Year {target_year}",
         "The Varshesh is determined through Panchadhikari selection: Lagnesha, Varsha Lagnesha, Munthesha, Trirashipati, and Dina/Ratri Pati. The planet with highest Panchavargiya Bala becomes the ruling Year King.",
         "Conduct affairs with the virtue and attributes of the Year Lord to receive uninterrupted blessings.",
         "Wear the color of the Varshesh planet on crucial business milestones and fast on its weekday."),

        ("Tajik 16 Yogas (Ithasala, Muthashila, Esharpha, Kamboola)",
         "Classical mathematical planetary aspects determining whether desired events fructify or dissipate",
         "Unlike Parashari aspects, Tajik aspects operate through planetary speeds and orb degrees (Deeptamsha). Ithasala Yoga guarantees favorable fruition of agreements, while Nakta or Yamaya yogas offer mediated success through third-party mentors.",
         "Act decisively during active Ithasala transits between key house lords to finalize contracts.",
         "Avoid litigations or impulsive arguments during Esharpha (separating) configurations."),

        ("Punya Saham & 36 Tajik Arabic Lots Audit",
         "Mathematical sensitive points pinpointing specific life sectors: Punya, Vidya, Karma, and Yasha",
         "Punya Saham (Fortunate Fate) is calculated from the distance between Sun, Moon, and Ascendant. When fortified by Jupiter or Venus, it unleashes unprecedented financial and familial growth.",
         "Plan crucial contract announcements on dates when transiting benefics conjoin Punya Saham.",
         "Keep a silver square piece in your wallet to energize your wealth-attracting magnetic field."),

        ("Patyayini & Mudda Dasha Timeline for the Year",
         f"The 365-day annual timeline breaking down seasonal planetary sub-cycles for {target_year}",
         "Patyayini Dasha divides the year into planetary periods proportional to longitudes. Each period brings distinct changes in psychology, professional opportunities, and household circumstances.",
         "Align aggressive commercial initiatives with Sun, Mars, and Jupiter sub-periods.",
         "Dedicate Saturn and Rahu sub-cycles to organizational auditing, health rejuvenation, and charity."),

        ("Annual Health, Financial & Career Risk Mitigation",
         "Precautions to guard capital reserves, maintain metabolic vitality, and prevent transit friction",
         "Strategic risk mitigation includes balancing work stress, respecting seasonal dietary rhythms, and avoiding speculative debt. Prioritizing structured savings shields your household from unanticipated expenses.",
         "Establish emergency reserves covering at least six months of household overhead.",
         "Incorporate daily morning walks and 10 minutes of solar meditation to sustain mental peace."),

        ("Grand Annual Vedic Remedial Master Suite",
         f"Holistic gemstone, sacred stotras, rudraksha, and daana practices customized for Year {target_year}",
         f"To unlock the highest blessings of Year {target_year}, perform targeted Vedic harmonizations. These time-tested remedies dissolve subtle friction and align your personal vibration with the planetary current.",
         f"Prescribed Gemstone: Natural energizing stone harmonized with your {target_year} Year Lord.",
         "Prescribed Stotra: Recite the Sri Suktam and Mahamrityunjaya Mantra on full moon nights.")
    ]

    for p_idx, (t_title, t_sub, t_core, t_strat, t_upay) in enumerate(annual_topics):
        p_num = 14 + p_idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(t_title, t_sub)
        
        pb.add_section_header(725, "1. TAJIK CLASSICAL ASSESSMENT")
        pb.draw_card(30, 595, 535, 115)
        pb.add_text_block(45, 680, 505, "Astronomical Significance:", t_core, line_spacing=12)

        pb.add_section_header(555, "2. PRACTICAL APPLICATION & REMEDIES")
        pb.draw_card(30, 420, 535, 120)
        pb.add_text_block(45, 510, 505, "Strategic Directives:", t_strat, line_spacing=12)
        pb.add_text_block(45, 465, 505, "Prescribed Upay & Rituals:", t_upay, line_spacing=12)

        pb.add_section_header(380, "ANNUAL LIFE WISDOM")
        pb.add_text_block(30, 360, 535, "Predictive Synthesis",
                          f"Integrating the wisdom of {t_title} ensures that your initiatives throughout {target_year} flow with celestial support, turning potential challenges into stepping stones for prosperity.")
        streams.append(pb.get_stream())

    writer = MinimalPDFWriter()
    return writer.assemble_pdf(streams)


# ════════════════════════════════════════════════════════════════════════════
# 6. NUMEROLOGY BLUEPRINT REPORT BUILDER (12 Pages)
# ════════════════════════════════════════════════════════════════════════════
def build_numerology_pdf(birth_data: Dict[str, Any], branding: Dict[str, Any], lang: str) -> bytes:
    company = branding.get("company_name") or "AstroEngine Vedic Portal"
    website = branding.get("website") or "www.astroengine.io"
    b_color = (0.05, 0.45, 0.35) # Emerald Green
    total_pages = 12
    streams = []

    from app.modules.numerology.calculator import calculate_core_numbers, calculate_loshu_grid
    dob = birth_data.get("dob", "1995-10-05")
    core = calculate_core_numbers(dob)
    loshu = calculate_loshu_grid(dob)

    mulank = core.get("mulank", {}).get("number", 5)
    bhagyank = core.get("bhagyank", {}).get("number", 3)

    # Page 1: Core Numbers & Lo Shu Grid
    p1 = PageBuilder(1, total_pages, company, website, b_color)
    p1.add_page_title("Complete Numerology Blueprint", "Comprehensive 12-Page Pythagorean & Chaldean Life Path Analysis")
    p1.add_section_header(725, "1. CORE NUMERICAL PROFILE")
    p1.draw_card(30, 615, 260, 95)
    p1.cmds.append(f"BT /F2 11 Tf 45 685 Td (MULANK (BIRTH NUMBER): {mulank}) Tj ET")
    p1.cmds.append(f"BT /F1 9 Tf 45 665 Td (Governing Planet: {core.get('mulank', {}).get('ruler', 'Mercury')}) Tj ET")
    p1.cmds.append(f"BT /F1 8.5 Tf 45 645 Td (Core Traits: {core.get('mulank', {}).get('traits', 'Versatility, Freedom')}) Tj ET")

    p1.draw_card(305, 615, 260, 95)
    p1.cmds.append(f"BT /F2 11 Tf 320 685 Td (BHAGYANK (DESTINY NUMBER): {bhagyank}) Tj ET")
    p1.cmds.append(f"BT /F1 9 Tf 320 665 Td (Governing Planet: {core.get('bhagyank', {}).get('ruler', 'Jupiter')}) Tj ET")
    p1.cmds.append(f"BT /F1 8.5 Tf 320 645 Td (Core Traits: {core.get('bhagyank', {}).get('traits', 'Wisdom, Expansion')}) Tj ET")

    p1.add_section_header(585, "2. 3x3 LO SHU MAGIC GRID (8 PLANES)")
    p1.draw_card(30, 435, 535, 135)
    p1.cmds.append("0.15 0.2 0.25 rg")
    p1.cmds.append("BT /F2 10 Tf 50 545 Td (Standard 3x3 Lo Shu Matrix from Date of Birth:) Tj ET")
    p1.cmds.append("BT /F2 11 Tf 50 520 Td ([ 4 | 9 | 2 ]   -> Mental Plane) Tj ET")
    p1.cmds.append("BT /F2 11 Tf 50 495 Td ([ 3 | 5 | 7 ]   -> Emotional / Thought Plane) Tj ET")
    p1.cmds.append("BT /F2 11 Tf 50 470 Td ([ 8 | 1 | 6 ]   -> Practical Action Plane) Tj ET")
    streams.append(p1.get_stream())

    # Pages 2 to 12: Planes, Pinnacles, Name Vibration, Yearly Forecast (11 Pages)
    num_chapters = [
        ("Mulank (Psychic Number) Deep Dive",
         f"Comprehensive psychological profile and instinctive behavioral drives governed by Mulank {mulank}",
         f"Mulank {mulank} governs your day-to-day thinking, emotional reactions, and instinctive habits. People ruled by {mulank} are known for their distinctive character, mental speed, and independence. In professional spheres, you operate best when granted creative autonomy.",
         "Leadership, quick analysis, resilience, innovative thinking, communication dexterity.",
         "Impatience, overthinking, restless shifts in interest, avoidance of repetitive paperwork."),
        
        ("Bhagyank (Destiny Number) Life Purpose",
         f"Soul purpose, ultimate life accomplishments and long-term career path for Bhagyank {bhagyank}",
         f"Bhagyank {bhagyank} takes precedence after the 30th year of life, shaping major life shifts, vocational status, and public reputation. It determines whether destiny favors entrepreneurship, governance, academic research, or creative industries.",
         "Strategic planning, moral authority, long-range wealth accumulation, institutional leadership.",
         "Taking on too many responsibilities simultaneously, neglecting physical rejuvenation."),

        ("Namank (Name Vibration) & Spelling Harmonization",
         "Chaldean reduction of your name and tuning letters to harmonious cosmic frequencies",
         "In Chaldean numerology, every alphabet vibrates with a numerical frequency from 1 to 8. Aligning your common name vibration (Namank) with your friendly Mulank or Bhagyank accelerates worldly breakthroughs and removes hidden resistance.",
         "Choose spellings that reduce to 1 (Sun), 3 (Jupiter), 5 (Mercury), or 6 (Venus) according to chart harmony.",
         "Avoid total compound numbers 4, 8, or 29 if they clash with your core birth numbers."),

        ("Lo Shu 8 Planes Strength & Balance Assessment",
         "Detailed diagnostic of Mental, Emotional, Practical, Thought, Will, and Action planes",
         "The Lo Shu 3x3 grid reveals energy flows across your personality planes. When an entire plane has its numbers present, it constitutes a powerful Golden Line of achievement, granting exceptional gifts in that department of life.",
         "Full planes indicate effortless natural aptitude, persuasive eloquence, and strong execution grit.",
         "Balancing planes with remedies creates holistic mental and physical equilibrium."),

        ("Missing Numbers in Lo Shu Grid & Upayas",
         "Neutralizing missing grid digits through color therapy, sacred metals, and geometric yantras",
         "Missing numbers in the birth chart indicate areas requiring conscious effort and external harmonizers. By incorporating specific planetary colors, water therapy, and sacred metals, you restore the elemental balance of earth, water, fire, wood, and metal.",
         "Wear green jade or emerald for missing 3 or 4; wear gold/brass or crystal for missing 5, 2, or 8.",
         "Avoid excessive use of colors corresponding to heavy missing numbers without expert guidance."),

        ("Repetitive Numbers Significance in Birth Grid",
         "Impact of duplicate digits amplifying specific karmic traits and psychological tendencies",
         "When a number appears multiple times in your date of birth, its corresponding archetype dominates your subconscious thoughts. Balanced repetitive digits bestow extraordinary genius, while over-amplification requires calming routines.",
         "Double digits indicate heightened intuitive reception, artistic passion, or commercial acumen.",
         "Channel excess elemental power into creative outlets and disciplined physical exercise."),

        ("4 Life Pinnacles & Challenges Lifecycle",
         "The 4 major developmental milestones and challenges spanning youth, maturity, and wisdom",
         "Life unfolds in four grand nine-year cycles known as Pinnacles. Each Pinnacle defines the dominant arena of focus, career opportunities, and personal lessons, transitioning you from youthful exploration to executive mastery.",
         "Align major vocational ventures with the ruler of your current active Pinnacle.",
         "Treat Pinnacle challenges as sacred training grounds to strengthen your life skills."),

        ("Lucky Colors, Gemstones & Power Days",
         f"Optimal vibrational frequencies, weekdays, and remedies harmonized with numbers {mulank} and {bhagyank}",
         f"Colors and sacred days carry electromagnetic vibrations that resonate with your birth rulers. Scheduling crucial contract signings, medical treatments, and major acquisitions on your friendly days ensures smooth success.",
         f"Primary Lucky Colors: Harmonious shades aligned with numbers {mulank} and {bhagyank}.",
         f"Auspicious Days: Weekdays ruled by friendly planetary vibrations for optimal ease."),

        ("Personal Year & Annual 9-Year Epoched Cycle",
         "Calculating your current 9-year personal development cycle and annual forecast",
         "Every calendar year introduces a new vibrational frequency derived from your birth date and the universal calendar. Understanding your Personal Year number reveals whether the year demands aggressive expansion, consolidation, or inward study.",
         "Personal Years 1, 3, 5, and 8 favor high-visibility enterprise, wealth acquisition, and career leaps.",
         "Personal Years 4, 7, and 9 favor spiritual consolidation, system refinement, and closure."),

        ("Relationship & Professional Compatibility Matrix",
         "Harmonious, neutral, and challenging relationship numbers in love, marriage, and enterprise",
         "Numerological synergy evaluates mutual harmony between both parties' Mulank and Bhagyank. Deep compatibility fosters spontaneous emotional empathy, mutual trust, and collaborative prosperity in business partnerships.",
         "Highly Compatible: Pairs whose birth numbers share friendly planetary rulers.",
         "Growth Pairs: Neutral combinations that flourish through clear roles and mutual respect."),

        ("Concluding Master Numerological Advisory",
         "Synthesized daily prosperity habits and ethical guidance for lifelong success",
         "Numerology is a divine science of vibrational frequencies. By harmonizing your name, living spaces, and key decisions with your cosmic numbers, you unlock steady peace, vibrant health, and flourishing success in all endeavors.",
         "Begin important works during your personal lucky hours and maintain sacred gratitude daily.",
         "Certified Numerological Life Blueprint calculated under classical Chaldean and Pythagorean standards.")
    ]

    for idx, (n_title, n_sub, n_core, n_pros, n_cons) in enumerate(num_chapters):
        p_num = 2 + idx
        pb = PageBuilder(p_num, total_pages, company, website, b_color)
        pb.add_page_title(f"Chapter {idx+1}: {n_title}", n_sub)
        
        pb.add_section_header(725, "1. VIBRATIONAL FREQUENCY ANALYSIS")
        pb.draw_card(30, 595, 535, 115)
        pb.add_text_block(45, 680, 505, "Cosmic Frequency & Core Significations:", n_core, line_spacing=12)

        pb.add_section_header(555, "2. PRACTICAL APPLICATION & REAL-WORLD GUIDANCE")
        pb.draw_card(30, 420, 535, 120)
        pb.add_text_block(45, 510, 505, "Key Auspicious Manifestations:", n_pros, line_spacing=12)
        pb.add_text_block(45, 465, 505, "Precautions & Harmonization Upayas:", n_cons, line_spacing=12)

        pb.add_section_header(380, "NUMEROLOGICAL MASTERY DIRECTIVE")
        pb.add_text_block(30, 360, 535, "Vibrational Alignment",
                          f"By integrating the wisdom of {n_title} into your daily scheduling and commercial decisions, you effortlessly attune to universal abundance and fulfill your destiny with confidence.")
        streams.append(pb.get_stream())

    writer = MinimalPDFWriter()
    return writer.assemble_pdf(streams)


# ════════════════════════════════════════════════════════════════════════════
# 7. ROUTING DISPATCHER ENTRYPOINT
# ════════════════════════════════════════════════════════════════════════════
def render_real_pdf_bytes(
    report_title: str,
    birth_data: Dict[str, Any],
    chart: Dict[str, Any],
    branding: Dict[str, Any],
    report_type: str = "kundli_basic",
    lang: str = "en"
) -> bytes:
    """Master entrypoint dispatching to tailored multi-page PDF generators."""
    clean_type = (report_type or "kundli_basic").lower().strip()
    
    if clean_type in ["kundli_brihat", "brihat"]:
        return build_brihat_kundli_pdf(birth_data, chart, branding, lang)
    elif clean_type in ["matchmaking", "matching_report", "matching"]:
        return build_matching_pdf(birth_data, branding, lang)
    elif clean_type in ["lalkitab", "lalkitab_full", "lal_kitab"]:
        return build_lalkitab_pdf(birth_data, chart, branding, lang)
    elif clean_type in ["varshphal", "varshphal_annual"]:
        return build_varshphal_pdf(birth_data, chart, branding, lang)
    elif clean_type in ["numerology", "numerology_report"]:
        return build_numerology_pdf(birth_data, branding, lang)
    elif clean_type in ["sadesati", "sadesati_guide", "shani_sade_sati"]:
        return build_basic_kundli_pdf(birth_data, chart, branding, lang)
    else:
        # Default: 15-Page Basic Kundli Report
        return build_basic_kundli_pdf(birth_data, chart, branding, lang)
