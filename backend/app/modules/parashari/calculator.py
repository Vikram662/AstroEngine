import swisseph as swe
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.core.swisseph import (
    calculate_julian_day,
    get_zodiac_sign_info,
    get_nakshatra_info,
    VEDIC_PLANETS,
    ZODIAC_SIGNS
)
from app.locales.i18n import translate_entity

VARGA_FACTORS = {
    "D1": 1,    # Rashi / Birth chart
    "D2": 2,    # Hora (Wealth)
    "D3": 3,    # Drekkana (Siblings)
    "D4": 4,    # Chaturthamsha (Destiny, Property)
    "D7": 7,    # Saptamsha (Children)
    "D9": 9,    # Navamsha (Spouse, Dharma)
    "D10": 10,  # Dashamsha (Career)
    "D12": 12,  # Dwadashamsha (Parents)
    "D16": 16,  # Shodashamsha (Vehicles, Happiness)
    "D20": 20,  # Vimsamsha (Spiritual progress)
    "D24": 24,  # Chaturvimsamsha (Learning, Knowledge)
    "D27": 27,  # Saptavimsamsha (Strengths, Weaknesses)
    "D30": 30,  # Trimsamsha (Misfortunes, Arishta)
    "D40": 40,  # Khavedamsha (Auspicious/inauspicious events)
    "D45": 45,  # Akshavedamsha (General well-being)
    "D60": 60,  # Shashtiamsha (Past karma, All matters)
}

# Classical Dignities (Exaltation / Debilitation / Own Sign indices 0-11)
# Signs: 0=Aries, 1=Taurus, 2=Gemini, 3=Cancer, 4=Leo, 5=Virgo, 6=Libra, 7=Scorpio, 8=Sagittarius, 9=Capricorn, 10=Aquarius, 11=Pisces
EXALTATION_SIGNS = {
    "SUN": 0, "MOON": 1, "MARS": 9, "MERCURY": 5, "JUPITER": 3, "VENUS": 11, "SATURN": 6, "RAHU": 1, "KETU": 7
}
DEBILITATION_SIGNS = {
    "SUN": 6, "MOON": 7, "MARS": 3, "MERCURY": 11, "JUPITER": 9, "VENUS": 5, "SATURN": 0, "RAHU": 7, "KETU": 1
}
OWN_SIGNS = {
    "SUN": [4], "MOON": [3], "MARS": [0, 7], "MERCURY": [2, 5], "JUPITER": [8, 11], "VENUS": [1, 6], "SATURN": [9, 10]
}
COMBUST_ORBS = {
    "MOON": 12.0, "MARS": 17.0, "MERCURY": 14.0, "JUPITER": 11.0, "VENUS": 10.0, "SATURN": 15.0
}

# Classical Moolatrikona sign + degree span per BPHS (distinct from Own Sign for
# Moon/Mars/Mercury/Jupiter/Venus/Saturn — only Sun's happens to coincide with its own sign).
# (sign_index, start_degree, end_degree)
MOOLATRIKONA_RANGES = {
    "SUN": (4, 0.0, 20.0),      # Leo 0-20
    "MOON": (1, 4.0, 30.0),     # Taurus 4-30
    "MARS": (0, 0.0, 12.0),     # Aries 0-12
    "MERCURY": (5, 15.0, 20.0), # Virgo 15-20
    "JUPITER": (8, 0.0, 10.0),  # Sagittarius 0-10
    "VENUS": (6, 0.0, 15.0),    # Libra 0-15
    "SATURN": (10, 0.0, 20.0),  # Aquarius 0-20
}

# Deep exaltation degree (within the exaltation sign) per BPHS; debilitation point is +180 deg.
DEEP_EXALTATION_DEGREE = {
    "SUN": 0 * 30 + 10.0,      # 10 Aries
    "MOON": 1 * 30 + 3.0,      # 3 Taurus
    "MARS": 9 * 30 + 28.0,     # 28 Capricorn
    "MERCURY": 5 * 30 + 15.0,  # 15 Virgo
    "JUPITER": 3 * 30 + 5.0,   # 5 Cancer
    "VENUS": 11 * 30 + 27.0,   # 27 Pisces
    "SATURN": 6 * 30 + 20.0,   # 20 Libra
}

# BPHS natural friendship (Naisargika Maitri) per planet, one-directional — mirrors
# dosha_matching.calculator.NATURAL_FRIENDSHIP (kept local here to avoid a cross-module
# import cycle, since dosha_matching already depends on parashari for chart data).
NATURAL_FRIENDSHIP = {
    "SUN": {"friends": {"MOON", "MARS", "JUPITER"}, "enemies": {"VENUS", "SATURN"}},
    "MOON": {"friends": {"SUN", "MERCURY"}, "enemies": set()},
    "MARS": {"friends": {"SUN", "MOON", "JUPITER"}, "enemies": {"MERCURY"}},
    "MERCURY": {"friends": {"SUN", "VENUS"}, "enemies": {"MOON"}},
    "JUPITER": {"friends": {"SUN", "MOON", "MARS"}, "enemies": {"MERCURY", "VENUS"}},
    "VENUS": {"friends": {"MERCURY", "SATURN"}, "enemies": {"SUN", "MOON"}},
    "SATURN": {"friends": {"MERCURY", "VENUS"}, "enemies": {"SUN", "MOON", "MARS"}},
}

_COMPOUND_RELATION_TABLE = {
    ("FRIEND", "FRIEND"): "GREAT_FRIEND",
    ("FRIEND", "NEUTRAL"): "FRIEND", ("NEUTRAL", "FRIEND"): "FRIEND",
    ("FRIEND", "ENEMY"): "NEUTRAL", ("ENEMY", "FRIEND"): "NEUTRAL",
    ("NEUTRAL", "NEUTRAL"): "NEUTRAL",
    ("NEUTRAL", "ENEMY"): "ENEMY", ("ENEMY", "NEUTRAL"): "ENEMY",
    ("ENEMY", "ENEMY"): "GREAT_ENEMY",
}


def _natural_relation(a: str, b: str) -> str:
    """One-directional Naisargika Maitri: how planet `a` regards planet `b`."""
    if b in NATURAL_FRIENDSHIP.get(a, {}).get("friends", set()):
        return "FRIEND"
    if b in NATURAL_FRIENDSHIP.get(a, {}).get("enemies", set()):
        return "ENEMY"
    return "NEUTRAL"


def compute_compound_dignity(pid: str, sign_idx: int, deg_in_sign: float, d1_sign_of: Dict[str, int], is_d1: bool = False, include_exaltation: bool = True) -> str:
    """
    Classical Panchadha Maitri (5-fold compound) dignity of `pid` occupying `sign_idx`
    (at `deg_in_sign` degrees into that sign), combining Naisargika (natural) +
    Tatkalika (temporal, from D1 sign positions in `d1_sign_of`) friendship toward the
    sign's ruling lord. Returns one of:
    EXALTED / DEBILITATED / MOOLATRIKONA / OWN / GREAT_FRIEND / FRIEND / NEUTRAL / ENEMY / GREAT_ENEMY.
    Temporal friendship is symmetric by construction (houses 2/3/4/10/11/12 from each
    other are mutual temporal friends; the rest mutual temporal enemies), so only one
    direction needs to be checked.
    `include_exaltation=False` skips the Exalted/Debilitated short-circuit — used by
    Saptavargaja Bala, whose classical point table has no separate exaltation tier
    (exaltation strength is captured entirely by the separate Uchcha Bala component;
    an exalted planet's Saptavargaja points come from its ordinary relation to the sign lord).
    """
    if include_exaltation and pid in EXALTATION_SIGNS and sign_idx == EXALTATION_SIGNS[pid]:
        return "EXALTED"
    if include_exaltation and pid in DEBILITATION_SIGNS and sign_idx == DEBILITATION_SIGNS[pid]:
        return "DEBILITATED"
    if is_d1 and pid in MOOLATRIKONA_RANGES:
        mt_sign, mt_lo, mt_hi = MOOLATRIKONA_RANGES[pid]
        if sign_idx == mt_sign and mt_lo <= deg_in_sign < mt_hi:
            return "MOOLATRIKONA"
    if sign_idx in OWN_SIGNS.get(pid, []):
        return "OWN"

    owner = ZODIAC_SIGNS[sign_idx]["ruler"]
    if owner == pid:
        return "OWN"

    natural = _natural_relation(pid, owner)
    owner_d1_sign = d1_sign_of.get(owner)
    planet_d1_sign = d1_sign_of.get(pid)
    if owner_d1_sign is None or planet_d1_sign is None:
        return natural if natural in ("FRIEND", "ENEMY") else "NEUTRAL"

    house_diff = ((owner_d1_sign - planet_d1_sign) % 12) + 1
    temporal = "FRIEND" if house_diff in (2, 3, 4, 10, 11, 12) else "ENEMY"
    return _COMPOUND_RELATION_TABLE.get((natural, temporal), "NEUTRAL")


def sputa_drishti_raw(angle: float, aspecting_pid: str) -> float:
    """
    Classical Sputa Drishti (exact aspect strength, 0-60 Virupas before benefic/malefic
    rectification), piecewise by angular separation from the aspecting planet, with the
    special full-strength zones for Mars (4th/8th), Jupiter (5th/9th) and Saturn (3rd/10th).
    Sourced verbatim from the PyJHora reference implementation's __drik_bala_calc_1.
    `angle` = (aspected_longitude - aspecting_longitude) % 360.
    """
    a = angle % 360.0
    if a < 30.0:
        v = 0.0
    elif a < 60.0:
        v = 0.5 * (a - 30.0)
    elif a < 90.0:
        v = (a - 60.0) + 15.0
        if aspecting_pid == "SATURN":
            v += 45.0
    elif a < 120.0:
        v = 0.5 * (120.0 - a) + 30.0
        if aspecting_pid == "MARS":
            v += 15.0
    elif a < 150.0:
        v = (150.0 - a)
        if aspecting_pid == "JUPITER":
            v += 30.0
    elif a < 180.0:
        v = 2.0 * (a - 150.0)
    elif a < 300.0:
        v = 0.5 * (300.0 - a)
        if aspecting_pid == "MARS" and 210.0 <= a < 240.0:
            v += 15.0
        if aspecting_pid == "JUPITER" and 240.0 <= a < 270.0:
            v += 30.0
        if aspecting_pid == "SATURN" and 270.0 <= a < 300.0:
            v += 45.0
    else:
        v = 0.0
    return v


