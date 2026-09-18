import swisseph as swe
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple
from app.core.config import settings

# Initialize Ephemeris files directory
EPHE_DIR = os.path.abspath(settings.EPHE_PATH)
if os.path.isdir(EPHE_DIR):
    swe.set_ephe_path(EPHE_DIR)

# Ayanamsa Mappings
AYANAMSA_MODES = {
    "LAHIRI": swe.SIDM_LAHIRI,
    "RAMAN": swe.SIDM_RAMAN,
    "KP": swe.SIDM_KRISHNAMURTI,
    "FAGAN_BRADLEY": swe.SIDM_FAGAN_BRADLEY,
    "TROPICAL": -1,  # Special flag for Sayana / Western calculations
}

# Vedic Planets definition with standard IDs
VEDIC_PLANETS = [
    {"id": "SUN", "name_en": "Sun", "swe_id": swe.SUN},
    {"id": "MOON", "name_en": "Moon", "swe_id": swe.MOON},
    {"id": "MARS", "name_en": "Mars", "swe_id": swe.MARS},
    {"id": "MERCURY", "name_en": "Mercury", "swe_id": swe.MERCURY},
    {"id": "JUPITER", "name_en": "Jupiter", "swe_id": swe.JUPITER},
    {"id": "VENUS", "name_en": "Venus", "swe_id": swe.VENUS},
    {"id": "SATURN", "name_en": "Saturn", "swe_id": swe.SATURN},
    {"id": "RAHU", "name_en": "Rahu", "swe_id": swe.MEAN_NODE},   # Rahu (North Node)
    {"id": "KETU", "name_en": "Ketu", "swe_id": None},            # 180° opposite Rahu
    {"id": "URANUS", "name_en": "Uranus", "swe_id": swe.URANUS},
    {"id": "NEPTUNE", "name_en": "Neptune", "swe_id": swe.NEPTUNE},
    {"id": "PLUTO", "name_en": "Pluto", "swe_id": swe.PLUTO},
]

# Zodiac Signs (0 to 11)
ZODIAC_SIGNS = [
    {"id": "ARIES", "name_en": "Aries", "ruler": "MARS"},
    {"id": "TAURUS", "name_en": "Taurus", "ruler": "VENUS"},
    {"id": "GEMINI", "name_en": "Gemini", "ruler": "MERCURY"},
    {"id": "CANCER", "name_en": "Cancer", "ruler": "MOON"},
    {"id": "LEO", "name_en": "Leo", "ruler": "SUN"},
    {"id": "VIRGO", "name_en": "Virgo", "ruler": "MERCURY"},
    {"id": "LIBRA", "name_en": "Libra", "ruler": "VENUS"},
    {"id": "SCORPIO", "name_en": "Scorpio", "ruler": "MARS"},
    {"id": "SAGITTARIUS", "name_en": "Sagittarius", "ruler": "JUPITER"},
    {"id": "CAPRICORN", "name_en": "Capricorn", "ruler": "SATURN"},
    {"id": "AQUARIUS", "name_en": "Aquarius", "ruler": "SATURN"},
    {"id": "PISCES", "name_en": "Pisces", "ruler": "JUPITER"},
]

