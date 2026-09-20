"""
12 Houses Bhavaphala & Life Predictions Engine
Calculates Classical Vedic Parashari Predictions for all 12 Houses (Bhavas),
Life Domains (Career, Marriage, Wealth, Health, Moksha), and 12-Month Annual Trends.
"""
from typing import Dict, Any, List, Optional
import swisseph as swe
from app.core.swisseph import (
    calculate_julian_day,
    get_zodiac_sign_info,
    get_nakshatra_info,
    AYANAMSA_MODES
)
from app.locales.i18n import translate_entity

HOUSES_METADATA = [
    {
        "house": 1,
        "name_en": "Tanu Bhava (1st House)",
        "name_hi": "तनु भाव (प्रथम भाव - लग्न)",
        "domain_en": "Physical Body, Personality, Self, Vitality & Appearance",
        "domain_hi": "शारीरिक गठन, स्वभाव, व्यक्तित्व एवं जीवन ऊर्जा",
        "significator": "SUN",
        "icon": "👤",
        "color": "from-red-500 to-rose-600"
    },
    {
        "house": 2,
        "name_en": "Dhana Bhava (2nd House)",
        "name_hi": "धन भाव (द्वितीय भाव)",
        "domain_en": "Accumulated Wealth, Speech, Family Assets & Food Habits",
        "domain_hi": "संचित धन, वाणी, कुटुंब संपत्ति एवं खान-पान",
        "significator": "JUPITER",
        "icon": "💰",
        "color": "from-amber-500 to-yellow-600"
    },
    {
        "house": 3,
        "name_en": "Sahaja Bhava (3rd House)",
        "name_hi": "सहज भाव (तृतीय भाव - पराक्रम)",
        "domain_en": "Courage, Siblings, Communication, Short Journeys & Initiative",
        "domain_hi": "साहस, पराक्रम, छोटे भाई-बहन, संवाद एवं छोटी यात्राएं",
        "significator": "MARS",
        "icon": "⚔️",
        "color": "from-orange-500 to-red-500"
    },
    {
        "house": 4,
        "name_en": "Sukha Bhava (4th House)",
        "name_hi": "सुख भाव (चतुर्थ भाव - मातृ)",
        "domain_en": "Mother, Home, Land, Vehicles, Peace of Mind & Early Education",
        "domain_hi": "माता, गृह सुख, भूमि, वाहन, मानसिक शांति एवं प्राथमिक शिक्षा",
        "significator": "MOON",
        "icon": "🏠",
        "color": "from-emerald-500 to-teal-600"
    },
    {
        "house": 5,
        "name_en": "Putra Bhava (5th House)",
        "name_hi": "पुत्र भाव (पंचम भाव - ज्ञान व संतान)",
        "domain_en": "Intellect, Children, Purva Punya, Creativity, Romance & Mantras",
        "domain_hi": "बुद्धि, संतान सुख, पूर्व पुण्य, रचनात्मकता एवं मंत्र दीक्षा",
        "significator": "JUPITER",
        "icon": "🎓",
        "color": "from-indigo-500 to-blue-600"
    },
    {
        "house": 6,
        "name_en": "Ripu/Ari Bhava (6th House)",
        "name_hi": "रिपु भाव (षष्ठ भाव - रोग, ऋण, शत्रु)",
        "domain_en": "Debts, Enemies, Health Challenges, Daily Work & Competition",
        "domain_hi": "रोग, शत्रु, ऋण, दैनिक सेवा, प्रतिस्पर्धा एवं कानूनी विजय",
        "significator": "MARS",
        "icon": "🛡️",
        "color": "from-slate-600 to-gray-700"
    },
    {
        "house": 7,
        "name_en": "Kalatra Bhava (7th House)",
        "name_hi": "कलत्र भाव (सप्तम भाव - दांपत्य व साझेदारी)",
        "domain_en": "Spouse, Marriage, Business Partnerships & Foreign Public Ties",
        "domain_hi": "जीवनसाथी, वैवाहिक सुख, व्यापारिक साझेदारी एवं सामाजिक संबंध",
        "significator": "VENUS",
        "icon": "💍",
        "color": "from-pink-500 to-rose-500"
    },
    {
        "house": 8,
        "name_en": "Ayur/Randhra Bhava (8th House)",
        "name_hi": "आयु भाव (अष्टम भाव - गूढ़ ज्ञान व परिवर्तन)",
        "domain_en": "Longevity, Transformation, Hidden Wealth, Occult & Research",
        "domain_hi": "दीर्घायु, अचानक धन लाभ, गूढ़ विद्या, शोध एवं रहस्यमय परिवर्तन",
        "significator": "SATURN",
        "icon": "🔮",
        "color": "from-purple-600 to-indigo-800"
    },
    {
        "house": 9,
        "name_en": "Dharma/Bhagya Bhava (9th House)",
        "name_hi": "भाग्य भाव (नवम भाव - धर्म व गुरु)",
        "domain_en": "Fortune, Father, Higher Wisdom, Guru, Pilgrimage & Spirituality",
        "domain_hi": "भाग्य, पिता, उच्च शिक्षा, गुरु कृपा, तीर्थ यात्रा एवं धर्म",
        "significator": "JUPITER",
        "icon": "🛕",
        "color": "from-amber-600 to-orange-600"
    },
    {
        "house": 10,
        "name_en": "Karma Bhava (10th House)",
        "name_hi": "कर्म भाव (दशम भाव - करियर व प्रतिष्ठा)",
        "domain_en": "Career, Reputation, Government Favors, Authority & Ambition",
        "domain_hi": "करियर, आजीविका, मान-सम्मान, पद-प्रतिष्ठा एवं राजकृपा",
        "significator": "MERCURY",
        "icon": "👑",
        "color": "from-blue-600 to-cyan-700"
    },
    {
        "house": 11,
        "name_en": "Labha Bhava (11th House)",
        "name_hi": "लाभ भाव (एकादश भाव - आय व समृद्धि)",
        "domain_en": "Gains, Desires, Cash Inflows, Elder Siblings & Large Networks",
        "domain_hi": "सर्वतोमुखी लाभ, आय, मनोकामना पूर्ति, बड़े भाई-बहन एवं मित्र मंडली",
        "significator": "JUPITER",
        "icon": "🌟",
        "color": "from-emerald-600 to-green-600"
    },
    {
        "house": 12,
        "name_en": "Vyaya Bhava (12th House)",
        "name_hi": "व्यय भाव (द्वादश भाव - मोक्ष व विदेश)",
        "domain_en": "Expenses, Foreign Lands, Spiritual Liberation (Moksha) & Sleep",
        "domain_hi": "व्यय, विदेश गमन, ध्यान, मोक्ष प्राप्ति, निद्रा सुख एवं आध्यात्मिक साधना",
        "significator": "SATURN",
        "icon": "🕊️",
        "color": "from-violet-600 to-purple-700"
    }
]

