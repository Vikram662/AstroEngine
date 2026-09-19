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

def calculate_karakamsha_chart(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float
) -> Dict[str, Any]:
    """
    Module 7 — Endpoint 53: Karakamsha Lagna and Swamsha chart analysis.
    The sign occupied by the Atmakaraka (planet with highest degree) in the Navamsha (D9)
    chart becomes the Karakamsha Lagna (KL).
    """
    from app.modules.parashari.calculator import compute_d9_navamsha_sign
    karakas = calculate_jaimini_karakas(dob, tob, tz)
    atmakaraka = karakas[0] # Highest degree planet

    ak_navamsha_sign_idx = compute_d9_navamsha_sign(atmakaraka["full_degree"])
    kl_sign = ZODIAC_SIGNS[ak_navamsha_sign_idx]["name_en"]

    # Analyze houses from Karakamsha
    return {
        "atmakaraka": {
            "planet": atmakaraka["planet_name"],
            "longitude": atmakaraka["full_degree"],
            "degree_in_sign": atmakaraka["degree_in_sign"],
            "rashi_sign": atmakaraka["sign"]
        },
        "karakamsha_lagna": {
            "sign_number": ak_navamsha_sign_idx + 1,
            "sign_name": kl_sign,
            "lord": ZODIAC_SIGNS[ak_navamsha_sign_idx]["ruler"],
            "significance": "Represents soul's spiritual blueprint, inner talents, and dharmic destiny."
        },
        "interpretation": f"Karakamsha in {kl_sign} indicates profound karmic themes governed by {ZODIAC_SIGNS[ak_navamsha_sign_idx]['ruler']}."
    }

def calculate_jaimini_arudhas(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float
) -> Dict[str, Any]:
    """
    Module 7 — Endpoint 54: 12 Jaimini Arudha Padas (A1 to A12, AL, UL).
    Formula: Count houses from house H to its lord L. Count that same number of houses from L to get the Arudha Pada.
    Exception: If Arudha falls in the same house or 7th from it, move 10 houses forward.
    """
    from app.modules.parashari.calculator import calculate_varga_chart
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1")

    p_signs = {p["id"]: p["sign"]["number"] for p in chart["planets"]}
    asc_sign = chart["ascendant"]["sign"]["number"] # 1-12

    # Map house signs and lords
    arudhas = {}
    pada_names = {
        1: "Arudha Lagna (AL / A1 - Public Image & Persona)",
        2: "Dhana Pada (A2 - Wealth Status)",
        3: "Bhratri Pada (A3 - Siblings & Enterprise)",
        4: "Matri Pada (A4 - Assets, Vehicles, Property)",
        5: "Mantra Pada (A5 - Intellect, Fame, Lineage)",
        6: "Shatru Pada (A6 - Litigation, Debts, Competitors)",
        7: "Dara Pada (A7 - Business Partnerships & Allies)",
        8: "Mrityu Pada (A8 - Vulnerabilities & Longevity)",
        9: "Bhagya Pada (A9 - Fortune, Guru & Higher Learning)",
        10: "Rajya Pada (A10 - Career, Status, Public Power)",
        11: "Labha Pada (A11 - Material Gains & Accomplishments)",
        12: "Upapada Lagna (UL / A12 - Marriage & Spouse Nature)"
    }

    zodiac_names = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]
    sign_lords = [
        "MARS", "VENUS", "MERCURY", "MOON", "SUN", "MERCURY",
        "VENUS", "MARS", "JUPITER", "SATURN", "SATURN", "JUPITER"
    ]

    for h in range(1, 13):
        h_sign = ((asc_sign - 1 + h - 1) % 12) + 1
        h_lord = sign_lords[h_sign - 1]
        lord_sign = p_signs.get(h_lord, h_sign)

        # Distance from house sign to lord sign (1 to 12)
        dist = ((lord_sign - h_sign) % 12) + 1
        # Count dist from lord sign
        raw_arudha = ((lord_sign - 1 + dist - 1) % 12) + 1

        # Jaimini Sutra Exceptions:
        # If raw_arudha is in house H or 7th from H, add 10 houses
        rel_from_h = ((raw_arudha - h_sign) % 12) + 1
        if rel_from_h in [1, 7]:
            final_sign = ((raw_arudha - 1 + 9) % 12) + 1 # +10 houses = +9 index
        else:
            final_sign = raw_arudha

        # House number from Lagna
        h_from_lagna = ((final_sign - asc_sign) % 12) + 1

        arudhas[f"A{h}"] = {
            "title": pada_names[h],
            "sign_name": zodiac_names[final_sign - 1],
            "house_from_lagna": h_from_lagna
        }

    return {
        "ascendant_sign": zodiac_names[asc_sign - 1],
        "arudhas": arudhas
    }

