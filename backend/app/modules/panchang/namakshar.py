"""
Namakshar & Baby Naming Engine based on Vedic Nakshatra Pada syllables,
Rashi, Nakshatra deities, and Numerology vibrations.
"""
import swisseph as swe
from typing import Dict, Any, List
from app.core.swisseph import calculate_julian_day, get_nakshatra_info, get_zodiac_sign_info
from app.locales.i18n import translate_entity

# Complete 27 Nakshatras with 4 Pada Syllables (108 Akshars)
NAKSHATRA_SYLLABLES = {
    "ASHWINI": {
        "syllables": ["Chu (चू)", "Che (चे)", "Cho (चो)", "Laa (ला)"],
        "letters": ["Ch", "L"],
        "deity": "Ashwini Kumaras",
        "symbol": "Horse Head",
        "gender": "Male"
    },
    "BHARANI": {
        "syllables": ["Lee (ली)", "Lu (लू)", "Le (ले)", "Lo (लो)"],
        "letters": ["L"],
        "deity": "Yama",
        "symbol": "Yoni / Triangle",
        "gender": "Female"
    },
    "KRITTIKA": {
        "syllables": ["Aa (आ)", "Ee (ई)", "U (उ)", "Ay (ए)"],
        "letters": ["A", "I", "U", "E"],
        "deity": "Agni",
        "symbol": "Knife / Flame",
        "gender": "Female"
    },
    "ROHINI": {
        "syllables": ["O (ओ)", "Vaa (वा)", "Vee (वी)", "Vu (वू)"],
        "letters": ["O", "V", "W"],
        "deity": "Brahma",
        "symbol": "Cart / Chariot",
        "gender": "Female"
    },
    "MRIGASHIRA": {
        "syllables": ["Ve (वे)", "Vo (वो)", "Kaa (का)", "Kee (की)"],
        "letters": ["V", "W", "K"],
        "deity": "Soma (Chandra)",
        "symbol": "Deer Head",
        "gender": "Neutral"
    },
    "ARDRA": {
        "syllables": ["Koo (कू)", "Gha (घ)", "Nga (ङ)", "Chha (छ)"],
        "letters": ["K", "Gh", "Chh"],
        "deity": "Rudra",
        "symbol": "Teardrop / Diamond",
        "gender": "Female"
    },
    "PUNARVASU": {
        "syllables": ["Ke (के)", "Ko (को)", "Haa (हा)", "Hee (ही)"],
        "letters": ["K", "H"],
        "deity": "Aditi",
        "symbol": "Bow and Quiver",
        "gender": "Male"
    },
    "PUSHYA": {
        "syllables": ["Hoo (हू)", "He (हे)", "Ho (हो)", "Daa (डा)"],
        "letters": ["H", "D"],
        "deity": "Brihaspati",
        "symbol": "Flower / Cow Udder",
        "gender": "Male"
    },
    "ASHLESHA": {
        "syllables": ["Dee (डी)", "Doo (डू)", "De (डे)", "Do (डो)"],
        "letters": ["D"],
        "deity": "Sarpa (Nagas)",
        "symbol": "Coiled Serpent",
        "gender": "Female"
    },
    "MAGHA": {
        "syllables": ["Maa (मा)", "Mee (मी)", "Moo (मू)", "Me (मे)"],
        "letters": ["M"],
        "deity": "Pitras (Ancestors)",
        "symbol": "Royal Throne",
        "gender": "Female"
    },
    "PURVA_PHALGUNI": {
        "syllables": ["Mo (मो)", "Taa (टा)", "Tee (टी)", "Too (टू)"],
        "letters": ["M", "T"],
        "deity": "Bhaga",
        "symbol": "Hammock / Front Legs of Bed",
        "gender": "Female"
    },
    "UTTARA_PHALGUNI": {
        "syllables": ["Te (टे)", "To (टो)", "Paa (पा)", "Pee (पी)"],
        "letters": ["T", "P"],
        "deity": "Aryaman",
        "symbol": "Back Legs of Bed",
        "gender": "Female"
    },
    "HASTA": {
        "syllables": ["Poo (पू)", "Sha (ष)", "Na (ण)", "Ttha (ठ)"],
        "letters": ["P", "Sh"],
        "deity": "Savitar (Sun)",
        "symbol": "Open Hand / Palm",
        "gender": "Male"
    },
    "CHITRA": {
        "syllables": ["Pe (पे)", "Po (पो)", "Raa (रा)", "Ree (री)"],
        "letters": ["P", "R"],
        "deity": "Twashtar (Vishwakarma)",
        "symbol": "Bright Pearl / Jewel",
        "gender": "Female"
    },
    "SWATI": {
        "syllables": ["Roo (रू)", "Re (रे)", "Ro (रो)", "Taa (ता)"],
        "letters": ["R", "T"],
        "deity": "Vayu",
        "symbol": "Young Shoot / Coral",
        "gender": "Female"
    },
    "VISHAKHA": {
        "syllables": ["Tee (ती)", "Too (तू)", "Te (ते)", "To (तो)"],
        "letters": ["T"],
        "deity": "Indra-Agni",
        "symbol": "Triumphal Arch",
        "gender": "Female"
    },
    "ANURADHA": {
        "syllables": ["Naa (ना)", "Nee (नी)", "Noo (नू)", "Ne (ने)"],
        "letters": ["N"],
        "deity": "Mitra",
        "symbol": "Lotus Flower",
        "gender": "Male"
    },
    "JYESHTHA": {
        "syllables": ["No (नो)", "Yaa (या)", "Yee (यी)", "Yoo (यू)"],
        "letters": ["N", "Y"],
        "deity": "Indra",
        "symbol": "Round Talisman / Earring",
        "gender": "Female"
    },
    "MULA": {
        "syllables": ["Ye (ये)", "Yo (यो)", "Bhaa (भा)", "Bhee (भी)"],
        "letters": ["Y", "Bh", "B"],
        "deity": "Nirriti",
        "symbol": "Tied Bunch of Roots",
        "gender": "Neutral"
    },
    "PURVA_ASHADHA": {
        "syllables": ["Bhoo (भू)", "Dhaa (धा)", "Pha (फा)", "Dha (ढा)"],
        "letters": ["Bh", "Dh", "Ph"],
        "deity": "Apas (Water)",
        "symbol": "Elephant Tusk / Fan",
        "gender": "Female"
    },
    "UTTARA_ASHADHA": {
        "syllables": ["Bhe (भे)", "Bho (भो)", "Jaa (जा)", "Jee (जी)"],
        "letters": ["Bh", "J"],
        "deity": "Vishvadevas",
        "symbol": "Small Cot / Planks",
        "gender": "Female"
    },
    "SHRAVANA": {
        "syllables": ["Khee (खी)", "Khoo (खू)", "Khe (खे)", "Kho (खो)"],
        "letters": ["Kh", "J"],
        "deity": "Vishnu",
        "symbol": "Three Footprints / Ear",
        "gender": "Male"
    },
    "DHANISHTHA": {
        "syllables": ["Gaa (गा)", "Gee (गी)", "Goo (गू)", "Ge (गे)"],
        "letters": ["G"],
        "deity": "Eight Vasus",
        "symbol": "Musical Drum (Mridangam)",
        "gender": "Female"
    },
    "SHATABHISHA": {
        "syllables": ["Go (गो)", "Saa (सा)", "See (सी)", "Soo (सू)"],
        "letters": ["G", "S"],
        "deity": "Varuna",
        "symbol": "Empty Circle / 100 Physicians",
        "gender": "Neutral"
    },
    "PURVA_BHADRAPADA": {
        "syllables": ["Se (से)", "So (सो)", "Daa (दा)", "Dee (दी)"],
        "letters": ["S", "D"],
        "deity": "Aja Ekapada",
        "symbol": "Two Front Legs of Funeral Cot",
        "gender": "Male"
    },
    "UTTARA_BHADRAPADA": {
        "syllables": ["Doo (दू)", "Tha (थ)", "Jha (झ)", "Nga (ञ)"],
        "letters": ["D", "Th", "Jh"],
        "deity": "Ahirbudhnya",
        "symbol": "Two Back Legs of Funeral Cot",
        "gender": "Male"
    },
    "REVATI": {
        "syllables": ["De (दे)", "Do (दो)", "Chaa (चा)", "Chee (ची)"],
        "letters": ["D", "Ch"],
        "deity": "Pushan",
        "symbol": "Fish / Drum",
        "gender": "Female"
    }
}

