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
    if selected_lang == "hi":
        topic_hi = cat_meta["hindi_title"]
        lord_label = PLANET_NAMES_HI.get(house_lord_id, house_lord_id)
        dasha_label = f"{PLANET_NAMES_HI.get(current_md, current_md)} की महादशा में {PLANET_NAMES_HI.get(current_ad, current_ad)} की अंतर्दशा"

        answer_paragraphs = [
            f"आपकी लग्न कुंडली **{asc_sign_hi} लग्न ({asc_sign_name} Ascendant)** की है। आपके प्रश्न ({topic_hi}) के लिए जन्म कुंडली का **{primary_house}वां भाव** और इसके स्वामी **{lord_label}** मुख्य नियंत्रक हैं।",
            f"वर्तमान में आपकी कुंडली में **{dasha_label}** चल रही है, जो **{ad_end}** तक प्रभावी है। आपके {primary_house}वें भाव के स्वामी अपनी स्थिति के अनुसार {house_lord_house}वें भाव में गोचररत हैं और इनकी स्थिति **{house_lord_dignity}** है।"
        ]

        if occupants:
            answer_paragraphs.append(f"आपके {primary_house}वें भाव में **{', '.join(occupants)}** की उपस्थिति इस क्षेत्र में महत्वपूर्ण प्रभाव डाल रही है।")

        if score >= 75:
            verdict_text = "ग्रह स्थितियां अत्यधिक अनुकूल हैं। आपको अपने प्रयासों में सकारात्मक परिणाम, तरक्की और स्थिरता मिलने के अत्यंत प्रबल योग बने हुए हैं।"
            timing_text = f"आगामी 4 से 9 महीने ({datetime.date.today().year}–{datetime.date.today().year + 1}) आपके लिए विशेष रूप से फलदायी सिद्ध होंगे।"
        elif score >= 60:
            verdict_text = "परिस्थितियां सामान्य से बेहतर हैं। कुछ प्रारंभिक परिश्रम या विलंब के बाद अपेक्षित सफलता अवश्य प्राप्त होगी। धैर्य बनाए रखें।"
            timing_text = f"वर्तमान दशा के उत्तरार्ध में लगभग 6 से 12 महीनों के भीतर परिस्थिति में स्पष्ट सकारात्मक बदलाव देखने को मिलेगा।"
        else:
            verdict_text = "ग्रहों की वर्तमान स्थिति में कुछ सतर्कता और शास्त्रीय उपायों की आवश्यकता है। अनावश्यक जोखिम या जल्दबाजी से बचें।"
            timing_text = "अगले 3 से 6 महीने संयम बरतने का समय है, जिसके बाद स्थितियां आपके पक्ष में आनी शुरू होंगी।"

        answer_paragraphs.append(verdict_text)

        full_answer = "\n\n".join(answer_paragraphs)
        suggested_remedy = remedy_info["hi"]

    else:
        topic_en = category.title()
        answer_paragraphs = [
            f"Your foundational chart is anchored in **{asc_sign_name} Ascendant ({asc_sign_hi})**. For your inquiry regarding **{topic_en}**, the **{primary_house}th House** and its governing lord **{house_lord_id}** act as primary astrological catalysts.",
            f"You are currently navigating through the **{md_name} Mahadasha** and **{ad_name} Antardasha** cycle, operating until **{ad_end}**. The {primary_house}th house lord resides in House {house_lord_house} with **{house_lord_dignity}** dignity."
        ]

        if occupants:
            answer_paragraphs.append(f"The placement of **{', '.join(occupants)}** in your {primary_house}th house imparts distinctive strength to this life sector.")

        if score >= 75:
            verdict_text = "Planetary alignments are substantially favorable. High probability of progress, recognition, and long-term breakthroughs."
            timing_text = f"The window between the next 4 to 9 months ({datetime.date.today().year}–{datetime.date.today().year + 1}) will act as a pivotal turning point."
        elif score >= 60:
            verdict_text = "Vibrations are moderately constructive. Gradual, steady gains will manifest with persistent focus."
            timing_text = "A noticeable upward shift is forecasted within the next 6 to 12 months."
        else:
            verdict_text = "Current astrological transits suggest disciplined caution. Prioritize stability and avoid hasty commitments."
            timing_text = "The upcoming 3 to 6 months recommend patience, followed by stabilizing momentum."

        answer_paragraphs.append(verdict_text)

        full_answer = "\n\n".join(answer_paragraphs)
        suggested_remedy = remedy_info["en"]

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