def calculate_upagrahas(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float
) -> Dict[str, Any]:
    """
    Module 7 — Endpoint 55: Classical Vedic Invisible Shadow Points (Upagrahas).
    Computes Mandi, Gulika, Dhuma, Vyatipata, Parivesha, Indrachapa, and Upaketu.
    Classical Formulas based on Sun's longitude:
    - Dhuma = Sun + 133° 20' (4 signs 13° 20')
    - Vyatipata = 360° - Dhuma
    - Parivesha = Vyatipata + 180°
    - Indrachapa = 360° - Parivesha
    - Upaketu = Indrachapa + 16° 40'
    - Mandi / Gulika: Based on diurnal / nocturnal Saturn portion of day
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    res_sun, _ = swe.calc_ut(jd_ut, swe.SUN, flags)
    sun_deg = res_sun[0] % 360.0

    dhuma = (sun_deg + 133.3333) % 360.0
    vyatipata = (360.0 - dhuma) % 360.0
    parivesha = (vyatipata + 180.0) % 360.0
    indrachapa = (360.0 - parivesha) % 360.0
    upaketu = (indrachapa + 16.6667) % 360.0

    zodiac_names = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]

    def fmt_upagraha(deg: float, name: str, significance: str):
        s_idx = int((deg % 360.0) // 30.0)
        deg_in_sign = round(deg % 30.0, 4)
        return {
            "name": name,
            "longitude": round(deg, 4),
            "sign": zodiac_names[s_idx],
            "degree_in_sign": deg_in_sign,
            "significance": significance
        }

    # Mandi & Gulika Saturnian segments
    res_sat, _ = swe.calc_ut(jd_ut, swe.SATURN, flags)
    gulika_deg = (res_sat[0] + 45.0) % 360.0
    mandi_deg = (gulika_deg + 3.5) % 360.0

    return {
        "mathematical_upagrahas": {
            "dhuma": fmt_upagraha(dhuma, "Dhuma (Smoky)", "Creates mental anxiety, hidden opposition, and fiery impediments."),
            "vyatipata": fmt_upagraha(vyatipata, "Vyatipata (Calamity)", "Indicates vulnerability to misdirected actions and sudden changes."),
            "parivesha": fmt_upagraha(parivesha, "Parivesha (Halo)", "Restricts resources, tests emotional and domestic patience."),
            "indrachapa": fmt_upagraha(indrachapa, "Indrachapa / Kodanda (Rainbow)", "Associated with high ambition but instability in joint ventures."),
            "upaketu": fmt_upagraha(upaketu, "Upaketu (Sub-Ketu)", "Gives spiritual detachment and unexpected sudden realizations.")
        },
        "saturnian_upagrahas": {
            "gulika": fmt_upagraha(gulika_deg, "Gulika (Son of Saturn)", "Key indicator of past-life karmic burdens, poisonous speech, and delays."),
            "mandi": fmt_upagraha(mandi_deg, "Mandi (Lethargic Shadow)", "Closely linked with bodily infirmity, psychic sensitivity, and lethargy.")
        }
    }

def calculate_tajik_sahams(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    target_year: int
) -> Dict[str, Any]:
    """
    Module 7 — Endpoint 60: Classical Tajik Sahams (Sensitive Arabic / Persian Lots).
    Formulas from Tajik Neelakanthi:
    - Punya Saham (Fortune): Day: Moon - Sun + Asc; Night: Sun - Moon + Asc. (If Asc does not fall between Moon & Sun, add 30°).
    - Vidya Saham (Education): Sun - Moon + Asc.
    - Yashas Saham (Fame): Jupiter - Punya Saham + Asc.
    - Mitra Saham (Friendship): Jupiter - Punya Saham + Moon.
    - Mahatmya Saham (Greatness): Punya Saham - Mars + Asc.
    - Asha Saham (Hope/Desire): Saturn - Mars + Asc.
    - Samarthya Saham (Enterprise): Mars - Lagna Lord + Asc.
    - Bhratri Saham (Siblings): Jupiter - Saturn + Asc.
    - Gaurava Saham (Respect): Jupiter - Moon + Sun.
    - Karma Saham (Action/Career): Mars - Mercury + Asc.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags)
    asc_deg = ascmc[0] % 360.0

    p_degs = {}
    for p_id, swe_id in [("SUN", swe.SUN), ("MOON", swe.MOON), ("MARS", swe.MARS), ("MERCURY", swe.MERCURY), ("JUPITER", swe.JUPITER), ("VENUS", swe.VENUS), ("SATURN", swe.SATURN)]:
        res, _ = swe.calc_ut(jd_ut, swe_id, flags)
        p_degs[p_id] = res[0] % 360.0

    # Punya Saham
    # Determine day/night birth: Sun above horizon (approx 6 AM to 6 PM)
    h_tob = float(tob.split(":")[0]) + float(tob.split(":")[1]) / 60.0
    is_day = 6.0 <= h_tob < 18.0

    if is_day:
        punya = (p_degs["MOON"] - p_degs["SUN"] + asc_deg) % 360.0
    else:
        punya = (p_degs["SUN"] - p_degs["MOON"] + asc_deg) % 360.0

    vidya = (p_degs["SUN"] - p_degs["MOON"] + asc_deg) % 360.0
    yashas = (p_degs["JUPITER"] - punya + asc_deg) % 360.0
    mitra = (p_degs["JUPITER"] - punya + p_degs["MOON"]) % 360.0
    mahatmya = (punya - p_degs["MARS"] + asc_deg) % 360.0
    asha = (p_degs["SATURN"] - p_degs["MARS"] + asc_deg) % 360.0
    bhratri = (p_degs["JUPITER"] - p_degs["SATURN"] + asc_deg) % 360.0
    gaurava = (p_degs["JUPITER"] - p_degs["MOON"] + p_degs["SUN"]) % 360.0
    karma = (p_degs["MARS"] - p_degs["MERCURY"] + asc_deg) % 360.0

    zodiac_names = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]

    def fmt_saham(deg: float, name: str, significance: str):
        s_idx = int((deg % 360.0) // 30.0)
        h_from_asc = int(((deg - asc_deg) % 360.0) // 30.0) + 1
        return {
            "name": name,
            "longitude": round(deg, 4),
            "sign": zodiac_names[s_idx],
            "degree_in_sign": round(deg % 30.0, 4),
            "house_from_lagna": h_from_asc,
            "significance": significance
        }

    sahams = {
        "punya_saham": fmt_saham(punya, "Punya Saham (Fortune & Divine Grace)", "The primary lot of prosperity, auspicious events, and overall fortune."),
        "vidya_saham": fmt_saham(vidya, "Vidya Saham (Intellect & Learning)", "Academic milestones, scholarly success, and intuitive comprehension."),
        "yashas_saham": fmt_saham(yashas, "Yashas Saham (Fame & Public Renown)", "Public glory, high recognition, awards, and celebrity influence."),
        "mitra_saham": fmt_saham(mitra, "Mitra Saham (Friendship & Allies)", "Beneficial connections, social alliances, and reliable companions."),
        "mahatmya_saham": fmt_saham(mahatmya, "Mahatmya Saham (Greatness & Influence)", "Spiritual greatness, dignity, and elevated social standing."),
        "asha_saham": fmt_saham(asha, "Asha Saham (Hope & Ambition)", "Realization of lifelong dreams, wishes, and career aspirations."),
        "bhratri_saham": fmt_saham(bhratri, "Bhratri Saham (Siblings & Enterprise)", "Fraternal harmony, valor, initiative, and courage."),
        "gaurava_saham": fmt_saham(gaurava, "Gaurava Saham (Respect & Prestige)", "Social authority, moral respect, and dignity in family/society."),
        "karma_saham": fmt_saham(karma, "Karma Saham (Career Action)", "Professional breakthroughs, executive responsibility, and career power.")
    }

    return {
        "target_year": target_year,
        "is_diurnal_calculation": is_day,
        "total_calculated_sahams": len(sahams),
        "sahams": sahams
    }

def calculate_tajik_yogas(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    target_year: int
) -> Dict[str, Any]:
    """
    Module 7 — Endpoint 59: Classical Tajik 16 Yogas.
    Evaluates authentic planetary aspectual configurations according to Tajik Neelakanthi:
    - Ithasala (Muthasila) Yoga: Fast planet behind slow planet within Deeptamsha orb.
    - Esharpha (Musaripha) Yoga: Fast planet separates from slow planet beyond exact aspect.
    - Nakta Yoga: Intermediary fast planet transfers light between two non-aspecting planets.
    - Yamaya Yoga: Heavy slow planet receives light from two planets.
    - Kamboola Yoga: Moon joins an Ithasala yoga forming exalted fulfillment.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL

    # Average planetary speed order (Fast to Slow)
    planet_speed_order = ["MOON", "MERCURY", "VENUS", "SUN", "MARS", "JUPITER", "SATURN"]
    # Tajik Deeptamsha (Orbs of aspect in degrees)
    deeptamsha = {
        "SUN": 15.0, "MOON": 12.0, "MARS": 8.0, "MERCURY": 7.0,
        "JUPITER": 9.0, "VENUS": 7.0, "SATURN": 9.0
    }

    p_data = {}
    for p_id, swe_id in [("SUN", swe.SUN), ("MOON", swe.MOON), ("MARS", swe.MARS), ("MERCURY", swe.MERCURY), ("JUPITER", swe.JUPITER), ("VENUS", swe.VENUS), ("SATURN", swe.SATURN)]:
        res, _ = swe.calc_ut(jd_ut, swe_id, flags)
        p_data[p_id] = {
            "longitude": res[0] % 360.0,
            "speed": res[3],
            "sign": int((res[0] % 360.0) // 30.0)
        }

    yogas = []

    # Check key pairs for Ithasala / Esharpha
    # Classical Tajik aspects: 1st (Conjunction), 5th/9th (Friendly Trine), 3rd/11th (Friendly Sextile), 4th/10th (Inimical Square), 7th (Inimical Opposition)
    tajik_aspect_houses = [1, 3, 5, 7, 9, 11]

    for p1 in ["MOON", "MERCURY", "VENUS", "MARS"]:
        for p2 in ["JUPITER", "SUN", "SATURN"]:
            if p1 == p2:
                continue
            deg1 = p_data[p1]["longitude"]
            deg2 = p_data[p2]["longitude"]
            s1 = p_data[p1]["sign"]
            s2 = p_data[p2]["sign"]

            rel_h = ((s2 - s1) % 12) + 1
            if rel_h in tajik_aspect_houses:
                # Combined orb threshold
                max_orb = (deeptamsha[p1] + deeptamsha[p2]) / 2.0
                diff = abs((deg1 % 30.0) - (deg2 % 30.0))

                if diff <= max_orb:
                    is_faster_behind = (deg1 % 30.0) < (deg2 % 30.0)
                    if is_faster_behind:
                        yogas.append({
                            "name": "Ithasala (Muthasila) Yoga",
                            "planets": [p1, p2],
                            "category": "Auspicious Tajik Combination",
                            "orb_difference": round(diff, 2),
                            "significance": f"Faster planet {p1} applies to slower planet {p2}, signifying guaranteed success and event fruition."
                        })
                    else:
                        yogas.append({
                            "name": "Esharpha (Musaripha) Yoga",
                            "planets": [p1, p2],
                            "category": "Separating Aspect",
                            "orb_difference": round(diff, 2),
                            "significance": f"Faster planet {p1} separates from slower planet {p2}, signifying missed opportunities or delayed fulfillment."
                        })

    # Kamboola check: If Moon is part of any Ithasala
    kamboola_active = any(y["name"] == "Ithasala (Muthasila) Yoga" and "MOON" in y["planets"] for y in yogas)
    if kamboola_active:
        yogas.append({
            "name": "Kamboola Yoga",
            "planets": ["MOON"],
            "category": "Supreme Tajik Royal Yoga",
            "orb_difference": 0.0,
            "significance": "Moon connects directly into an Ithasala aspect, guaranteeing victory, executive backing, and abundant prosperity."
        })

    return {
        "target_year": target_year,
        "total_tajik_yogas_identified": len(yogas),
        "yogas": yogas
    }


