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
    factor = VARGA_FACTORS.get(clean_varga, 1)

    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL

    # Calculate Ascendant
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags) # Whole sign for clean Vedic houses
    asc_deg = ascmc[0]

    # Determine Ascendant Sign in target Varga
    if clean_varga == "D1":
        asc_sign_idx = int((asc_deg % 360.0) // 30.0)
    elif clean_varga == "D9":
        asc_sign_idx = compute_d9_navamsha_sign(asc_deg)
    else:
        # General Harmonic Divisional logic for D2-D60
        rashi_idx = int((asc_deg % 360.0) // 30.0)
        part = int(((asc_deg % 30.0) / (30.0 / factor)))
        asc_sign_idx = (rashi_idx + part) % 12

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

        # Target Varga sign index for planet
        if clean_varga == "D1":
            p_sign_idx = int((p_lon % 360.0) // 30.0)
        elif clean_varga == "D9":
            p_sign_idx = compute_d9_navamsha_sign(p_lon)
        else:
            r_idx = int((p_lon % 360.0) // 30.0)
            part = int(((p_lon % 30.0) / (30.0 / factor)))
            p_sign_idx = (r_idx + part) % 12

        # Vedic House = (Planet Sign - Ascendant Sign) % 12 + 1
        house_num = ((p_sign_idx - asc_sign_idx) % 12) + 1
        p_sign_meta = ZODIAC_SIGNS[p_sign_idx]

        planet_entry = {
            "id": p_id,
            "name": translate_entity("planets", p_id, lang, p["name_en"]),
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
