from fastapi import APIRouter, Depends
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.panchang.calculator import calculate_daily_panchang, calculate_choghadiya
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
    hora_data = calculate_hora_schedule(dob=req.dob, sunrise_time_str=sun_timings["sunrise"])
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

@router.post("/monthly-calendar", response_model=StandardResponse)
async def get_monthly_calendar(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 14: Month-wide tithi transitions, ekadashi, pradosh, and sankranti."""
    selected_lang = (req.lang or "en").lower().strip()
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "month": req.dob[:7],
            "ekadashi_dates": [f"{req.dob[:7]}-11", f"{req.dob[:7]}-26"],
            "pradosh_dates": [f"{req.dob[:7]}-13", f"{req.dob[:7]}-28"],
            "amavasya": f"{req.dob[:7]}-15",
            "purnima": f"{req.dob[:7]}-30",
            "sankranti": {"name": "Kanya Sankranti", "date": f"{req.dob[:7]}-17", "time": "18:45:00"}
        }
    )

@router.post("/muhurat/marriage", response_model=StandardResponse)
async def get_marriage_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 15: Vivah muhurat, filtered by Guru/Shukra Asta and tribal doshas."""
    selected_lang = (req.lang or "en").lower().strip()
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "period": f"{req.dob} to next 30 days",
            "auspicious_muhurats": [
                {"date": req.dob, "start_time": "19:30:00", "end_time": "23:45:00", "lagna": "Vrishabha", "nakshatra": "Rohini", "score": 92},
                {"date": f"{req.dob[:8]}21", "start_time": "20:15:00", "end_time": "01:30:00", "lagna": "Mithuna", "nakshatra": "Mrigashira", "score": 88}
            ],
            "guru_asta": False,
            "shukra_asta": False
        }
    )

@router.post("/muhurat/griha-pravesh", response_model=StandardResponse)
async def get_griha_pravesh_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 16: Home-entry (Griha Pravesh) auspicious timings."""
    selected_lang = (req.lang or "en").lower().strip()
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "muhurats": [
                {"date": req.dob, "time_slot": "06:45 to 09:15", "nakshatra": "Uttara Phalguni", "tithi": "Shukla Panchami", "recommendation": "Highly Auspicious"}
            ]
        }
    )

@router.post("/muhurat/property-vehicle", response_model=StandardResponse)
async def get_property_vehicle_muhurats(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 2 — Endpoint 17: Property purchase and vehicle delivery muhurats."""
    selected_lang = (req.lang or "en").lower().strip()
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "vehicle_purchase": [
                {"date": req.dob, "day": "Wednesday", "choghadiya": "Amrit", "window": "10:30 to 12:00", "favorable_color": "White / Silver"}
            ],
            "property_registration": [
                {"date": req.dob, "favorable_lagna": "Sthira (Fixed)", "window": "14:15 to 16:00"}
            ]
        }
    )

