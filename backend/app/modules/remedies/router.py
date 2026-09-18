from fastapi import APIRouter, Depends
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.remedies.calculator import (
    calculate_gemstone_recommendations,
    get_rudraksha_recommendations,
    get_planetary_mantras_list
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
    # Calculate Lagna lord
    gems = calculate_gemstone_recommendations(req.dob, req.tob, req.lat, req.lon, req.tz, selected_lang)
    asc_lord = gems["life_stone"]["planet"]
    recs = get_rudraksha_recommendations(asc_lord.upper())
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

@router.post("/gemstones/restrictions", response_model=StandardResponse)
async def get_gemstone_restrictions(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 9 — Endpoint 72: Critical Maraka and Badhaka gemstone conflict restrictions."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "prohibited_gemstones": [
                {"stone": "Diamond (Heera)", "planet": "Venus", "reason": "Venus is 6th & 11th functional malefic lord."},
                {"stone": "Blue Sapphire (Neelam)", "planet": "Saturn", "reason": "Requires trial period due to 2nd house Maraka lordship."}
            ]
        }
    )

@router.post("/yantras", response_model=StandardResponse)
async def get_yantras(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 9 — Endpoint 74: Planetary and Deity Yantra prescriptions."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "prescribed_yantras": [
                {"name": "Surya Yantra", "metal": "Copper", "direction": "East", "purpose": "Vitality, authority and career elevation"},
                {"name": "Shree Yantra", "metal": "Silver / Gold", "direction": "North-East", "purpose": "Overall spiritual & financial prosperity"}
            ]
        }
    )

@router.post("/donations", response_model=StandardResponse)
async def get_donations(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 9 — Endpoint 76: Planet-wise Daan items, grains, metals, and optimum day."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "donation_schedule": [
                {"planet": "Saturn", "items": ["Black sesame", "Mustard oil", "Iron vessel"], "day": "Saturday sunset", "target": "Needy laborers"},
                {"planet": "Rahu", "items": ["Blankets", "Seven grains (Sapta Dhanya)"], "day": "Wednesday night", "target": "Leprosy centers / destitute"}
            ]
        }
    )

@router.post("/fasting", response_model=StandardResponse)
async def get_fasting_schedule(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 9 — Endpoint 77: Weekly and Tithi-based Vrat / Fasting schedule."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "recommended_vrats": [
                {"type": "Weekly Vrat", "day": "Thursday (Brihaspativar)", "deity": "Lord Vishnu", "purpose": "Strengthening Jupiter / wisdom"},
                {"type": "Tithi Vrat", "tithi": "Ekadashi", "rules": "Avoid grains and pulses, water/fruits only"}
            ]
        }
    )

