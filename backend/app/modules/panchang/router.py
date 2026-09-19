from fastapi import APIRouter, Depends
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.panchang.calculator import (
    calculate_daily_panchang,
    calculate_choghadiya,
    calculate_monthly_calendar,
    calculate_muhurat_selection
)
from app.modules.core_astronomy.advanced_astronomy import calculate_sun_moon_timings

router = APIRouter(prefix="/api/v1/panchang", tags=["Panchang & Muhurat"])

@router.post("/daily", response_model=StandardResponse)
async def get_daily_panchang(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 2 — Endpoint 8:
    Daily Panchang: Tithi, Vaar, Nakshatra, Yoga, and Karana with progress metrics.
    """
    selected_lang = (req.lang or "en").lower().strip()
    panchang_data = calculate_daily_panchang(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data=panchang_data
    )

@router.post("/choghadiya", response_model=StandardResponse)
async def get_choghadiya(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 2 — Endpoint 10:
    Calculates 8 Day Choghadiya slots based on exact local sunrise and sunset timings.
    """
    selected_lang = (req.lang or "en").lower().strip()
    sun_timings = calculate_sun_moon_timings(
        dob=req.dob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz
    )
    choghadiya_data = calculate_choghadiya(
        dob=req.dob,
        sunrise_time_str=sun_timings["sunrise"],
        sunset_time_str=sun_timings["sunset"],
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data=choghadiya_data
    )

@router.post("/advanced", response_model=StandardResponse)
async def get_advanced_muhurat(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 9: Rahu Kaal, Yamaghanda, Gulika Kaal, Abhijit and Brahma Muhurat."""
    selected_lang = (req.lang or "en").lower().strip()
    sun_timings = calculate_sun_moon_timings(dob=req.dob, lat=req.lat, lon=req.lon, tz=req.tz)
    from app.modules.panchang.calculator import calculate_advanced_muhurats
    adv_data = calculate_advanced_muhurats(
        dob=req.dob,
        sunrise_time_str=sun_timings["sunrise"],
        sunset_time_str=sun_timings["sunset"],
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=adv_data)

@router.post("/hora", response_model=StandardResponse)
async def get_hora_schedule(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 11: 24-hr planetary Hora schedule from local sunrise."""
    sun_timings = calculate_sun_moon_timings(dob=req.dob, lat=req.lat, lon=req.lon, tz=req.tz)
    from app.modules.panchang.calculator import calculate_hora_schedule
    hora_data = calculate_hora_schedule(
        dob=req.dob, 
        sunrise_time_str=sun_timings["sunrise"],
        sunset_time_str=sun_timings["sunset"]
    )
    return StandardResponse(status="success", language=req.lang or "en", data=hora_data)

@router.post("/bhadra", response_model=StandardResponse)
async def get_bhadra_status(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 12: Bhadra presence, Vishti Karana timing, Mukh/Puchh, Swarga/Patala/Mrityu Loka."""
    from app.modules.panchang.calculator import calculate_bhadra_panchak
    bp_data = calculate_bhadra_panchak(dob=req.dob, tob=req.tob, lat=req.lat, lon=req.lon, tz=req.tz)
    return StandardResponse(status="success", language=req.lang or "en", data={"bhadra": bp_data["bhadra"]})

@router.post("/panchak", response_model=StandardResponse)
async def get_panchak_status(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 13: Panchak presence and classification (Roga, Agni, Nripa, Chora, Mrityu)."""
    from app.modules.panchang.calculator import calculate_bhadra_panchak
    bp_data = calculate_bhadra_panchak(dob=req.dob, tob=req.tob, lat=req.lat, lon=req.lon, tz=req.tz)
    return StandardResponse(status="success", language=req.lang or "en", data={"panchak": bp_data["panchak"]})

from fastapi import HTTPException

@router.post("/monthly-calendar", response_model=StandardResponse)
async def get_monthly_calendar(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 14: Month-wide tithi transitions, ekadashi, pradosh, and sankranti."""
    selected_lang = (req.lang or "en").lower().strip()
    dt = req.dob.split("-")
    year = int(dt[0])
    month = int(dt[1])
    data = calculate_monthly_calendar(year, month, req.lat, req.lon, req.tz, selected_lang)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/muhurat/marriage", response_model=StandardResponse)
async def get_marriage_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 15: Vivah muhurat, filtered by Guru/Shukra Asta and tribal doshas."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_muhurat_selection(req.dob, req.lat, req.lon, req.tz, "MARRIAGE", 15)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/muhurat/griha-pravesh", response_model=StandardResponse)
async def get_griha_pravesh_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 16: Home-entry (Griha Pravesh) auspicious timings."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_muhurat_selection(req.dob, req.lat, req.lon, req.tz, "GRIHA_PRAVESH", 15)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/muhurat/property-vehicle", response_model=StandardResponse)
async def get_property_vehicle_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 17: Property purchase and vehicle delivery muhurats."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_muhurat_selection(req.dob, req.lat, req.lon, req.tz, "PROPERTY_VEHICLE", 15)
    return StandardResponse(status="success", language=selected_lang, data=data)

