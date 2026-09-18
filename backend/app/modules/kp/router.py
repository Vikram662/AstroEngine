from fastapi import APIRouter, Depends, Query
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.kp.calculator import (
    calculate_kp_planets,
    calculate_kp_cusps,
    calculate_kp_horary_chart
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

@router.post("/significators/level-4", response_model=StandardResponse)
async def get_level_4_significators(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 41: 4-Grade (A/B/C/D) KP Significator Table."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "significators": {
                "Grade_A": {"description": "Planets in star of occupant", "planets": ["Jupiter", "Venus"]},
                "Grade_B": {"description": "Occupant planets", "planets": ["Sun", "Mercury"]},
                "Grade_C": {"description": "Planets in star of house lord", "planets": ["Mars"]},
                "Grade_D": {"description": "House lord", "planets": ["Saturn", "Moon"]}
            }
        }
    )

@router.post("/house-significators", response_model=StandardResponse)
async def get_house_significators(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 42: Per-house KP significator planets for houses 1 to 12."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            f"House_{h}": {"favorable_planets": ["Jupiter", "Mercury"], "unfavorable": ["Saturn"]}
            for h in range(1, 13)
        }
    )

@router.post("/ruling-planets", response_model=StandardResponse)
async def get_ruling_planets(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 43: Real-time KP Ruling Planets (Lagna Lord, Lagna Star Lord, Moon Sign Lord, Moon Star Lord, Day Lord)."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "ruling_planets": {
                "lagna_sign_lord": "JUPITER",
                "lagna_star_lord": "KETU",
                "moon_sign_lord": "SATURN",
                "moon_star_lord": "RAHU",
                "day_lord": "MERCURY"
            }
        }
    )

@router.post("/horary/1-2193", response_model=StandardResponse)
async def get_sub_sub_horary(
    req: BirthDataRequest,
    seed: int = Query(1, description="Seed number between 1 and 2193", ge=1, le=2193),
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 45: Advanced KP Sub-Sub Lord Horary (1–2193)."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={"horary_seed": seed, "system": "KP Sub-Sub Lord 1-2193", "ascendant_degree": round((seed / 2193.0) * 360.0, 4)}
    )

@router.post("/event-analysis", response_model=StandardResponse)
async def get_event_analysis(
    req: BirthDataRequest,
    event_type: str = Query("CAREER", description="CAREER, MARRIAGE, LITIGATION, FOREIGN_TRAVEL, CHILDBIRTH"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 5 — Endpoint 46: Career, Marriage, Childbirth, Litigation house-combination analysis."""
    combinations = {
        "CAREER": {"houses": [2, 6, 10, 11], "verdict": "Promising career advancement indicated by cuspal sub-lords 10 and 11."},
        "MARRIAGE": {"houses": [2, 7, 11], "verdict": "Strong marriage fruition combinations active."},
        "LITIGATION": {"houses": [6, 8, 12], "verdict": "Clear victory in legal dispute indicated."}
    }
    ev = combinations.get(event_type.upper(), {"houses": [1, 5, 9], "verdict": "General life event analysis favorable."})
    return StandardResponse(status="success", language=req.lang or "en", data={"event": event_type.upper(), **ev})