# 27 Nakshatras
NAKSHATRAS = [
    {"id": "ASHWINI", "name_en": "Ashwini", "lord": "KETU"},
    {"id": "BHARANI", "name_en": "Bharani", "lord": "VENUS"},
    {"id": "KRITTIKA", "name_en": "Krittika", "lord": "SUN"},
    {"id": "ROHINI", "name_en": "Rohini", "lord": "MOON"},
    {"id": "MRIGASHIRA", "name_en": "Mrigashira", "lord": "MARS"},
    {"id": "ARDRA", "name_en": "Ardra", "lord": "RAHU"},
    {"id": "PUNARVASU", "name_en": "Punarvasu", "lord": "JUPITER"},
    {"id": "PUSHYA", "name_en": "Pushya", "lord": "SATURN"},
    {"id": "ASHLESHA", "name_en": "Ashlesha", "lord": "MERCURY"},
    {"id": "MAGHA", "name_en": "Magha", "lord": "KETU"},
    {"id": "PURVA_PHALGUNI", "name_en": "Purva Phalguni", "lord": "VENUS"},
    {"id": "UTTARA_PHALGUNI", "name_en": "Uttara Phalguni", "lord": "SUN"},
    {"id": "HASTA", "name_en": "Hasta", "lord": "MOON"},
    {"id": "CHITRA", "name_en": "Chitra", "lord": "MARS"},
    {"id": "SWATI", "name_en": "Swati", "lord": "RAHU"},
    {"id": "VISHAKHA", "name_en": "Vishakha", "lord": "JUPITER"},
    {"id": "ANURADHA", "name_en": "Anuradha", "lord": "SATURN"},
    {"id": "JYESHTHA", "name_en": "Jyeshtha", "lord": "MERCURY"},
    {"id": "MULA", "name_en": "Mula", "lord": "KETU"},
    {"id": "PURVA_ASHADHA", "name_en": "Purva Ashadha", "lord": "VENUS"},
    {"id": "UTTARA_ASHADHA", "name_en": "Uttara Ashadha", "lord": "SUN"},
    {"id": "SHRAVANA", "name_en": "Shravana", "lord": "MOON"},
    {"id": "DHANISHTHA", "name_en": "Dhanishta", "lord": "MARS"},
    {"id": "SHATABHISHA", "name_en": "Shatabhisha", "lord": "RAHU"},
    {"id": "PURVA_BHADRAPADA", "name_en": "Purva Bhadrapada", "lord": "JUPITER"},
    {"id": "UTTARA_BHADRAPADA", "name_en": "Uttara Bhadrapada", "lord": "SATURN"},
    {"id": "REVATI", "name_en": "Revati", "lord": "MERCURY"},
]

def calculate_julian_day(dob: str, tob: str, tz_offset_hours: float) -> float:
    """
    Compute Universal Time (UT) Julian Day from local Date of Birth (YYYY-MM-DD),
    Time of Birth (HH:MM or HH:MM:SS), and Timezone offset (e.g. +5.5 for IST).
    """
    time_parts = [int(p) for p in tob.split(":")]
    hour = time_parts[0]
    minute = time_parts[1]
    second = time_parts[2] if len(time_parts) > 2 else 0

    local_dt = datetime.strptime(dob, "%Y-%m-%d")
    local_decimal_hour = hour + (minute / 60.0) + (second / 3600.0)
    ut_decimal_hour = local_decimal_hour - tz_offset_hours

    # Handle day rollover if UT decimal hour is negative or >= 24
    day_shift = 0
    while ut_decimal_hour < 0.0:
        ut_decimal_hour += 24.0
        day_shift -= 1
    while ut_decimal_hour >= 24.0:
        ut_decimal_hour -= 24.0
        day_shift += 1

    adjusted_date = local_dt + timedelta(days=day_shift)
    jd_ut = swe.julday(
        adjusted_date.year,
        adjusted_date.month,
        adjusted_date.day,
        ut_decimal_hour,
        swe.GREG_CAL
    )
    return jd_ut

def get_nakshatra_info(longitude: float) -> Dict[str, Any]:
    """Calculate Nakshatra (1 to 27) and Pada (1 to 4) from sidereal longitude (0° to 360°)."""
    norm_deg = longitude % 360.0
    nak_span = 360.0 / 27.0        # 13° 20' = 13.333333333333334°
    pada_span = nak_span / 4.0     # 3° 20' = 3.3333333333333335°

    nak_index = int(norm_deg // nak_span)
    nak_meta = NAKSHATRAS[nak_index]
    degrees_into_nak = norm_deg - (nak_index * nak_span)
    pada = int(degrees_into_nak // pada_span) + 1

    return {
        "index": nak_index + 1,
        "id": nak_meta["id"],
        "name_en": nak_meta["name_en"],
        "pada": pada,
        "lord": nak_meta["lord"],
        "degrees_in_nak": round(degrees_into_nak, 4)
    }

def get_zodiac_sign_info(longitude: float) -> Dict[str, Any]:
    """Calculate Zodiac Sign (0-11 / 1-12) and degree within the sign (0° to 30°)."""
    norm_deg = longitude % 360.0
    sign_index = int(norm_deg // 30.0)
    degree_in_sign = norm_deg % 30.0
    sign_meta = ZODIAC_SIGNS[sign_index]

    return {
        "index": sign_index + 1,
        "id": sign_meta["id"],
        "name_en": sign_meta["name_en"],
        "degree": round(degree_in_sign, 4),
        "ruler": sign_meta["ruler"]
    }

def calculate_moon_longitude(dob: str, tob: str, tz: float) -> float:
    """Calculate Moon sidereal Lahiri longitude for Dasha calculations."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    moon_res, _ = swe.calc_ut(jd_ut, swe.MOON, flags)
    return float(moon_res[0])

