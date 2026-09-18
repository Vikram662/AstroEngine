import swisseph as swe
from typing import Dict, Any, List
from app.core.swisseph import calculate_julian_day, ZODIAC_SIGNS
from app.locales.i18n import translate_entity

GEMSTONE_CATALOG = {
    "SUN": {"stone_en": "Ruby", "stone_hi": "माणिक्य (Ruby)", "metal": "Gold / Copper", "finger": "Ring Finger", "day": "Sunday"},
    "MOON": {"stone_en": "Pearl", "stone_hi": "मोती (Pearl)", "metal": "Silver", "finger": "Little Finger", "day": "Monday"},
    "MARS": {"stone_en": "Red Coral", "stone_hi": "मूंगा (Red Coral)", "metal": "Gold / Copper", "finger": "Ring Finger", "day": "Tuesday"},
    "MERCURY": {"stone_en": "Emerald", "stone_hi": "पन्ना (Emerald)", "metal": "Gold / Bronze", "finger": "Little Finger", "day": "Wednesday"},
    "JUPITER": {"stone_en": "Yellow Sapphire", "stone_hi": "पुखराज (Yellow Sapphire)", "metal": "Gold", "finger": "Index Finger", "day": "Thursday"},
    "VENUS": {"stone_en": "Diamond / White Sapphire", "stone_hi": "हीरा / ओपल (Diamond)", "metal": "Platinum / Silver", "finger": "Middle / Little Finger", "day": "Friday"},
    "SATURN": {"stone_en": "Blue Sapphire", "stone_hi": "नीलम (Blue Sapphire)", "metal": "Panchdhatu / Iron", "finger": "Middle Finger", "day": "Saturday"},
    "RAHU": {"stone_en": "Hessonite (Gomed)", "stone_hi": "गोमेद (Hessonite)", "metal": "Silver / Ashtadhatu", "finger": "Middle Finger", "day": "Saturday"},
    "KETU": {"stone_en": "Cat's Eye (Lehsunia)", "stone_hi": "लहसुनिया (Cat's Eye)", "metal": "Silver / Gold", "finger": "Ring Finger", "day": "Thursday/Tuesday"}
}

RUDRAKSHA_CATALOG = {
    1: {"ruling_planet": "SUN", "benefits": "Leadership, vitality, spiritual focus, ego balance."},
    2: {"ruling_planet": "MOON", "benefits": "Emotional stability, mental peace, harmonious relations."},
    3: {"ruling_planet": "MARS", "benefits": "Courage, energy, freedom from past guilt and anger."},
    4: {"ruling_planet": "MERCURY", "benefits": "Intellect, speech, memory power, analytical clarity."},
    5: {"ruling_planet": "JUPITER", "benefits": "Wisdom, wealth, health, spiritual awakening."},
    6: {"ruling_planet": "VENUS", "benefits": "Attraction, artistic gifts, stamina, love life."},
    7: {"ruling_planet": "SATURN", "benefits": "Prosperity, protection from Shani dosha, overcoming obstacles."},
    8: {"ruling_planet": "RAHU", "benefits": "Removes sudden hurdles, enhances intuition and mystery mastery."},
    9: {"ruling_planet": "KETU", "benefits": "Fearlessness, detachment from negativity, divine protection."},
    10: {"ruling_planet": "ALL_PLANETS", "benefits": "Navagraha pacification, aura shield, removes black magic fears."},
    11: {"ruling_planet": "MARS_HANUMAN", "benefits": "Physical strength, judgment clarity, fearlessness."},
    12: {"ruling_planet": "SUN", "benefits": "Charisma, administrative power, fame and radiant health."},
    13: {"ruling_planet": "VENUS_KAMADEVA", "benefits": "Attraction, business negotiation success, luxury."},
    14: {"ruling_planet": "SATURN_SHIVA", "benefits": "Ajna chakra awakening, supreme protection, intuitive foresight."}
}

