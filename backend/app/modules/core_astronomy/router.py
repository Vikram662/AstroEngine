from typing import Optional
from datetime import datetime
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
        house_system=req.house_system or "PLACIDUS",
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
        # Major Indian Metros & State Capitals
        {"city": "New Delhi", "country": "India", "lat": 28.6139, "lon": 77.2090, "tz": 5.5, "elevation": 216},
        {"city": "Delhi", "country": "India", "lat": 28.6139, "lon": 77.2090, "tz": 5.5, "elevation": 216},
        {"city": "Noida", "country": "India", "lat": 28.5355, "lon": 77.3910, "tz": 5.5, "elevation": 200},
        {"city": "Gurgaon", "country": "India", "lat": 28.4595, "lon": 77.0266, "tz": 5.5, "elevation": 217},
        {"city": "Gurugram", "country": "India", "lat": 28.4595, "lon": 77.0266, "tz": 5.5, "elevation": 217},
        {"city": "Faridabad", "country": "India", "lat": 28.4089, "lon": 77.3178, "tz": 5.5, "elevation": 204},
        {"city": "Ghaziabad", "country": "India", "lat": 28.6692, "lon": 77.4538, "tz": 5.5, "elevation": 214},
        {"city": "Mumbai", "country": "India", "lat": 19.0760, "lon": 72.8777, "tz": 5.5, "elevation": 14},
        {"city": "Pune", "country": "India", "lat": 18.5204, "lon": 73.8567, "tz": 5.5, "elevation": 560},
        {"city": "Nagpur", "country": "India", "lat": 21.1458, "lon": 79.0882, "tz": 5.5, "elevation": 310},
        {"city": "Nashik", "country": "India", "lat": 19.9975, "lon": 73.7898, "tz": 5.5, "elevation": 600},
        {"city": "Aurangabad", "country": "India", "lat": 19.8762, "lon": 75.3433, "tz": 5.5, "elevation": 568},
        {"city": "Bengaluru", "country": "India", "lat": 12.9716, "lon": 77.5946, "tz": 5.5, "elevation": 920},
        {"city": "Bangalore", "country": "India", "lat": 12.9716, "lon": 77.5946, "tz": 5.5, "elevation": 920},
        {"city": "Mysuru", "country": "India", "lat": 12.2958, "lon": 76.6394, "tz": 5.5, "elevation": 763},
        {"city": "Mangalore", "country": "India", "lat": 12.9141, "lon": 74.8560, "tz": 5.5, "elevation": 22},
        {"city": "Hubli", "country": "India", "lat": 15.3647, "lon": 75.1240, "tz": 5.5, "elevation": 671},
        {"city": "Hyderabad", "country": "India", "lat": 17.3850, "lon": 78.4867, "tz": 5.5, "elevation": 542},
        {"city": "Warangal", "country": "India", "lat": 17.9689, "lon": 79.5941, "tz": 5.5, "elevation": 302},
        {"city": "Chennai", "country": "India", "lat": 13.0827, "lon": 80.2707, "tz": 5.5, "elevation": 6},
        {"city": "Madurai", "country": "India", "lat": 9.9252, "lon": 78.1198, "tz": 5.5, "elevation": 101},
        {"city": "Coimbatore", "country": "India", "lat": 11.0168, "lon": 76.9558, "tz": 5.5, "elevation": 411},
        {"city": "Tiruchirappalli", "country": "India", "lat": 10.7905, "lon": 78.7047, "tz": 5.5, "elevation": 88},
        {"city": "Salem", "country": "India", "lat": 11.6643, "lon": 78.1460, "tz": 5.5, "elevation": 278},
        {"city": "Kolkata", "country": "India", "lat": 22.5726, "lon": 88.3639, "tz": 5.5, "elevation": 9},
        {"city": "Howrah", "country": "India", "lat": 22.5958, "lon": 88.2636, "tz": 5.5, "elevation": 12},
        {"city": "Siliguri", "country": "India", "lat": 26.7271, "lon": 88.3953, "tz": 5.5, "elevation": 122},
        {"city": "Ahmedabad", "country": "India", "lat": 23.0225, "lon": 72.5714, "tz": 5.5, "elevation": 53},
        {"city": "Surat", "country": "India", "lat": 21.1702, "lon": 72.8311, "tz": 5.5, "elevation": 13},
        {"city": "Vadodara", "country": "India", "lat": 22.3072, "lon": 73.1812, "tz": 5.5, "elevation": 39},
        {"city": "Rajkot", "country": "India", "lat": 22.3039, "lon": 70.8022, "tz": 5.5, "elevation": 134},
        {"city": "Gandhinagar", "country": "India", "lat": 23.2156, "lon": 72.6369, "tz": 5.5, "elevation": 81},
        {"city": "Jaipur", "country": "India", "lat": 26.9124, "lon": 75.7873, "tz": 5.5, "elevation": 431},
        {"city": "Jodhpur", "country": "India", "lat": 26.2389, "lon": 73.0243, "tz": 5.5, "elevation": 231},
        {"city": "Udaipur", "country": "India", "lat": 24.5854, "lon": 73.7125, "tz": 5.5, "elevation": 598},
        {"city": "Kota", "country": "India", "lat": 25.2138, "lon": 75.8648, "tz": 5.5, "elevation": 271},
        {"city": "Bikaner", "country": "India", "lat": 28.0229, "lon": 73.3119, "tz": 5.5, "elevation": 242},
        {"city": "Ajmer", "country": "India", "lat": 26.4499, "lon": 74.6399, "tz": 5.5, "elevation": 480},
        {"city": "Pushkar", "country": "India", "lat": 26.4897, "lon": 74.5511, "tz": 5.5, "elevation": 530},
        {"city": "Lucknow", "country": "India", "lat": 26.8467, "lon": 80.9462, "tz": 5.5, "elevation": 123},
        {"city": "Kanpur", "country": "India", "lat": 26.4499, "lon": 80.3319, "tz": 5.5, "elevation": 126},
        {"city": "Varanasi", "country": "India", "lat": 25.3176, "lon": 82.9739, "tz": 5.5, "elevation": 81},
        {"city": "Banaras", "country": "India", "lat": 25.3176, "lon": 82.9739, "tz": 5.5, "elevation": 81},
        {"city": "Prayagraj", "country": "India", "lat": 25.4358, "lon": 81.8463, "tz": 5.5, "elevation": 98},
        {"city": "Allahabad", "country": "India", "lat": 25.4358, "lon": 81.8463, "tz": 5.5, "elevation": 98},
        {"city": "Ayodhya", "country": "India", "lat": 26.7922, "lon": 82.1998, "tz": 5.5, "elevation": 93},
        {"city": "Agra", "country": "India", "lat": 27.1767, "lon": 78.0081, "tz": 5.5, "elevation": 171},
        {"city": "Mathura", "country": "India", "lat": 27.4924, "lon": 77.6737, "tz": 5.5, "elevation": 174},
        {"city": "Vrindavan", "country": "India", "lat": 27.5806, "lon": 77.7006, "tz": 5.5, "elevation": 170},
        {"city": "Meerut", "country": "India", "lat": 28.9845, "lon": 77.7064, "tz": 5.5, "elevation": 219},
        {"city": "Bareilly", "country": "India", "lat": 28.3670, "lon": 79.4304, "tz": 5.5, "elevation": 166},
        {"city": "Aligarh", "country": "India", "lat": 27.8974, "lon": 78.0880, "tz": 5.5, "elevation": 178},
        {"city": "Gorakhpur", "country": "India", "lat": 26.7606, "lon": 83.3732, "tz": 5.5, "elevation": 84},
        {"city": "Patna", "country": "India", "lat": 25.5941, "lon": 85.1376, "tz": 5.5, "elevation": 53},
        {"city": "Gaya", "country": "India", "lat": 24.7914, "lon": 85.0002, "tz": 5.5, "elevation": 111},
        {"city": "Bodh Gaya", "country": "India", "lat": 24.6961, "lon": 84.9869, "tz": 5.5, "elevation": 113},
        {"city": "Muzaffarpur", "country": "India", "lat": 26.1209, "lon": 85.3647, "tz": 5.5, "elevation": 60},
        {"city": "Bhagalpur", "country": "India", "lat": 25.2425, "lon": 86.9842, "tz": 5.5, "elevation": 52},
        {"city": "Ranchi", "country": "India", "lat": 23.3441, "lon": 85.3096, "tz": 5.5, "elevation": 651},
        {"city": "Jamshedpur", "country": "India", "lat": 22.8046, "lon": 86.2029, "tz": 5.5, "elevation": 135},
        {"city": "Dhanbad", "country": "India", "lat": 23.7957, "lon": 86.4304, "tz": 5.5, "elevation": 227},
        {"city": "Bhopal", "country": "India", "lat": 23.2599, "lon": 77.4126, "tz": 5.5, "elevation": 527},
        {"city": "Indore", "country": "India", "lat": 22.7196, "lon": 75.8577, "tz": 5.5, "elevation": 553},
        {"city": "Gwalior", "country": "India", "lat": 26.2183, "lon": 78.1828, "tz": 5.5, "elevation": 197},
        {"city": "Jabalpur", "country": "India", "lat": 23.1815, "lon": 79.9864, "tz": 5.5, "elevation": 411},
        {"city": "Ujjain", "country": "India", "lat": 23.1765, "lon": 75.7885, "tz": 5.5, "elevation": 491},
        {"city": "Raipur", "country": "India", "lat": 21.2514, "lon": 81.6296, "tz": 5.5, "elevation": 298},
        {"city": "Bhubaneswar", "country": "India", "lat": 20.2961, "lon": 85.8245, "tz": 5.5, "elevation": 45},
        {"city": "Cuttack", "country": "India", "lat": 20.4625, "lon": 85.8828, "tz": 5.5, "elevation": 36},
        {"city": "Puri", "country": "India", "lat": 19.8135, "lon": 85.8312, "tz": 5.5, "elevation": 0},
        {"city": "Chandigarh", "country": "India", "lat": 30.7333, "lon": 76.7794, "tz": 5.5, "elevation": 321},
        {"city": "Mohali", "country": "India", "lat": 30.7046, "lon": 76.7179, "tz": 5.5, "elevation": 316},
        {"city": "Panchkula", "country": "India", "lat": 30.6942, "lon": 76.8606, "tz": 5.5, "elevation": 365},
        {"city": "Ludhiana", "country": "India", "lat": 30.9010, "lon": 75.8573, "tz": 5.5, "elevation": 244},
        {"city": "Amritsar", "country": "India", "lat": 31.6340, "lon": 74.8723, "tz": 5.5, "elevation": 234},
        {"city": "Jalandhar", "country": "India", "lat": 31.3260, "lon": 75.5762, "tz": 5.5, "elevation": 228},
        {"city": "Patiala", "country": "India", "lat": 30.3398, "lon": 76.3869, "tz": 5.5, "elevation": 250},
        {"city": "Dehradun", "country": "India", "lat": 30.3165, "lon": 78.0322, "tz": 5.5, "elevation": 640},
        {"city": "Haridwar", "country": "India", "lat": 29.9457, "lon": 78.1642, "tz": 5.5, "elevation": 314},
        {"city": "Rishikesh", "country": "India", "lat": 30.0869, "lon": 78.2676, "tz": 5.5, "elevation": 372},
        {"city": "Nainital", "country": "India", "lat": 29.3919, "lon": 79.4542, "tz": 5.5, "elevation": 2084},
        {"city": "Shimla", "country": "India", "lat": 31.1048, "lon": 77.1734, "tz": 5.5, "elevation": 2276},
        {"city": "Dharamshala", "country": "India", "lat": 32.2190, "lon": 76.3234, "tz": 5.5, "elevation": 1457},
        {"city": "Jammu", "country": "India", "lat": 32.7266, "lon": 74.8570, "tz": 5.5, "elevation": 327},
        {"city": "Srinagar", "country": "India", "lat": 34.0837, "lon": 74.7973, "tz": 5.5, "elevation": 1585},
        {"city": "Thiruvananthapuram", "country": "India", "lat": 8.5241, "lon": 76.9366, "tz": 5.5, "elevation": 10},
        {"city": "Trivandrum", "country": "India", "lat": 8.5241, "lon": 76.9366, "tz": 5.5, "elevation": 10},
        {"city": "Kochi", "country": "India", "lat": 9.9312, "lon": 76.2673, "tz": 5.5, "elevation": 4},
        {"city": "Cochin", "country": "India", "lat": 9.9312, "lon": 76.2673, "tz": 5.5, "elevation": 4},
        {"city": "Kozhikode", "country": "India", "lat": 11.2588, "lon": 75.7804, "tz": 5.5, "elevation": 1},
        {"city": "Calicut", "country": "India", "lat": 11.2588, "lon": 75.7804, "tz": 5.5, "elevation": 1},
        {"city": "Guwahati", "country": "India", "lat": 26.1445, "lon": 91.7362, "tz": 5.5, "elevation": 55},
        {"city": "Goa", "country": "India", "lat": 15.2993, "lon": 74.1240, "tz": 5.5, "elevation": 10},
        {"city": "Panaji", "country": "India", "lat": 15.4909, "lon": 73.8278, "tz": 5.5, "elevation": 7},
        {"city": "Visakhapatnam", "country": "India", "lat": 17.6868, "lon": 83.2185, "tz": 5.5, "elevation": 45},
        {"city": "Vijayawada", "country": "India", "lat": 16.5062, "lon": 80.6480, "tz": 5.5, "elevation": 11},
        {"city": "Tirupati", "country": "India", "lat": 13.6288, "lon": 79.4192, "tz": 5.5, "elevation": 162},
        {"city": "Kanchipuram", "country": "India", "lat": 12.8342, "lon": 79.7036, "tz": 5.5, "elevation": 83},
        {"city": "Rameswaram", "country": "India", "lat": 9.2876, "lon": 79.3129, "tz": 5.5, "elevation": 10},
        # Global Centers
        {"city": "Kathmandu", "country": "Nepal", "lat": 27.7172, "lon": 85.3240, "tz": 5.75, "elevation": 1400},
        {"city": "Pokhara", "country": "Nepal", "lat": 28.2096, "lon": 83.9856, "tz": 5.75, "elevation": 822},
        {"city": "Colombo", "country": "Sri Lanka", "lat": 6.9271, "lon": 79.8612, "tz": 5.5, "elevation": 1},
        {"city": "Dhaka", "country": "Bangladesh", "lat": 23.8103, "lon": 90.4125, "tz": 6.0, "elevation": 4},
        {"city": "London", "country": "United Kingdom", "lat": 51.5074, "lon": -0.1278, "tz": 0.0, "elevation": 35},
        {"city": "Manchester", "country": "United Kingdom", "lat": 53.4808, "lon": -2.2426, "tz": 0.0, "elevation": 38},
        {"city": "Birmingham", "country": "United Kingdom", "lat": 52.4862, "lon": -1.8904, "tz": 0.0, "elevation": 140},
        {"city": "New York", "country": "United States", "lat": 40.7128, "lon": -74.0060, "tz": -5.0, "elevation": 10},
        {"city": "Los Angeles", "country": "United States", "lat": 34.0522, "lon": -118.2437, "tz": -8.0, "elevation": 71},
        {"city": "Chicago", "country": "United States", "lat": 41.8781, "lon": -87.6298, "tz": -6.0, "elevation": 182},
        {"city": "Houston", "country": "United States", "lat": 29.7604, "lon": -95.3698, "tz": -6.0, "elevation": 15},
        {"city": "San Francisco", "country": "United States", "lat": 37.7749, "lon": -122.4194, "tz": -8.0, "elevation": 16},
        {"city": "Seattle", "country": "United States", "lat": 47.6062, "lon": -122.3321, "tz": -8.0, "elevation": 53},
        {"city": "Toronto", "country": "Canada", "lat": 43.6532, "lon": -79.3832, "tz": -5.0, "elevation": 76},
        {"city": "Vancouver", "country": "Canada", "lat": 49.2827, "lon": -123.1207, "tz": -8.0, "elevation": 0},
        {"city": "Dubai", "country": "United Arab Emirates", "lat": 25.2048, "lon": 55.2708, "tz": 4.0, "elevation": 5},
        {"city": "Abu Dhabi", "country": "United Arab Emirates", "lat": 24.4539, "lon": 54.3773, "tz": 4.0, "elevation": 5},
        {"city": "Singapore", "country": "Singapore", "lat": 1.3521, "lon": 103.8198, "tz": 8.0, "elevation": 15},
        {"city": "Kuala Lumpur", "country": "Malaysia", "lat": 3.1390, "lon": 101.6869, "tz": 8.0, "elevation": 22},
        {"city": "Bangkok", "country": "Thailand", "lat": 13.7563, "lon": 100.5018, "tz": 7.0, "elevation": 1.5},
        {"city": "Sydney", "country": "Australia", "lat": -33.8688, "lon": 151.2093, "tz": 10.0, "elevation": 3},
        {"city": "Melbourne", "country": "Australia", "lat": -37.8136, "lon": 144.9631, "tz": 10.0, "elevation": 31},
        {"city": "Tokyo", "country": "Japan", "lat": 35.6762, "lon": 139.6503, "tz": 9.0, "elevation": 40},
        {"city": "Paris", "country": "France", "lat": 48.8566, "lon": 2.3522, "tz": 1.0, "elevation": 35},
    ]
    query_lower = q.lower().strip()
    matched = [c for c in cities if query_lower in c["city"].lower() or query_lower in c["country"].lower()]

    # If user searches for any village, town, or global city not in static list, query OpenStreetMap Nominatim API (100% Free, No API Key Required)
    if len(matched) < 5 and len(query_lower) >= 3:
        try:
            import httpx
            headers = {"User-Agent": "AstroEngine/1.0 (vedic-astrology-geo-lookup)"}
            params = {
                "q": q.strip(),
                "format": "json",
                "addressdetails": 1,
                "limit": 8,
                "accept-language": "en"
            }
            with httpx.Client(timeout=3.0) as client:
                res = client.get("https://nominatim.openstreetmap.org/search", params=params, headers=headers)
                if res.status_code == 200:
                    places = res.json()
                    from timezonefinder import TimezoneFinder
                    import pytz
                    tf = TimezoneFinder()

                    for p in places:
                        lat_val = float(p.get("lat", 0))
                        lon_val = float(p.get("lon", 0))
                        addr = p.get("address", {})
                        city_name = (
                            addr.get("city") or 
                            addr.get("town") or 
                            addr.get("village") or 
                            addr.get("municipality") or 
                            addr.get("county") or 
                            p.get("name") or 
                            q.title()
                        )
                        country_name = addr.get("country", "")
                        state_name = addr.get("state", "")
                        display_country = f"{state_name}, {country_name}".strip(", ") if state_name else country_name

                        # Auto-calculate exact timezone offset using timezonefinder
                        tz_calc = 5.5
                        try:
                            tz_name_found = tf.timezone_at(lng=lon_val, lat=lat_val)
                            if tz_name_found:
                                tz_o = pytz.timezone(tz_name_found)
                                now_dt = datetime.now()
                                loc_dt = tz_o.localize(now_dt, is_dst=None)
                                tz_calc = loc_dt.utcoffset().total_seconds() / 3600.0
                        except Exception:
                            tz_calc = 5.5 if "india" in country_name.lower() else 0.0

                        # Prevent duplicate entries
                        if not any(abs(m["lat"] - lat_val) < 0.05 and abs(m["lon"] - lon_val) < 0.05 for m in matched):
                            matched.append({
                                "city": city_name,
                                "country": display_country,
                                "lat": round(lat_val, 4),
                                "lon": round(lon_val, 4),
                                "tz": round(tz_calc, 2),
                                "elevation": 0
                            })
        except Exception as e:
            # Silently fallback to matched static results on network timeout
            pass

    return StandardResponse(
        status="success",
        language="en",
        data={"query": q, "results": matched}
    )


