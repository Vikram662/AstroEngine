import swisseph as swe
from typing import Dict, Any, List
from app.core.swisseph import calculate_julian_day, VEDIC_PLANETS, ZODIAC_SIGNS
from app.locales.i18n import translate_entity

LAL_KITAB_DEBTS = [
    {"debt": "Pitri Rin (Father's Debt)", "cause": "Jupiter afflicted by Venus/Mercury in 2nd/5th/9th/12th houses", "remedy": "Collect equal money from all blood relatives and donate to religious places."},
    {"debt": "Matri Rin (Mother's Debt)", "cause": "Moon afflicted by Ketu in 2nd/4th/7th/8th houses", "remedy": "Collect silver from all relatives and throw into flowing river."},
    {"debt": "Stri Rin (Wife's Debt)", "cause": "Venus afflicted by Sun/Rahu in 2nd/7th houses", "remedy": "Feed 100 cows with green grass and dough balls simultaneously."},
    {"debt": "Bhratri Rin (Brother's Debt)", "cause": "Mars afflicted by Mercury/Ket in 3rd/8th houses", "remedy": "Donate sweets and medicine to doctors or hospitals."},
    {"debt": "Kudrati Rin (Nature's Debt)", "cause": "Moon or Mars afflicted by Saturn/Rahu in 6th house", "remedy": "Feed stray dogs continuously for 43 days with sweet bread."},
    {"debt": "Aatmiya Rin (Self/Soul Debt)", "cause": "Sun afflicted by Saturn/Rahu/Ketu in 1st/5th/10th houses", "remedy": "Collect copper coins from family members and donate to temple."}
]

def calculate_lalkitab_chart(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Lal Kitab Kundli:
    In Lal Kitab, signs are fixed to the Kalpurush chart (House 1 is always Aries, House 2 Taurus, etc.).
    The houses are calculated relative to the birth ascendant and then placed into fixed Kalpurush bhavas.
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL

    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'W', flags)
    asc_deg = ascmc[0]
    asc_sign = int((asc_deg % 360.0) // 30.0)

    planets_lk = []
    rahu_lon = 0.0

    houses_planets = {h: [] for h in range(1, 13)}

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

        p_sign = int((p_lon % 360.0) // 30.0)
        # House = (Planet Sign - Asc Sign) % 12 + 1
        house_num = ((p_sign - asc_sign) % 12) + 1
        houses_planets[house_num].append(p_id)

        planets_lk.append({
            "id": p_id,
            "name": translate_entity("planets", p_id, lang, p["name_en"]),
            "kalpurush_house": house_num,
            "fixed_sign": ZODIAC_SIGNS[house_num - 1]["id"],
            "is_retrograde": is_ret
        })

    # Sleeping Houses (Dharmi / Andhe ghar)
    # Houses with no occupants are considered sleeping (Soya hua ghar)
    sleeping_houses = [h for h, occ in houses_planets.items() if len(occ) == 0]

    return {
        "chart_type": "Lal Kitab Kalpurush Kundli",
        "planets": planets_lk,
        "sleeping_houses": sleeping_houses,
        "ancestral_debts": LAL_KITAB_DEBTS,
        "kudrati_debts": LAL_KITAB_DEBTS
    }

def calculate_lalkitab_varshphal(
    dob: str,
    age: int,
    lang: str = "en"
) -> Dict[str, Any]:
    """Calculate Lal Kitab progression Varshphal for a specific age (1 to 120)."""
    # Lal Kitab planetary circular progression rule
    return {
        "age": age,
        "target_year": int(dob[:4]) + age,
        "progression_cycle": f"Cycle {(age // 35) + 1}",
        "advice": "Keep pure silver square piece in wallet and respect elders."
    }
