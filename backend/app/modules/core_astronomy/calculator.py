import swisseph as swe
from typing import Dict, Any, List
from app.core.swisseph import (
    calculate_julian_day,
    get_nakshatra_info,
    get_zodiac_sign_info,
    AYANAMSA_MODES,
    VEDIC_PLANETS,
)
from app.locales.i18n import translate_entity

def calculate_planetary_positions(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    ayanamsa: str = "LAHIRI",
    lang: str = "en"
) -> Dict[str, Any]:
    """
    High-precision calculation of all Vedic and outer planetary positions.
    Returns dual-key JSON: machine-readable invariant ID + localized display name.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)

    # Configure Ayanamsa
    selected_mode = AYANAMSA_MODES.get(ayanamsa.upper(), swe.SIDM_LAHIRI)
    is_sidereal = selected_mode != -1

    if is_sidereal:
        swe.set_sid_mode(selected_mode, 0, 0)
        calc_flag = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    else:
        calc_flag = swe.FLG_SWIEPH | swe.FLG_SPEED

    ayanamsa_val = swe.get_ayanamsa_ut(jd_ut) if is_sidereal else 0.0

    planets_result: List[Dict[str, Any]] = []
    rahu_lon = 0.0

    for p in VEDIC_PLANETS:
        p_id = p["id"]
        p_name_en = p["name_en"]
        localized_p_name = translate_entity("planets", p_id, lang, p_name_en)

        if p_id == "KETU":
            # Ketu is strictly 180° opposite Rahu
            ketu_lon = (rahu_lon + 180.0) % 360.0
            sign_info = get_zodiac_sign_info(ketu_lon)
            nak_info = get_nakshatra_info(ketu_lon)

            planets_result.append({
                "id": "KETU",
                "name": localized_p_name,
                "full_degree": round(ketu_lon, 4),
                "norm_degree": sign_info["degree"],
                "speed": round(-planets_result[-1]["speed"] if planets_result else 0.0, 4),
                "is_retrograde": True,  # Rahu/Ketu are always retrograde in mean motion
                "sign": {
                    "id": sign_info["id"],
                    "name": translate_entity("signs", sign_info["id"], lang, sign_info["name_en"]),
                    "ruler": sign_info["ruler"],
                    "number": sign_info["index"]
                },
                "nakshatra": {
                    "id": nak_info["id"],
                    "name": translate_entity("nakshatras", nak_info["id"], lang, nak_info["name_en"]),
                    "number": nak_info["index"],
                    "pada": nak_info["pada"],
                    "lord": nak_info["lord"]
                }
            })
            continue

        swe_id = p["swe_id"]
        res, ret_flag = swe.calc_ut(jd_ut, swe_id, calc_flag)
        longitude = res[0]
        latitude = res[1]
        distance = res[2]
        speed_deg_per_day = res[3]

        if p_id == "RAHU":
            rahu_lon = longitude

        is_retrograde = speed_deg_per_day < 0.0
        sign_info = get_zodiac_sign_info(longitude)
        nak_info = get_nakshatra_info(longitude)

        planets_result.append({
            "id": p_id,
            "name": localized_p_name,
            "full_degree": round(longitude, 4),
            "norm_degree": sign_info["degree"],
            "latitude": round(latitude, 4),
            "distance_au": round(distance, 6),
            "speed": round(speed_deg_per_day, 4),
            "is_retrograde": is_retrograde,
            "sign": {
                "id": sign_info["id"],
                "name": translate_entity("signs", sign_info["id"], lang, sign_info["name_en"]),
                "ruler": sign_info["ruler"],
                "number": sign_info["index"]
            },
            "nakshatra": {
                "id": nak_info["id"],
                "name": translate_entity("nakshatras", nak_info["id"], lang, nak_info["name_en"]),
                "number": nak_info["index"],
                "pada": nak_info["pada"],
                "lord": nak_info["lord"]
            }
        })

    # Compute Ascendant (Lagna) and 12 Bhavas (House Cusps)
    # Using 'P' for Placidus or 'W' for Whole Sign
    hsys = b'P'
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, hsys, calc_flag)
    asc_deg = ascmc[0]
    asc_sign = get_zodiac_sign_info(asc_deg)
    asc_nak = get_nakshatra_info(asc_deg)

    return {
        "julian_day": round(jd_ut, 6),
        "ayanamsa_name": ayanamsa.upper(),
        "ayanamsa_degree": round(ayanamsa_val, 4),
        "ascendant": {
            "full_degree": round(asc_deg, 4),
            "norm_degree": asc_sign["degree"],
            "sign": {
                "id": asc_sign["id"],
                "name": translate_entity("signs", asc_sign["id"], lang, asc_sign["name_en"]),
                "number": asc_sign["index"]
            },
            "nakshatra": {
                "id": asc_nak["id"],
                "name": translate_entity("nakshatras", asc_nak["id"], lang, asc_nak["name_en"]),
                "pada": asc_nak["pada"],
                "lord": asc_nak["lord"]
            }
        },
        "planets": planets_result
    }
