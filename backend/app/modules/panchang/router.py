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
    Not tied to anyone's birth -- pass the target calendar date via `date` (falls back
    to `dob` if `date` is omitted, since `dob` is required by the shared schema).
    """
    selected_lang = (req.lang or "en").lower().strip()
    target_date = req.date or req.dob
    panchang_data = calculate_daily_panchang(
        dob=target_date,
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
    Pass the target calendar date via `date` (falls back to `dob`).
    """
    selected_lang = (req.lang or "en").lower().strip()
    target_date = req.date or req.dob
    sun_timings = calculate_sun_moon_timings(
        dob=target_date,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz
    )
    choghadiya_data = calculate_choghadiya(
        dob=target_date,
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
    """Module 2 — Endpoint 9: Rahu Kaal, Yamaghanda, Gulika Kaal, Abhijit and Brahma Muhurat.
    Pass the target calendar date via `date` (falls back to `dob`)."""
    selected_lang = (req.lang or "en").lower().strip()
    target_date = req.date or req.dob
    sun_timings = calculate_sun_moon_timings(dob=target_date, lat=req.lat, lon=req.lon, tz=req.tz)
    from app.modules.panchang.calculator import calculate_advanced_muhurats
    adv_data = calculate_advanced_muhurats(
        dob=target_date,
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
    """Module 2 — Endpoint 11: 24-hr planetary Hora schedule from local sunrise.
    Pass the target calendar date via `date` (falls back to `dob`)."""
    target_date = req.date or req.dob
    sun_timings = calculate_sun_moon_timings(dob=target_date, lat=req.lat, lon=req.lon, tz=req.tz)
    from app.modules.panchang.calculator import calculate_hora_schedule
    hora_data = calculate_hora_schedule(
        dob=target_date,
        sunrise_time_str=sun_timings["sunrise"],
        sunset_time_str=sun_timings["sunset"]
    )
    return StandardResponse(status="success", language=req.lang or "en", data=hora_data)

@router.post("/bhadra", response_model=StandardResponse)
async def get_bhadra_status(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 12: Bhadra presence, Vishti Karana timing, Mukh/Puchh, Swarga/Patala/Mrityu Loka.
    Pass the target calendar date via `date` (falls back to `dob`)."""
    from app.modules.panchang.calculator import calculate_bhadra_panchak
    target_date = req.date or req.dob
    bp_data = calculate_bhadra_panchak(dob=target_date, tob=req.tob, lat=req.lat, lon=req.lon, tz=req.tz)
    return StandardResponse(status="success", language=req.lang or "en", data={"bhadra": bp_data["bhadra"]})

@router.post("/panchak", response_model=StandardResponse)
async def get_panchak_status(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 13: Panchak presence and classification (Roga, Agni, Nripa, Chora, Mrityu).
    Pass the target calendar date via `date` (falls back to `dob`)."""
    from app.modules.panchang.calculator import calculate_bhadra_panchak
    target_date = req.date or req.dob
    bp_data = calculate_bhadra_panchak(dob=target_date, tob=req.tob, lat=req.lat, lon=req.lon, tz=req.tz)
    return StandardResponse(status="success", language=req.lang or "en", data={"panchak": bp_data["panchak"]})

from fastapi import HTTPException

@router.post("/monthly-calendar", response_model=StandardResponse)
async def get_monthly_calendar(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 14: Month-wide tithi transitions, ekadashi, pradosh, and sankranti.
    Pass any date within the target month via `date` (falls back to `dob`)."""
    selected_lang = (req.lang or "en").lower().strip()
    target_date = req.date or req.dob
    dt = target_date.split("-")
    year = int(dt[0])
    month = int(dt[1])
    data = calculate_monthly_calendar(year, month, req.lat, req.lon, req.tz, selected_lang)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/muhurat/marriage", response_model=StandardResponse)
async def get_marriage_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 15: Vivah muhurat, filtered by Guru/Shukra Asta and tribal doshas.
    Scans the 15 days starting from `date` (falls back to `dob`)."""
    selected_lang = (req.lang or "en").lower().strip()
    target_date = req.date or req.dob
    data = calculate_muhurat_selection(target_date, req.lat, req.lon, req.tz, "MARRIAGE", 15)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/muhurat/griha-pravesh", response_model=StandardResponse)
async def get_griha_pravesh_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 16: Home-entry (Griha Pravesh) auspicious timings.
    Scans the 15 days starting from `date` (falls back to `dob`)."""
    selected_lang = (req.lang or "en").lower().strip()
    target_date = req.date or req.dob
    data = calculate_muhurat_selection(target_date, req.lat, req.lon, req.tz, "GRIHA_PRAVESH", 15)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/muhurat/property-vehicle", response_model=StandardResponse)
async def get_property_vehicle_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 17: Property purchase and vehicle delivery muhurats.
    Scans the 15 days starting from `date` (falls back to `dob`)."""
    selected_lang = (req.lang or "en").lower().strip()
    target_date = req.date or req.dob
    data = calculate_muhurat_selection(target_date, req.lat, req.lon, req.tz, "PROPERTY_VEHICLE", 15)
    return StandardResponse(status="success", language=selected_lang, data=data)


# ═══════════════════════════════════════════════════════════════════════════
# HOROSCOPE & RASHIFAL APIS (All 12 Rashis: Daily, Weekly, Monthly, Yearly)
# ═══════════════════════════════════════════════════════════════════════════
from app.modules.panchang.horoscope import (
    calculate_daily_horoscope,
    calculate_weekly_horoscope,
    calculate_monthly_horoscope,
    calculate_yearly_horoscope
)

@router.post("/horoscope/daily", response_model=StandardResponse)
async def get_daily_horoscope(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Daily Horoscope / Rashifal for all 12 Rashis or user's sign.
    Calculates Moon transit house, career/finance/love/health scores, lucky numbers, and colors.
    """
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_daily_horoscope(
        dob=req.dob,
        tob=req.tob or "06:00",
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/horoscope/weekly", response_model=StandardResponse)
async def get_weekly_horoscope(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Weekly Horoscope / Rashifal for all 12 Rashis."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_weekly_horoscope(
        dob=req.dob,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/horoscope/monthly", response_model=StandardResponse)
async def get_monthly_horoscope(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Monthly Horoscope / Rashifal for all 12 Rashis with best dates."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_monthly_horoscope(
        dob=req.dob,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/horoscope/yearly", response_model=StandardResponse)
async def get_yearly_horoscope(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Annual / Yearly Horoscope for all 12 Rashis based on major planetary transits."""
    selected_lang = (req.lang or "en").lower().strip()
    year = int(req.dob.split("-")[0]) if req.dob else 2026
    if year < 2020 or year > 2035:
        year = 2026
    data = calculate_yearly_horoscope(
        year=year,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=data)

# ═══════════════════════════════════════════════════════════════════════════
# NAMAKSHAR & BABY NAMING (Janma Nakshatra Pada Syllables & Deity)
# ═══════════════════════════════════════════════════════════════════════════
from app.modules.panchang.namakshar import calculate_namakshar_and_naming

@router.post("/namakshar", response_model=StandardResponse)
async def get_namakshar_analysis(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Namakshar & Baby Naming API:
    Calculates exact Janma Nakshatra Pada syllable (नामाक्षर), starting letters,
    ruling deity, Rashi, and numerological Mulank for child naming ceremonies.
    """
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_namakshar_and_naming(
        dob=req.dob,
        tob=req.tob,
        tz=req.tz,
        lat=req.lat,
        lon=req.lon,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=data)

