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

    # Multilingual Gemstone Names Catalog
    GEMSTONE_NAMES_I18N = {
        "SUN": {"en": "Ruby", "hi": "माणिक्य (Ruby)", "ta": "மாணிக்கம் (Ruby)", "te": "కెంపు (Ruby)", "bn": "চুনি (Ruby)"},
        "MOON": {"en": "Pearl", "hi": "मोती (Pearl)", "ta": "முத்து (Pearl)", "te": "ముత్యం (Pearl)", "bn": "মুক্তো (Pearl)"},
        "MARS": {"en": "Red Coral", "hi": "मूँगा (Red Coral)", "ta": "பவளம் (Red Coral)", "te": "పగడం (Red Coral)", "bn": "পলা (Red Coral)"},
        "MERCURY": {"en": "Emerald", "hi": "पन्ना (Emerald)", "ta": "மரகதம் (Emerald)", "te": "మరకతం / పచ్చ (Emerald)", "bn": "পান্না (Emerald)"},
        "JUPITER": {"en": "Yellow Sapphire", "hi": "पुखराज (Yellow Sapphire)", "ta": "புஷ்பராகம் (Yellow Sapphire)", "te": "పుష్యరాగం (Yellow Sapphire)", "bn": "পোখরাজ (Yellow Sapphire)"},
        "VENUS": {"en": "Diamond / White Sapphire", "hi": "हीरा / ओपल (Diamond)", "ta": "வைரம் (Diamond)", "te": "వజ్రం (Diamond)", "bn": "হীরে (Diamond)"},
        "SATURN": {"en": "Blue Sapphire", "hi": "नीलम (Blue Sapphire)", "ta": "நீலக்கல் (Blue Sapphire)", "te": "నీలం (Blue Sapphire)", "bn": "নীলা (Blue Sapphire)"},
        "RAHU": {"en": "Hessonite (Gomed)", "hi": "गोमेद (Hessonite)", "ta": "கோமேதகம் (Hessonite)", "te": "గోమేధికం (Hessonite)", "bn": "গোমেদ (Hessonite)"},
        "KETU": {"en": "Cat's Eye (Lehsunia)", "hi": "लहसुनिया (Cat's Eye)", "ta": "வைடூரியம் (Cat's Eye)", "te": "వైడూర్యం (Cat's Eye)", "bn": "বৈদূর্য (Cat's Eye)"}
    }

    def get_gem_meta(planet: str):
        meta = GEMSTONE_CATALOG.get(planet, GEMSTONE_CATALOG["SUN"])
        names_dict = GEMSTONE_NAMES_I18N.get(planet, {"en": meta["stone_en"]})
        stone_name = names_dict.get(lang, names_dict.get("en", meta["stone_en"]))
        p_name = translate_entity("planets", planet, lang, planet.capitalize())
        return {
            "planet_id": planet,
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

def calculate_gemstone_restrictions(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float
) -> Dict[str, Any]:
    """
    Module 9 — Endpoint 72:
    Maraka, Badhaka, and 6th/8th/12th Dusthana Gemstone Conflict Restrictions.
    Classical BPHS principle: Never wear gemstones of functional malefics or marakas.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags)
    asc_deg = ascmc[0]
    asc_sign_idx = int((asc_deg % 360.0) // 30.0) # 0 to 11

    # Maraka lords (2nd and 7th)
    maraka_2 = ZODIAC_SIGNS[(asc_sign_idx + 1) % 12]["ruler"]
    maraka_7 = ZODIAC_SIGNS[(asc_sign_idx + 6) % 12]["ruler"]

    # Badhaka house: Movable (11th), Fixed (9th), Dual (7th)
    mod3 = asc_sign_idx % 3
    if mod3 == 0:    # Movable (Aries, Cancer, Libra, Cap) -> 11th house
        badhaka_house = 11
    elif mod3 == 1:  # Fixed (Taurus, Leo, Scorpio, Aqua) -> 9th house
        badhaka_house = 9
    else:            # Dual (Gemini, Virgo, Sag, Pisces) -> 7th house
        badhaka_house = 7
    badhaka_lord = ZODIAC_SIGNS[(asc_sign_idx + badhaka_house - 1) % 12]["ruler"]

    # Dusthana lords (6th, 8th, 12th)
    dusthana_6 = ZODIAC_SIGNS[(asc_sign_idx + 5) % 12]["ruler"]
    dusthana_8 = ZODIAC_SIGNS[(asc_sign_idx + 7) % 12]["ruler"]
    dusthana_12 = ZODIAC_SIGNS[(asc_sign_idx + 11) % 12]["ruler"]

    restricted_planets = list(set([maraka_2, maraka_7, badhaka_lord, dusthana_6, dusthana_8, dusthana_12]))
    
    # Lagna lord should not be strictly prohibited unless dual rulership complicates it
    lagna_lord = ZODIAC_SIGNS[asc_sign_idx]["ruler"]
    if lagna_lord in restricted_planets and lagna_lord not in [maraka_2, maraka_7]:
        restricted_planets.remove(lagna_lord)

    prohibitions = []
    for p in restricted_planets:
        gem = GEMSTONE_CATALOG.get(p, {})
        reasons = []
        if p in [maraka_2, maraka_7]:
            reasons.append("Maraka lord (harbinger of health crisis / loss of vitality)")
        if p == badhaka_lord:
            reasons.append(f"Badhakesh (Lord of obstruction from {badhaka_house}th house)")
        if p in [dusthana_6, dusthana_8, dusthana_12]:
            reasons.append("Trika / Dusthana ruler (6th/8th/12th trik houses of debts, chronic ailments, or losses)")

        prohibitions.append({
            "planet": p,
            "gemstone": gem.get("stone_en", ""),
            "severity": "STRICTLY_PROHIBITED" if p in [maraka_2, maraka_7] else "AVOID",
            "conflict_reasons": reasons
        })

    return {
        "ascendant_sign": ZODIAC_SIGNS[asc_sign_idx]["id"],
        "badhaka_house": badhaka_house,
        "badhaka_lord": badhaka_lord,
        "maraka_lords": list(set([maraka_2, maraka_7])),
        "restricted_gemstones_count": len(prohibitions),
        "prohibitions": prohibitions
    }

YANTRAS_CATALOG = {
    "SUN": {"name": "Surya Yantra", "purpose": "Charisma, health, vitality, paternal harmony", "metal": "Copper / Gold", "mantra": "Om Hram Hreem Hroum Sah Suryaya Namah"},
    "MOON": {"name": "Chandra Yantra", "purpose": "Emotional stability, mental peace, mother well-being", "metal": "Silver", "mantra": "Om Shram Shreem Shroum Sah Chandramase Namah"},
    "MARS": {"name": "Mangal Yantra", "purpose": "Courage, land acquisition, blood purification", "metal": "Copper", "mantra": "Om Kram Kreem Kroum Sah Bhaumaya Namah"},
    "MERCURY": {"name": "Budha Yantra", "purpose": "Intellect, business acumen, communication prowess", "metal": "Bronze / Silver", "mantra": "Om Bram Breem Broum Sah Budhaya Namah"},
    "JUPITER": {"name": "Brihaspati Yantra", "purpose": "Wisdom, wealth, progeny blessing, spiritual elevation", "metal": "Gold / Brass", "mantra": "Om Gram Greem Groum Sah Gurave Namah"},
    "VENUS": {"name": "Shukra Yantra", "purpose": "Marital harmony, artistic beauty, wealth attraction", "metal": "Silver", "mantra": "Om Dram Dreem Droum Sah Shukraya Namah"},
    "SATURN": {"name": "Shani Yantra", "purpose": "Removes hurdles, pacifies Sade Sati, disciplined success", "metal": "Iron / Lead", "mantra": "Om Pram Preem Proum Sah Shanaishcharaya Namah"},
    "RAHU": {"name": "Rahu Yantra", "purpose": "Removes illusions, hidden enemies, foreign opportunities", "metal": "Ashtadhatu", "mantra": "Om Bhram Bhreem Bhroum Sah Rahave Namah"},
    "KETU": {"name": "Ketu Yantra", "purpose": "Spiritual liberation, protection from accidents and phobias", "metal": "Panchdhatu", "mantra": "Om Sram Sreem Sroum Sah Ketave Namah"},
    "MAHALAKSHMI": {"name": "Shri Yantra", "purpose": "Supreme prosperity, abundance, and cosmic equilibrium", "metal": "Gold / Silver Plate", "mantra": "Om Shreem Hreem Shreem Kamale Kamalalaye Praseed"}
}

DONATIONS_CATALOG = {
    "SUN": {"items": ["Wheat", "Ruby/Copper", "Jaggery", "Red cloth", "Saffron"], "recipient": "Temple priest or venerable elders", "best_day": "Sunday morning", "time": "Sunrise"},
    "MOON": {"items": ["Rice", "Milk", "Silver", "White flowers", "Conch shell"], "recipient": "Needy women or elderly motherly figures", "best_day": "Monday evening", "time": "Dusk / Sunset"},
    "MARS": {"items": ["Red lentils (Masoor Dal)", "Copper vessels", "Jaggery", "Red vermillion"], "recipient": "Celibates, military veterans, or blood donation", "best_day": "Tuesday noon", "time": "Midday"},
    "MERCURY": {"items": ["Green Moong Dal", "Green cloth", "Bronze", "Books/Educational supplies"], "recipient": "Needy students, young girls, or orphanages", "best_day": "Wednesday morning", "time": "Morning"},
    "JUPITER": {"items": ["Chana Dal (Chickpeas)", "Turmeric", "Yellow cloth", "Gold/Brass", "Religious scriptures"], "recipient": "Scholars, teachers, Brahmins, spiritual mentors", "best_day": "Thursday morning", "time": "Sunrise"},
    "VENUS": {"items": ["Kheer (Sweet Rice Pudding)", "White clothes", "Perfumes", "Camphor", "Silver"], "recipient": "Blind people, indigent girls, or artists", "best_day": "Friday morning", "time": "Morning"},
    "SATURN": {"items": ["Mustard Oil", "Black Urad Dal", "Iron/Black footwear", "Black sesame seeds", "Blankets"], "recipient": "Manual laborers, handicapped persons, lepers", "best_day": "Saturday twilight", "time": "Sunset"},
    "RAHU": {"items": ["Coconut", "Blue/Black cloth", "Radish", "Coins", "Mustard seeds"], "recipient": "Lepers, sweepers, or flow into running river", "best_day": "Saturday late evening", "time": "Night"},
    "KETU": {"items": ["Multi-colored blanket", "Sesame seeds", "Banana", "Feed stray street dogs"], "recipient": "Monks, hermits, street dogs", "best_day": "Tuesday early morning", "time": "Brahma Muhurta"}
}

FASTING_CATALOG = {
    "SUNDAY": {"deity": "Surya Bhagavan", "benefits": "Cures bone/eye disorders, enhances executive power and vitality.", "rules": "Avoid salt, consume wheat and jaggery porridge once a day."},
    "MONDAY": {"deity": "Lord Shiva & Chandra", "benefits": "Calms mental anxiety, blesses with marital peace and gentle disposition.", "rules": "Consume fruits, milk, Sabudana, worship Shivling with water/milk."},
    "TUESDAY": {"deity": "Lord Hanuman & Mangal", "benefits": "Neutralizes Manglik dosha, bestows courage and debt clearance.", "rules": "Observe fast without salt; consume halwa or roti with jaggery once."},
    "WEDNESDAY": {"deity": "Lord Ganesha & Budha", "benefits": "Sharpens commercial intelligence, removes speech speech impediments and business stagnation.", "rules": "Consume green mung preparations, offer Durva grass to Ganesha."},
    "THURSDAY": {"deity": "Lord Brihaspati & Vishnu", "benefits": "Removes delayed marriage hurdles, blesses with wealth, children, and wisdom.", "rules": "Avoid salt, wash hair/clothes strictly prohibited, consume yellow food once."},
    "FRIDAY": {"deity": "Goddess Lakshmi & Shukra", "benefits": "Attracts material luxury, aesthetic happiness, and marital bliss.", "rules": "Avoid sour foods and curds, consume kheer or milk preparations in evening."},
    "SATURDAY": {"deity": "Lord Shani & Hanuman", "benefits": "Shields against Sade Sati, accidents, chronic afflictions, and poverty.", "rules": "Fast until sunset, eat khichdi or sesame dishes after dusk under Peepal tree."}
}

def get_yantras_recommendations(lagna_lord: str) -> Dict[str, Any]:
    """Prescribe primary and wealth Yantras based on Lagna Lord."""
    primary_yantra = YANTRAS_CATALOG.get(lagna_lord, YANTRAS_CATALOG["SUN"])
    wealth_yantra = YANTRAS_CATALOG["MAHALAKSHMI"]
    return {
        "primary_planetary_yantra": primary_yantra,
        "cosmic_abundance_yantra": wealth_yantra,
        "installation_guide": "Install on a clean wooden pedestal facing East or North on an auspicious sunrise after bathing the yantra in Panchamrit and Gangajal."
    }

def get_donations_recommendations(lagna_lord: str) -> Dict[str, Any]:
    """Recommend Daan / Charity items based on Maraka / Malefic afflictions and universal benefic."""
    return {
        "lagna_enhancement": DONATIONS_CATALOG.get(lagna_lord, DONATIONS_CATALOG["JUPITER"]),
        "karmic_purgation_saturday": DONATIONS_CATALOG["SATURN"],
        "shadow_node_pacification": DONATIONS_CATALOG["RAHU"]
    }

def get_fasting_recommendations(dob: str, tob: str, tz: float) -> Dict[str, Any]:
    """Prescribe Weekly Vrat schedule and Ekadashi guidelines."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    w_idx = int((jd_ut + 1.5) % 7) # 0=Sunday, 1=Monday...
    weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
    birth_day = weekdays[w_idx]

    return {
        "janma_vaar": birth_day,
        "recommended_weekly_vrat": FASTING_CATALOG[birth_day],
        "universal_vrat": {
            "vrat_type": "Ekadashi Vrat (11th Tithi)",
            "significance": "Cleanses karmic toxins, grants highest spiritual elevation and Lord Vishnu's grace.",
            "rules": "Avoid all grains and cereals, consume fruits, milk and water."
        }
    }