def compute_d9_navamsha_sign(longitude: float) -> int:
    """
    Classical Parashari Navamsha (D9) sign index (0-11):
    - Fiery signs (Aries, Leo, Sag): starts from Aries (0)
    - Earthy signs (Taurus, Virgo, Cap): starts from Cap (9)
    - Airy signs (Gemini, Libra, Aqua): starts from Libra (6)
    - Watery signs (Cancer, Scorpio, Pisces): starts from Cancer (3)
    """
    norm_deg = longitude % 360.0
    rashi_idx = int(norm_deg // 30.0) # 0 to 11
    deg_in_rashi = norm_deg % 30.0
    nav_idx_in_rashi = int(deg_in_rashi // (30.0 / 9.0)) # 0 to 8

    element = rashi_idx % 4 # 0=Fire, 1=Earth, 2=Air, 3=Water
    start_sign = 0
    if element == 0:
        start_sign = 0  # Aries
    elif element == 1:
        start_sign = 9  # Capricorn
    elif element == 2:
        start_sign = 6  # Libra
    elif element == 3:
        start_sign = 3  # Cancer

    d9_sign_idx = (start_sign + nav_idx_in_rashi) % 12
    return d9_sign_idx

def compute_varga_sign(longitude: float, varga: str) -> int:
    """
    Classical Parashari / BPHS Varga calculation rules (0-11 sign index):
    Aries=0, Taurus=1, ..., Pisces=11.
    """
    norm_deg = longitude % 360.0
    rashi_idx = int(norm_deg // 30.0) # 0 to 11
    deg_in_rashi = norm_deg % 30.0
    is_odd = (rashi_idx % 2 == 0) # Aries (0) is odd, Taurus (1) is even in 1-based convention

    # Movable (0, 3, 6, 9), Fixed (1, 4, 7, 10), Dual (2, 5, 8, 11)
    mod3 = rashi_idx % 3

    v = varga.upper()
    if v == "D1":
        return rashi_idx

    elif v == "D2": # Hora (2 parts of 15°)
        # Odd sign: 0-15° Leo (4, Sun), 15-30° Cancer (3, Moon)
        # Even sign: 0-15° Cancer (3, Moon), 15-30° Leo (4, Sun)
        first_half = (deg_in_rashi < 15.0)
        if is_odd:
            return 4 if first_half else 3
        else:
            return 3 if first_half else 4

    elif v == "D3": # Drekkana (3 parts of 10°): Same, 5th, 9th
        part = int(deg_in_rashi // 10.0)
        return (rashi_idx + part * 4) % 12

    elif v == "D4": # Chaturthamsha (4 parts of 7.5°): Same, 4th, 7th, 10th
        part = int(deg_in_rashi // 7.5)
        return (rashi_idx + part * 3) % 12

    elif v == "D7": # Saptamsha (7 parts of 30/7°): Odd from same, Even from 7th
        part = int(deg_in_rashi / (30.0 / 7.0))
        start = rashi_idx if is_odd else (rashi_idx + 6) % 12
        return (start + part) % 12

    elif v == "D9": # Navamsha (9 parts of 3°20'): Fire->Aries, Earth->Cap, Air->Libra, Water->Cancer
        return compute_d9_navamsha_sign(longitude)

    elif v == "D10": # Dashamsha (10 parts of 3°): Odd from same, Even from 9th
        part = int(deg_in_rashi // 3.0)
        start = rashi_idx if is_odd else (rashi_idx + 8) % 12
        return (start + part) % 12

    elif v == "D12": # Dwadashamsha (12 parts of 2.5°): Starts from same sign
        part = int(deg_in_rashi // 2.5)
        return (rashi_idx + part) % 12

    elif v == "D16": # Shodashamsha (16 parts): Movable->Aries(0), Fixed->Leo(4), Dual->Sagittarius(8)
        part = int(deg_in_rashi / (30.0 / 16.0))
        start = 0 if mod3 == 0 else (4 if mod3 == 1 else 8)
        return (start + part) % 12

    elif v == "D20": # Vimsamsha (20 parts): Movable->Aries(0), Fixed->Sagittarius(8), Dual->Leo(4)
        part = int(deg_in_rashi / 1.5)
        start = 0 if mod3 == 0 else (8 if mod3 == 1 else 4)
        return (start + part) % 12

    elif v == "D24": # Chaturvimsamsha (24 parts): Odd->Leo(4), Even->Cancer(3)
        part = int(deg_in_rashi / 1.25)
        start = 4 if is_odd else 3
        return (start + part) % 12

    elif v == "D27": # Saptavimsamsha (27 parts): Fire->Aries(0), Earth->Cancer(3), Air->Libra(6), Water->Cap(9)
        part = int(deg_in_rashi / (30.0 / 27.0))
        elem = rashi_idx % 4
        start = 0 if elem == 0 else (3 if elem == 1 else (6 if elem == 2 else 9))
        return (start + part) % 12

    elif v == "D30": # Trimshamsha (5 unequal parts):
        # Odd: 0-5° Mars (Aries:0), 5-10° Saturn (Aquarius:10), 10-18° Jupiter (Sagittarius:8), 18-25° Mercury (Gemini:2), 25-30° Venus (Libra:6)
        # Even: 0-5° Venus (Taurus:1), 5-12° Mercury (Virgo:5), 12-20° Jupiter (Pisces:11), 20-25° Saturn (Cap:9), 25-30° Mars (Scorpio:7)
        d = deg_in_rashi
        if is_odd:
            if d < 5.0: return 0
            elif d < 10.0: return 10
            elif d < 18.0: return 8
            elif d < 25.0: return 2
            else: return 6
        else:
            if d < 5.0: return 1
            elif d < 12.0: return 5
            elif d < 20.0: return 11
            elif d < 25.0: return 9
            else: return 7

    elif v == "D40": # Khavedamsha (40 parts): Odd->Aries(0), Even->Libra(6)
        part = int(deg_in_rashi / 0.75)
        start = 0 if is_odd else 6
        return (start + part) % 12

    elif v == "D45": # Akshavedamsha (45 parts): Movable->Aries(0), Fixed->Leo(4), Dual->Sagittarius(8)
        part = int(deg_in_rashi / (30.0 / 45.0))
        start = 0 if mod3 == 0 else (4 if mod3 == 1 else 8)
        return (start + part) % 12

    elif v == "D60": # Shashtiamsha (60 parts of 0.5°): Starts from same sign
        part = int(deg_in_rashi / 0.5)
        return (rashi_idx + part) % 12

    else:
        # Unknown fallback: same sign
        return rashi_idx

def compute_varga_chart(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    varga: str = "D1",
    ayanamsa: str = "LAHIRI",
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Calculate Divisional Chart (D1 to D60 Vargas) for Lagna and all planets.
    Returns house placements (1 to 12) from Ascendant and zodiac signs.
    """
    clean_varga = varga.upper()
    if clean_varga not in VARGA_FACTORS:
        clean_varga = "D1"

    jd_ut = calculate_julian_day(dob, tob, tz)
    
    # Configure Ayanamsa properly
    from app.core.swisseph import AYANAMSA_MODES
    selected_mode = AYANAMSA_MODES.get((ayanamsa or "LAHIRI").upper(), swe.SIDM_LAHIRI)
    if selected_mode != -1:
        swe.set_sid_mode(selected_mode, 0, 0)
        flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    else:
        flags = swe.FLG_SWIEPH | swe.FLG_SPEED

    # Calculate Ascendant
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags) # Whole sign for clean Vedic houses
    asc_deg = ascmc[0]

    # Determine Ascendant Sign in target Varga using classical rules
    asc_sign_idx = compute_varga_sign(asc_deg, clean_varga)
    asc_sign_meta = ZODIAC_SIGNS[asc_sign_idx]

    # Calculate planetary placements in target Varga
    planets_data = []
    rahu_deg = 0.0

    # Prepare houses container: 12 houses
    houses_dict = {h: [] for h in range(1, 13)}

    # First pass: collect raw positions and speeds
    raw_planets = []
    sun_lon = 0.0
    for p in VEDIC_PLANETS:
        p_id = p["id"]
        if p_id == "KETU":
            p_lon = (rahu_deg + 180.0) % 360.0
            is_ret = True
            speed = 0.0
        else:
            swe_id = p["swe_id"]
            res, _ = swe.calc_ut(jd_ut, swe_id, flags)
            p_lon = res[0]
            speed = res[3]
            is_ret = speed < 0.0
            if p_id == "RAHU":
                rahu_deg = p_lon
            elif p_id == "SUN":
                sun_lon = p_lon
        raw_planets.append((p, p_id, p_lon, speed, is_ret))

    # Dignity tables (EXALTATION_SIGNS / DEBILITATION_SIGNS / OWN_SIGNS / COMBUST_ORBS)
    # are module-level constants defined above, shared with the Shadbala/Avastha dignity helpers.
    for p, p_id, p_lon, speed, is_ret in raw_planets:
        # Target Varga sign index for planet using classical rules
        p_sign_idx = compute_varga_sign(p_lon, clean_varga)

        # Vedic House = (Planet Sign - Ascendant Sign) % 12 + 1
        house_num = ((p_sign_idx - asc_sign_idx) % 12) + 1
        p_sign_meta = ZODIAC_SIGNS[p_sign_idx]

        # Normalized degrees within sign (0° to 30°)
        norm_deg_in_sign = round(p_lon % 30.0, 2)
        deg_int = int(norm_deg_in_sign)
        min_int = int(round((norm_deg_in_sign - deg_int) * 60))
        if min_int >= 60:
            deg_int += 1
            min_int = 0
        deg_str = f"{deg_int:02d}°{min_int:02d}'"

        # Dignity status (उ / नी / स्व)
        dignity = "NEUTRAL"
        if p_id in EXALTATION_SIGNS and p_sign_idx == EXALTATION_SIGNS[p_id]:
            dignity = "EXALTED"
        elif p_id in DEBILITATION_SIGNS and p_sign_idx == DEBILITATION_SIGNS[p_id]:
            dignity = "DEBILITATED"
        elif p_id in OWN_SIGNS and p_sign_idx in OWN_SIGNS[p_id]:
            dignity = "OWN_SIGN"

        # Combustion check
        is_combust = False
        if clean_varga == "D1" and p_id in COMBUST_ORBS:
            orb_dist = abs((p_lon - sun_lon + 180.0) % 360.0 - 180.0)
            if orb_dist <= COMBUST_ORBS[p_id]:
                is_combust = True

        planet_entry = {
            "id": p_id,
            "name": translate_entity("planets", p_id, lang, p["name_en"]),
            "longitude": round(p_lon, 4),
            "full_degree": round(p_lon, 4),
            "norm_degree": norm_deg_in_sign,
            "deg_formatted": deg_str,
            "house": house_num,
            "sign": {
                "id": p_sign_meta["id"],
                "name": translate_entity("signs", p_sign_meta["id"], lang, p_sign_meta["name_en"]),
                "number": p_sign_idx + 1
            },
            "is_retrograde": is_ret,
            "dignity": dignity,
            "is_combust": is_combust,
            "speed": round(speed, 6)
        }
        planets_data.append(planet_entry)
        houses_dict[house_num].append(p_id)


    # Format 12 Bhavas overview
    houses_overview = []
    for h in range(1, 13):
        h_sign_idx = (asc_sign_idx + (h - 1)) % 12
        h_sign_meta = ZODIAC_SIGNS[h_sign_idx]
        houses_overview.append({
            "house": h,
            "sign": {
                "id": h_sign_meta["id"],
                "name": translate_entity("signs", h_sign_meta["id"], lang, h_sign_meta["name_en"]),
                "number": h_sign_idx + 1,
                "lord": h_sign_meta["ruler"]
            },
            "occupants": houses_dict[h]
        })

    return {
        "varga": clean_varga,
        "language": lang,
        "ascendant": {
            "full_degree": round(asc_deg, 4),
            "sign": {
                "id": asc_sign_meta["id"],
                "name": translate_entity("signs", asc_sign_meta["id"], lang, asc_sign_meta["name_en"]),
                "number": asc_sign_idx + 1
            }
        },
        "planets": planets_data,
        "houses": houses_overview
    }

calculate_varga_chart = compute_varga_chart

def compute_kp_chart_data(dob: str, tob: str, lat: float, lon: float, tz: float, lang: str = "en") -> Dict[str, Any]:
    """Compute KP Kundli chart data with Placidus cusps and Krishnamurti ayanamsa for SVG rendering."""
    from app.modules.kp.calculator import calculate_kp_planets, calculate_kp_cusps
    planets = calculate_kp_planets(dob, tob, tz, lang)
    cusps = calculate_kp_cusps(dob, tob, lat, lon, tz, lang)
    
    asc_sign_num = cusps[0]["sign"]["number"]
    asc_sign_id = cusps[0]["sign"]["id"]
    asc_sign_name = cusps[0]["sign"]["name"]

    # Place planets into 12 Placidus houses based on cusps
    planets_data = []
    for p in planets:
        p_lon = p["full_degree"]
        house_num = 1
        for h in range(1, 13):
            c_start = cusps[h-1]["full_degree"]
            c_end = cusps[h % 12]["full_degree"]
            if c_start < c_end:
                if c_start <= p_lon < c_end:
                    house_num = h
                    break
            else:
                if p_lon >= c_start or p_lon < c_end:
                    house_num = h
                    break

        planets_data.append({
            "id": p["planet_id"],
            "name": p["planet_name"],
            "house": house_num,
            "norm_degree": p["degree_in_sign"],
            "deg_formatted": f"{int(p['degree_in_sign']):02d}°{int(round((p['degree_in_sign'] % 1) * 60)):02d}'",
            "is_retrograde": p["is_retrograde"],
            "dignity": None,
            "is_combust": False
        })

    return {
        "varga": "KP Kundli (Placidus)",
        "language": lang,
        "ascendant": {
            "sign": {
                "id": asc_sign_id,
                "name": asc_sign_name,
                "number": asc_sign_num
            }
        },
        "planets": planets_data
    }

def compute_lalkitab_chart_data(dob: str, tob: str, lat: float, lon: float, tz: float, lang: str = "en") -> Dict[str, Any]:
    """Compute Lal Kitab Kalpurush Kundli chart data (House 1 is Aries = 1) for SVG rendering."""
    from app.modules.lalkitab.calculator import calculate_lalkitab_chart
    lk = calculate_lalkitab_chart(dob, tob, lat, lon, tz, lang)
    
    planets_data = []
    for p in lk.get("planets", []):
        planets_data.append({
            "id": p["id"],
            "name": p["name"],
            "house": p["kalpurush_house"],
            "deg_formatted": f"H{p['kalpurush_house']}",
            "is_retrograde": p.get("is_retrograde", False),
            "dignity": None,
            "is_combust": False
        })

    return {
        "varga": "Lal Kitab (मेष लग्न 1)",
        "language": lang,
        "ascendant": {
            "sign": {
                "id": "ARIES",
                "name": "मेष" if lang == "hi" else "Aries",
                "number": 1
            }
        },
        "planets": planets_data
    }


# Classical abbreviations for Hindi / Vedic astrology
HINDI_PLANET_ABBR = {
    "SUN": "सू",
    "MOON": "चं",
    "MARS": "मं",
    "MERCURY": "बु",
    "JUPITER": "गु",
    "VENUS": "शु",
    "SATURN": "श",
    "RAHU": "रा",
    "KETU": "के",
    "URANUS": "अरु",
    "NEPTUNE": "वरु",
    "PLUTO": "यम"
}

ENGLISH_PLANET_ABBR = {
    "SUN": "Su",
    "MOON": "Mo",
    "MARS": "Ma",
    "MERCURY": "Me",
    "JUPITER": "Ju",
    "VENUS": "Ve",
    "SATURN": "Sa",
    "RAHU": "Ra",
    "KETU": "Ke",
    "URANUS": "Ur",
    "NEPTUNE": "Ne",
    "PLUTO": "Pl"
}

def generate_chart_svg(
    chart_data: Dict[str, Any],
    chart_style: str = "NORTH_INDIAN"
) -> str:
    """
    Generate crisp, rich, AstroSage-standard inline SVG Kundli diagram.
    Supports chart_style="NORTH_INDIAN" (default, house-fixed diamond),
    "SOUTH_INDIAN" (sign-fixed box grid), and "EAST_INDIAN" (sign-fixed diamond,
    Aries at top, counter-clockwise).
    Displays:
    - House sign numbers (Lagna and Bhavas)
    - Planet abbreviation (in Hindi or English)
    - Planet degrees within sign (e.g., 14°28')
    - Motion status: (व) or (R) for retrograde
    - Dignity: [उ] for Exalted, [नी] for Debilitated, [स्व] for Own Sign
    - Combustion: [अ] or [C] for Sun-combust planets
    """
    asc_sign_num = chart_data["ascendant"]["sign"]["number"]
    lang = (chart_data.get("language") or "en").lower().strip()
    
    # Map rich planet strings into each house (and, in parallel, each sign —
    # used by the East Indian renderer, which is sign-fixed rather than house-fixed)
    house_planets = {h: [] for h in range(1, 13)}
    sign_planets_fixed = {s: [] for s in range(1, 13)}
    for p in chart_data.get("planets", []):
        p_id = p.get("id", "")
        h_num = p.get("house", 1)
        p_sign_num = p.get("sign", {}).get("number", 1)
        
        # Abbreviation
        if lang == "hi":
            p_label = HINDI_PLANET_ABBR.get(p_id, p_id[:2])
        else:
            p_label = ENGLISH_PLANET_ABBR.get(p_id, p_id[:2].capitalize())

        # Pure intuitive icons:
        # Exalted (उच्च): ↑ (Green)
        # Debilitated (नीच): ↓ (Red)
        # Retrograde (वक्री): (व) or (R) (Amber)
        # Combust (अस्त): ☼ (Sun icon)
        tags = []
        if p.get("is_retrograde"):
            tags.append("(व)" if lang == "hi" else "(R)")
        
        dignity = p.get("dignity")
        if dignity == "EXALTED":
            tags.append("↑")
        elif dignity == "DEBILITATED":
            tags.append("↓")

        if p.get("is_combust"):
            tags.append("☼")

        tag_str = "".join(tags)
        
        # Degrees
        deg_str = p.get("deg_formatted", "")
        if not deg_str and "norm_degree" in p:
            nd = float(p["norm_degree"])
            deg_str = f"{int(nd):02d}°{int(round((nd % 1) * 60)):02d}'"
        elif not deg_str and "longitude" in p:
            nd = float(p["longitude"]) % 30.0
            deg_str = f"{int(nd):02d}°{int(round((nd % 1) * 60)):02d}'"

        # Format full item (e.g. 'सू↑ 14°28'' or 'गु(व)↑ 08°15'' or 'बु☼ 22°14'')
        if tag_str:
            item_text = f"{p_label}{tag_str} {deg_str}".strip()
        else:
            item_text = f"{p_label} {deg_str}".strip()

        color = "#1e3a8a" # default navy blue
        if dignity == "EXALTED":
            color = "#047857" # emerald green for exalted (उच्च)
        elif dignity == "DEBILITATED":
            color = "#dc2626" # crimson red for debilitated (नीच)
        elif p.get("is_combust"):
            color = "#ea580c" # solar orange for combust (अस्त)
        elif p.get("is_retrograde"):
            color = "#b45309" # amber for retrograde (वक्री)
        
        house_planets[h_num].append((item_text, color))
        sign_planets_fixed[p_sign_num].append((item_text, color))

    # House layout config: each house has (center_x, center_y, max_height, max_width)
    # These define the safe drawing zone per house in the 400x400 North Indian grid
    # center_y must match the visual center of each house zone
    HOUSE_ZONES = {
        1:  (200, 110, 80,  120),   # Top diamond (Lagna)
        2:  (100, 72,  55,  80),    # Top-left corner triangle
        3:  (55,  130, 55,  80),    # Left-top side triangle
        4:  (105, 225, 80,  90),    # Left center diamond
        5:  (55,  318, 55,  80),    # Left-bottom side triangle (below label y=302, inside triangle)
        6:  (100, 335, 55,  80),    # Bottom-left corner triangle
        7:  (200, 295, 80,  120),   # Bottom center diamond
        8:  (300, 335, 55,  80),    # Bottom-right corner triangle
        9:  (345, 318, 55,  80),    # Right-bottom side triangle (below label y=302, inside triangle)
        10: (295, 225, 80,  90),    # Right center diamond
        11: (345, 130, 55,  80),    # Right-top side triangle
        12: (300, 72,  55,  80),    # Top-right corner triangle
    }

    def render_zone_items(zone_idx: int, items: list) -> str:
        if not items:
            return ""

        cx, cy, max_h, max_w = HOUSE_ZONES[zone_idx]
        n = len(items)
        font_size = 10
        line_h = 11

        # Vertically center the block around zone center
        total_h = n * line_h
        curr_y = cy - total_h // 2 + line_h // 2

        lines = []
        for itm, col in items:
            lines.append(
                f'<text x="{cx}" y="{curr_y}" text-anchor="middle" '
                f'font-size="{font_size}" fill="{col}" font-weight="700">{itm}</text>'
            )
            curr_y += line_h

        return "\n    ".join(lines)

    def render_house_items(h_idx: int, _cx: int = 0, _sy: int = 0, _lh: int = 12) -> str:
        return render_zone_items(h_idx, house_planets.get(h_idx, []))

    # Compute 12 house sign numbers
    def h_sign(h: int) -> int:
        return ((asc_sign_num + (h - 1) - 1) % 12) + 1

    # ══════════════════════════════════════════════════════════════════════════
    # EAST INDIAN CHART GENERATOR (Bengali/Odia — sign-fixed diamond, Aries at
    # top, signs running counter-clockwise; same diamond geometry as North
    # Indian but each compartment holds a FIXED sign instead of a fixed house —
    # the house number displayed there rotates with the Ascendant instead).
    # ══════════════════════════════════════════════════════════════════════════
    if chart_style and chart_style.upper() in ["EAST_INDIAN", "EAST", "BENGALI"]:
        SIGN_ABBR = {
            1: "Ari", 2: "Tau", 3: "Gem", 4: "Can", 5: "Leo", 6: "Vir",
            7: "Lib", 8: "Sco", 9: "Sag", 10: "Cap", 11: "Aqu", 12: "Pis"
        }

        def house_of_sign(sign_num: int) -> int:
            return ((sign_num - asc_sign_num) % 12) + 1

        zone_labels = []
        zone_items = []
        for sign_num in range(1, 13):
            cx, cy, _, _ = HOUSE_ZONES[sign_num]
            is_lagna = (sign_num == asc_sign_num)
            label_y = cy - 40 if sign_num in (1, 4, 7, 10) else cy - 28
            lagna_mark = ' <tspan fill="#dc2626">(लग्न)</tspan>' if is_lagna else ""
            zone_labels.append(
                f'<text x="{cx}" y="{label_y}" text-anchor="middle" font-size="9.5" '
                f'fill="#a16207" font-weight="bold">{SIGN_ABBR[sign_num]} · H{house_of_sign(sign_num)}{lagna_mark}</text>'
            )
            zone_items.append(render_zone_items(sign_num, sign_planets_fixed.get(sign_num, [])))

        east_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" style="font-family:'Segoe UI',Roboto,Helvetica,sans-serif; background:#fffdfa; border:2px solid #b45309; border-radius:8px;">
    <rect x="8" y="8" width="384" height="384" fill="none" stroke="#b45309" stroke-width="2"/>
    <line x1="8" y1="8" x2="392" y2="392" stroke="#b45309" stroke-width="1.8"/>
    <line x1="8" y1="392" x2="392" y2="8" stroke="#b45309" stroke-width="1.8"/>
    <polygon points="200,8 392,200 200,392 8,200" fill="none" stroke="#b45309" stroke-width="1.8"/>
    <text x="200" y="204" text-anchor="middle" font-size="12" fill="#92400e" font-weight="bold" letter-spacing="1">{chart_data.get('varga', 'D1')}</text>
    {''.join(zone_labels)}
    {''.join(zone_items)}
</svg>'''
        return east_svg

    # ══════════════════════════════════════════════════════════════════════════
    # SOUTH INDIAN CHART GENERATOR (Fixed Zodiac Box Grid with Lagna marker)
    # ══════════════════════════════════════════════════════════════════════════
    if chart_style and chart_style.upper() in ["SOUTH_INDIAN", "SOUTH"]:
        # South Indian fixed sign boxes:
        # Row 1: Pisces (12), Aries (1), Taurus (2), Gemini (3)
        # Row 2: Aquarius (11), [CENTER], Cancer (4)
        # Row 3: Capricorn (10), [CENTER], Leo (5)
        # Row 4: Sagittarius (9), Scorpio (8), Libra (7), Virgo (6)
        SIGN_BOX_COORDS = {
            12: (10,  10,  95, 95, 57, 57),
            1:  (105, 10,  95, 95, 152, 57),
            2:  (200, 10,  95, 95, 247, 57),
            3:  (295, 10,  95, 95, 342, 57),
            11: (10,  105, 95, 95, 57, 152),
            4:  (295, 105, 95, 95, 342, 152),
            10: (10,  200, 95, 95, 57, 247),
            5:  (295, 200, 95, 95, 342, 247),
            9:  (10,  295, 95, 95, 57, 342),
            8:  (105, 295, 95, 95, 152, 342),
            7:  (200, 295, 95, 95, 247, 342),
            6:  (295, 295, 95, 95, 342, 342),
        }
        SIGN_NAMES = {
            1: "Mesha", 2: "Vrish", 3: "Mithun", 4: "Karka",
            5: "Simha", 6: "Kanya", 7: "Tula", 8: "Vrishc",
            9: "Dhanu", 10: "Makar", 11: "Kumbh", 12: "Meena"
        }

        # Sign to house mapping:
        # Sign S contains house H = ((S - asc_sign_num) % 12) + 1
        sign_planets: Dict[int, list] = {s: [] for s in range(1, 13)}
        for p in chart_data.get("planets", []):
            p_id = p.get("id", "")
            p_sign = p.get("sign", {}).get("number")
            if not p_sign:
                h_num = p.get("house", 1)
                p_sign = h_sign(h_num)
            
            p_label = HINDI_PLANET_ABBR.get(p_id, p_id[:2]) if lang == "hi" else ENGLISH_PLANET_ABBR.get(p_id, p_id[:2].capitalize())
            dignity = p.get("dignity")
            color = "#047857" if dignity == "EXALTED" else ("#dc2626" if dignity == "DEBILITATED" else "#1e3a8a")
            deg_s = ""
            if "norm_degree" in p:
                nd = float(p["norm_degree"])
                deg_s = f" {int(nd)}°"
            sign_planets[p_sign].append((f"{p_label}{deg_s}", color))

        box_elements = []
        for s_idx, (bx, by, bw, bh, cx, cy) in SIGN_BOX_COORDS.items():
            is_lagna = (s_idx == asc_sign_num)
            lagna_mark = ""
            if is_lagna:
                lagna_mark = f'''
                <line x1="{bx}" y1="{by}" x2="{bx + bw}" y2="{by + bh}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
                <text x="{bx + 6}" y="{by + 16}" font-size="10" font-weight="900" fill="#dc2626">ASC (लग्न)</text>
                '''
            s_name = SIGN_NAMES[s_idx]
            p_items = sign_planets[s_idx]
            p_lines = []
            start_y = by + 28 if is_lagna else by + 20
            for itm, col in p_items[:4]:
                p_lines.append(f'<text x="{cx}" y="{start_y}" text-anchor="middle" font-size="9.5" fill="{col}" font-weight="bold">{itm}</text>')
                start_y += 13

            box_svg = f'''
            <rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="#fffdfa" stroke="#b45309" stroke-width="1.2"/>
            <text x="{bx + bw - 4}" y="{by + bh - 4}" text-anchor="end" font-size="8.5" fill="#a16207" font-weight="bold">{s_name}</text>
            {lagna_mark}
            {''.join(p_lines)}
            '''
            box_elements.append(box_svg)

        south_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" style="font-family:'Segoe UI',Roboto,sans-serif; background:#fefdf8; border:2px solid #b45309; border-radius:8px;">
        <!-- Outer Border -->
        <rect x="10" y="10" width="380" height="380" fill="none" stroke="#b45309" stroke-width="2"/>
        <!-- Central Hollow Area -->
        <rect x="105" y="105" width="190" height="190" fill="#fffbeb" stroke="#b45309" stroke-width="1.5"/>
        <text x="200" y="185" text-anchor="middle" font-size="16" fill="#92400e" font-weight="bold" letter-spacing="1">{chart_data.get('varga', 'D1')}</text>
        <text x="200" y="208" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">South Indian Style (दक्षिण भारतीय)</text>
        <text x="200" y="226" text-anchor="middle" font-size="10" fill="#b45309">Lagna: {SIGN_NAMES.get(asc_sign_num, "")}</text>
        {''.join(box_elements)}
        </svg>'''
        return south_svg

    # ══════════════════════════════════════════════════════════════════════════
    # NORTH INDIAN CHART GENERATOR (Default Diamond Grid)
    # ══════════════════════════════════════════════════════════════════════════
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" style="font-family:'Segoe UI',Roboto,Helvetica,sans-serif; background:#fffdfa; border:2px solid #b45309; border-radius:8px;">
    <!-- Outer boundary & Main Diagonals -->
    <rect x="8" y="8" width="384" height="384" fill="none" stroke="#b45309" stroke-width="2"/>
    <line x1="8" y1="8" x2="392" y2="392" stroke="#b45309" stroke-width="1.8"/>
    <line x1="8" y1="392" x2="392" y2="8" stroke="#b45309" stroke-width="1.8"/>
    <!-- Inner Diamond -->
    <polygon points="200,8 392,200 200,392 8,200" fill="none" stroke="#b45309" stroke-width="1.8"/>

    <!-- Central Lagna / Varga Title -->
    <text x="200" y="204" text-anchor="middle" font-size="12" fill="#92400e" font-weight="bold" letter-spacing="1">{chart_data.get('varga', 'D1')}</text>

    <!-- House 1 (Top Center Diamond) -->
    <text x="200" y="70" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(1)}</text>
    {render_house_items(1)}

    <!-- House 2 (Top Left Corner Triangle) -->
    <text x="100" y="42" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(2)}</text>
    {render_house_items(2)}

    <!-- House 3 (Left Top Triangle) -->
    <text x="42" y="98" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(3)}</text>
    {render_house_items(3)}

    <!-- House 4 (Left Center Diamond) -->
    <text x="105" y="195" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(4)}</text>
    {render_house_items(4)}

    <!-- House 5 (Left Bottom Triangle) -->
    <text x="42" y="302" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(5)}</text>
    {render_house_items(5)}

    <!-- House 6 (Bottom Left Corner Triangle) -->
    <text x="100" y="365" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(6)}</text>
    {render_house_items(6)}

    <!-- House 7 (Bottom Center Diamond) -->
    <text x="200" y="332" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(7)}</text>
    {render_house_items(7)}

    <!-- House 8 (Bottom Right Corner Triangle) -->
    <text x="300" y="365" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(8)}</text>
    {render_house_items(8)}

    <!-- House 9 (Right Bottom Triangle) -->
    <text x="358" y="302" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(9)}</text>
    {render_house_items(9)}

    <!-- House 10 (Right Center Diamond) -->
    <text x="295" y="195" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(10)}</text>
    {render_house_items(10)}

    <!-- House 11 (Right Top Triangle) -->
    <text x="358" y="98" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(11)}</text>
    {render_house_items(11)}

    <!-- House 12 (Top Right Corner Triangle) -->
    <text x="300" y="42" text-anchor="middle" font-size="11" fill="#78350f" font-weight="bold">{h_sign(12)}</text>
    {render_house_items(12)}
</svg>'''
    return svg

def calculate_parashari_yogas(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    ayanamsa: str = "LAHIRI"
) -> Dict[str, Any]:
    """
    Classical Parashari Yoga Scanner:
    Calculates authentic Vedic yogas including:
    - Gajakesari Yoga (Jupiter in Kendra from Moon)
    - Budhaditya Yoga (Sun conjunct Mercury)
    - Pancha Mahapurusha Yogas (Ruchaka, Bhadra, Hamsa, Malavya, Sasa)
    - Chandra-Mangala Yoga (Moon conjunct Mars)
    - Amala Yoga (Benefic in 10th from Lagna or Moon)
    - Kemadruma Yoga (No planets in 2nd and 12th from Moon)
    - Kahala Yoga & Parvata Yoga
    """
    from app.modules.parashari.calculator import calculate_varga_chart
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)
    
    planets = {p["id"]: p for p in chart["planets"]}
    asc_sign = chart["ascendant"]["sign"]["number"] # 1 to 12

    # Planetary positions
    p_houses = {p["id"]: p["house"] for p in chart["planets"]}
    p_signs = {p["id"]: p["sign"]["number"] for p in chart["planets"]}

    found_yogas = []

    # 1. Budhaditya Yoga
    if p_signs["SUN"] == p_signs["MERCURY"]:
        # Angular orb
        sun_deg = planets["SUN"]["longitude"]
        merc_deg = planets["MERCURY"]["longitude"]
        orb = abs(sun_deg - merc_deg)
        found_yogas.append({
            "name": "Budhaditya Yoga",
            "category": "Raja Yoga / Intellect",
            "planets": ["SUN", "MERCURY"],
            "house": p_houses["SUN"],
            "description": "Sun and Mercury conjoined in the same sign, bestowing keen analytical intellect, learning, and administrative competence.",
            "orb_degrees": round(orb, 2),
            "strength": "STRONG" if orb <= 10.0 else "MODERATE"
        })

    # 2. Gajakesari Yoga
    # Jupiter in Kendra (1, 4, 7, 10) from Moon
    rel_moon_jup = ((p_houses["JUPITER"] - p_houses["MOON"]) % 12) + 1
    if rel_moon_jup in [1, 4, 7, 10]:
        found_yogas.append({
            "name": "Gajakesari Yoga",
            "category": "Maha Raja Yoga",
            "planets": ["MOON", "JUPITER"],
            "house": p_houses["JUPITER"],
            "description": "Jupiter placed in a quadrant (Kendra) from the Moon, conferring lasting reputation, moral integrity, wisdom, and prosperity.",
            "kendra_position": f"{rel_moon_jup}th from Moon",
            "strength": "STRONG"
        })

    # 3. Pancha Mahapurusha Yogas (Mars, Mercury, Jupiter, Venus, Saturn in Kendra and in own/exalted sign)
    # Own signs: Mars (1, 8), Mercury (3, 6), Jupiter (9, 12), Venus (2, 7), Saturn (10, 11)
    # Exalted: Mars (10), Mercury (6), Jupiter (4), Venus (12), Saturn (7)
    mahapurusha_defs = [
        ("MARS", "Ruchaka Yoga", [1, 8, 10], "Valor, physical vitality, commandership, and martial victory."),
        ("MERCURY", "Bhadra Yoga", [3, 6], "Sharp intellect, eloquence, photographic memory, and commercial acumen."),
        ("JUPITER", "Hamsa Yoga", [9, 12, 4], "Spiritual wisdom, scholarly honor, virtuous character, and reverence."),
        ("VENUS", "Malavya Yoga", [2, 7, 12], "Artistic gifts, luxurious life, aesthetic sensibility, and magnetic charm."),
        ("SATURN", "Sasa Yoga", [10, 11, 7], "Authority, perseverance, political power, and leadership over masses.")
    ]
    for pid, yname, dignified_signs, ydesc in mahapurusha_defs:
        if p_houses[pid] in [1, 4, 7, 10] and p_signs[pid] in dignified_signs:
            found_yogas.append({
                "name": yname,
                "category": "Pancha Mahapurusha Yoga",
                "planets": [pid],
                "house": p_houses[pid],
                "description": ydesc,
                "strength": "HIGH"
            })

    # 4. Chandra-Mangala Yoga
    if p_signs["MOON"] == p_signs["MARS"]:
        found_yogas.append({
            "name": "Chandra Mangala Yoga",
            "category": "Dhana Yoga",
            "planets": ["MOON", "MARS"],
            "house": p_houses["MOON"],
            "description": "Moon and Mars conjoined, creating high enterprise, resourcefulness, financial acumen, and assertiveness.",
            "strength": "STRONG"
        })

    # 5. Amala Yoga (Benefics Jupiter, Venus, or Mercury in 10th from Lagna or Moon)
    h10_lagna = 10
    h10_moon = ((p_houses["MOON"] + 9 - 1) % 12) + 1
    amala_planets = [pid for pid in ["JUPITER", "VENUS", "MERCURY"] if p_houses[pid] in [h10_lagna, h10_moon]]
    if amala_planets:
        found_yogas.append({
            "name": "Amala Yoga",
            "category": "Shubha Yoga",
            "planets": amala_planets,
            "house": 10,
            "description": "Natural benefics occupying the 10th house of profession, giving an unblemished reputation and noble livelihood.",
            "strength": "STRONG"
        })

    # 6. Kemadruma Yoga Check (Inauspicious: No planet except Sun/Rahu/Ketu in 2nd & 12th from Moon)
    h2_moon = (p_houses["MOON"] % 12) + 1
    h12_moon = ((p_houses["MOON"] - 2) % 12) + 1
    flank_planets = [pid for pid in ["MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"] if p_houses[pid] in [h2_moon, h12_moon]]
    has_kemadruma = (len(flank_planets) == 0)
    
    # Cancellation check: Moon in Kendra or planets in Kendra from Moon
    kemadruma_cancelled = False
    if has_kemadruma:
        planets_in_moon_kendra = [pid for pid in ["MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"] if ((p_houses[pid] - p_houses["MOON"]) % 12) + 1 in [1, 4, 7, 10]]
        if p_houses["MOON"] in [1, 4, 7, 10] or len(planets_in_moon_kendra) > 0:
            kemadruma_cancelled = True

    if has_kemadruma:
        found_yogas.append({
            "name": "Kemadruma Yoga",
            "category": "Arishta Yoga",
            "planets": ["MOON"],
            "house": p_houses["MOON"],
            "description": "No planets in flanking 2nd or 12th houses from Moon." + (" (Bhanga / Cancelled due to Kendra planetary support)." if kemadruma_cancelled else " Indicates phases of mental solitude and self-reliance."),
            "is_cancelled": kemadruma_cancelled,
            "strength": "NEUTRALIZED" if kemadruma_cancelled else "MODERATE"
        })

    return {
        "ascendant_sign": chart["ascendant"]["sign"]["name"],
        "total_yogas_identified": len(found_yogas),
        "yogas": found_yogas
    }

def calculate_ashtakavarga(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    ayanamsa: str = "LAHIRI"
) -> Dict[str, Any]:
    """
    Classical Brihat Parashara Hora Shastra (BPHS) Ashtakavarga:
    Computes Bhinnashtakavarga (BAV) for 7 planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
    and composite Sarvashtakavarga (SAV) points across all 12 signs (summing to 337 bindus).
    """
    from app.modules.parashari.calculator import calculate_varga_chart
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)

    # 1-indexed house positions (1 to 12)
    p_signs = {p["id"]: p["sign"]["number"] for p in chart["planets"]}
    asc_sign = chart["ascendant"]["sign"]["number"]
    p_signs["ASC"] = asc_sign

    # Classical BPHS Benefic Bindu Placement Rules (relative house offsets from reference bodies)
    # Offsets are 1-based relative house positions
    ASHTAKAVARGA_RULES = {
        "SUN": {
            "SUN": [1, 2, 4, 7, 8, 9, 10, 11],
            "MOON": [3, 6, 10, 11],
            "MARS": [1, 2, 4, 7, 8, 9, 10, 11],
            "MERCURY": [3, 5, 6, 9, 10, 11, 12],
            "JUPITER": [5, 6, 9, 11],
            "VENUS": [6, 7, 12],
            "SATURN": [1, 2, 4, 7, 8, 9, 10, 11],
            "ASC": [3, 4, 6, 10, 11, 12]
        },
        "MOON": {
            "SUN": [3, 6, 7, 8, 10, 11],
            "MOON": [1, 3, 6, 7, 10, 11],
            "MARS": [2, 3, 5, 6, 9, 10, 11],
            "MERCURY": [1, 3, 4, 5, 7, 8, 10, 11],
            "JUPITER": [1, 4, 7, 8, 10, 11, 12],
            "VENUS": [3, 4, 5, 7, 9, 10, 11],
            "SATURN": [3, 5, 6, 11],
            "ASC": [3, 6, 10, 11]
        },
        "MARS": {
            "SUN": [3, 5, 6, 10, 11],
            "MOON": [3, 6, 11],
            "MARS": [1, 2, 4, 7, 8, 10, 11],
            "MERCURY": [3, 5, 6, 11],
            "JUPITER": [6, 10, 11, 12],
            "VENUS": [6, 8, 11, 12],
            "SATURN": [1, 4, 7, 8, 9, 10, 11],
            "ASC": [1, 3, 6, 10, 11]
        },
        "MERCURY": {
            "SUN": [5, 6, 9, 11, 12],
            "MOON": [2, 4, 6, 8, 10, 11],
            "MARS": [1, 2, 4, 7, 8, 9, 10, 11],
            "MERCURY": [1, 3, 5, 6, 9, 10, 11, 12],
            "JUPITER": [6, 8, 11, 12],
            "VENUS": [1, 2, 3, 4, 5, 8, 9, 11],
            "SATURN": [1, 2, 4, 7, 8, 9, 10, 11],
            "ASC": [1, 2, 4, 6, 8, 10, 11]
        },
        "JUPITER": {
            "SUN": [1, 2, 3, 4, 7, 8, 9, 10, 11],
            "MOON": [2, 5, 7, 9, 11],
            "MARS": [1, 2, 4, 7, 8, 10, 11],
            "MERCURY": [1, 2, 4, 5, 6, 9, 10, 11],
            "JUPITER": [1, 2, 3, 4, 7, 8, 10, 11],
            "VENUS": [2, 5, 6, 9, 10, 11],
            "SATURN": [3, 5, 6, 12],
            "ASC": [1, 2, 4, 5, 6, 7, 9, 10, 11]
        },
        "VENUS": {
            "SUN": [8, 11, 12],
            "MOON": [1, 2, 3, 4, 5, 8, 9, 11, 12],
            "MARS": [3, 5, 6, 9, 11, 12],
            "MERCURY": [3, 5, 6, 9, 11],
            "JUPITER": [5, 8, 9, 10, 11],
            "VENUS": [1, 2, 3, 4, 5, 8, 9, 10, 11],
            "SATURN": [3, 4, 5, 8, 9, 10, 11],
            "ASC": [1, 2, 3, 4, 5, 8, 9, 11]
        },
        "SATURN": {
            "SUN": [1, 2, 4, 7, 8, 10, 11],
            "MOON": [3, 6, 11],
            "MARS": [3, 5, 6, 10, 11, 12],
            "MERCURY": [6, 8, 9, 10, 11, 12],
            "JUPITER": [5, 6, 11, 12],
            "VENUS": [6, 11, 12],
            "SATURN": [3, 5, 6, 11],
            "ASC": [1, 3, 4, 6, 10, 11]
        }
    }

    zodiac_names = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]

    bhinnashtaka = {}
    sarvashtaka_totals = [0] * 12 # Sign index 0 to 11

    for planet, ref_dict in ASHTAKAVARGA_RULES.items():
        bindus = [0] * 12 # Points in each of the 12 signs (Aries=0 to Pisces=11)
        for ref_body, offset_list in ref_dict.items():
            ref_sign = p_signs[ref_body] - 1 # 0-indexed sign
            for offset in offset_list:
                target_sign = (ref_sign + offset - 1) % 12
                bindus[target_sign] += 1

        bhinnashtaka[planet] = {
            "total_points": sum(bindus),
            "sign_points": {zodiac_names[i]: bindus[i] for i in range(12)}
        }
        for i in range(12):
            sarvashtaka_totals[i] += bindus[i]

    return {
        "sarvashtakavarga": {
            "total_bindus": sum(sarvashtaka_totals),
            "sign_bindus": {zodiac_names[i]: sarvashtaka_totals[i] for i in range(12)},
            "average_per_sign": round(sum(sarvashtaka_totals) / 12.0, 1)
        },
        "bhinnashtakavarga": bhinnashtaka
    }

def calculate_planetary_avasthas(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    ayanamsa: str = "LAHIRI"
) -> Dict[str, Any]:
    """
    Module 3 — Endpoint 26: Classical Parashari Planetary Avasthas.
    Calculates:
    1. Baladi Avasthas (Age States based on degree in sign):
       - Odd Signs: 0-6° Bala (Infant), 6-12° Kumara (Youth), 12-18° Yuva (Adolescent/Prime), 18-24° Vriddha (Old), 24-30° Mrita (Dead).
       - Even Signs: Reversed order.
    2. Jagradadi Avasthas (Alertness based on full Panchadha Maitri dignity toward the
       sign lord — Jagrata for Exalted/Moolatrikona/Own/Great-Friend, Swapna for
       Friend/Neutral, Sushupti for Enemy/Great-Enemy/Debilitated).
    """
    from app.modules.parashari.calculator import calculate_varga_chart
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)

    d1_sign_of = {p["id"]: p["sign"]["number"] - 1 for p in chart["planets"]}

    avasthas = {}
    for p in chart["planets"]:
        pid = p["id"]
        deg_in_sign = p["longitude"] % 30.0
        sign_num = p["sign"]["number"] # 1 to 12
        sign_idx = sign_num - 1
        is_odd = (sign_num % 2 != 0)

        # 1. Baladi Avastha
        segment = int(deg_in_sign // 6.0) # 0 to 4
        if is_odd:
            baladi_names = ["Bala (Infant - 25% fruit)", "Kumara (Youth - 50% fruit)", "Yuva (Prime Adult - 100% full fruit)", "Vriddha (Old - Negligible fruit)", "Mrita (Dead - 0% fruit)"]
            baladi = baladi_names[segment]
        else:
            baladi_names = ["Mrita (Dead - 0% fruit)", "Vriddha (Old - Negligible fruit)", "Yuva (Prime Adult - 100% full fruit)", "Kumara (Youth - 50% fruit)", "Bala (Infant - 25% fruit)"]
            baladi = baladi_names[segment]

        # 2. Jagradadi Avastha — real Panchadha Maitri dignity (natural + temporal
        # friendship toward the occupied sign's lord), not just the coarse
        # Exalted/Debilitated/Own/Neutral field used elsewhere, so Swapna is actually reachable.
        dignity = compute_compound_dignity(pid, sign_idx, deg_in_sign, d1_sign_of, is_d1=True)
        if dignity in ("EXALTED", "MOOLATRIKONA", "OWN", "GREAT_FRIEND"):
            jagradadi = "Jagrata (Awake - Highly Conscious & Effective)"
        elif dignity in ("FRIEND", "NEUTRAL"):
            jagradadi = "Swapna (Dreaming - Moderately Active)"
        else:
            jagradadi = "Sushupti (Sleeping - Subdued & Dormant)"

        avasthas[pid] = {
            "planet_name": p["name"],
            "longitude": p["longitude"],
            "sign": p["sign"]["name"],
            "degree_in_sign": round(deg_in_sign, 2),
            "baladi_avastha": baladi,
            "dignity_toward_sign_lord": dignity,
            "jagradadi_avastha": jagradadi
        }

    return {
        "ascendant_sign": chart["ascendant"]["sign"]["name"],
        "planetary_avasthas": avasthas
    }

def calculate_special_points(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    ayanamsa: str = "LAHIRI"
) -> Dict[str, Any]:
    """
    Module 3 — Endpoint 29: Sensitive Points: Pushkar Navamsha, Pushkar Bhaga, Gandanta, and Mrityu Bhaga.
    - Gandanta: Junction of Water and Fire signs (Revati-Ashwini, Ashlesha-Magha, Jyeshtha-Mula).
    - Pushkar Navamsha: Highly auspicious nourishing degrees in Navamsha.
    - Pushkar Bhaga: Specific degree in each sign providing supreme regenerative power.
    """
    from app.modules.parashari.calculator import calculate_varga_chart, compute_d9_navamsha_sign
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)

    # Specific Pushkar Bhaga degrees per sign (1 to 12)
    PUSHKAR_BHAGA_DEGREES = {
        1: 21.0, 2: 14.0, 3: 18.0, 4: 8.0, 5: 19.0, 6: 9.0,
        7: 24.0, 8: 11.0, 9: 23.0, 10: 14.0, 11: 19.0, 12: 9.0
    }

    # Gandanta spans (within 3°20' of water-fire cusp: 119° - 121°, 239° - 241°, 359° - 1°)
    gandanta_zones = [
        ("Cancer-Leo Gandanta", 120.0),
        ("Scorpio-Sagittarius Gandanta", 240.0),
        ("Pisces-Aries Gandanta", 0.0)
    ]

    points_audit = []
    for p in chart["planets"]:
        lon = p["longitude"]
        s_num = p["sign"]["number"]
        deg_in_sign = lon % 30.0

        # Pushkar Navamsha check (Navamsha sign ruled by Moon, Mercury, Jupiter, Venus in Taurus, Cancer, Virgo, Sag, Pisces)
        d9_sign = compute_d9_navamsha_sign(lon)
        is_pushkar_nav = d9_sign in [1, 3, 5, 8, 11] # Taurus, Cancer, Virgo, Sag, Pisces

        # Pushkar Bhaga proximity (< 1.5°)
        pb_deg = PUSHKAR_BHAGA_DEGREES.get(s_num, 15.0)
        is_pushkar_bhaga = abs(deg_in_sign - pb_deg) <= 1.5

        # Gandanta proximity (< 1.5° from 0, 120, 240)
        is_gandanta = False
        gandanta_name = "None"
        for g_name, g_deg in gandanta_zones:
            dist = abs((lon - g_deg + 180.0) % 360.0 - 180.0)
            if dist <= 2.0:
                is_gandanta = True
                gandanta_name = g_name
                break

        points_audit.append({
            "planet": p["id"],
            "longitude": round(lon, 4),
            "sign": p["sign"]["name"],
            "is_pushkar_navamsha": is_pushkar_nav,
            "is_pushkar_bhaga": is_pushkar_bhaga,
            "pushkar_bhaga_degree": pb_deg,
            "is_gandanta": is_gandanta,
            "gandanta_junction": gandanta_name
        })

    return {
        "ascendant_sign": chart["ascendant"]["sign"]["name"],
        "planets_special_points": points_audit
    }

def calculate_shadbala_details(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    ayanamsa: str = "LAHIRI"
) -> Dict[str, Any]:
    """
    Module 3 — Endpoint 24: 6-Fold Planetary Strength (Shadbala), BPHS Ch. 27.

    Formulas cross-checked against the Saravali reference (saravali.github.io/astrology/bala_*.html)
    and the PyJHora open-source implementation (github.com/naturalstupid/PyJHora, based on
    P.V.R. Narasimha Rao's "Vedic Astrology: An Integrated Approach"). Real, sourced formulas
    unless noted:
    1. Sthana Bala = Uchcha + Saptavargaja + Ojayugmarasyamsa + Kendradi + Drekkana Bala (all 5 real).
    2. Dig Bala: real distance/3 formula, but the "weakest point" reference uses an equal-house
       bhava-madhya (Lagna degree + (house-1)*30 + 15) since this module's houses are whole-sign,
       not Placidus cusps — an approximation, not the exact classical cusp-based version.
    3. Kaala Bala = Nathonnata + Paksha + Tribhaga + Vaaradhipati + Hora + Ayana Bala.
       Abdadhipati (year-lord, 15 virupas) and Masadhipati (month-lord, 30 virupas) are DELIBERATELY
       OMITTED: both need a Hindu-calendar ahargana epoch this module doesn't implement, and
       guessing epoch constants risked a confidently-wrong number, which is worse than a documented
       gap. Nathonnata Bala's "midnight" is the midpoint of the nearest sunrise/sunset-derived night,
       not a precise ahargana-based midnight. Yuddha (planetary war) redistribution is not computed
       (rare edge case: two of the 5 non-luminaries within ~1 degree of each other).
    4. Chesta Bala: Sun's = its own Ayana Bala, Moon's = its own Paksha Bala (both real, per BPHS).
       For Mars/Mercury/Jupiter/Venus/Saturn: approximated from real instantaneous speed vs. mean
       daily motion on a continuous 0-60 scale, anchored so Sama (mean speed) ~= 7.5 and Chara
       (fast, ratio~1) ~= 45 to match the sourced classical anchor values — NOT the exact classical
       discrete 8-tier Vakra/Anuvakra/Vikala/Mandatara/Manda/Sama/Chara/Atichara classification,
       whose precise speed-ratio breakpoints were not confidently sourced this session.
    5. Naisargika Bala: unchanged — already matched the classical fixed table (Sun 60 ... Saturn 8.57).
    6. Drik Bala: real piecewise Sputa Drishti formula (special aspects: Mars 4th/8th, Jupiter
       5th/9th, Saturn 3rd/10th full-strength zones), summed as (benefic aspects - malefic
       aspects)/4 per the reference implementation. Moon classified benefic/malefic by paksha
       (bright/dark half); Mercury is simplified to always-benefic (the classical rule also flips
       it malefic when conjunct another malefic, not implemented here).
    """
    from app.modules.parashari.calculator import calculate_varga_chart
    from app.modules.core_astronomy.advanced_astronomy import calculate_sun_moon_timings

    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)
    planets_by_id = {p["id"]: p for p in chart["planets"]}
    d1_sign_of = {p["id"]: p["sign"]["number"] - 1 for p in chart["planets"]}
    asc_deg = chart["ascendant"]["full_degree"]

    NAISARGIKA_BALA = {
        "SUN": 60.0, "MOON": 51.43, "VENUS": 42.86, "JUPITER": 34.29,
        "MERCURY": 25.71, "MARS": 17.14, "SATURN": 8.57
    }
    MIN_REQUIRED_RUPAS = {
        "SUN": 6.5, "MOON": 6.0, "MARS": 5.0, "MERCURY": 7.0,
        "JUPITER": 6.5, "VENUS": 5.5, "SATURN": 5.0
    }
    DIG_BALA_STRONG_HOUSE = {"JUPITER": 1, "MERCURY": 1, "MOON": 4, "VENUS": 4, "SATURN": 7, "SUN": 10, "MARS": 10}
    MEAN_DAILY_MOTION = {"MARS": 0.524, "MERCURY": 1.383, "JUPITER": 0.0831, "VENUS": 1.602, "SATURN": 0.0334}
    SAPTAVARGA_LIST = ["D1", "D2", "D3", "D7", "D9", "D12", "D30"]
    SAPTAVARGA_POINTS = {"GREAT_FRIEND": 22.5, "FRIEND": 15.0, "NEUTRAL": 7.5, "ENEMY": 3.75, "GREAT_ENEMY": 1.875}
    SWE_PLANET_IDS = {"SUN": swe.SUN, "MOON": swe.MOON, "MARS": swe.MARS, "MERCURY": swe.MERCURY,
                       "JUPITER": swe.JUPITER, "VENUS": swe.VENUS, "SATURN": swe.SATURN}

    # ---------- Sthana Bala (5 real sub-components) ----------
    def uchcha_bala(pid, full_lon):
        debil_point = (DEEP_EXALTATION_DEGREE[pid] + 180.0) % 360.0
        dist = abs((full_lon - debil_point + 180.0) % 360.0 - 180.0)
        return round(dist / 3.0, 2)

    def saptavargaja_bala(pid):
        total = 0.0
        p_lon = planets_by_id[pid]["longitude"]
        for vg in SAPTAVARGA_LIST:
            s_idx = compute_varga_sign(p_lon, vg)
            deg_in = (p_lon % 30.0) if vg == "D1" else 0.0
            dignity = compute_compound_dignity(pid, s_idx, deg_in, d1_sign_of, is_d1=(vg == "D1"), include_exaltation=False)
            if dignity == "MOOLATRIKONA":
                total += 45.0
            elif dignity == "OWN":
                total += 30.0
            else:
                total += SAPTAVARGA_POINTS.get(dignity, 7.5)
        return round(total, 2)

    def ojayugmarasyamsa_bala(pid, rasi_sign_idx, nav_sign_idx):
        female = pid in ("MOON", "VENUS")
        pts = 0.0
        if female:
            if rasi_sign_idx % 2 == 1:
                pts += 15.0
            if nav_sign_idx % 2 == 1:
                pts += 15.0
        else:
            if rasi_sign_idx % 2 == 0:
                pts += 15.0
            if nav_sign_idx % 2 == 0:
                pts += 15.0
        return pts

    def kendradi_bala(house_num):
        if house_num in (1, 4, 7, 10):
            return 60.0
        if house_num in (2, 5, 8, 11):
            return 30.0
        return 15.0

    DREKKANA_GROUP = {"SUN": 0, "MARS": 0, "JUPITER": 0, "MOON": 1, "VENUS": 1, "MERCURY": 2, "SATURN": 2}

    def drekkana_bala(pid, deg_in_sign):
        part = min(int(deg_in_sign // 10.0), 2)
        return 15.0 if DREKKANA_GROUP.get(pid) == part else 0.0

    # ---------- Dig Bala ----------
    def dig_bala(pid, full_lon):
        strong_house = DIG_BALA_STRONG_HOUSE[pid]
        weak_house = ((strong_house - 1 + 6) % 12) + 1
        weak_point = (asc_deg + (weak_house - 1) * 30.0 + 15.0) % 360.0
        dist = abs((full_lon - weak_point + 180.0) % 360.0 - 180.0)
        return round(dist / 3.0, 2)

    # ---------- Kaala Bala ----------
    sun_timings = calculate_sun_moon_timings(dob, lat, lon, tz)
    jd_birth = calculate_julian_day(dob, tob, tz)
    if sun_timings.get("sunrise") not in (None, "N/A") and sun_timings.get("sunset") not in (None, "N/A"):
        jd_sunrise = calculate_julian_day(dob, sun_timings["sunrise"], tz)
        jd_sunset = calculate_julian_day(dob, sun_timings["sunset"], tz)
    else:
        # Polar edge case fallback: assume a 06:00/18:00 day.
        jd_sunrise = calculate_julian_day(dob, "06:00:00", tz)
        jd_sunset = calculate_julian_day(dob, "18:00:00", tz)
    day_length_days = max(jd_sunset - jd_sunrise, 1.0 / 1440.0)
    night_length_days = max(1.0 - day_length_days, 1.0 / 1440.0)

    # Nathonnata Bala: distance (in hours, scaled x5 to virupas) from the nearer of the
    # two midnights (previous-night midpoint or next-night midpoint) bracketing this day.
    night_before_mid = jd_sunrise - night_length_days / 2.0
    night_after_mid = jd_sunset + night_length_days / 2.0
    nearest_mid = night_before_mid if abs(jd_birth - night_before_mid) <= abs(jd_birth - night_after_mid) else night_after_mid
    hrs_from_mid = min(abs(jd_birth - nearest_mid) * 24.0, 12.0)
    nathonnata_raw = round(hrs_from_mid * 5.0, 2)
    NATHONNATA = {"SUN": nathonnata_raw, "JUPITER": nathonnata_raw, "VENUS": nathonnata_raw, "MERCURY": 60.0}
    for _pid in ("MOON", "MARS", "SATURN"):
        NATHONNATA[_pid] = round(60.0 - nathonnata_raw, 2)

    # Paksha Bala: real Sun-Moon elongation, symmetric fold around Purnima (full moon = 60).
    sun_lon = planets_by_id["SUN"]["longitude"]
    moon_lon = planets_by_id["MOON"]["longitude"]
    raw_elong = (moon_lon - sun_lon) % 360.0
    is_waxing = raw_elong <= 180.0
    pb = raw_elong / 3.0
    if pb > 60.0:
        pb = 120.0 - pb
    pb = round(pb, 2)
    PAKSHA_BENEFIC = {"JUPITER", "VENUS", "MERCURY"}
    PAKSHA = {}
    for _pid in NAISARGIKA_BALA:
        if _pid == "MOON":
            PAKSHA[_pid] = round(pb * 2.0 if is_waxing else (60.0 - pb) * 2.0, 2)
        elif _pid in PAKSHA_BENEFIC:
            PAKSHA[_pid] = pb
        else:
            PAKSHA[_pid] = round(60.0 - pb, 2)

    # Tribhaga Bala: day/night each split into thirds with a fixed segment-lord sequence;
    # Jupiter always receives the full 60 virupas alongside whichever segment lord applies.
    TRIBHAGA = {pid: 0.0 for pid in NAISARGIKA_BALA}
    TRIBHAGA["JUPITER"] = 60.0
    if jd_sunrise <= jd_birth < jd_sunset:
        day_frac = (jd_birth - jd_sunrise) / day_length_days
        seg = min(int(day_frac * 3.0), 2)
        TRIBHAGA[["MERCURY", "SUN", "SATURN"][seg]] = 60.0
    else:
        night_start = jd_sunset if jd_birth >= jd_sunset else (jd_sunrise - night_length_days)
        night_frac = max(min((jd_birth - night_start) / night_length_days, 1.0), 0.0)
        seg = min(int(night_frac * 3.0), 2)
        TRIBHAGA[["MOON", "VENUS", "MARS"][seg]] = 60.0

    # Vaaradhipati Bala: 45 virupas to the sunrise-based weekday lord (mirrors the
    # verified sunrise-based Vaar logic already used in the panchang module).
    dt = datetime.strptime(dob, "%Y-%m-%d")
    effective_dt = dt - timedelta(days=1) if jd_birth < jd_sunrise else dt
    weekday_idx = effective_dt.weekday()  # 0=Monday ... 6=Sunday
    WEEKDAY_LORD = ["MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "SUN"]
    vaara_lord = WEEKDAY_LORD[weekday_idx]
    VAARADHIPATI = {pid: (45.0 if pid == vaara_lord else 0.0) for pid in NAISARGIKA_BALA}

    # Hora Bala: 60 virupas to the ruling planet of the current classical planetary hour —
    # Chaldean order (Saturn>Jupiter>Mars>Sun>Venus>Mercury>Moon), first hora after sunrise
    # ruled by the day's own lord, advancing one planet per elapsed clock hour.
    CHALDEAN_ORDER = ["SATURN", "JUPITER", "MARS", "SUN", "VENUS", "MERCURY", "MOON"]
    hours_since_sunrise = (jd_birth - jd_sunrise) * 24.0
    if hours_since_sunrise < 0:
        hours_since_sunrise += 24.0
    hora_steps = int(hours_since_sunrise) % 7
    hora_lord = CHALDEAN_ORDER[(CHALDEAN_ORDER.index(vaara_lord) + hora_steps) % 7]
    HORA = {pid: (60.0 if pid == hora_lord else 0.0) for pid in NAISARGIKA_BALA}

    # Ayana Bala: real declination-based formula, (24 + declination) * 1.25, Sun doubled per BPHS.
    jd_ut_tropical = calculate_julian_day(dob, tob, tz)
    AYANA = {}
    for pid, swe_id in SWE_PLANET_IDS.items():
        eq_res, _ = swe.calc_ut(jd_ut_tropical, swe_id, swe.FLG_SWIEPH | swe.FLG_EQUATORIAL)
        decl = eq_res[1]
        val = round((24.0 + decl) * 1.25, 2)
        if pid == "SUN":
            val = round(val * 2.0, 2)
        AYANA[pid] = max(0.0, val)

    # ---------- Chesta Bala ----------
    def chesta_bala(pid, speed, is_retro):
        if pid == "SUN":
            return AYANA["SUN"]  # BPHS: Sun's Chesta Bala equals its own Ayana Bala
        if pid == "MOON":
            return PAKSHA["MOON"]  # BPHS: Moon's Chesta Bala equals its own Paksha Bala
        if is_retro:
            return 60.0
        mean = MEAN_DAILY_MOTION.get(pid, 1.0)
        ratio = (abs(speed) / mean) if mean > 0 else 0.0
        val = 7.5 + 37.5 * min(ratio, 1.4)
        return round(min(val, 60.0), 2)

    # ---------- Drik Bala (real piecewise Sputa Drishti, module-level sputa_drishti_raw) ----------
    def classify_benefic(pid):
        if pid == "MOON":
            return is_waxing
        return pid in ("JUPITER", "VENUS", "MERCURY")

    def drik_bala(target_pid):
        target_lon = planets_by_id[target_pid]["longitude"]
        benefic_sum = 0.0
        malefic_sum = 0.0
        for src_pid in NAISARGIKA_BALA:
            if src_pid == target_pid:
                continue
            src_lon = planets_by_id[src_pid]["longitude"]
            raw = sputa_drishti_raw((target_lon - src_lon) % 360.0, src_pid)
            if classify_benefic(src_pid):
                benefic_sum += raw
            else:
                malefic_sum += raw
        return round((benefic_sum - malefic_sum) / 4.0, 2)

    # ---------- Assemble ----------
    shadbala_table = {}
    for p in chart["planets"]:
        pid = p["id"]
        if pid not in NAISARGIKA_BALA:
            continue  # Rahu/Ketu are not part of classical Shadbala

        h = p["house"]
        full_lon = p["longitude"]
        deg_in_sign = full_lon % 30.0
        rasi_sign_idx = p["sign"]["number"] - 1
        nav_sign_idx = compute_d9_navamsha_sign(full_lon)
        speed = p.get("speed", 0.0)
        is_ret = p.get("is_retrograde", False)

        ub = uchcha_bala(pid, full_lon)
        svb = saptavargaja_bala(pid)
        ob = ojayugmarasyamsa_bala(pid, rasi_sign_idx, nav_sign_idx)
        kb = kendradi_bala(h)
        drb = drekkana_bala(pid, deg_in_sign)
        sthana_bala_total = round(ub + svb + ob + kb + drb, 2)

        dig_bala_total = dig_bala(pid, full_lon)

        kaala_bala_total = round(
            NATHONNATA[pid] + PAKSHA[pid] + TRIBHAGA[pid] + VAARADHIPATI[pid] + HORA[pid] + AYANA[pid], 2
        )

        chesta_bala_total = chesta_bala(pid, speed, is_ret)
        naisargika = NAISARGIKA_BALA[pid]
        drik_bala_total = drik_bala(pid)

        total_virupas = round(
            sthana_bala_total + dig_bala_total + kaala_bala_total + chesta_bala_total + naisargika + drik_bala_total, 2
        )
        total_rupas = round(total_virupas / 60.0, 2)
        req_rupas = MIN_REQUIRED_RUPAS[pid]
        is_strong = total_rupas >= req_rupas

        shadbala_table[pid] = {
            "planet_name": p["name"],
            "sthana_bala": sthana_bala_total,
            "sthana_bala_breakdown": {
                "uchcha_bala": ub, "saptavargaja_bala": svb, "ojayugmarasyamsa_bala": ob,
                "kendradi_bala": kb, "drekkana_bala": drb
            },
            "dig_bala": dig_bala_total,
            "kaala_bala": kaala_bala_total,
            "kaala_bala_breakdown": {
                "nathonnata_bala": NATHONNATA[pid], "paksha_bala": PAKSHA[pid], "tribhaga_bala": TRIBHAGA[pid],
                "vaaradhipati_bala": VAARADHIPATI[pid], "hora_bala": HORA[pid], "ayana_bala": AYANA[pid]
            },
            "chesta_bala": chesta_bala_total,
            "naisargika_bala": naisargika,
            "drik_bala": drik_bala_total,
            "total_shadbala_virupas": total_virupas,
            "total_shadbala_rupas": total_rupas,
            "minimum_required_rupas": req_rupas,
            "strength_ratio": round(total_rupas / req_rupas, 2),
            "verdict": "STRONG_CAPABLE" if is_strong else "DEFICIENT"
        }

    return {
        "ascendant_sign": chart["ascendant"]["sign"]["name"],
        "total_planets_analyzed": len(shadbala_table),
        "shadbala": shadbala_table
    }

def calculate_bhavabala(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    ayanamsa: str = "LAHIRI"
) -> Dict[str, Any]:
    """
    Module 3 — Endpoint 25: 12-House Strength Analysis (Bhavabala).
    Classical BPHS composite house strength from three real components:
    1. Bhavadhipati Bala: the house lord's own total Shadbala (from calculate_shadbala_details).
    2. Bhava Digbala: Kendra/Panapara/Apoklima 60/30/15 virupas, the same well-sourced
       grouping used for planetary Kendradi Bala (not the ad hoc 60/45/30 grouping this
       endpoint used previously).
    3. Bhava Drishti Bala: real Sputa Drishti aspect strength (benefic - malefic)/4 received
       by the house's own bhava-madhya point (equal-house approximation, see Shadbala's
       Dig Bala docstring note) from all 7 classical planets — not a crude occupant count.
    """
    shad = calculate_shadbala_details(dob, tob, lat, lon, tz, ayanamsa)
    shad_p = shad["shadbala"]

    from app.modules.parashari.calculator import calculate_varga_chart
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)
    asc_deg = chart["ascendant"]["full_degree"]
    planet_lons = {p["id"]: p["longitude"] for p in chart["planets"]}
    sun_lon = planet_lons.get("SUN", 0.0)
    moon_lon = planet_lons.get("MOON", 0.0)
    is_waxing = ((moon_lon - sun_lon) % 360.0) <= 180.0

    def classify_benefic(pid):
        if pid == "MOON":
            return is_waxing
        return pid in ("JUPITER", "VENUS", "MERCURY")

    bhavabala_table = {}
    house_names = [
        "Tanu Bhava (Lagna - Vitality & Personality)",
        "Dhana Bhava (Wealth & Family Assets)",
        "Sahaja Bhava (Enterprise & Siblings)",
        "Sukha Bhava (Happiness, Land & Vehicles)",
        "Putra Bhava (Intellect, Progeny & Past Merits)",
        "Ari Bhava (Debts, Competitors & Health)",
        "Kalatra Bhava (Spouse & Business Alliances)",
        "Randhra Bhava (Longevity & Transformation)",
        "Bhagya Bhava (Fortune, Dharma & Higher Learning)",
        "Karma Bhava (Profession, Status & Authority)",
        "Labha Bhava (Gains, Social Circles & Fulfillment)",
        "Vyaya Bhava (Expenditure, Foreign Resonances & Liberation)"
    ]

    for h_obj in chart["houses"]:
        h = h_obj["house"]
        h_lord = h_obj["sign"]["lord"]

        # 1. Bhavadhipati Bala (Virupas of house lord)
        lord_shad = shad_p.get(h_lord, {}).get("total_shadbala_virupas", 350.0)

        # 2. Bhava Digbala (Kendra 60 / Panapara 30 / Apoklima 15 virupas)
        bhav_digbala = 60.0 if h in (1, 4, 7, 10) else (30.0 if h in (2, 5, 8, 11) else 15.0)

        # 3. Bhava Drishti Bala: real aspect strength at this house's bhava-madhya
        bhava_madhya_deg = (asc_deg + (h - 1) * 30.0 + 15.0) % 360.0
        benefic_sum = 0.0
        malefic_sum = 0.0
        for src_pid, src_lon in planet_lons.items():
            if src_pid not in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
                continue
            raw = sputa_drishti_raw((bhava_madhya_deg - src_lon) % 360.0, src_pid)
            if classify_benefic(src_pid):
                benefic_sum += raw
            else:
                malefic_sum += raw
        bhav_drishti = round((benefic_sum - malefic_sum) / 4.0, 2)

        total_bhavabala_virupas = round(lord_shad + bhav_digbala + bhav_drishti, 2)
        total_bhavabala_rupas = round(total_bhavabala_virupas / 60.0, 2)

        bhavabala_table[f"House_{h}"] = {
            "house_number": h,
            "bhava_name": house_names[h - 1],
            "sign": h_obj["sign"]["name"],
            "lord": h_lord,
            "bhavadhipati_bala": lord_shad,
            "bhava_digbala": bhav_digbala,
            "bhava_drishti_bala": bhav_drishti,
            "total_bhavabala_virupas": total_bhavabala_virupas,
            "total_bhavabala_rupas": total_bhavabala_rupas,
            "occupants": h_obj["occupants"],
            "relative_strength": "EXCELLENT" if total_bhavabala_rupas >= 8.0 else ("GOOD" if total_bhavabala_rupas >= 6.5 else "AVERAGE")
        }

    return {
        "ascendant_sign": chart["ascendant"]["sign"]["name"],
        "bhavabala": bhavabala_table
    }



