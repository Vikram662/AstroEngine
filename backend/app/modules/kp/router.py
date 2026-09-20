from fastapi import APIRouter, Depends, Query
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.kp.calculator import (
    calculate_kp_planets,
    calculate_kp_cusps,
    calculate_kp_horary_chart,
    calculate_kp_significators,
    calculate_kp_ruling_planets,
    calculate_kp_event_combination,
    calculate_kp_horary_2193
)

router = APIRouter(prefix="/api/v1/kp", tags=["KP System"])

@router.post("/planets", response_model=StandardResponse)
async def get_kp_planets(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 5 — Endpoint 39:
    KP Planetary Table: Sign Lord, Star Lord (Nakshatra), and Sub-Lord for all planets.
    """
    selected_lang = (req.lang or "en").lower().strip()
    planets_data = calculate_kp_planets(
        dob=req.dob,
        tob=req.tob,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data={"planets": planets_data})

@router.post("/cusps", response_model=StandardResponse)
async def get_kp_cusps(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 5 — Endpoint 40:
    KP 12 Placidus House Cusps with Sign Lord, Star Lord, and Sub-Lord mappings.
    """
    selected_lang = (req.lang or "en").lower().strip()
    cusps_data = calculate_kp_cusps(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data={"cusps": cusps_data})

from fastapi import Response

@router.post("/chart/svg")
async def get_kp_chart_svg(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 5 — KP System: Vector SVG Kundli Chart Generator.
    Renders North Indian style diamond chart with Placidus houses and KP planet placements.
    """
    selected_lang = (req.lang or "en").lower().strip()
    from app.modules.parashari.calculator import compute_kp_chart_data, generate_chart_svg
    chart = compute_kp_chart_data(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        lang=selected_lang
    )
    svg_content = generate_chart_svg(chart)
    return Response(content=svg_content, media_type="image/svg+xml")

@router.post("/horary/1-249", response_model=StandardResponse)

async def get_kp_horary(
    req: BirthDataRequest,
    seed: int = Query(1, description="Horary seed number between 1 and 249", ge=1, le=249),
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 5 — Endpoint 44:
    KP Horary (Prashna Kundli) using seed 1 to 249.
    """
    selected_lang = (req.lang or "en").lower().strip()
    horary_data = calculate_kp_horary_chart(
        horary_number=seed,
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=horary_data)

from fastapi import HTTPException

@router.post("/significators/level-4", response_model=StandardResponse)
async def get_level_4_significators(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 41: 4-Grade (A/B/C/D) KP Significator Table."""
    selected_lang = (req.lang or "en").lower().strip()
    calc_data = calculate_kp_significators(req.dob, req.tob, req.lat, req.lon, req.tz)
    # Include both per-house and per-planet 4-grade mappings so frontend renders perfectly
    combined_data = {
        **calc_data["house_significators"],
        "houses": calc_data["house_significators"],
        "planets": calc_data["planet_4_level_significators"],
        "planet_4_level_significators": calc_data["planet_4_level_significators"]
    }
    return StandardResponse(status="success", language=selected_lang, data=combined_data)

@router.post("/house-significators", response_model=StandardResponse)
async def get_house_significators(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 42: Per-house KP significator planets for houses 1 to 12."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_kp_significators(req.dob, req.tob, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data["house_significators"])

@router.post("/ruling-planets", response_model=StandardResponse)
async def get_ruling_planets(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 43: Real-time KP Ruling Planets (Lagna Lord, Lagna Star Lord, Moon Sign Lord, Moon Star Lord, Day Lord)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_kp_ruling_planets(req.dob, req.tob, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/horary/1-2193", response_model=StandardResponse)
async def get_sub_sub_horary(
    req: BirthDataRequest,
    seed: int = Query(1, description="Seed number between 1 and 2193", ge=1, le=2193),
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 45: Advanced KP Sub-Sub Lord Horary (1–2193)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_kp_horary_2193(seed, req.dob, req.tob, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/event-analysis", response_model=StandardResponse)
async def get_event_analysis(
    req: BirthDataRequest,
    event_type: str = Query("CAREER", description="CAREER, MARRIAGE, LITIGATION, FOREIGN_TRAVEL, CHILDBIRTH"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 46: Career, Marriage, Childbirth, Litigation house-combination analysis."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_kp_event_combination(req.dob, req.tob, req.lat, req.lon, req.tz, event_type)
    return StandardResponse(status="success", language=selected_lang, data=data)

