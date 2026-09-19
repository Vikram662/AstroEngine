from fastapi import APIRouter, Depends
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.remedies.calculator import (
    calculate_gemstone_recommendations,
    get_rudraksha_recommendations,
    get_planetary_mantras_list,
    calculate_gemstone_restrictions,
    get_yantras_recommendations,
    get_donations_recommendations,
    get_fasting_recommendations
)

router = APIRouter(prefix="/api/v1/remedies", tags=["Astrological Remedies"])

@router.post("/gemstones", response_model=StandardResponse)
async def get_gemstones(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 9 — Endpoint 71:
    Gemstone recommendations: Life Stone (Lagna), Lucky Stone (9th), Benefic Stone (5th)
    with Maraka warnings.
    """
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_gemstone_recommendations(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/rudraksha", response_model=StandardResponse)
async def get_rudraksha(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 9 — Endpoint 73:
    1 to 14 Mukhi Rudraksha prescription based on birth horoscope.
    """
    selected_lang = (req.lang or "en").lower().strip()
    # Calculate Lagna lord using invariant ID
    gems = calculate_gemstone_recommendations(req.dob, req.tob, req.lat, req.lon, req.tz, selected_lang)
    asc_lord_id = gems["life_stone"].get("planet_id", "SUN")
    recs = get_rudraksha_recommendations(asc_lord_id.upper())
    return StandardResponse(status="success", language=selected_lang, data={"rudraksha_recommendations": recs})

@router.post("/mantras", response_model=StandardResponse)
async def get_mantras(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 9 — Endpoint 75:
    Planetary Vedic & Tantrik Beej Mantras with chanting frequencies.
    """
    mantras = get_planetary_mantras_list()
    return StandardResponse(status="success", language=req.lang or "en", data={"mantras": mantras})

from fastapi import HTTPException

@router.post("/gemstones/restrictions", response_model=StandardResponse)
async def get_gemstone_restrictions(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 9 — Endpoint 72: Critical Maraka and Badhaka gemstone conflict restrictions."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_gemstone_restrictions(req.dob, req.tob, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/yantras", response_model=StandardResponse)
async def get_yantras(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 9 — Endpoint 74: Planetary and Deity Yantra prescriptions."""
    selected_lang = (req.lang or "en").lower().strip()
    from app.modules.remedies.calculator import calculate_gemstone_recommendations
    gems = calculate_gemstone_recommendations(req.dob, req.tob, req.lat, req.lon, req.tz, selected_lang)
    lagna_lord = gems["life_stone"]["planet_id"]
    data = get_yantras_recommendations(lagna_lord)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/donations", response_model=StandardResponse)
async def get_donations(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 9 — Endpoint 76: Planet-wise Daan items, grains, metals, and optimum day."""
    selected_lang = (req.lang or "en").lower().strip()
    from app.modules.remedies.calculator import calculate_gemstone_recommendations
    gems = calculate_gemstone_recommendations(req.dob, req.tob, req.lat, req.lon, req.tz, selected_lang)
    lagna_lord = gems["life_stone"]["planet_id"]
    data = get_donations_recommendations(lagna_lord)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/fasting", response_model=StandardResponse)
async def get_fasting_schedule(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 9 — Endpoint 77: Weekly and Tithi-based Vrat / Fasting schedule."""
    selected_lang = (req.lang or "en").lower().strip()
    data = get_fasting_recommendations(req.dob, req.tob, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

