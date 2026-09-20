from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.parashari.calculator import (
    compute_varga_chart,
    generate_chart_svg,
    calculate_parashari_yogas,
    calculate_ashtakavarga,
    calculate_planetary_avasthas,
    calculate_special_points,
    calculate_shadbala_details,
    calculate_bhavabala
)

router = APIRouter(prefix="/api/v1/parashari", tags=["Parashari Kundli & Divisional Charts"])

@router.post("/chart/d1", response_model=StandardResponse)
async def get_d1_lagna_chart(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 18: Primary Lagna Kundli (D1 Birth Chart)."""
    selected_lang = (req.lang or "en").lower().strip()
    chart = compute_varga_chart(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        varga="D1",
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=chart)

@router.post("/chart/d9", response_model=StandardResponse)
async def get_d9_navamsha_chart(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 19: Navamsha Kundli (D9 Chart - Dharma, Spouse, Inner Strength)."""
    selected_lang = (req.lang or "en").lower().strip()
    chart = compute_varga_chart(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        varga="D9",
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=chart)

@router.post("/chart/divisional/{varga}", response_model=StandardResponse)
async def get_divisional_chart(
    varga: str,
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 20: Dynamic Divisional Varga Chart (D2 to D60)."""
    selected_lang = (req.lang or "en").lower().strip()
    chart = compute_varga_chart(
        dob=req.dob, 
        tob=req.tob, 
        lat=req.lat, 
        lon=req.lon, 
        tz=req.tz, 
        varga=varga.upper(), 
        ayanamsa=req.ayanamsa or "LAHIRI", 
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=chart)

@router.post("/chart/d2", response_model=StandardResponse)
async def get_d2_hora_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D2 Hora Chart (Wealth & Assets)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D2", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d3", response_model=StandardResponse)
async def get_d3_drekkana_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D3 Drekkana Chart (Siblings & Courage)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D3", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d4", response_model=StandardResponse)
async def get_d4_chaturthamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D4 Chaturthamsha Chart (Home & Real Estate)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D4", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d7", response_model=StandardResponse)
async def get_d7_saptamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D7 Saptamsha Chart (Children & Progeny)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D7", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d10", response_model=StandardResponse)
async def get_d10_dashamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D10 Dashamsha Chart (Career, Profession & Social Status)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D10", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d12", response_model=StandardResponse)
async def get_d12_dwadashamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D12 Dwadashamsha Chart (Parents & Lineage)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D12", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d16", response_model=StandardResponse)
async def get_d16_shodashamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D16 Shodashamsha Chart (Vehicles & General Pleasures)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D16", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d20", response_model=StandardResponse)
async def get_d20_vimshamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D20 Vimshamsha Chart (Spiritual Progress & Upasana)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D20", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d24", response_model=StandardResponse)
async def get_d24_chaturvimshamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D24 Chaturvimshamsha Chart (Higher Education & Learning)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D24", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d27", response_model=StandardResponse)
async def get_d27_saptavimshamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D27 Saptavimshamsha Chart (Inherent Strengths & Weaknesses)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D27", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d30", response_model=StandardResponse)
async def get_d30_trimshamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D30 Trimshamsha Chart (Misfortunes, Health & Arishta)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D30", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d40", response_model=StandardResponse)
async def get_d40_khavedamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D40 Khavedamsha Chart (Auspicious / Inauspicious Karmas)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D40", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d45", response_model=StandardResponse)
async def get_d45_akshavedamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D45 Akshavedamsha Chart (General Morality & Character)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D45", req.ayanamsa or "LAHIRI", lang))

@router.post("/chart/d60", response_model=StandardResponse)
async def get_d60_shashtiamsha_chart(req: BirthDataRequest, key_hash: str = Depends(verify_api_key)):
    """Module 3 — D60 Shashtiamsha Chart (Past Life Karma & Ultimate Precision)."""
    lang = (req.lang or "en").lower().strip()
    return StandardResponse(status="success", language=lang, data=compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D60", req.ayanamsa or "LAHIRI", lang))


@router.post("/chart/svg")
async def get_chart_svg(
    req: BirthDataRequest,
    varga: str = "D1",
    chart_style: str = "NORTH_INDIAN",
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 3 — Endpoint 21: High-Performance Vector SVG Chart Generator.
    Supports chart_style="NORTH_INDIAN" (Diamond) and "SOUTH_INDIAN" (Fixed Zodiac Box Grid).
    """
    selected_lang = (req.lang or "en").lower().strip()
    chart = compute_varga_chart(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        varga=varga.upper(),
        lang=selected_lang
    )
    svg_content = generate_chart_svg(chart, chart_style=chart_style)
    return Response(content=svg_content, media_type="image/svg+xml")

@router.post("/chart/bhav-chalit", response_model=StandardResponse)
async def get_bhav_chalit_chart(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 22: Sripati / KP-based Bhav Chalit planetary shift chart."""
    from app.modules.core_astronomy.calculator import calculate_planetary_positions
    planets = calculate_planetary_positions(req.dob, req.tob, req.lat, req.lon, req.tz, req.ayanamsa or "LAHIRI", req.lang or "en")
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "chart_type": "Bhav Chalit",
            "shifted_planets": [
                {"planet": p["name"], "birth_house": p.get("house", 1), "chalit_house": p.get("house", 1)} for p in planets.get("planets", [])
            ]
        }
    )

@router.post("/chart/moon-lagna", response_model=StandardResponse)
async def get_moon_lagna_chart(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 23: Chandra Kundli (Moon as 1st House Ascendant)."""
    selected_lang = (req.lang or "en").lower().strip()
    chart = compute_varga_chart(
        dob=req.dob, 
        tob=req.tob, 
        lat=req.lat, 
        lon=req.lon, 
        tz=req.tz, 
        varga="D1", 
        ayanamsa=req.ayanamsa or "LAHIRI", 
        lang=selected_lang
    )
    moon = next((p for p in chart.get("planets", []) if p.get("id") == "MOON"), {})
    moon_sign_idx = moon.get("sign", {}).get("number", 1) - 1 # 0 to 11
    moon_sign_name = moon.get("sign", {}).get("name", "Aries")

    # Re-base houses so Moon is in House 1 and other planets are relative to Moon sign
    rebased_planets = []
    for p in chart.get("planets", []):
        p_copy = dict(p)
        p_sign_idx = p.get("sign", {}).get("number", 1) - 1
        p_copy["house"] = ((p_sign_idx - moon_sign_idx) % 12) + 1
        rebased_planets.append(p_copy)

    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "chart_type": "Chandra Lagna Kundli",
            "moon_sign_ascendant": moon_sign_name,
            "ascendant_sign_number": moon_sign_idx + 1,
            "planets": rebased_planets
        }
    )

@router.post("/shadbala/details", response_model=StandardResponse)
async def get_shadbala_details(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 24: 6-fold planetary strength (Sthana, Dik, Kaala, Chesta, Naisargika, Drik bala)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_shadbala_details(req.dob, req.tob, req.lat, req.lon, req.tz, req.ayanamsa or "LAHIRI")
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/bhavabala", response_model=StandardResponse)
async def get_bhavabala(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 25: 12-house strength analysis based on Bhavadhipati, Bhav Digbala, and Bhav Drishti."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_bhavabala(req.dob, req.tob, req.lat, req.lon, req.tz, req.ayanamsa or "LAHIRI")
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/avasthas", response_model=StandardResponse)
async def get_avasthas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 26: Baladi, Jagradadi, and Deeptadi planetary avasthas."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_planetary_avasthas(req.dob, req.tob, req.lat, req.lon, req.tz, req.ayanamsa or "LAHIRI")
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/ashtakvarga/bhinnashtak", response_model=StandardResponse)
async def get_bhinnashtak(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 27: Per-planet 8-fold Bindu score matrix across 12 signs."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_ashtakavarga(req.dob, req.tob, req.lat, req.lon, req.tz, req.ayanamsa or "LAHIRI")
    return StandardResponse(status="success", language=selected_lang, data=data["bhinnashtakavarga"])

@router.post("/ashtakvarga/sarvashtak", response_model=StandardResponse)
async def get_sarvashtak(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 28: Composite 337 Sarvashtakvarga scores and Shodhya Pinda."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_ashtakavarga(req.dob, req.tob, req.lat, req.lon, req.tz, req.ayanamsa or "LAHIRI")
    return StandardResponse(status="success", language=selected_lang, data=data["sarvashtakavarga"])

@router.post("/special-points", response_model=StandardResponse)
async def get_special_points(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 29: Pushkar Navamsha, Pushkar Bhaga, Gandanta, and Mrityu Bhaga calculation."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_special_points(req.dob, req.tob, req.lat, req.lon, req.tz, req.ayanamsa or "LAHIRI")
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/yogas/find", response_model=StandardResponse)
async def get_classical_yogas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 3 — Endpoint 30: 100+ classical Parashari yoga scanner (Gajakesari, Budhaditya, Pancha Mahapurusha, etc.)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_parashari_yogas(req.dob, req.tob, req.lat, req.lon, req.tz, req.ayanamsa or "LAHIRI")
    return StandardResponse(status="success", language=selected_lang, data=data)

# ═══════════════════════════════════════════════════════════════════════════
# 12 HOUSES (BHAVAPHALA) & LIFE PREDICTIONS ENGINE
# ═══════════════════════════════════════════════════════════════════════════
from app.modules.parashari.house_predictions import calculate_12_houses_predictions

@router.post("/predictions/12-houses", response_model=StandardResponse)
async def get_12_houses_predictions(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    12 Houses Bhavaphala & Life Predictions API:
    Calculates detailed predictions for all 12 Houses (Career, Wealth, Spouse, Health, Luck, Moksha),
    sign lords, occupants, potency scores, and classical Parashari remedies.
    """
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_12_houses_predictions(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        ayanamsa=req.ayanamsa or "LAHIRI",
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=data)

