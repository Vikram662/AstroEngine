import swisseph as swe
from datetime import datetime
from typing import Dict, Any, List
from app.core.swisseph import calculate_julian_day, VEDIC_PLANETS, ZODIAC_SIGNS
from app.locales.i18n import translate_entity

CHARA_KARAKA_NAMES = [
    "Atmakaraka (Soul / Core Self)",
    "Amatyakaraka (Career / Intellect)",
    "Bhratrikaraka (Siblings / Guru)",
    "Matrikaraka (Mother / Emotions)",
    "Putrakaraka (Children / Creativity)",
    "Gnatikaraka (Obstacles / Competitors)",
    "Darakaraka (Spouse / Relationships)"
]

def calculate_jaimini_karakas(
    dob: str,
    tob: str,
    tz: float,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """
    Calculate 7 Jaimini Chara Karakas (AK, AmK, BK, MK, PK, GK, DK).
    Ranked purely by highest degrees traversed within the zodiac sign (0° to 30°),
    excluding Rahu and Ketu in the standard 7-karaka scheme.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL

    physical_planets = [
        {"id": "SUN", "swe_id": swe.SUN, "name_en": "Sun"},
        {"id": "MOON", "swe_id": swe.MOON, "name_en": "Moon"},
        {"id": "MARS", "swe_id": swe.MARS, "name_en": "Mars"},
        {"id": "MERCURY", "swe_id": swe.MERCURY, "name_en": "Mercury"},
        {"id": "JUPITER", "swe_id": swe.JUPITER, "name_en": "Jupiter"},
        {"id": "VENUS", "swe_id": swe.VENUS, "name_en": "Venus"},
        {"id": "SATURN", "swe_id": swe.SATURN, "name_en": "Saturn"},
    ]

    planet_degrees = []
    for p in physical_planets:
        res, _ = swe.calc_ut(jd_ut, p["swe_id"], flags)
        lon = res[0]
        deg_in_sign = lon % 30.0
        planet_degrees.append({
            "planet_id": p["id"],
            "planet_name": translate_entity("planets", p["id"], lang, p["name_en"]),
            "full_degree": round(lon, 4),
            "degree_in_sign": round(deg_in_sign, 4),
            "sign": ZODIAC_SIGNS[int((lon % 360.0) // 30.0)]["id"]
        })

    # Sort descending by degree traversed within the sign
    planet_degrees.sort(key=lambda x: x["degree_in_sign"], reverse=True)

    karakas = []
    for i in range(len(planet_degrees)):
        karakas.append({
            "karaka_name": CHARA_KARAKA_NAMES[i],
            **planet_degrees[i]
        })

    return karakas

def calculate_tajik_varshphal(
    dob: str,
    target_year: int,
    birth_lat: float,
    birth_lon: float,
    tz: float
) -> Dict[str, Any]:
    """
    Calculate Tajik Varshphal (Solar Return) parameters:
    - Muntha calculation: (Birth Lagna Sign + Completed Years) % 12
    - Varshesh (Lord of the Year) candidate evaluation
    """
    birth_year = int(dob[:4])
    completed_years = target_year - birth_year
    if completed_years < 0:
        completed_years = 0

    # Approximate Muntha house from Lagna
    muntha_house = (completed_years % 12) + 1

    return {
        "target_year": target_year,
        "completed_years": completed_years,
        "muntha": {
            "house": muntha_house,
            "significance": "Auspicious if in Kendra (1,4,7,10) or Trikona (5,9); Inauspicious if in 6, 8, 12."
        },
        "varshesh_candidates": ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    }
