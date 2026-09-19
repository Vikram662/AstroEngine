import swisseph as swe
from typing import Dict, Any, List, Tuple
from app.core.swisseph import (
    calculate_julian_day,
    get_zodiac_sign_info,
    VEDIC_PLANETS,
    ZODIAC_SIGNS
)
from app.modules.dasha.calculator import VIMSHOTTARI_CYCLE, NAKSHATRA_LORD_SEQUENCE
from app.locales.i18n import translate_entity

# 1 Nakshatra = 13° 20' = 800 minutes of arc
NAKSHATRA_SPAN_MINUTES = 800.0

def get_kp_sub_lord(longitude: float) -> Tuple[str, str, str]:
    """
    Calculate KP Sign Lord, Star Lord (Nakshatra Lord), and Sub-Lord.
    Longitude is sidereal (KP / Krishnamurti ayanamsa).
    """
    norm_deg = longitude % 360.0
    
    # 1. Sign Lord
    sign_idx = int(norm_deg // 30.0)
    sign_lord = ZODIAC_SIGNS[sign_idx]["ruler"]
    
    # 2. Star Lord (Nakshatra)
    nak_span_deg = 360.0 / 27.0 # 13.333333333333334°
    nak_idx = int(norm_deg // nak_span_deg)
    star_lord = NAKSHATRA_LORD_SEQUENCE[nak_idx]
    
    # 3. Sub-Lord
    # Degrees traversed inside current nakshatra
    deg_in_nak = norm_deg - (nak_idx * nak_span_deg)
    minutes_in_nak = deg_in_nak * 60.0
    
    # Sub-lord cycle starts from the star lord
    start_cycle_idx = next(i for i, item in enumerate(VIMSHOTTARI_CYCLE) if item["planet"] == star_lord)
    
    accumulated_minutes = 0.0
    sub_lord = star_lord
    for i in range(9):
        c_item = VIMSHOTTARI_CYCLE[(start_cycle_idx + i) % 9]
        # Sub-division span = (years / 120) * 800 minutes
        sub_span_min = (c_item["years"] / 120.0) * NAKSHATRA_SPAN_MINUTES
        if accumulated_minutes + sub_span_min >= minutes_in_nak:
            sub_lord = c_item["planet"]
            break
        accumulated_minutes += sub_span_min
        
    return sign_lord, star_lord, sub_lord

def calculate_kp_planets(
    dob: str,
    tob: str,
    tz: float,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """Calculate KP Sign Lord, Star Lord, and Sub-Lord for all planets using Krishnamurti Ayanamsa."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    
    # Set KP Krishnamurti Ayanamsa strictly for KP system
    swe.set_sid_mode(swe.SIDM_KRISHNAMURTI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    
    planets_result = []
    rahu_lon = 0.0
    
    for p in VEDIC_PLANETS:
        p_id = p["id"]
        if p_id == "KETU":
            p_lon = (rahu_lon + 180.0) % 360.0
            is_ret = True
        else:
            swe_id = p["swe_id"]
            res, _ = swe.calc_ut(jd_ut, swe_id, flags)
            p_lon = res[0]
            is_ret = res[3] < 0.0
            if p_id == "RAHU":
                rahu_lon = p_lon
                
        sign_lord, star_lord, sub_lord = get_kp_sub_lord(p_lon)
        sign_info = get_zodiac_sign_info(p_lon)
        
        planets_result.append({
            "planet_id": p_id,
            "planet_name": translate_entity("planets", p_id, lang, p["name_en"]),
            "full_degree": round(p_lon, 4),
            "degree_in_sign": sign_info["degree"],
            "sign": {
                "id": sign_info["id"],
                "name": translate_entity("signs", sign_info["id"], lang, sign_info["name_en"]),
                "number": sign_info["index"]
            },
            "sign_lord": sign_lord,
            "star_lord": star_lord,
            "sub_lord": sub_lord,
            "is_retrograde": is_ret
        })
        
    return planets_result

def calculate_kp_cusps(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """Calculate KP 12 Placidus House Cusps with Sign Lord, Star Lord, and Sub-Lord."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_KRISHNAMURTI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
    
    # Placidus cusps ('P')
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', flags)
    
    cusps_result = []
    for i in range(12):
        cusp_deg = cusps[i]
        sign_lord, star_lord, sub_lord = get_kp_sub_lord(cusp_deg)
        sign_info = get_zodiac_sign_info(cusp_deg)
        
        cusps_result.append({
            "cusp": i + 1,
            "full_degree": round(cusp_deg, 4),
            "degree_in_sign": sign_info["degree"],
            "sign": {
                "id": sign_info["id"],
                "name": translate_entity("signs", sign_info["id"], lang, sign_info["name_en"]),
                "number": sign_info["index"]
            },
            "sign_lord": sign_lord,
            "star_lord": star_lord,
            "sub_lord": sub_lord
        })
        
    return cusps_result

def _generate_kp_249_table() -> List[Dict[str, Any]]:
    """
    Generate standard classical KP 249 Horary table:
    27 Nakshatras * 9 Sub-lords = 243 intervals.
    Divided at the 12 zodiac sign boundaries (30°, 60°, ... 330°) where a sub-arc
    spans across two adjacent signs, producing exactly 249 unequal divisions.
    """
    table = []
    current_deg = 0.0
    number = 1

    for nak_idx in range(27):
        star_lord = NAKSHATRA_LORD_SEQUENCE[nak_idx]
        start_cycle_idx = next(i for i, item in enumerate(VIMSHOTTARI_CYCLE) if item["planet"] == star_lord)

        for sub_i in range(9):
            c_item = VIMSHOTTARI_CYCLE[(start_cycle_idx + sub_i) % 9]
            sub_lord = c_item["planet"]
            # Sub-division span in degrees = (years / 120) * (360 / 27)
            sub_span_deg = (c_item["years"] / 120.0) * (360.0 / 27.0)
            end_deg = current_deg + sub_span_deg

            # Check if this sub-division crosses a 30° sign boundary
            sign_boundary = int(current_deg // 30.0 + 1) * 30.0

            if sign_boundary < end_deg and abs(sign_boundary - end_deg) > 1e-7:
                # Split at sign boundary
                # Part 1: current_deg to sign_boundary
                sign_idx_1 = int(current_deg // 30.0)
                sign_lord_1 = ZODIAC_SIGNS[sign_idx_1]["ruler"]
                table.append({
                    "number": number,
                    "start_deg": current_deg,
                    "end_deg": sign_boundary,
                    "sign_lord": sign_lord_1,
                    "star_lord": star_lord,
                    "sub_lord": sub_lord
                })
                number += 1

                # Part 2: sign_boundary to end_deg
                sign_idx_2 = int(sign_boundary // 30.0) % 12
                sign_lord_2 = ZODIAC_SIGNS[sign_idx_2]["ruler"]
                table.append({
                    "number": number,
                    "start_deg": sign_boundary,
                    "end_deg": end_deg,
                    "sign_lord": sign_lord_2,
                    "star_lord": star_lord,
                    "sub_lord": sub_lord
                })
                number += 1
            else:
                sign_idx = int(current_deg // 30.0) % 12
                sign_lord = ZODIAC_SIGNS[sign_idx]["ruler"]
                table.append({
                    "number": number,
                    "start_deg": current_deg,
                    "end_deg": end_deg,
                    "sign_lord": sign_lord,
                    "star_lord": star_lord,
                    "sub_lord": sub_lord
                })
                number += 1

            current_deg = end_deg

    return table

KP_249_TABLE = _generate_kp_249_table()

def calculate_kp_horary_chart(
    horary_number: int,
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Calculate KP Horary Chart (Prashna) using seed numbers 1 to 249.
    Each number corresponds to a precise Sub-Lord arc segment on the zodiac.
    """
    if horary_number < 1 or horary_number > 249:
        raise ValueError("KP Horary seed number must be between 1 and 249.")
        
    entry = KP_249_TABLE[horary_number - 1]
    asc_deg = entry["start_deg"]
    sign_info = get_zodiac_sign_info(asc_deg)
    
    planets = calculate_kp_planets(dob, tob, tz, lang)
    
    return {
        "horary_number": horary_number,
        "horary_ascendant": {
            "degree": round(asc_deg, 4),
            "sign": sign_info["name_en"],
            "sign_lord": entry["sign_lord"],
            "star_lord": entry["star_lord"],
            "sub_lord": entry["sub_lord"],
            "arc_start": round(entry["start_deg"], 4),
            "arc_end": round(entry["end_deg"], 4)
        },
        "planets": planets
    }

def calculate_kp_significators(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float
) -> Dict[str, Any]:
    """
    Module 5 — Endpoints 41 & 42:
    KP 4-Grade (A/B/C/D) Significator Table & House Significators.
    Classical KP Rules:
    - Grade A (Strongest): Planet in the constellation (Star) of an occupant of the house.
    - Grade B: Occupant of the house.
    - Grade C: Planet in the constellation (Star) of the lord of the house.
    - Grade D (Weakest): Lord of the house.
    """
    planets = calculate_kp_planets(dob, tob, tz)
    from app.modules.kp.calculator import calculate_kp_cusps
    cusps = calculate_kp_cusps(dob, tob, lat, lon, tz)

    # Map planet positions into houses (Placidus cusps)
    p_dict = {p["planet_id"]: p for p in planets}
    p_stars = {p["planet_id"]: p["star_lord"] for p in planets}

    # Determine which house each planet occupies
    planet_house = {}
    for p in planets:
        p_lon = p["full_degree"]
        for h in range(1, 13):
            c_start = cusps[h-1]["full_degree"]
            c_end = cusps[h % 12]["full_degree"]
            if c_start < c_end:
                if c_start <= p_lon < c_end:
                    planet_house[p["planet_id"]] = h
                    break
            else: # Wrap around 0 Aries
                if p_lon >= c_start or p_lon < c_end:
                    planet_house[p["planet_id"]] = h
                    break
        if p["planet_id"] not in planet_house:
            planet_house[p["planet_id"]] = 1

    house_occupants = {h: [] for h in range(1, 13)}
    for pid, h in planet_house.items():
        house_occupants[h].append(pid)

    house_lords = {h: cusps[h-1]["sign_lord"] for h in range(1, 13)}

    # Grade A, B, C, D calculation per house
    house_sig_table = {}
    for h in range(1, 13):
        # Grade B: Occupants
        b_planets = house_occupants[h]

        # Grade A: In stars of occupants
        a_planets = [pid for pid, st_lord in p_stars.items() if st_lord in b_planets]

        # Grade D: House Lord
        d_planet = house_lords[h]

        # Grade C: In star of house lord
        c_planets = [pid for pid, st_lord in p_stars.items() if st_lord == d_planet]

        house_sig_table[f"House_{h}"] = {
            "house": h,
            "sign_lord": d_planet,
            "grade_a_strongest": list(set(a_planets)),
            "grade_b_occupants": list(set(b_planets)),
            "grade_c_lord_stars": list(set(c_planets)),
            "grade_d_house_lord": [d_planet],
            "all_significators": list(set(a_planets + b_planets + c_planets + [d_planet]))
        }

    # Per-planet 4-grade summary
    planet_sig_table = {}
    for pid in p_stars.keys():
        houses_a = [h for h in range(1, 13) if pid in house_sig_table[f"House_{h}"]["grade_a_strongest"]]
        houses_b = [h for h in range(1, 13) if pid in house_sig_table[f"House_{h}"]["grade_b_occupants"]]
        houses_c = [h for h in range(1, 13) if pid in house_sig_table[f"House_{h}"]["grade_c_lord_stars"]]
        houses_d = [h for h in range(1, 13) if pid in house_sig_table[f"House_{h}"]["grade_d_house_lord"]]

        planet_sig_table[pid] = {
            "planet": pid,
            "star_lord": p_stars[pid],
            "occupying_house": planet_house.get(pid, 1),
            "level_1_grade_a": houses_a,
            "level_2_grade_b": houses_b,
            "level_3_grade_c": houses_c,
            "level_4_grade_d": houses_d
        }

    return {
        "house_significators": house_sig_table,
        "planet_4_level_significators": planet_sig_table
    }

def calculate_kp_ruling_planets(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float
) -> Dict[str, Any]:
    """
    Module 5 — Endpoint 43: Real-time KP Ruling Planets (RPs).
    A vital Krishnamurti Paddhati diagnostic tool based on the exact moment of inquiry:
    1. Ascendant Sign Lord
    2. Ascendant Star Lord
    3. Moon Sign Lord
    4. Moon Star Lord
    5. Day Lord (Vaara Lord)
    Rahu / Ketu represent nodes representing ruling planets.
    """
    from app.modules.kp.calculator import calculate_kp_cusps
    planets = calculate_kp_planets(dob, tob, tz)
    cusps = calculate_kp_cusps(dob, tob, lat, lon, tz)

    asc = cusps[0]
    moon = next(p for p in planets if p["planet_id"] == "MOON")

    jd_ut = calculate_julian_day(dob, tob, tz)
    w_idx = int((jd_ut + 1.5) % 7) # 0=Sun, 1=Moon, 2=Mars, 3=Merc, 4=Jup, 5=Ven, 6=Sat
    day_lords = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"]
    day_lord = day_lords[w_idx]

    rp_list = [
        {"position": "Ascendant Sign Lord", "planet": asc["sign_lord"]},
        {"position": "Ascendant Star Lord", "planet": asc["star_lord"]},
        {"position": "Moon Sign Lord", "planet": moon["sign_lord"]},
        {"position": "Moon Star Lord", "planet": moon["star_lord"]},
        {"position": "Day Lord (Vaara Lord)", "planet": day_lord}
    ]

    unique_rps = list(dict.fromkeys([r["planet"] for r in rp_list]))

    return {
        "query_datetime": f"{dob} {tob}",
        "ruling_planets_ordered": rp_list,
        "primary_ruling_planets": unique_rps,
        "usage_guidance": "The ruling planets that appear more than once or connect to sub-lords are primary determinants of event timing and horary verification."
    }

def calculate_kp_event_combination(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    event_type: str = "CAREER"
) -> Dict[str, Any]:
    """
    Module 5 — Endpoint 46: KP Event House-Combination Analysis.
    Authentic KP combinations:
    - Career / Promotion: 2, 6, 10, 11 (Opposition: 5, 8, 12)
    - Marriage: 2, 7, 11 (Opposition / Denial: 1, 6, 10)
    - Childbirth: 2, 5, 11 (Denial: 1, 4, 10)
    - Foreign Travel: 3, 9, 12
    - Litigation / Victory: 6, 11 (Defeat: 8, 12)
    """
    sigs = calculate_kp_significators(dob, tob, lat, lon, tz)
    house_sigs = sigs["house_significators"]

    EVENT_HOUSES = {
        "CAREER": {"favorable": [2, 6, 10, 11], "adverse": [5, 8, 12], "description": "Professional growth, promotions, status elevation and income."},
        "MARRIAGE": {"favorable": [2, 7, 11], "adverse": [1, 6, 10], "description": "Matrimonial union, spouse relationship harmony, and commitment."},
        "CHILDBIRTH": {"favorable": [2, 5, 11], "adverse": [1, 4, 10], "description": "Progeny conception, pregnancy progression, and healthy delivery."},
        "FOREIGN_TRAVEL": {"favorable": [3, 9, 12], "adverse": [2, 4, 11], "description": "Relocation abroad, overseas education, visas, and cross-border settlement."},
        "LITIGATION": {"favorable": [6, 11], "adverse": [8, 12], "description": "Legal victories, overcoming rivals, settlement agreements."}
    }

    ev_info = EVENT_HOUSES.get(event_type.upper(), EVENT_HOUSES["CAREER"])
    fav_houses = ev_info["favorable"]
    adv_houses = ev_info["adverse"]

    fav_planets = set()
    for h in fav_houses:
        fav_planets.update(house_sigs[f"House_{h}"]["all_significators"])

    adv_planets = set()
    for h in adv_houses:
        adv_planets.update(house_sigs[f"House_{h}"]["all_significators"])

    return {
        "event_type": event_type.upper(),
        "description": ev_info["description"],
        "favorable_houses": fav_houses,
        "adverse_houses": adv_houses,
        "favorable_significator_planets": list(fav_planets),
        "adverse_significator_planets": list(adv_planets),
        "event_fruition_likelihood": "VERY_HIGH" if len(fav_planets) > len(adv_planets) else "MODERATE"
    }

def calculate_kp_horary_2193(seed_number: int, dob: str, tob: str, tz: float) -> Dict[str, Any]:
    """
    Module 5 — Endpoint 45: Advanced Sub-Sub Lord Horary (1–2193).
    Each of the 249 sub-lord divisions is further split into 9 sub-sub segments = 2193 divisions.
    """
    if seed_number < 1 or seed_number > 2193:
        raise ValueError("KP Sub-Sub Horary seed must be between 1 and 2193.")

    sub_249_idx = (seed_number - 1) // 9
    sub_sub_offset = (seed_number - 1) % 9

    sub_entry = KP_249_TABLE[sub_249_idx % len(KP_249_TABLE)]
    sub_span = sub_entry["end_deg"] - sub_entry["start_deg"]

    # Calculate proportional start degree for the sub-sub arc
    ss_start = sub_entry["start_deg"] + (sub_span * (sub_sub_offset / 9.0))
    ss_end = sub_entry["start_deg"] + (sub_span * ((sub_sub_offset + 1) / 9.0))

    sub_sub_lords = ["KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER", "SATURN", "MERCURY"]
    sub_sub_lord = sub_sub_lords[sub_sub_offset]

    return {
        "seed_number": seed_number,
        "sub_249_number": sub_249_idx + 1,
        "sign_lord": sub_entry["sign_lord"],
        "star_lord": sub_entry["star_lord"],
        "sub_lord": sub_entry["sub_lord"],
        "sub_sub_lord": sub_sub_lord,
        "arc_start_deg": round(ss_start, 5),
        "arc_end_deg": round(ss_end, 5)
    }