def calculate_12_houses_predictions(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    ayanamsa: str = "LAHIRI",
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Calculates comprehensive Parashari Bhavaphala predictions for all 12 Houses (Bhavas),
    including Sign, Cusp degree, Sign Lord, Occupant planets, and detailed actionable guidance.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    selected_mode = AYANAMSA_MODES.get(ayanamsa.upper(), swe.SIDM_LAHIRI)
    swe.set_sid_mode(selected_mode, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    # Calculate 12 House Cusps (Placidus)
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', flags)
    asc_deg = ascmc[0] % 360.0
    asc_sign_info = get_zodiac_sign_info(asc_deg)
    asc_sign_index = asc_sign_info["index"] # 1 to 12

    # Calculate all planetary positions
    planets = []
    for pid, name in [
        (swe.SUN, "Sun"), (swe.MOON, "Moon"), (swe.MARS, "Mars"),
        (swe.MERCURY, "Mercury"), (swe.JUPITER, "Jupiter"),
        (swe.VENUS, "Venus"), (swe.SATURN, "Saturn"), (swe.MEAN_NODE, "Rahu")
    ]:
        res, _ = swe.calc_ut(jd_ut, pid, flags)
        p_deg = res[0] % 360.0
        p_sign_info = get_zodiac_sign_info(p_deg)
        # Whole sign house
        p_house = ((p_sign_info["index"] - asc_sign_index) % 12) + 1
        planets.append({
            "name": name,
            "degree": round(p_deg, 2),
            "sign_index": p_sign_info["index"],
            "sign_name": p_sign_info["name_en"],
            "house": p_house
        })

    # Ketu is opposite Rahu
    rahu_p = next((p for p in planets if p["name"] == "Rahu"), None)
    if rahu_p:
        ketu_deg = (rahu_p["degree"] + 180.0) % 360.0
        k_sign_info = get_zodiac_sign_info(ketu_deg)
        k_house = ((k_sign_info["index"] - asc_sign_index) % 12) + 1
        planets.append({
            "name": "Ketu",
            "degree": round(ketu_deg, 2),
            "sign_index": k_sign_info["index"],
            "sign_name": k_sign_info["name_en"],
            "house": k_house
        })

    houses_results = []
    for i in range(12):
        house_num = i + 1
        meta = HOUSES_METADATA[i]
        cusp_deg = cusps[i] % 360.0
        sign_info = get_zodiac_sign_info(cusp_deg)
        sign_name = translate_entity("signs", sign_info["id"], lang, sign_info["name_en"])
        occupants = [p["name"] for p in planets if p["house"] == house_num]

        # Strength & nature assessment
        has_benefic = any(p in ["Jupiter", "Venus", "Moon", "Mercury"] for p in occupants)
        has_malefic = any(p in ["Saturn", "Mars", "Rahu", "Ketu"] for p in occupants)
        score = 85 if has_benefic and not has_malefic else (75 if not occupants else (70 if has_malefic and has_benefic else 65))

        from app.locales.content_translator import generate_house_prediction_i18n, get_sign_i18n, get_planet_i18n, normalize_lang
        clean_l = normalize_lang(lang)
        h_pred_data = generate_house_prediction_i18n(
            house_num=house_num,
            house_name_en=meta["name_en"],
            sign_name_en=sign_info["name_en"],
            sign_lord_en=sign_info["ruler"],
            domain_en=meta["domain_en"],
            occupants=occupants,
            score=score,
            lang=clean_l
        )
        pred = h_pred_data["prediction"]
        remedy = h_pred_data["remedy"]

        houses_results.append({
            "house": house_num,
            "name": meta["name_hi"] if clean_l == "hi" else meta["name_en"],
            "name_en": meta["name_en"],
            "name_hi": meta["name_hi"],
            "domain": meta["domain_hi"] if clean_l == "hi" else meta["domain_en"],
            "sign": get_sign_i18n(sign_info["id"], clean_l),
            "sign_lord": get_planet_i18n(sign_info["ruler"], clean_l),
            "cusp_degree": round(cusp_deg, 2),
            "occupant_planets": occupants,
            "significator": meta["significator"],
            "icon": meta["icon"],
            "color": meta["color"],
            "potency_score": score,
            "prediction": pred,
            "remedy": remedy
        })

    return {
        "ascendant": {
            "sign": translate_entity("signs", asc_sign_info["id"], lang, asc_sign_info["name_en"]),
            "degree": round(asc_deg, 2)
        },
        "total_houses": 12,
        "houses": houses_results
    }
