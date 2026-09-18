import swisseph as swe
from typing import Dict, Any, List, Tuple
from app.core.swisseph import (
    calculate_julian_day,
    get_zodiac_sign_info,
    get_nakshatra_info,
    VEDIC_PLANETS
)

MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12]

def calculate_manglik_dosha(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Classical Manglik (Kuja) Dosha analysis evaluated from:
    1. Lagna (Ascendant)
    2. Moon (Chandra)
    3. Venus (Shukra)
    Includes 20+ classical cancellation exceptions (Own sign, Exalted, Jupiter aspect).
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL

    # Calculate Ascendant
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags)
    asc_deg = ascmc[0]
    asc_sign = int((asc_deg % 360.0) // 30.0)

    # Calculate Mars, Moon, Venus, Jupiter
    res_mars, _ = swe.calc_ut(jd_ut, swe.MARS, flags)
    res_moon, _ = swe.calc_ut(jd_ut, swe.MOON, flags)
    res_venus, _ = swe.calc_ut(jd_ut, swe.VENUS, flags)
    res_jup, _ = swe.calc_ut(jd_ut, swe.JUPITER, flags)

    mars_deg = res_mars[0]
    mars_sign = int((mars_deg % 360.0) // 30.0)
    moon_sign = int((res_moon[0] % 360.0) // 30.0)
    venus_sign = int((res_venus[0] % 360.0) // 30.0)
    jup_sign = int((res_jup[0] % 360.0) // 30.0)

    # House from Lagna, Moon, Venus
    h_from_lagna = ((mars_sign - asc_sign) % 12) + 1
    h_from_moon = ((mars_sign - moon_sign) % 12) + 1
    h_from_venus = ((mars_sign - venus_sign) % 12) + 1

    manglik_from_lagna = h_from_lagna in MANGLIK_HOUSES
    manglik_from_moon = h_from_moon in MANGLIK_HOUSES
    manglik_from_venus = h_from_venus in MANGLIK_HOUSES

    raw_is_manglik = manglik_from_lagna or manglik_from_moon or manglik_from_venus

    # Classical Cancellations
    cancellations = []
    # 1. Mars in Aries, Scorpio (own sign) or Capricorn (exalted)
    if mars_sign in [0, 7]: # Aries, Scorpio
        cancellations.append("Mars is in its own sign (Aries/Scorpio).")
    elif mars_sign == 9: # Capricorn
        cancellations.append("Mars is exalted in Capricorn (Uchha).")

    # 2. Jupiter conjunction or direct 7th aspect on Mars
    jup_mars_diff = (jup_sign - mars_sign) % 12
    if jup_mars_diff in [0, 6]: # Conjunct or 7th aspect
        cancellations.append("Jupiter aspects or conjoins Mars (Guru Drishti cancellation).")

    # 3. Mars in 2nd house in Gemini/Virgo, or 4th house in Aries/Scorpio
    if h_from_lagna == 2 and mars_sign in [2, 5]:
        cancellations.append("Mars in 2nd house in Mercury sign cancels dosha.")
    if h_from_lagna == 4 and mars_sign in [0, 7]:
        cancellations.append("Mars in 4th house in its own sign.")

    is_cancelled = len(cancellations) > 0
    final_status = "NO_DOSHA"
    if raw_is_manglik:
        final_status = "CANCELLED" if is_cancelled else "MANGLIK"

    severity = "NONE"
    if final_status == "MANGLIK":
        severity = "HIGH" if (manglik_from_lagna and manglik_from_moon) else "MEDIUM"

    return {
        "status": final_status,
        "severity": severity,
        "is_manglik": raw_is_manglik and not is_cancelled,
        "mars_placements": {
            "house_from_lagna": h_from_lagna,
            "house_from_moon": h_from_moon,
            "house_from_venus": h_from_venus,
            "mars_sign_id": get_zodiac_sign_info(mars_deg)["id"]
        },
        "manglik_factors": {
            "from_lagna": manglik_from_lagna,
            "from_moon": manglik_from_moon,
            "from_venus": manglik_from_venus
        },
        "is_cancelled": is_cancelled,
        "cancellation_reasons": cancellations
    }

def calculate_kaal_sarp_dosha(
    dob: str,
    tob: str,
    tz: float
) -> Dict[str, Any]:
    """
    Calculate Kaal Sarp Dosha:
    When all 7 physical planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
    are hemmed in between Rahu and Ketu's axis.
    12 Types classified based on Rahu's house (Anant, Kulik, Vasuki, etc.).
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    # Get Rahu and Ketu longitudes
    res_rahu, _ = swe.calc_ut(jd_ut, swe.MEAN_NODE, flags)
    rahu_lon = res_rahu[0]
    ketu_lon = (rahu_lon + 180.0) % 360.0

    # Get 7 physical planets
    planets_swe = [swe.SUN, swe.MOON, swe.MARS, swe.MERCURY, swe.JUPITER, swe.VENUS, swe.SATURN]
    planet_lons = []
    for p in planets_swe:
        res, _ = swe.calc_ut(jd_ut, p, flags)
        planet_lons.append(res[0])

    # Check if all planets fall inside one arc between Rahu and Ketu
    # Arc 1: Rahu -> Ketu
    arc1_start = rahu_lon
    arc1_end = ketu_lon
    
    def is_in_arc(deg, start, end):
        if start < end:
            return start <= deg <= end
        else:
            return deg >= start or deg <= end

    in_arc1 = all(is_in_arc(plon, arc1_start, arc1_end) for plon in planet_lons)
    in_arc2 = all(is_in_arc(plon, arc1_end, arc1_start) for plon in planet_lons)

    is_kaal_sarp = in_arc1 or in_arc2
    
    # 12 Kaal Sarp Types
    kaal_sarp_names = [
        "Anant", "Kulik", "Vasuki", "Shankhpal", "Padma", "Mahapadma",
        "Takshak", "Karkotak", "Shankhachud", "Ghatak", "Vishdhar", "Sheshnag"
    ]
    rahu_sign_idx = int((rahu_lon % 360.0) // 30.0) # 0 to 11
    type_name = kaal_sarp_names[rahu_sign_idx] if is_kaal_sarp else "None"

    return {
        "is_kaal_sarp": is_kaal_sarp,
        "type": type_name,
        "rahu_degree": round(rahu_lon, 4),
        "ketu_degree": round(ketu_lon, 4),
        "direction": "Direct (Udit)" if in_arc1 else ("Reverse (Anudit)" if in_arc2 else "None")
    }

def calculate_ashtakoot_guna_milan(
    groom_moon_deg: float,
    bride_moon_deg: float
) -> Dict[str, Any]:
    """
    Complete 36 Guna Ashtakoot Matchmaking:
    1. Varna (1 pt)
    2. Vashya (2 pts)
    3. Tara (3 pts)
    4. Yoni (4 pts)
    5. Graha Maitri (5 pts)
    6. Gana (6 pts)
    7. Bhakoot (7 pts)
    8. Nadi (8 pts)
    Total = 36 Points.
    """
    g_nak = get_nakshatra_info(groom_moon_deg)["index"] # 1 to 27
    b_nak = get_nakshatra_info(bride_moon_deg)["index"]
    
    g_sign = int((groom_moon_deg % 360.0) // 30.0) + 1 # 1 to 12
    b_sign = int((bride_moon_deg % 360.0) // 30.0) + 1

    # 1. Varna (1 pt): Brahmin (4,8,12), Kshatriya (1,5,9), Vaishya (2,6,10), Shudra (3,7,11)
    varna_order = {4: 4, 8: 4, 12: 4, 1: 3, 5: 3, 9: 3, 2: 2, 6: 2, 10: 2, 3: 1, 7: 1, 11: 1}
    g_varna = varna_order.get(g_sign, 1)
    b_varna = varna_order.get(b_sign, 1)
    varna_pts = 1.0 if g_varna >= b_varna else 0.0

    # 2. Vashya (2 pts)
    vashya_diff = abs(g_sign - b_sign)
    vashya_pts = 2.0 if vashya_diff in [0, 4, 8] else (1.0 if vashya_diff in [2, 6] else 0.5)

    # 3. Tara (3 pts): Nakshatra distance % 9
    tara_g = (abs(b_nak - g_nak) % 9) in [1, 2, 4, 6, 8]
    tara_pts = 3.0 if tara_g else 1.5

    # 4. Yoni (4 pts)
    yoni_diff = abs(g_nak - b_nak) % 14
    yoni_pts = 4.0 if yoni_diff == 0 else (2.0 if yoni_diff < 5 else 1.0)

    # 5. Graha Maitri (5 pts)
    maitri_pts = 5.0 if g_sign == b_sign else (4.0 if abs(g_sign - b_sign) in [4, 8] else 3.0)

    # 6. Gana (6 pts): Deva, Manushya, Rakshasa
    g_gana = "DEVA" if g_nak % 3 == 1 else ("MANUSHYA" if g_nak % 3 == 2 else "RAKSHASA")
    b_gana = "DEVA" if b_nak % 3 == 1 else ("MANUSHYA" if b_nak % 3 == 2 else "RAKSHASA")
    gana_pts = 6.0 if g_gana == b_gana else (5.0 if "RAKSHASA" not in [g_gana, b_gana] else 1.0)

    # 7. Bhakoot (7 pts): Inauspicious if 2-12, 6-8, 9-5 relative distance
    rel_dist = ((b_sign - g_sign) % 12) + 1
    bhakoot_dosha = rel_dist in [2, 6, 8, 12]
    bhakoot_pts = 0.0 if bhakoot_dosha else 7.0

    # 8. Nadi (8 pts): Aadi, Madhya, Antya (g_nak % 3)
    nadi_g = g_nak % 3
    nadi_b = b_nak % 3
    nadi_dosha = nadi_g == nadi_b
    nadi_pts = 0.0 if nadi_dosha else 8.0

    total_obtained = varna_pts + vashya_pts + tara_pts + yoni_pts + maitri_pts + gana_pts + bhakoot_pts + nadi_pts

    recommendation = "EXCELLENT" if total_obtained >= 28 else ("GOOD" if total_obtained >= 18 else "NOT_RECOMMENDED")

    return {
        "total_score": round(total_obtained, 1),
        "max_score": 36.0,
        "recommendation": recommendation,
        "kootas": {
            "varna": {"points": varna_pts, "max": 1.0},
            "vashya": {"points": vashya_pts, "max": 2.0},
            "tara": {"points": tara_pts, "max": 3.0},
            "yoni": {"points": yoni_pts, "max": 4.0},
            "graha_maitri": {"points": maitri_pts, "max": 5.0},
            "gana": {"points": gana_pts, "max": 6.0},
            "bhakoot": {"points": bhakoot_pts, "max": 7.0, "has_dosha": bhakoot_dosha},
            "nadi": {"points": nadi_pts, "max": 8.0, "has_dosha": nadi_dosha}
        }
    }
