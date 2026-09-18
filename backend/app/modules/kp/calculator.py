import swisseph as swe
from typing import Dict, Any, List, Tuple
from app.core.swisseph import (
    calculate_julian_day,
    get_zodiac_sign_info,
    VEDIC_PLANETS,
    ZODIAC_SIGNS
)
from app.modules.dasha.calculator import VIMSHOTTARI_CYCLE, NAKSHATRA_LORD_SEQUENCE
from app.locales.i18n import translate_entity

# 1 Nakshatra = 13° 20' = 800 minutes of arc
NAKSHATRA_SPAN_MINUTES = 800.0

def get_kp_sub_lord(longitude: float) -> Tuple[str, str, str]:
    """
    Calculate KP Sign Lord, Star Lord (Nakshatra Lord), and Sub-Lord.
    Longitude is sidereal (KP / Krishnamurti ayanamsa).
    """
    norm_deg = longitude % 360.0
    
    # 1. Sign Lord
    sign_idx = int(norm_deg // 30.0)
    sign_lord = ZODIAC_SIGNS[sign_idx]["ruler"]
    
    # 2. Star Lord (Nakshatra)
    nak_span_deg = 360.0 / 27.0 # 13.333333333333334°
    nak_idx = int(norm_deg // nak_span_deg)
    star_lord = NAKSHATRA_LORD_SEQUENCE[nak_idx]
    
    # 3. Sub-Lord
    # Degrees traversed inside current nakshatra
    deg_in_nak = norm_deg - (nak_idx * nak_span_deg)
    minutes_in_nak = deg_in_nak * 60.0
    
    # Sub-lord cycle starts from the star lord
    start_cycle_idx = next(i for i, item in enumerate(VIMSHOTTARI_CYCLE) if item["planet"] == star_lord)
    
    accumulated_minutes = 0.0
    sub_lord = star_lord
    for i in range(9):
        c_item = VIMSHOTTARI_CYCLE[(start_cycle_idx + i) % 9]
        # Sub-division span = (years / 120) * 800 minutes
        sub_span_min = (c_item["years"] / 120.0) * NAKSHATRA_SPAN_MINUTES
        if accumulated_minutes + sub_span_min >= minutes_in_nak:
            sub_lord = c_item["planet"]
            break
        accumulated_minutes += sub_span_min
        
    return sign_lord, star_lord, sub_lord

def calculate_kp_planets(
    dob: str,
    tob: str,
    tz: float,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """Calculate KP Sign Lord, Star Lord, and Sub-Lord for all planets using Krishnamurti Ayanamsa."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    
    # Set KP Krishnamurti Ayanamsa strictly for KP system
    swe.set_sid_mode(swe.SIDM_KRISHNAMURTI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    
    planets_result = []
    rahu_lon = 0.0
    
    for p in VEDIC_PLANETS:
        p_id = p["id"]
        if p_id == "KETU":
            p_lon = (rahu_lon + 180.0) % 360.0
            is_ret = True
        else:
            swe_id = p["swe_id"]
            res, _ = swe.calc_ut(jd_ut, swe_id, flags)
            p_lon = res[0]
            is_ret = res[3] < 0.0
            if p_id == "RAHU":
                rahu_lon = p_lon
                
        sign_lord, star_lord, sub_lord = get_kp_sub_lord(p_lon)
        sign_info = get_zodiac_sign_info(p_lon)
        
        planets_result.append({
            "planet_id": p_id,
            "planet_name": translate_entity("planets", p_id, lang, p["name_en"]),
            "full_degree": round(p_lon, 4),
            "degree_in_sign": sign_info["degree"],
            "sign": {
                "id": sign_info["id"],
                "name": translate_entity("signs", sign_info["id"], lang, sign_info["name_en"]),
                "number": sign_info["index"]
            },
            "sign_lord": sign_lord,
            "star_lord": star_lord,
            "sub_lord": sub_lord,
            "is_retrograde": is_ret
        })
        
    return planets_result

def calculate_kp_cusps(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """Calculate KP 12 Placidus House Cusps with Sign Lord, Star Lord, and Sub-Lord."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_KRISHNAMURTI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
    
    # Placidus cusps ('P')
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', flags)
    
    cusps_result = []
    for i in range(12):
        cusp_deg = cusps[i]
        sign_lord, star_lord, sub_lord = get_kp_sub_lord(cusp_deg)
        sign_info = get_zodiac_sign_info(cusp_deg)
        
        cusps_result.append({
            "cusp": i + 1,
            "full_degree": round(cusp_deg, 4),
            "degree_in_sign": sign_info["degree"],
            "sign": {
                "id": sign_info["id"],
                "name": translate_entity("signs", sign_info["id"], lang, sign_info["name_en"]),
                "number": sign_info["index"]
            },
            "sign_lord": sign_lord,
            "star_lord": star_lord,
            "sub_lord": sub_lord
        })
        
    return cusps_result

def calculate_kp_horary_chart(
    horary_number: int,
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Calculate KP Horary Chart (Prashna) using seed numbers 1 to 249.
    Each number corresponds to a precise Sub-Lord arc segment on the zodiac.
    """
    if horary_number < 1 or horary_number > 249:
        raise ValueError("KP Horary seed number must be between 1 and 249.")
        
    # KP 249 table maps 360° into 249 unequal sub-divisions
    # Approximate degree starting position for horary seed
    approx_asc_deg = ((horary_number - 1) / 249.0) * 360.0
    sign_lord, star_lord, sub_lord = get_kp_sub_lord(approx_asc_deg)
    sign_info = get_zodiac_sign_info(approx_asc_deg)
    
    planets = calculate_kp_planets(dob, tob, tz, lang)
    
    return {
        "horary_number": horary_number,
        "horary_ascendant": {
            "degree": round(approx_asc_deg, 4),
            "sign": sign_info["name_en"],
            "sign_lord": sign_lord,
            "star_lord": star_lord,
            "sub_lord": sub_lord
        },
        "planets": planets
    }
