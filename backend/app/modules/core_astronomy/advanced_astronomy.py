import swisseph as swe
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.core.swisseph import (
    calculate_julian_day,
    get_zodiac_sign_info,
    get_nakshatra_info,
    AYANAMSA_MODES,
    VEDIC_PLANETS
)
from app.locales.i18n import translate_entity

HOUSE_SYSTEMS = {
    "PLACIDUS": b'P',
    "SRIPATI": b'O',      # Porphyry / close to Sripati bhava
    "EQUAL": b'A',        # Equal house system
    "WHOLE_SIGN": b'W',   # Whole Sign
    "KOCH": b'K',
}

def calculate_house_cusps(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    house_system: str = "PLACIDUS",
    ayanamsa: str = "LAHIRI",
    lang: str = "en"
) -> Dict[str, Any]:
    """Calculate 12 house cusps under Placidus, Sripati, Equal, or Whole Sign systems."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    hsys = HOUSE_SYSTEMS.get(house_system.upper(), b'P')
    
    selected_mode = AYANAMSA_MODES.get(ayanamsa.upper(), swe.SIDM_LAHIRI)
    if selected_mode != -1:
        swe.set_sid_mode(selected_mode, 0, 0)
        calc_flag = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
    else:
        calc_flag = swe.FLG_SWIEPH

    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, hsys, calc_flag)
    
    houses_list = []
    # cusps has 12 items (index 0 to 11 correspond to Houses 1 to 12)
    for i, cusp_deg in enumerate(cusps):
        house_num = i + 1
        sign_info = get_zodiac_sign_info(cusp_deg)
        nak_info = get_nakshatra_info(cusp_deg)
        houses_list.append({
            "house": house_num,
            "full_degree": round(cusp_deg, 4),
            "degree_in_sign": sign_info["degree"],
            "sign": {
                "id": sign_info["id"],
                "name": translate_entity("signs", sign_info["id"], lang, sign_info["name_en"]),
                "number": sign_info["index"],
                "ruler": sign_info["ruler"]
            },
            "nakshatra": {
                "id": nak_info["id"],
                "name": translate_entity("nakshatras", nak_info["id"], lang, nak_info["name_en"]),
                "number": nak_info["index"],
                "pada": nak_info["pada"],
                "lord": nak_info["lord"]
            }
        })

    asc_sign = get_zodiac_sign_info(ascmc[0])
    mc_sign = get_zodiac_sign_info(ascmc[1])

    return {
        "house_system": house_system.upper(),
        "ayanamsa": ayanamsa.upper(),
        "ascendant": {
            "degree": round(ascmc[0], 4),
            "sign": asc_sign["name_en"]
        },
        "midheaven_mc": {
            "degree": round(ascmc[1], 4),
            "sign": mc_sign["name_en"]
        },
        "houses": houses_list
    }

def calculate_retrograde_details(
    dob: str,
    tob: str,
    tz: float,
    ayanamsa: str = "LAHIRI",
    lang: str = "en"
) -> Dict[str, Any]:
    """Calculate Vakri / Margi details, current daily speed, and status for all planets."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    selected_mode = AYANAMSA_MODES.get(ayanamsa.upper(), swe.SIDM_LAHIRI)
    if selected_mode != -1:
        swe.set_sid_mode(selected_mode, 0, 0)
        calc_flag = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    else:
        calc_flag = swe.FLG_SWIEPH | swe.FLG_SPEED

    planets_status = []
    # Check physical planets that can go retrograde (excluding Sun, Moon, Rahu, Ketu)
    ret_candidates = [
        {"id": "MERCURY", "swe_id": swe.MERCURY, "name_en": "Mercury"},
        {"id": "VENUS", "swe_id": swe.VENUS, "name_en": "Venus"},
        {"id": "MARS", "swe_id": swe.MARS, "name_en": "Mars"},
        {"id": "JUPITER", "swe_id": swe.JUPITER, "name_en": "Jupiter"},
        {"id": "SATURN", "swe_id": swe.SATURN, "name_en": "Saturn"},
        {"id": "URANUS", "swe_id": swe.URANUS, "name_en": "Uranus"},
        {"id": "NEPTUNE", "swe_id": swe.NEPTUNE, "name_en": "Neptune"},
        {"id": "PLUTO", "swe_id": swe.PLUTO, "name_en": "Pluto"},
    ]

    for p in ret_candidates:
        res, _ = swe.calc_ut(jd_ut, p["swe_id"], calc_flag)
        speed = res[3]
        is_vakri = speed < 0.0
        is_stationary = abs(speed) < 0.005

        status_code = "STATIONARY" if is_stationary else ("RETROGRADE" if is_vakri else "DIRECT")
        status_label = "वक्री" if is_vakri else "मार्गी"
        if is_stationary:
            status_label = "स्थिर"

        planets_status.append({
            "id": p["id"],
            "name": translate_entity("planets", p["id"], lang, p["name_en"]),
            "daily_speed_deg": round(speed, 4),
            "status": status_code,
            "status_localized": status_label if lang == "hi" else status_code.capitalize(),
            "is_retrograde": is_vakri,
            "is_stationary": is_stationary
        })

    return {
        "reference_date": dob,
        "planets": planets_status
    }