PLANETARY_MANTRAS = {
    "SUN": {"mantra": "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः", "beej_mantra": "ॐ घृणिः सूर्याय नमः", "recitations": 7000},
    "MOON": {"mantra": "ॐ श्रां श्रीं श्रौं सः चंद्रमसे नमः", "beej_mantra": "ॐ सों सोमाय नमः", "recitations": 11000},
    "MARS": {"mantra": "ॐ क्रां क्रीं क्रौं सः भौमाय नमः", "beej_mantra": "ॐ अं अंगारकाय नमः", "recitations": 10000},
    "MERCURY": {"mantra": "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः", "beej_mantra": "ॐ बुं बुधाय नमः", "recitations": 9000},
    "JUPITER": {"mantra": "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः", "beej_mantra": "ॐ बृं बृहस्पतये नमः", "recitations": 19000},
    "VENUS": {"mantra": "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः", "beej_mantra": "ॐ शुं शुक्राय नमः", "recitations": 16000},
    "SATURN": {"mantra": "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः", "beej_mantra": "ॐ शं शनैश्चराय नमः", "recitations": 23000},
    "RAHU": {"mantra": "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः", "beej_mantra": "ॐ रां राहवे नमः", "recitations": 18000},
    "KETU": {"mantra": "ॐ स्रां स्रीं स्रौं सः केतवे नमः", "beej_mantra": "ॐ कें केतवे नमः", "recitations": 17000},
}

def calculate_gemstone_recommendations(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Recommend Vedic Gemstones:
    - Life Stone (Lagna Lord)
    - Lucky Stone (9th House Lord of Bhagya)
    - Benefic Stone (5th House Lord of Purva Punya)
    With explicit Maraka (2nd/7th house) and Badhaka warnings.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags)
    asc_deg = ascmc[0]
    asc_sign_idx = int((asc_deg % 360.0) // 30.0) # 0 to 11

    # House lords: Lagna (1st), 5th, 9th
    lagna_lord = ZODIAC_SIGNS[asc_sign_idx]["ruler"]
    fifth_lord = ZODIAC_SIGNS[(asc_sign_idx + 4) % 12]["ruler"]
    ninth_lord = ZODIAC_SIGNS[(asc_sign_idx + 8) % 12]["ruler"]

    # Maraka lords (2nd and 7th)
    maraka_2 = ZODIAC_SIGNS[(asc_sign_idx + 1) % 12]["ruler"]
    maraka_7 = ZODIAC_SIGNS[(asc_sign_idx + 6) % 12]["ruler"]
    maraka_planets = list(set([maraka_2, maraka_7]))

    def get_gem_meta(planet: str):
        meta = GEMSTONE_CATALOG.get(planet, GEMSTONE_CATALOG["SUN"])
        stone_name = meta["stone_hi"] if lang == "hi" else meta["stone_en"]
        p_name = translate_entity("planets", planet, lang, planet.capitalize())
        return {
            "planet": p_name,
            "gemstone": stone_name,
            "wearing_finger": meta["finger"],
            "metal": meta["metal"],
            "auspicious_day": meta["day"],
            "is_maraka_conflict": planet in maraka_planets
        }

    return {
        "ascendant_sign": ZODIAC_SIGNS[asc_sign_idx]["id"],
        "life_stone": {
            "type": "Life Stone (Lagna Lord)",
            "significance": "Enhances overall vitality, longevity, immunity and personal aura.",
            **get_gem_meta(lagna_lord)
        },
        "lucky_stone": {
            "type": "Lucky Stone (9th Lord of Fortune)",
            "significance": "Activates luck, divine grace, higher wisdom, and destiny support.",
            **get_gem_meta(ninth_lord)
        },
        "benefic_stone": {
            "type": "Benefic Stone (5th Lord of Intellect)",
            "significance": "Boosts intellect, education, creativity, memory and past merits.",
            **get_gem_meta(fifth_lord)
        },
        "maraka_caution": {
            "maraka_lords": maraka_planets,
            "warning": "Avoid stones of 2nd/7th lords if undergoing Maraka dasha or critical health phases."
        }
    }

def get_rudraksha_recommendations(lagna_lord: str) -> List[Dict[str, Any]]:
    """Recommend 1 to 14 Mukhi Rudraksha based on planetary needs."""
    recs = []
    for mukhi, data in RUDRAKSHA_CATALOG.items():
        if data["ruling_planet"] in [lagna_lord, "ALL_PLANETS"]:
            recs.append({
                "mukhi": f"{mukhi} Mukhi",
                "ruling_planet": data["ruling_planet"],
                "benefits": data["benefits"]
            })
    # Always include 5 Mukhi as universal benefic
    if not any(r["mukhi"] == "5 Mukhi" for r in recs):
        recs.append({
            "mukhi": "5 Mukhi",
            "ruling_planet": "JUPITER",
            "benefits": RUDRAKSHA_CATALOG[5]["benefits"]
        })
    return recs

def get_planetary_mantras_list() -> Dict[str, Any]:
    """Provide Vedic & Tantrik Beej Mantras with chanting frequencies."""
    return PLANETARY_MANTRAS