@router.get("/geo/timezone", response_model=StandardResponse)
async def geo_timezone(
    lat: float,
    lon: float,
    date: Optional[str] = None,
    key_hash: str = Depends(verify_api_key)
):
    """Module 1 — Endpoint 7: Timezone detection and DST offsets for coordinates."""
    tz_val = 5.5
    tz_name = "Asia/Kolkata"
    dst_active = False

    try:
        from timezonefinder import TimezoneFinder
        import pytz
        tf = TimezoneFinder()
        found_name = tf.timezone_at(lng=lon, lat=lat)
        if found_name:
            tz_name = found_name
            tz_obj = pytz.timezone(tz_name)
            ref_dt = datetime.strptime(date, "%Y-%m-%d") if date else datetime.now()
            localized = tz_obj.localize(ref_dt, is_dst=None)
            total_seconds = localized.utcoffset().total_seconds()
            tz_val = total_seconds / 3600.0
            dst_active = bool(localized.dst() and localized.dst().total_seconds() != 0)
        else:
            tz_val = round((lon / 15.0) * 2) / 2
            if 68.0 <= lon <= 97.0 and 8.0 <= lat <= 37.0:
                tz_val = 5.5
                tz_name = "Asia/Kolkata"
            else:
                tz_name = f"UTC+{tz_val}" if tz_val >= 0 else f"UTC{tz_val}"
    except Exception:
        tz_val = round((lon / 15.0) * 2) / 2
        if 68.0 <= lon <= 97.0 and 8.0 <= lat <= 37.0:
            tz_val = 5.5
            tz_name = "Asia/Kolkata"
        else:
            tz_name = f"UTC+{tz_val}" if tz_val >= 0 else f"UTC{tz_val}"

    return StandardResponse(
        status="success",
        language="en",
        data={
            "lat": lat,
            "lon": lon,
            "tz": tz_val,
            "timezone_name": tz_name,
            "dst_active": dst_active
        }
    )