def calculate_sun_moon_timings(
    dob: str,
    lat: float,
    lon: float,
    tz: float
) -> Dict[str, Any]:
    """Calculate Sunrise, Sunset, Moonrise, Moonset and twilight windows."""
    local_midnight = datetime.strptime(dob, "%Y-%m-%d")
    ut_decimal_hour = 0.0 - tz
    day_shift = 0
    if ut_decimal_hour < 0.0:
        ut_decimal_hour += 24.0
        day_shift -= 1
    
    base_date = local_midnight + timedelta(days=day_shift)
    jd_midnight_ut = swe.julday(base_date.year, base_date.month, base_date.day, ut_decimal_hour, swe.GREG_CAL)
    geopos = (lon, lat, 0.0) # lon, lat, altitude in meters

    # Sunrise & Sunset (center of disc, accounting for atmospheric refraction)
    rs_flags = swe.CALC_RISE | swe.BIT_DISC_CENTER
    set_flags = swe.CALC_SET | swe.BIT_DISC_CENTER

    # Correct signature: swe.rise_trans(tjdut, body, rsmi, geopos, atpress, attemp, flags)
    ret_rise, rise_time = swe.rise_trans(jd_midnight_ut, swe.SUN, rs_flags, geopos, 1013.25, 10.0, swe.FLG_SWIEPH)
    ret_set, set_time = swe.rise_trans(jd_midnight_ut, swe.SUN, set_flags, geopos, 1013.25, 10.0, swe.FLG_SWIEPH)

    def jd_to_local_time_str(jd_val: float) -> str:
        year, month, day, dec_hour = swe.revjul(jd_val, swe.GREG_CAL)
        total_seconds = int(round(dec_hour * 3600.0)) + int(tz * 3600.0)
        total_seconds = total_seconds % 86400
        h = total_seconds // 3600
        m = (total_seconds % 3600) // 60
        s = total_seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    sunrise_str = jd_to_local_time_str(rise_time[0]) if ret_rise == 0 else "N/A"
    sunset_str = jd_to_local_time_str(set_time[0]) if ret_set == 0 else "N/A"

    # Moonrise & Moonset
    m_ret_rise, m_rise_time = swe.rise_trans(jd_midnight_ut, swe.MOON, rs_flags, geopos, 1013.25, 10.0, swe.FLG_SWIEPH)
    m_ret_set, m_set_time = swe.rise_trans(jd_midnight_ut, swe.MOON, set_flags, geopos, 1013.25, 10.0, swe.FLG_SWIEPH)
    
    moonrise_str = jd_to_local_time_str(m_rise_time[0]) if m_ret_rise == 0 else "N/A"
    moonset_str = jd_to_local_time_str(m_set_time[0]) if m_ret_set == 0 else "N/A"

    # Day duration in hours
    day_duration_hours = 0.0
    if ret_rise == 0 and ret_set == 0:
        day_duration_hours = round((set_time[0] - rise_time[0]) * 24.0, 2)

    return {
        "date": dob,
        "sunrise": sunrise_str,
        "sunset": sunset_str,
        "moonrise": moonrise_str,
        "moonset": moonset_str,
        "day_duration_hours": day_duration_hours
    }

def calculate_ayanamsa_comparison(dob: str, tob: str, tz: float) -> Dict[str, Any]:
    """Compare all standard astrological ayanamsas for given birth timestamp."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    
    comparisons = {}
    for name, mode in AYANAMSA_MODES.items():
        if mode == -1:
            comparisons[name] = 0.0
        else:
            swe.set_sid_mode(mode, 0, 0)
            val = swe.get_ayanamsa_ut(jd_ut)
            comparisons[name] = round(val, 5)

    return {
        "julian_day": round(jd_ut, 6),
        "ayanamsas": comparisons
    }
