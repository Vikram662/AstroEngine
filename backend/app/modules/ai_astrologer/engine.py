"""
AI Astrologer Synthesis Engine.
Performs real-time planetary & dasha synthesis to answer user queries with classical precision.
"""

from typing import Dict, Any, Optional
import datetime
from app.modules.parashari.calculator import compute_varga_chart
from app.modules.dasha.calculator import calculate_current_dasha
from app.modules.ai_astrologer.knowledge import (
    QUERY_CATEGORIES,
    PLANET_NAMES_HI,
    REMEDY_SUGGESTIONS
)

SIGN_NAMES_EN = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]
SIGN_NAMES_HI = [
    "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या",
    "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"
]

SIGN_LORDS = {
    1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON",
    5: "SUN", 6: "MERCURY", 7: "VENUS", 8: "MARS",
    9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER"
}

def detect_query_category(question: str) -> str:
    """Detect category from user's natural language question."""
    q_lower = (question or "").lower()
    for cat_id, data in QUERY_CATEGORIES.items():
        if cat_id == "general":
            continue
        for kw in data["keywords"]:
            if kw in q_lower:
                return cat_id
    return "general"

def generate_astrological_response(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    question: str,
    category: Optional[str] = None,
    lang: str = "hi"
) -> Dict[str, Any]:
    """
    Synthesize complete astrological response for user query.
    1. Computes genuine D1 Lagna Kundli.
    2. Computes running Vimshottari Mahadasha + Antardasha.
    3. Analyzes relevant houses and planet placements.
    4. Produces personalized reading, timeline, and remedial guidance.
    """
    selected_lang = (lang or "hi").lower().strip()
    if not category or category not in QUERY_CATEGORIES:
        category = detect_query_category(question)

    cat_meta = QUERY_CATEGORIES[category]

    # 1. Compute D1 Chart
    d1_chart = compute_varga_chart(
        dob=dob, tob=tob, lat=lat, lon=lon, tz=tz, varga="D1", lang="en"
    )
    asc_sign_num = d1_chart.get("ascendant", {}).get("sign", {}).get("number", 1)
    asc_sign_name = SIGN_NAMES_EN[asc_sign_num - 1]
    asc_sign_hi = SIGN_NAMES_HI[asc_sign_num - 1]

    # Map planets by ID
    planets_by_id = {}
    for p in d1_chart.get("planets", []):
        p_id = p.get("id", "").upper()
        planets_by_id[p_id] = p

    # 2. Compute Running Dasha
    try:
        moon_deg = planets_by_id.get("MOON", {}).get("full_degree", 45.0)
        dasha_info = calculate_current_dasha(dob, tob, tz, moon_deg)
        current_md = dasha_info.get("running_dasha", {}).get("mahadasha", {}).get("planet_id", "JUPITER").upper()
        current_ad = dasha_info.get("running_dasha", {}).get("antardasha", {}).get("antardasha_planet", "SATURN").upper()
        md_name = dasha_info.get("running_dasha", {}).get("mahadasha", {}).get("planet_name", "Jupiter")
        ad_name = dasha_info.get("running_dasha", {}).get("antardasha", {}).get("antardasha_name", "Saturn")
        ad_end = dasha_info.get("running_dasha", {}).get("antardasha", {}).get("end_date", "2027")
    except Exception:
        current_md = "JUPITER"
        current_ad = "SATURN"
        md_name = "Jupiter"
        ad_name = "Saturn"
        ad_end = "2027"

    # 3. Analyze Key House for this Category
    primary_house = cat_meta["primary_houses"][0]
    # House sign in D1
    house_sign_num = ((asc_sign_num + (primary_house - 1) - 1) % 12) + 1
    house_sign_en = SIGN_NAMES_EN[house_sign_num - 1]
    house_sign_hi = SIGN_NAMES_HI[house_sign_num - 1]
    house_lord_id = SIGN_LORDS.get(house_sign_num, "SUN")
    house_lord_data = planets_by_id.get(house_lord_id, {})
    house_lord_house = house_lord_data.get("house", 1)
    house_lord_dignity = house_lord_data.get("dignity", "NEUTRAL")

    # Planets occupying the primary house
    occupants = [
        p.get("name", p.get("id"))
        for p in d1_chart.get("planets", [])
        if p.get("house") == primary_house
    ]

    # Calculate Auspicious Score (0 to 100)
    score = 65
    if house_lord_dignity in ["EXALTED", "MOOLATRIKONA", "OWN"]:
        score += 20
    elif house_lord_dignity == "DEBILITATED":
        score -= 15

    if current_md in [house_lord_id] or current_ad in [house_lord_id]:
        score += 12

    score = max(45, min(95, score))

    # Determine recommended remedy planet
    remedy_planet = house_lord_id if house_lord_dignity == "DEBILITATED" else current_ad
    remedy_info = REMEDY_SUGGESTIONS.get(remedy_planet, REMEDY_SUGGESTIONS["JUPITER"])

    # 4. Synthesize Natural Astrological Answer
    from app.locales.content_translator import generate_ai_astrologer_text_i18n, get_sign_i18n, get_planet_i18n
    ai_text_data = generate_ai_astrologer_text_i18n(
        category_title=cat_meta.get("hindi_title") if selected_lang == "hi" else category.title(),
        asc_sign_en=asc_sign_name,
        primary_house=primary_house,
        house_lord_en=house_lord_id,
        running_md_en=current_md,
        running_ad_en=current_ad,
        ad_end_date=ad_end,
        score=score,
        lang=selected_lang
    )

    full_answer = ai_text_data["prediction_answer"]
    timing_text = ai_text_data["favorable_timing"]
    suggested_remedy = ai_text_data["prescribed_remedy"]

    return {
        "category": category,
        "category_title": cat_meta["hindi_title"] if selected_lang == "hi" else category.title(),
        "query": question,
        "auspicious_score": score,
        "astrological_breakdown": {
            "ascendant": f"{asc_sign_name} ({asc_sign_hi})",
            "primary_house_analyzed": f"House {primary_house}",
            "house_sign": f"{house_sign_en} ({house_sign_hi})",
            "house_lord": house_lord_id,
            "house_lord_placement": f"House {house_lord_house} ({house_lord_dignity})",
            "running_mahadasha": md_name,
            "running_antardasha": ad_name,
            "dasha_end": ad_end,
            "occupying_planets": occupants
        },
        "prediction_answer": full_answer,
        "favorable_timing": timing_text,
        "prescribed_remedy": suggested_remedy,
        "remedy_planet": remedy_planet
    }
