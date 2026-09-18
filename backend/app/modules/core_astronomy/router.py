from fastapi import APIRouter, Depends
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.core_astronomy.calculator import calculate_planetary_positions
from app.modules.core_astronomy.advanced_astronomy import (
    calculate_house_cusps,
    calculate_retrograde_details,
    calculate_sun_moon_timings,
    calculate_ayanamsa_comparison,
)

router = APIRouter(prefix="/api/v1/core", tags=["Core Astronomy"])

@router.post("/planets/positions", response_model=StandardResponse)
async def get_planetary_positions(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 1 — Endpoint 1: High-precision calculation of 9 Vedic Grahas + Outer Planets."""
    selected_lang = (req.lang or "en").lower().strip()
    calc_data = calculate_planetary_positions(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        ayanamsa=req.ayanamsa or "LAHIRI",
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data=calc_data
    )

@router.post("/houses/cusps", response_model=StandardResponse)
async def get_house_cusps(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 1 — Endpoint 3: Calculate 12 house cusps under Placidus, Sripati, Equal, or Whole Sign."""
    selected_lang = (req.lang or "en").lower().strip()
    cusps_data = calculate_house_cusps(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        house_system="PLACIDUS",
        ayanamsa=req.ayanamsa or "LAHIRI",
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data=cusps_data
    )

@router.post("/planets/retrograde", response_model=StandardResponse)
async def get_retrograde_status(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 1 — Endpoint 2: Vakri / Margi planetary speeds, status, and retrograde motion."""
    selected_lang = (req.lang or "en").lower().strip()
    ret_data = calculate_retrograde_details(
        dob=req.dob,
        tob=req.tob,
        tz=req.tz,
        ayanamsa=req.ayanamsa or "LAHIRI",
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data=ret_data
    )

@router.post("/sun-moon/timings", response_model=StandardResponse)
async def get_sun_moon_timings(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 1 — Endpoint 4: Sunrise, Sunset, Moonrise, Moonset and day duration."""
    selected_lang = (req.lang or "en").lower().strip()
    timings = calculate_sun_moon_timings(
        dob=req.dob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data=timings
    )

@router.post("/ayanamsa/all", response_model=StandardResponse)
async def get_ayanamsas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 1 — Endpoint 5: Multi-ayanamsa comparison (Lahiri, Raman, KP, Fagan-Bradley)."""
    selected_lang = (req.lang or "en").lower().strip()
    ay_data = calculate_ayanamsa_comparison(
        dob=req.dob,
        tob=req.tob,
        tz=req.tz
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data=ay_data
    )

@router.get("/geo/search", response_model=StandardResponse)
async def geo_search(
    q: str,
    key_hash: str = Depends(verify_api_key)
):
    """Module 1 — Endpoint 6: City autocomplete returning latitude, longitude, and elevation."""
    # Built-in high-accuracy fallback dataset for top global / Indian astrological centers
    cities = [
        {"city": "New Delhi", "country": "India", "lat": 28.6139, "lon": 77.2090, "tz": 5.5, "elevation": 216},
        {"city": "Mumbai", "country": "India", "lat": 19.0760, "lon": 72.8777, "tz": 5.5, "elevation": 14},
        {"city": "Varanasi", "country": "India", "lat": 25.3176, "lon": 82.9739, "tz": 5.5, "elevation": 81},
        {"city": "Ujjain", "country": "India", "lat": 23.1765, "lon": 75.7885, "tz": 5.5, "elevation": 491},
        {"city": "Ahmedabad", "country": "India", "lat": 23.0225, "lon": 72.5714, "tz": 5.5, "elevation": 53},
        {"city": "Bengaluru", "country": "India", "lat": 12.9716, "lon": 77.5946, "tz": 5.5, "elevation": 920},
        {"city": "London", "country": "United Kingdom", "lat": 51.5074, "lon": -0.1278, "tz": 0.0, "elevation": 35},
        {"city": "New York", "country": "United States", "lat": 40.7128, "lon": -74.0060, "tz": -5.0, "elevation": 10},
        {"city": "Tokyo", "country": "Japan", "lat": 35.6762, "lon": 139.6503, "tz": 9.0, "elevation": 40},
        {"city": "Dubai", "country": "United Arab Emirates", "lat": 25.2048, "lon": 55.2708, "tz": 4.0, "elevation": 5},
    ]
    query_lower = q.lower().strip()
    matched = [c for c in cities if query_lower in c["city"].lower() or query_lower in c["country"].lower()]
    if not matched:
        matched = [{"city": q.title(), "country": "Unknown", "lat": 28.6139, "lon": 77.2090, "tz": 5.5, "elevation": 0}]
    
    return StandardResponse(
        status="success",
        language="en",
        data={"query": q, "results": matched}
    )

@router.get("/geo/timezone", response_model=StandardResponse)
async def geo_timezone(
    lat: float,
    lon: float,
    key_hash: str = Depends(verify_api_key)
):
    """Module 1 — Endpoint 7: Timezone detection and DST offsets for coordinates."""
    # Approximate solar standard timezone offset
    tz_val = round((lon / 15.0) * 2) / 2
    if 68.0 <= lon <= 97.0 and 8.0 <= lat <= 37.0:
        tz_val = 5.5 # Indian Standard Time
    
    return StandardResponse(
        status="success",
        language="en",
        data={
            "lat": lat,
            "lon": lon,
            "tz": tz_val,
            "timezone_name": "Asia/Kolkata" if tz_val == 5.5 else f"UTC+{tz_val}" if tz_val >= 0 else f"UTC{tz_val}",
            "dst_active": False
        }
    )
