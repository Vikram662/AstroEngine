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

    # 2. Jupiter conjunction, 7th aspect, or 5th/9th trine aspect on Mars
    # Jupiter casts 5th (sign diff 4), 7th (sign diff 6), and 9th (sign diff 8) aspects forward
    mars_from_jup = (mars_sign - jup_sign) % 12
    if mars_from_jup in [0, 4, 6, 8]: # Conjunct, 5th aspect, 7th aspect, or 9th aspect
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
    tz: float,
    lat: float = 28.6139,
    lon: float = 77.2090
) -> Dict[str, Any]:
    """
    Calculate Kaal Sarp Dosha:
    When all 7 physical planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
    are hemmed in between Rahu and Ketu's axis.
    12 Types classified strictly based on Rahu's house from Lagna (1 to 12).
    1: Anant, 2: Kulik, 3: Vasuki, 4: Shankhpal, 5: Padma, 6: Mahapadma,
    7: Takshak, 8: Karkotak, 9: Shankhachud, 10: Ghatak, 11: Vishdhar, 12: Sheshnag.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    # Calculate Ascendant
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags)
    asc_deg = ascmc[0]
    asc_sign_idx = int((asc_deg % 360.0) // 30.0)

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
    
    # 12 Kaal Sarp Types (1 to 12 based on Rahu's house from Lagna)
    kaal_sarp_names = [
        "Anant", "Kulik", "Vasuki", "Shankhpal", "Padma", "Mahapadma",
        "Takshak", "Karkotak", "Shankhachud", "Ghatak", "Vishdhar", "Sheshnag"
    ]
    rahu_sign_idx = int((rahu_lon % 360.0) // 30.0)
    rahu_house = ((rahu_sign_idx - asc_sign_idx) % 12) + 1 # 1 to 12
    type_name = kaal_sarp_names[rahu_house - 1] if is_kaal_sarp else "None"

    return {
        "is_kaal_sarp": is_kaal_sarp,
        "type": type_name,
        "rahu_house": rahu_house,
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
    # Classical 1-based nakshatra groupings (Appendix A)
    # A1. Nadi (1-indexed nakshatra numbers):
    # Aadi (Vata): 1, 6, 7, 12, 13, 18, 19, 24, 25 (Ashwini, Ardra, Punarvasu, U.Phalguni, Hasta, Jyeshtha, Moola, Shatabhisha, P.Bhadrapada)
    # Madhya (Pitta): 2, 5, 8, 11, 14, 17, 20, 23, 26 (Bharani, Mrigashira, Pushya, P.Phalguni, Chitra, Anuradha, P.Ashadha, Dhanishta, U.Bhadrapada)
    # Antya (Kapha): 3, 4, 9, 10, 15, 16, 21, 22, 27 (Krittika, Rohini, Ashlesha, Magha, Swati, Vishakha, U.Ashadha, Shravana, Revati)
    aadi_naks = {1, 6, 7, 12, 13, 18, 19, 24, 25}
    madhya_naks = {2, 5, 8, 11, 14, 17, 20, 23, 26}
    antya_naks = {3, 4, 9, 10, 15, 16, 21, 22, 27}

    def get_nadi(nak: int) -> str:
        if nak in aadi_naks: return "AADI"
        if nak in madhya_naks: return "MADHYA"
        return "ANTYA"

    # A2. Gana (1-indexed nakshatra numbers):
    # Deva: 1, 5, 7, 8, 13, 15, 17, 22, 27 (Ashwini, Mrigashira, Punarvasu, Pushya, Hasta, Swati, Anuradha, Shravana, Revati)
    # Manushya: 2, 4, 6, 11, 12, 20, 21, 25, 26 (Bharani, Rohini, Ardra, P.Phalguni, U.Phalguni, P.Ashadha, U.Ashadha, P.Bhadrapada, U.Bhadrapada)
    # Rakshasa: 3, 9, 10, 14, 16, 18, 19, 23, 24 (Krittika, Ashlesha, Magha, Chitra, Vishakha, Jyeshtha, Moola, Dhanishta, Shatabhisha)
    deva_naks = {1, 5, 7, 8, 13, 15, 17, 22, 27}
    manushya_naks = {2, 4, 6, 11, 12, 20, 21, 25, 26}
    rakshasa_naks = {3, 9, 10, 14, 16, 18, 19, 23, 24}

    def get_gana(nak: int) -> str:
        if nak in deva_naks: return "DEVA"
        if nak in manushya_naks: return "MANUSHYA"
        return "RAKSHASA"

    g_gana = get_gana(g_nak)
    b_gana = get_gana(b_nak)

    # 1. Varna (1 pt)
    varna_pts = 1.0 if g_varna >= b_varna else 0.0

    # 2. Vashya (2 pts)
    vashya_diff = abs(g_sign - b_sign)
    vashya_pts = 2.0 if vashya_diff in [0, 4, 8] else (1.0 if vashya_diff in [2, 6] else 0.5)

    # 3. Tara (3 pts): Classical 2-way evaluation
    # Remainder 3, 5, 7 = inauspicious (Vipat, Pratyari, Vadha)
    inauspicious_taras = {3, 5, 7}
    rem_g_to_b = (((b_nak - g_nak) % 27) % 9) or 9
    rem_b_to_g = (((g_nak - b_nak) % 27) % 9) or 9
    tara_g_ok = rem_g_to_b not in inauspicious_taras
    tara_b_ok = rem_b_to_g not in inauspicious_taras
    if tara_g_ok and tara_b_ok:
        tara_pts = 3.0
    elif tara_g_ok or tara_b_ok:
        tara_pts = 1.5
    else:
        tara_pts = 0.0

    # 4. Yoni (4 pts)
    yoni_diff = abs(g_nak - b_nak) % 14
    yoni_pts = 4.0 if yoni_diff == 0 else (2.0 if yoni_diff < 5 else 1.0)

    # 5. Graha Maitri (5 pts)
    maitri_pts = 5.0 if g_sign == b_sign else (4.0 if abs(g_sign - b_sign) in [4, 8] else 3.0)

    # 6. Gana (6 pts): Classical Gana points matrix
    if g_gana == b_gana:
        gana_pts = 6.0
    elif (g_gana == "DEVA" and b_gana == "MANUSHYA") or (g_gana == "MANUSHYA" and b_gana == "DEVA"):
        gana_pts = 5.0
    elif g_gana == "RAKSHASA" and b_gana == "DEVA":
        gana_pts = 1.0
    elif g_gana == "DEVA" and b_gana == "RAKSHASA":
        gana_pts = 0.0
    elif g_gana == "RAKSHASA" and b_gana == "MANUSHYA":
        gana_pts = 0.5
    else: # MANUSHYA groom + RAKSHASA bride
        gana_pts = 0.0

    # 7. Bhakoot (7 pts): Classical 2/12, 6/8, 5/9 relative distances
    # Distance from groom to bride (1-indexed)
    dist_1 = ((b_sign - g_sign) % 12) + 1
    # Dosha occurs if relative pair is (2,12), (6,8), or (5,9)
    bhakoot_dosha = dist_1 in [2, 12, 6, 8, 5, 9]
    bhakoot_pts = 0.0 if bhakoot_dosha else 7.0

    # 8. Nadi (8 pts): Aadi, Madhya, Antya
    nadi_g = get_nadi(g_nak)
    nadi_b = get_nadi(b_nak)
    nadi_dosha = (nadi_g == nadi_b)
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

def calculate_sadesati_status(dob: str, tob: str, tz: float) -> Dict[str, Any]:
    """
    Real-time dynamic Saturn Sade Sati / Dhaiya phase check:
    Computes current Saturn transit sign relative to natal Moon sign.
    12th from Moon: Rising (Charan 1)
    1st from Moon: Peak (Charan 2)
    2nd from Moon: Setting (Charan 3)
    4th from Moon: Kantak Shani (Small Dhaiya)
    8th from Moon: Ashtam Shani (Small Dhaiya)
    """
    from datetime import datetime, timezone
    jd_natal = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    # Natal Moon
    res_m, _ = swe.calc_ut(jd_natal, swe.MOON, flags)
    moon_sign_idx = int((res_m[0] % 360.0) // 30.0)

    # Current Saturn transit
    now = datetime.now(timezone.utc)
    jd_now = swe.julday(now.year, now.month, now.day, now.hour + now.minute / 60.0)
    res_sat, _ = swe.calc_ut(jd_now, swe.SATURN, flags)
    saturn_sign_idx = int((res_sat[0] % 360.0) // 30.0)

    # Relative distance from natal moon (1 to 12)
    rel_house = ((saturn_sign_idx - moon_sign_idx) % 12) + 1

    is_sadesati = rel_house in [12, 1, 2]
    is_dhaiya = rel_house in [4, 8]

    phase = "NONE"
    if rel_house == 12:
        phase = "RISING_PHASE_1"
    elif rel_house == 1:
        phase = "PEAK_PHASE_2"
    elif rel_house == 2:
        phase = "SETTING_PHASE_3"
    elif rel_house == 4:
        phase = "KANTAK_DHAIYA_4TH"
    elif rel_house == 8:
        phase = "ASHTAM_DHAIYA_8TH"

    zodiac_signs = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]

    return {
        "natal_moon_sign": zodiac_signs[moon_sign_idx],
        "transit_saturn_sign": zodiac_signs[saturn_sign_idx],
        "transit_saturn_degree": round(res_sat[0] % 30.0, 4),
        "relative_house_from_moon": rel_house,
        "is_sadesati_active": is_sadesati,
        "is_dhaiya_active": is_dhaiya,
        "phase": phase,
        "remedy": "Recite Hanuman Chalisa daily and light a mustard oil lamp under a Peepal tree on Saturdays." if (is_sadesati or is_dhaiya) else "No severe Saturn affliction active currently."
    }

def calculate_pitra_dosha(dob: str, tob: str, tz: float, lat: float, lon: float) -> Dict[str, Any]:
    """
    Classical Pitra Dosha Evaluation:
    Evaluated when:
    1. Sun (father/ancestor significator) is conjunct Rahu or Ketu.
    2. 9th house (house of father/ancestors) is afflicted by Rahu, Ketu, or Saturn.
    3. 9th lord is debilitated or conjunct Rahu.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags)
    asc_sign = int((ascmc[0] % 360.0) // 30.0)

    # 9th House sign
    h9_sign = (asc_sign + 8) % 12

    res_sun, _ = swe.calc_ut(jd_ut, swe.SUN, flags)
    res_rahu, _ = swe.calc_ut(jd_ut, swe.MEAN_NODE, flags)
    res_sat, _ = swe.calc_ut(jd_ut, swe.SATURN, flags)

    sun_sign = int((res_sun[0] % 360.0) // 30.0)
    rahu_sign = int((res_rahu[0] % 360.0) // 30.0)
    ketu_sign = (rahu_sign + 6) % 12
    sat_sign = int((res_sat[0] % 360.0) // 30.0)

    causes = []
    # 1. Sun conjunct Rahu or Ketu
    if sun_sign == rahu_sign:
        causes.append("Surya-Rahu Grahan conjunction in same zodiac sign.")
    if sun_sign == ketu_sign:
        causes.append("Surya-Ketu conjunction in same zodiac sign.")

    # 2. 9th House occupied by Rahu or Ketu
    if rahu_sign == h9_sign:
        causes.append("Rahu occupies 9th house of ancestral dharma.")
    if ketu_sign == h9_sign:
        causes.append("Ketu occupies 9th house of ancestral dharma.")

    # 3. Saturn in 9th house
    if sat_sign == h9_sign:
        causes.append("Saturn occupies 9th house casting karmic delays.")

    has_dosha = len(causes) > 0
    return {
        "has_pitra_dosha": has_dosha,
        "severity": "HIGH" if len(causes) >= 2 else ("MEDIUM" if len(causes) == 1 else "NONE"),
        "reasons": causes,
        "remedies": [
            "Perform Narayan Bali / Tripindi Shradh at holy pilgrimage sites.",
            "Water a Peepal tree daily and offer food to crows and cows on Amavasya.",
            "Recite Gayatri Mantra 108 times during sunrise."
        ] if has_dosha else ["No ancestral karmic debt afflictions detected."]
    }

def calculate_guru_chandal_dosha(dob: str, tob: str, tz: float) -> Dict[str, Any]:
    """
    Classical Guru Chandal Dosha Evaluation:
    Formed when benevolent Jupiter (Guru) is conjoined or in direct mutual aspect with Rahu or Ketu.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    res_jup, _ = swe.calc_ut(jd_ut, swe.JUPITER, flags)
    res_rahu, _ = swe.calc_ut(jd_ut, swe.MEAN_NODE, flags)

    jup_deg = res_jup[0]
    rahu_deg = res_rahu[0]
    ketu_deg = (rahu_deg + 180.0) % 360.0

    jup_sign = int((jup_deg % 360.0) // 30.0)
    rahu_sign = int((rahu_deg % 360.0) // 30.0)
    ketu_sign = int((ketu_deg % 360.0) // 30.0)

    # Angular separation
    orb_rahu = abs((jup_deg - rahu_deg + 180.0) % 360.0 - 180.0)
    orb_ketu = abs((jup_deg - ketu_deg + 180.0) % 360.0 - 180.0)

    has_dosha = False
    condition = "None"
    orb = 0.0

    if jup_sign == rahu_sign:
        has_dosha = True
        condition = "Jupiter conjunct Rahu in same zodiac sign."
        orb = round(orb_rahu, 2)
    elif jup_sign == ketu_sign:
        has_dosha = True
        condition = "Jupiter conjunct Ketu in same zodiac sign."
        orb = round(orb_ketu, 2)
    elif abs(jup_sign - rahu_sign) == 6:
        has_dosha = True
        condition = "Jupiter and Rahu in mutual 7th aspect opposition."
        orb = round(abs(orb_rahu - 180.0), 2)

    return {
        "has_guru_chandal_dosha": has_dosha,
        "condition": condition,
        "orb_degrees": orb,
        "jupiter_sign_index": jup_sign + 1,
        "rahu_sign_index": rahu_sign + 1,
        "remedies": [
            "Wear yellow clothes on Thursdays and offer yellow sweets / chana dal to temple.",
            "Perform Guru Gayatri mantra japa (Om Gurave Namah 108 times daily).",
            "Feed cows with green grass and jaggery."
        ] if has_dosha else ["No Guru-Chandal shadow affliction present."]
    }

def calculate_matchmaking_exceptions(
    groom_moon_deg: float,
    bride_moon_deg: float
) -> Dict[str, Any]:
    """
    Classical Vedic Nadi & Bhakoot Cancellation Exceptions:
    Evaluates authentic Shastric exemptions that neutralize Nadi and Bhakoot doshas:
    1. Same Rashi (Moon sign) but different Nakshatras -> Nadi Dosha Cancelled.
    2. Same Nakshatra but different Charan / Padas in different Rashis -> Nadi Dosha Cancelled.
    3. Rashi lords are mutual friends or identical (e.g., Aries-Scorpio by Mars, Taurus-Libra by Venus) -> Bhakoot Dosha Cancelled.
    4. 6-8 (Shadastaka) cancellation when lords are friendly (Pisces-Leo / Sun-Jupiter).
    """
    norm_g = groom_moon_deg % 360.0
    norm_b = bride_moon_deg % 360.0

    g_sign = int(norm_g // 30.0)
    b_sign = int(norm_b // 30.0)

    g_nak = int(norm_g // (360.0 / 27.0))
    b_nak = int(norm_b // (360.0 / 27.0))

    g_charan = int((norm_g % (360.0 / 27.0)) // (360.0 / 108.0)) + 1
    b_charan = int((norm_b % (360.0 / 27.0)) // (360.0 / 108.0)) + 1

    rashi_names = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]
    sign_lords = [
        "MARS", "VENUS", "MERCURY", "MOON", "SUN", "MERCURY",
        "VENUS", "MARS", "JUPITER", "SATURN", "SATURN", "JUPITER"
    ]

    # Nadi lookup: 0=Adi, 1=Madhya, 2=Antya
    nak_nadi = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2]
    is_nadi_dosha = (nak_nadi[g_nak] == nak_nadi[b_nak])

    # Relative sign distance from groom to bride
    rel_dist = ((b_sign - g_sign) % 12) + 1
    is_bhakoot_dosha = rel_dist in [6, 8, 2, 12, 9, 5]

    nadi_exemptions = []
    if is_nadi_dosha:
        if g_sign == b_sign and g_nak != b_nak:
            nadi_exemptions.append("Same Moon Rashi but different Janma Nakshatras completely cancels Nadi Dosha (Ek Rashi Vibhinna Nakshatra).")
        if g_nak == b_nak and g_charan != b_charan:
            nadi_exemptions.append("Same Janma Nakshatra with different Charans cancels Nadi Dosha.")
        if g_nak in [3, 7, 9, 14, 16, 21, 24]: # Rohini, Mrigashirsha, Ardra, etc. exceptions
            nadi_exemptions.append("Classical Nakshatra pair exemption applies according to Muhurta Chintamani.")

    bhakoot_exemptions = []
    if is_bhakoot_dosha:
        g_lord = sign_lords[g_sign]
        b_lord = sign_lords[b_sign]
        if g_lord == b_lord:
            bhakoot_exemptions.append(f"Same Rashi Lord ({g_lord}) completely cancels Bhakoot Dosha (Ekaadhipatya Dosha Parihara).")
        elif (g_lord, b_lord) in [("SUN", "JUPITER"), ("JUPITER", "SUN"), ("MOON", "JUPITER"), ("JUPITER", "MOON"), ("MERCURY", "VENUS"), ("VENUS", "MERCURY")]:
            bhakoot_exemptions.append(f"Mutual planetary friendship between Rashi lords ({g_lord} and {b_lord}) neutralizes Bhakoot Dosha.")

    return {
        "groom_moon_sign": rashi_names[g_sign],
        "bride_moon_sign": rashi_names[b_sign],
        "nadi_analysis": {
            "has_base_dosha": is_nadi_dosha,
            "is_cancelled": len(nadi_exemptions) > 0,
            "cancellation_rules": nadi_exemptions
        },
        "bhakoot_analysis": {
            "has_base_dosha": is_bhakoot_dosha,
            "is_cancelled": len(bhakoot_exemptions) > 0,
            "cancellation_rules": bhakoot_exemptions
        },
        "overall_compatibility_verdict": "APPROVED_WITH_CANCELLATION" if (nadi_exemptions or bhakoot_exemptions) else ("DOSHA_FREE" if not (is_nadi_dosha or is_bhakoot_dosha) else "AFFLICTED")
    }

def calculate_dashakoota_milan(
    groom_moon_deg: float,
    bride_moon_deg: float
) -> Dict[str, Any]:
    """
    Module 8 — Endpoint 69: South Indian 10-Porutham (Dashakoota) Matching System.
    Evaluates 10 essential poruthams for marital harmony and longevity:
    1. Dina Porutham (Health & general well-being)
    2. Gana Porutham (Temperament compatibility)
    3. Mahendra Porutham (Progeny & bonding)
    4. Stree Deergha Porutham (Female longevity & prosperity)
    5. Yoni Porutham (Physical / sexual intimacy compatibility)
    6. Rashi Porutham (Lineage continuation & family peace)
    7. Rashiyaadhipathi Porutham (Planetary friendship of moon lords)
    8. Vasya Porutham (Mutual attraction and devotion)
    9. Rajju Porutham (Most vital: Mangalya / longevity of spouse)
    10. Vedha Porutham (Affliction / mutual repulsion)
    """
    norm_g = groom_moon_deg % 360.0
    norm_b = bride_moon_deg % 360.0

    g_nak = int(norm_g // (360.0 / 27.0))
    b_nak = int(norm_b // (360.0 / 27.0))

    g_sign = int(norm_g // 30.0)
    b_sign = int(norm_b // 30.0)

    # Count from bride's star to groom's star (1-indexed)
    star_dist = ((g_nak - b_nak) % 27) + 1

    # 1. Dina: Good if 2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26
    dina_ok = star_dist in [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26]

    # 2. Gana: Deva, Manushya, Rakshasa
    gana_map = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 0, 0, 2, 1, 1, 0, 0] # 0=Deva, 1=Manushya, 2=Rakshasa
    g_gana = gana_map[g_nak]
    b_gana = gana_map[b_nak]
    gana_ok = (g_gana == b_gana) or (b_gana == 0 and g_gana == 1) or (b_gana != 2 and g_gana != 2)

    # 3. Mahendra: Star count 4, 7, 10, 13, 16, 19, 22, 25
    mahendra_ok = star_dist in [4, 7, 10, 13, 16, 19, 22, 25]

    # 4. Stree Deergha: Star dist > 13
    stree_deergha_ok = (star_dist >= 13)

    # 5. Yoni Porutham: Compatible animal yonis
    yoni_map = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 11, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    yoni_ok = (yoni_map[g_nak] != yoni_map[b_nak])

    # 6. Rashi: Rashi distance 7, or not 6/8
    sign_dist = ((g_sign - b_sign) % 12) + 1
    rashi_ok = sign_dist in [7, 1, 3, 4, 10, 11]

    # 7. Rashiyaadhipathi (Lord friendship)
    sign_lords = ["MARS", "VENUS", "MERCURY", "MOON", "SUN", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "SATURN", "JUPITER"]
    lord_ok = sign_lords[g_sign] == sign_lords[b_sign] or (sign_lords[g_sign], sign_lords[b_sign]) in [("SUN", "JUPITER"), ("MOON", "JUPITER"), ("MERCURY", "VENUS")]

    # 8. Vasya: Specific sign pairs
    vasya_ok = (g_sign == b_sign) or (sign_dist in [3, 4, 7, 10, 11])

    # 9. Rajju: 5 Rajjus (Shiro, Kantha, Nabhi, Kati, Pada). Must NOT be in the same Rajju.
    rajju_map = [0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 4, 3]
    rajju_ok = (rajju_map[g_nak] != rajju_map[b_nak])

    # 10. Vedha: Repulsion pairs (e.g. Ashwini & Jyeshtha, Bharani & Anuradha)
    vedha_pairs = [(0, 17), (1, 16), (2, 15), (3, 14), (4, 13), (5, 12), (6, 11), (7, 10), (8, 9)]
    has_vedha = False
    for p1, p2 in vedha_pairs:
        if (g_nak == p1 and b_nak == p2) or (g_nak == p2 and b_nak == p1):
            has_vedha = True
            break
    vedha_ok = not has_vedha

    poruthams = [
        {"name": "Dina Porutham", "aspect": "Health & Prosperity", "is_compatible": dina_ok},
        {"name": "Gana Porutham", "aspect": "Temperament Harmony", "is_compatible": gana_ok},
        {"name": "Mahendra Porutham", "aspect": "Progeny & Lineage", "is_compatible": mahendra_ok},
        {"name": "Stree Deergha Porutham", "aspect": "Female Longevity", "is_compatible": stree_deergha_ok},
        {"name": "Yoni Porutham", "aspect": "Physical Compatibility", "is_compatible": yoni_ok},
        {"name": "Rashi Porutham", "aspect": "Family Harmony", "is_compatible": rashi_ok},
        {"name": "Rashiyaadhipathi Porutham", "aspect": "Planetary Friendship", "is_compatible": lord_ok},
        {"name": "Vasya Porutham", "aspect": "Mutual Affection", "is_compatible": vasya_ok},
        {"name": "Rajju Porutham", "aspect": "Spouse Longevity (Crucial)", "is_compatible": rajju_ok},
        {"name": "Vedha Porutham", "aspect": "Absence of Inimical Affliction", "is_compatible": vedha_ok},
    ]

    passed_count = sum(1 for p in poruthams if p["is_compatible"])

    return {
        "total_poruthams": 10,
        "passed_poruthams_count": passed_count,
        "is_rajju_porutham_passed": rajju_ok,
        "poruthams_breakdown": poruthams,
        "recommendation": "HIGHLY_FAVORABLE" if (passed_count >= 6 and rajju_ok and vedha_ok) else ("ACCEPTABLE_WITH_REMEDIES" if rajju_ok else "NOT_RECOMMENDED_RAJJU_DOSHA")
    }

def calculate_papasmya_balance(
    groom_dob: str,
    groom_tob: str,
    groom_tz: float,
    groom_lat: float,
    groom_lon: float,
    bride_dob: str,
    bride_tob: str,
    bride_tz: float,
    bride_lat: float,
    bride_lon: float
) -> Dict[str, Any]:
    """
    Module 8 — Endpoint 70: Relative Dosha / Malefic Point Balance (Papasmya).
    Evaluates cumulative malefic points of Mars, Sun, Saturn, Rahu, and Ketu
    from Lagna, Moon, and Venus in houses 1, 2, 4, 7, 8, 12.
    Rule: Groom's Papa points must equal or marginally exceed Bride's Papa points.
    """
    def compute_single_chart_papa(dob: str, tob: str, tz: float, lat: float, lon: float):
        jd_ut = calculate_julian_day(dob, tob, tz)
        swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
        flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

        cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags)
        asc_sign = int((ascmc[0] % 360.0) // 30.0)

        # Planets
        res_m, _ = swe.calc_ut(jd_ut, swe.MOON, flags)
        res_v, _ = swe.calc_ut(jd_ut, swe.VENUS, flags)
        moon_sign = int((res_m[0] % 360.0) // 30.0)
        venus_sign = int((res_v[0] % 360.0) // 30.0)

        # Malefics
        malefics = [
            ("MARS", swe.MARS, 1.0),
            ("SATURN", swe.SATURN, 1.0),
            ("RAHU", swe.MEAN_NODE, 0.5),
            ("SUN", swe.SUN, 0.5)
        ]

        total_papa = 0.0
        details = []

        for m_name, swe_id, weight in malefics:
            res_p, _ = swe.calc_ut(jd_ut, swe_id, flags)
            p_sign = int((res_p[0] % 360.0) // 30.0)

            # From Lagna
            h_lagna = ((p_sign - asc_sign) % 12) + 1
            if h_lagna in [1, 2, 4, 7, 8, 12]:
                total_papa += weight * 1.0
                details.append(f"{m_name} in {h_lagna}th from Lagna (+{weight})")

            # From Moon
            h_moon = ((p_sign - moon_sign) % 12) + 1
            if h_moon in [1, 2, 4, 7, 8, 12]:
                total_papa += weight * 0.75
                details.append(f"{m_name} in {h_moon}th from Moon (+{weight*0.75})")

            # From Venus
            h_venus = ((p_sign - venus_sign) % 12) + 1
            if h_venus in [1, 2, 4, 7, 8, 12]:
                total_papa += weight * 0.5
                details.append(f"{m_name} in {h_venus}th from Venus (+{weight*0.5})")

        return round(total_papa, 2), details

    g_papa, g_details = compute_single_chart_papa(groom_dob, groom_tob, groom_tz, groom_lat, groom_lon)
    b_papa, b_details = compute_single_chart_papa(bride_dob, bride_tob, bride_tz, bride_lat, bride_lon)

    diff = round(abs(g_papa - b_papa), 2)
    # Balanced if difference is within 2 points or groom has higher papa
    is_balanced = (g_papa >= b_papa) or (diff <= 2.0)

    return {
        "groom_papasmya_points": g_papa,
        "bride_papasmya_points": b_papa,
        "points_difference": diff,
        "is_papasmya_balanced": is_balanced,
        "verdict": "BALANCED_COMPATIBLE" if is_balanced else "EXCESS_BRIDE_DOSHA_REQUIRES_REMEDY",
        "groom_afflictions": g_details[:5],
        "bride_afflictions": b_details[:5]
    }

def calculate_sadesati_timeline(dob: str, tob: str, tz: float) -> Dict[str, Any]:
    """
    Module 8 — Endpoint 64: Lifetime Saturn Sade Sati Cycles (Rising, Peak, Setting).
    Saturn completes one zodiac revolution every ~29.5 years.
    Evaluates 3 distinct lifetime cycles (~0-30, ~30-60, ~60-90 years of age).
    """
    jd_natal = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    res_m, _ = swe.calc_ut(jd_natal, swe.MOON, flags)
    moon_sign_idx = int((res_m[0] % 360.0) // 30.0)

    # Birth year
    b_year = int(dob[:4])
    zodiac_names = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]

    rising_sign = (moon_sign_idx - 1) % 12
    peak_sign = moon_sign_idx
    setting_sign = (moon_sign_idx + 1) % 12

    # Classical 3 cycles across 90-year lifespan
    cycles = []
    # Median age when Saturn first reaches rising sign
    # Approximate current Saturn position relative to Moon
    res_sat_birth, _ = swe.calc_ut(jd_natal, swe.SATURN, flags)
    sat_birth_sign = int((res_sat_birth[0] % 360.0) // 30.0)
    signs_to_rising = (rising_sign - sat_birth_sign) % 12
    first_cycle_age = signs_to_rising * 2.45 # ~2.45 years per sign

    for cycle_num in range(1, 4):
        start_age = round(first_cycle_age + (cycle_num - 1) * 29.5, 1)
        start_yr = int(b_year + start_age)
        c_phases = [
            {"phase": "Charan 1 (Rising)", "saturn_sign": zodiac_names[rising_sign], "approx_years": f"{start_yr} - {start_yr + 2}"},
            {"phase": "Charan 2 (Peak)", "saturn_sign": zodiac_names[peak_sign], "approx_years": f"{start_yr + 2} - {start_yr + 5}"},
            {"phase": "Charan 3 (Setting)", "saturn_sign": zodiac_names[setting_sign], "approx_years": f"{start_yr + 5} - {start_yr + 7}"}
        ]
        cycles.append({
            "cycle_number": cycle_num,
            "lifecycle_stage": "Early Life" if cycle_num == 1 else ("Middle Age" if cycle_num == 2 else "Senior Years"),
            "approx_age_span": f"{start_age} to {round(start_age + 7.5, 1)} years",
            "phases": c_phases
        })

    return {
        "natal_moon_sign": zodiac_names[moon_sign_idx],
        "sadesati_signs": {
            "rising_12th": zodiac_names[rising_sign],
            "peak_1st": zodiac_names[peak_sign],
            "setting_2nd": zodiac_names[setting_sign]
        },
        "lifetime_cycles": cycles
    }



