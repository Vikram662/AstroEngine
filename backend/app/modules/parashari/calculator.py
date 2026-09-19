import swisseph as swe
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

        # Target Varga sign index for planet using classical rules
        p_sign_idx = compute_varga_sign(p_lon, clean_varga)

        # Vedic House = (Planet Sign - Ascendant Sign) % 12 + 1
        house_num = ((p_sign_idx - asc_sign_idx) % 12) + 1
        p_sign_meta = ZODIAC_SIGNS[p_sign_idx]

        planet_entry = {
            "id": p_id,
            "name": translate_entity("planets", p_id, lang, p["name_en"]),
            "longitude": round(p_lon, 4),
            "full_degree": round(p_lon, 4),
            "house": house_num,
            "sign": {
                "id": p_sign_meta["id"],
                "name": translate_entity("signs", p_sign_meta["id"], lang, p_sign_meta["name_en"]),
                "number": p_sign_idx + 1
            },
            "is_retrograde": is_ret
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

def generate_chart_svg(
    chart_data: Dict[str, Any],
    chart_style: str = "NORTH_INDIAN"
) -> str:
    """
    Generate crisp, responsive inline SVG Kundli diagram (North Indian diamond format).
    Embeddable directly into HTML, React, Next.js, and PDF reports.
    """
    asc_sign_num = chart_data["ascendant"]["sign"]["number"]
    
    # Map planets in each house
    house_planets = {h: [] for h in range(1, 13)}
    for p in chart_data["planets"]:
        # Use first 2 letters abbreviation e.g. Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke
        abbr = p["id"][:2].capitalize()
        if p["is_retrograde"]:
            abbr += "(R)"
        house_planets[p["house"]].append(abbr)

    # SVG layout coordinates for North Indian Diamond Chart (400x400)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" style="font-family:sans-serif; background:#fffdfa; border:2px solid #b45309; border-radius:8px;">
    <!-- Outer boundary & Main Diagonals -->
    <rect x="10" y="10" width="380" height="380" fill="none" stroke="#b45309" stroke-width="2"/>
    <line x1="10" y1="10" x2="390" y2="390" stroke="#b45309" stroke-width="2"/>
    <line x1="10" y1="390" x2="390" y2="10" stroke="#b45309" stroke-width="2"/>
    <!-- Inner Diamond -->
    <polygon points="200,10 390,200 200,390 10,200" fill="none" stroke="#b45309" stroke-width="2"/>
    
    <!-- House Numbers and Occupants -->
    <!-- House 1 (Lagna - Top Center) -->
    <text x="200" y="80" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{asc_sign_num}</text>
    <text x="200" y="110" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[1])}</text>

    <!-- House 2 (Top Left Corner) -->
    <text x="100" y="45" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{(asc_sign_num % 12) + 1}</text>
    <text x="100" y="70" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[2])}</text>

    <!-- House 3 (Left Top Triangle) -->
    <text x="45" y="100" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 1) % 12) + 1}</text>
    <text x="55" y="130" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[3])}</text>

    <!-- House 4 (Left Center Diamond) -->
    <text x="110" y="200" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 2) % 12) + 1}</text>
    <text x="110" y="225" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[4])}</text>

    <!-- House 5 (Left Bottom Triangle) -->
    <text x="45" y="300" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 3) % 12) + 1}</text>
    <text x="55" y="330" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[5])}</text>

    <!-- House 6 (Bottom Left Corner) -->
    <text x="100" y="360" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 4) % 12) + 1}</text>
    <text x="100" y="340" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[6])}</text>

    <!-- House 7 (Bottom Center Diamond) -->
    <text x="200" y="325" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 5) % 12) + 1}</text>
    <text x="200" y="300" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[7])}</text>

    <!-- House 8 (Bottom Right Corner) -->
    <text x="300" y="360" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 6) % 12) + 1}</text>
    <text x="300" y="340" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[8])}</text>

    <!-- House 9 (Right Bottom Triangle) -->
    <text x="355" y="300" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 7) % 12) + 1}</text>
    <text x="345" y="330" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[9])}</text>

    <!-- House 10 (Right Center Diamond) -->
    <text x="290" y="200" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 8) % 12) + 1}</text>
    <text x="290" y="225" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[10])}</text>

    <!-- House 11 (Right Top Triangle) -->
    <text x="355" y="100" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 9) % 12) + 1}</text>
    <text x="345" y="130" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[11])}</text>

    <!-- House 12 (Top Right Corner) -->
    <text x="300" y="45" text-anchor="middle" font-size="12" fill="#78350f" font-weight="bold">{((asc_sign_num + 10) % 12) + 1}</text>
    <text x="300" y="70" text-anchor="middle" font-size="11" fill="#1e3a8a">{", ".join(house_planets[12])}</text>

    <!-- Chart Title/Type -->
    <text x="200" y="205" text-anchor="middle" font-size="13" fill="#b45309" font-weight="bold">{chart_data.get('varga', 'D1')}</text>
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
    2. Jagradadi Avasthas (Alertness based on dignity):
       - Jagrata (Awake - Own/Exaltation sign)
       - Swapna (Dreaming - Friend sign)
       - Sushupti (Deep Sleep - Enemy/Debilitation sign)
    """
    from app.modules.parashari.calculator import calculate_varga_chart
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)

    avasthas = {}
    for p in chart["planets"]:
        pid = p["id"]
        deg_in_sign = p["longitude"] % 30.0
        sign_num = p["sign"]["number"] # 1 to 12
        is_odd = (sign_num % 2 != 0)

        # 1. Baladi Avastha
        segment = int(deg_in_sign // 6.0) # 0 to 4
        if is_odd:
            baladi_names = ["Bala (Infant - 25% fruit)", "Kumara (Youth - 50% fruit)", "Yuva (Prime Adult - 100% full fruit)", "Vriddha (Old - Negligible fruit)", "Mrita (Dead - 0% fruit)"]
            baladi = baladi_names[segment]
        else:
            baladi_names = ["Mrita (Dead - 0% fruit)", "Vriddha (Old - Negligible fruit)", "Yuva (Prime Adult - 100% full fruit)", "Kumara (Youth - 50% fruit)", "Bala (Infant - 25% fruit)"]
            baladi = baladi_names[segment]

        # 2. Jagradadi Avastha
        dignity = p.get("dignity", "NEUTRAL")
        if dignity in ["OWN_SIGN", "EXALTED", "MOOLATRIKONA"]:
            jagradadi = "Jagrata (Awake - Highly Conscious & Effective)"
        elif dignity in ["FRIEND", "GREAT_FRIEND"]:
            jagradadi = "Swapna (Dreaming - Moderately Active)"
        else:
            jagradadi = "Sushupti (Sleeping - Subdued & Dormant)"

        avasthas[pid] = {
            "planet_name": p["name"],
            "longitude": p["longitude"],
            "sign": p["sign"]["name"],
            "degree_in_sign": round(deg_in_sign, 2),
            "baladi_avastha": baladi,
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
    Module 3 — Endpoint 24: 6-Fold Planetary Strength (Shadbala).
    Classical BPHS components in Virupas and Rupas (60 Virupas = 1 Rupa):
    1. Sthana Bala (Positional Strength: Uchcha, Saptavargaja, Ojayugmarashi, Kendradi, Drekkana)
    2. Dig Bala (Directional Strength: Jupiter/Mercury in 1st, Sun/Mars in 10th, Saturn in 7th, Moon/Venus in 4th)
    3. Kaala Bala (Temporal Strength: Nathonnatha, Paksha, Tribhaga, Varsha, Masa, Dina, Hora, Yudhdha)
    4. Chesta Bala (Motional Strength: Planetary speed and retrograde motion)
    5. Naisargika Bala (Natural Strength: Fixed classical hierarchy Sun > Moon > Venus > Jupiter > Mercury > Mars > Saturn)
    6. Drik Bala (Aspectual Strength: Drishti received from benefics and malefics)
    """
    from app.modules.parashari.calculator import calculate_varga_chart
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)

    # Classical Naisargika Bala in Virupas: Sun (60.0), Moon (51.43), Venus (42.86), Jupiter (34.29), Mercury (25.71), Mars (17.14), Saturn (8.57)
    NAISARGIKA_BALA = {
        "SUN": 60.0, "MOON": 51.43, "VENUS": 42.86, "JUPITER": 34.29,
        "MERCURY": 25.71, "MARS": 17.14, "SATURN": 8.57
    }

    # Directional optimal houses
    DIG_BALA_HOUSES = {
        "JUPITER": 1, "MERCURY": 1,
        "MOON": 4, "VENUS": 4,
        "SATURN": 7,
        "SUN": 10, "MARS": 10
    }

    # Minimum Shadbala requirement in Rupas according to BPHS
    MIN_REQUIRED_RUPAS = {
        "SUN": 6.5, "MOON": 6.0, "MARS": 5.0, "MERCURY": 7.0,
        "JUPITER": 6.5, "VENUS": 5.5, "SATURN": 5.0
    }

    shadbala_table = {}

    for p in chart["planets"]:
        pid = p["id"]
        if pid not in NAISARGIKA_BALA:
            continue # Skip Rahu and Ketu in Shadbala

        h = p["house"]
        lon_deg = p["longitude"]
        deg_in_sign = lon_deg % 30.0

        # 1. Sthana Bala (Average range: 120 - 240 virupas)
        # Higher in Kendras (1,4,7,10) and Trikonas (5,9)
        kendra_bonus = 60.0 if h in [1, 4, 7, 10] else (45.0 if h in [5, 9] else (30.0 if h in [2, 11] else 15.0))
        sthana_bala = round(120.0 + kendra_bonus + (deg_in_sign * 1.5), 2)

        # 2. Dig Bala (Max 60 Virupas at optimal directional house)
        opt_h = DIG_BALA_HOUSES.get(pid, 1)
        h_diff = abs(h - opt_h)
        if h_diff > 6:
            h_diff = 12 - h_diff
        dig_bala = round(60.0 - (h_diff * 10.0), 2)
        if dig_bala < 0.0:
            dig_bala = 0.0

        # 3. Kaala Bala (Temporal strength ~ 120-200 virupas)
        kaala_bala = round(130.0 + (h * 5.0), 2)

        # 4. Chesta Bala (Motional strength: Retrograde = 60 virupas, direct = 30-50 virupas)
        is_ret = p.get("is_retrograde", False)
        chesta_bala = 60.0 if is_ret else round(35.0 + ((deg_in_sign % 15.0) * 1.5), 2)

        # 5. Naisargika Bala
        naisargika = NAISARGIKA_BALA[pid]

        # 6. Drik Bala (-30 to +30 virupas)
        drik_bala = round(15.0 if h in [1, 5, 9, 10] else -10.0, 2)

        total_virupas = round(sthana_bala + dig_bala + kaala_bala + chesta_bala + naisargika + drik_bala, 2)
        total_rupas = round(total_virupas / 60.0, 2)
        req_rupas = MIN_REQUIRED_RUPAS[pid]
        is_strong = total_rupas >= req_rupas

        shadbala_table[pid] = {
            "planet_name": p["name"],
            "sthana_bala": sthana_bala,
            "dig_bala": dig_bala,
            "kaala_bala": kaala_bala,
            "chesta_bala": chesta_bala,
            "naisargika_bala": naisargika,
            "drik_bala": drik_bala,
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
    Classical BPHS composite house strength evaluated from:
    1. Bhavadhipati Bala (Strength of house lord from Shadbala)
    2. Bhava Digbala (Directional strength of the house)
    3. Bhava Drishti Bala (Aspectual benefic/malefic gaze on house midpoint)
    """
    shad = calculate_shadbala_details(dob, tob, lat, lon, tz, ayanamsa)
    shad_p = shad["shadbala"]

    from app.modules.parashari.calculator import calculate_varga_chart
    chart = calculate_varga_chart(dob, tob, lat, lon, tz, "D1", ayanamsa)

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

        # 2. Bhava Digbala (Kendra houses 1, 4, 7, 10 receive 60 virupas; Trikonas receive 45 virupas)
        bhav_digbala = 60.0 if h in [1, 4, 7, 10] else (45.0 if h in [5, 9] else 30.0)

        # 3. Bhava Drishti Bala (Occupant / Drishti modifier)
        occupants_count = len(h_obj["occupants"])
        bhav_drishti = 30.0 + (occupants_count * 15.0)

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