def calculate_namakshar_and_naming(
    dob: str,
    tob: str,
    tz: float,
    lat: float,
    lon: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Calculates the exact baby name syllable (Namakshar) based on Moon's Janma Nakshatra and Pada,
    along with recommended starting letters, Rashi, deity, and lucky numerological Mulank.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    # Calculate Moon position
    moon_res, _ = swe.calc_ut(jd_ut, swe.MOON, flags)
    moon_lon = moon_res[0] % 360.0

    nak_info = get_nakshatra_info(moon_lon)
    sign_info = get_zodiac_sign_info(moon_lon)

    nak_id = nak_info["id"]
    pada = nak_info["pada"] # 1 to 4

    meta = NAKSHATRA_SYLLABLES.get(nak_id, {
        "syllables": ["A", "B", "C", "D"],
        "letters": ["A"],
        "deity": "Divine",
        "symbol": "Star",
        "gender": "Neutral"
    })

    chosen_syllable = meta["syllables"][pada - 1] if 1 <= pada <= 4 else meta["syllables"][0]

    # Calculate Mulank (Birth Day sum)
    day_num = int(dob.split("-")[2])
    mulank = day_num % 9 or 9

    rashi_name = translate_entity("signs", sign_info["id"], lang, sign_info["name_en"])
    nak_name = translate_entity("nakshatras", nak_info["id"], lang, nak_info["name_en"])

    if lang == "hi":
        verdict = (
            f"शिशु का जन्म {rashi_name} राशि और {nak_name} नक्षत्र के {pada} चरण में हुआ है। "
            f"शास्त्रसम्मत नामाक्षर '{chosen_syllable}' प्राप्त हुआ है। "
            f"इस नामाक्षर से नामकरण करने पर जातक को नक्षत्र स्वामी और राशि स्वामी की विशेष कृपा प्राप्त होती है।"
        )
    else:
        verdict = (
            f"The baby is born in {rashi_name} sign and {nak_name} Nakshatra in Pada {pada}. "
            f"The primary auspicious name syllable (Namakshar) is '{chosen_syllable}'. "
            f"Naming the child with this syllable channels positive cosmic energy from the ruling deity {meta['deity']}."
        )

    return {
        "primary_namakshar": chosen_syllable,
        "recommended_starting_letters": meta["letters"],
        "all_pada_syllables": meta["syllables"],
        "nakshatra": {
            "name": nak_name,
            "id": nak_info["id"],
            "pada": pada,
            "lord": nak_info["lord"],
            "deity": meta["deity"],
            "symbol": meta["symbol"]
        },
        "rashi": {
            "name": rashi_name,
            "id": sign_info["id"],
            "index": sign_info["index"],
            "ruler": sign_info["ruler"]
        },
        "mulank_birth_number": mulank,
        "verdict": verdict
    }
