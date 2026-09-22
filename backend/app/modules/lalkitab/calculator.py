import swisseph as swe
from typing import Dict, Any, List
from app.core.swisseph import calculate_julian_day, VEDIC_PLANETS, ZODIAC_SIGNS
from app.locales.i18n import translate_entity
from app.modules.dosha_matching.calculator import NATURAL_FRIENDSHIP

# Classical debilitation (Neecha) sign per planet — 0=Aries..11=Pisces.
# Same table used by parashari/calculator.py for chart dignity.
DEBILITATION_SIGNS = {
    "SUN": 6, "MOON": 7, "MARS": 3, "MERCURY": 11, "JUPITER": 9, "VENUS": 5, "SATURN": 0, "RAHU": 7, "KETU": 1
}


def _mutual_enemies(a: str, b: str) -> bool:
    if a not in NATURAL_FRIENDSHIP or b not in NATURAL_FRIENDSHIP:
        return False
    rel_ab = "ENEMY" if b in NATURAL_FRIENDSHIP[a]["enemies"] else ("FRIEND" if b in NATURAL_FRIENDSHIP[a]["friends"] else "NEUTRAL")
    rel_ba = "ENEMY" if a in NATURAL_FRIENDSHIP[b]["enemies"] else ("FRIEND" if a in NATURAL_FRIENDSHIP[b]["friends"] else "NEUTRAL")
    return rel_ab == "ENEMY" or rel_ba == "ENEMY"

LAL_KITAB_DEBTS = [
    {
        "debt": "Pitri Rin (Father's Debt)",
        "cause": "Jupiter afflicted by Venus/Mercury in 2nd/5th/9th/12th houses",
        "remedy": "Collect equal money from all blood relatives and donate to religious places.",
        "main_planets": ["JUPITER"], "afflicting_planets": ["VENUS", "MERCURY"], "houses": [2, 5, 9, 12]
    },
    {
        "debt": "Matri Rin (Mother's Debt)",
        "cause": "Moon afflicted by Ketu in 2nd/4th/7th/8th houses",
        "remedy": "Collect silver from all relatives and throw into flowing river.",
        "main_planets": ["MOON"], "afflicting_planets": ["KETU"], "houses": [2, 4, 7, 8]
    },
    {
        "debt": "Stri Rin (Wife's Debt)",
        "cause": "Venus afflicted by Sun/Rahu in 2nd/7th houses",
        "remedy": "Feed 100 cows with green grass and dough balls simultaneously.",
        "main_planets": ["VENUS"], "afflicting_planets": ["SUN", "RAHU"], "houses": [2, 7]
    },
    {
        "debt": "Bhratri Rin (Brother's Debt)",
        "cause": "Mars afflicted by Mercury/Ketu in 3rd/8th houses",
        "remedy": "Donate sweets and medicine to doctors or hospitals.",
        "main_planets": ["MARS"], "afflicting_planets": ["MERCURY", "KETU"], "houses": [3, 8]
    },
    {
        "debt": "Kudrati Rin (Nature's Debt)",
        "cause": "Moon or Mars afflicted by Saturn/Rahu in 6th house",
        "remedy": "Feed stray dogs continuously for 43 days with sweet bread.",
        "main_planets": ["MOON", "MARS"], "afflicting_planets": ["SATURN", "RAHU"], "houses": [6]
    },
    {
        "debt": "Aatmiya Rin (Self/Soul Debt)",
        "cause": "Sun afflicted by Saturn/Rahu/Ketu in 1st/5th/10th houses",
        "remedy": "Collect copper coins from family members and donate to temple.",
        "main_planets": ["SUN"], "afflicting_planets": ["SATURN", "RAHU", "KETU"], "houses": [1, 5, 10]
    }
]


def _evaluate_kudrati_debts(planet_houses: Dict[str, int]) -> List[Dict[str, Any]]:
    """
    Chart-based Lal Kitab Rin (debt) evaluation: a debt applies when one of its
    main planets sits in one of its trigger houses *and* is afflicted (conjunct,
    the standard Lal Kitab affliction test) by one of its afflicting planets —
    per the classical cause definitions already carried on each LAL_KITAB_DEBTS
    entry, not a constant list.
    """
    active_debts = []
    for debt in LAL_KITAB_DEBTS:
        is_active = False
        triggering_planet = None
        for main_p in debt["main_planets"]:
            main_house = planet_houses.get(main_p)
            if main_house is None or main_house not in debt["houses"]:
                continue
            for affl_p in debt["afflicting_planets"]:
                if planet_houses.get(affl_p) == main_house:
                    is_active = True
                    triggering_planet = main_p
                    break
            if is_active:
                break
        entry = {k: v for k, v in debt.items() if k not in ("main_planets", "afflicting_planets", "houses")}
        entry["is_active"] = is_active
        if is_active:
            entry["triggering_house"] = planet_houses[triggering_planet]
        active_debts.append(entry)
    return active_debts

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
        is_debilitated = DEBILITATION_SIGNS.get(p_id) == p_sign

        planets_lk.append({
            "id": p_id,
            "name": translate_entity("planets", p_id, lang, p["name_en"]),
            "kalpurush_house": house_num,
            "fixed_sign": ZODIAC_SIGNS[house_num - 1]["id"],
            "is_retrograde": is_ret,
            "is_debilitated": is_debilitated
        })

    # Sleeping Houses (Soya Hua Ghar): empty houses. (Lal Kitab also weighs
    # drishti/aspect on an empty house before calling it fully "asleep" — that
    # refinement isn't implemented; this is occupancy-only.)
    sleeping_houses = [h for h, occ in houses_planets.items() if len(occ) == 0]

    planet_houses = {pl["id"]: pl["kalpurush_house"] for pl in planets_lk}
    kudrati_debts = _evaluate_kudrati_debts(planet_houses)

    return {
        "chart_type": "Lal Kitab Kalpurush Kundli",
        "planets": planets_lk,
        "houses_planets": houses_planets,
        "sleeping_houses": sleeping_houses,
        "ancestral_debts": LAL_KITAB_DEBTS,
        "kudrati_debts": kudrati_debts
    }


def calculate_lalkitab_kundli_flags(planets_lk: List[Dict[str, Any]], houses_planets: Dict[int, List[str]]) -> Dict[str, Any]:
    """
    Whole-chart Lal Kitab classifications:
    - Andhi Kundli (blind chart): 2+ mutually-enemy planets, at least one
      debilitated, occupying the 10th (Karma) house.
    - Dharmi Kundli: Jupiter and Saturn conjunct in the same house.
    - Raat ki Andhi (night-blindness): Moon conjunct a natural enemy planet
      (the general "two enemy planets together" Andhi mechanism, applied to
      the Moon specifically).
    """
    by_id = {pl["id"]: pl for pl in planets_lk}

    tenth_house_planets = houses_planets.get(10, [])
    andhi_kundli = False
    for i, a in enumerate(tenth_house_planets):
        for b in tenth_house_planets[i + 1:]:
            if _mutual_enemies(a, b) and (by_id[a]["is_debilitated"] or by_id[b]["is_debilitated"]):
                andhi_kundli = True

    dharmi_kundli = False
    if "JUPITER" in by_id and "SATURN" in by_id:
        dharmi_kundli = by_id["JUPITER"]["kalpurush_house"] == by_id["SATURN"]["kalpurush_house"]

    rat_ki_andhi = False
    if "MOON" in by_id:
        moon_house = by_id["MOON"]["kalpurush_house"]
        for other_id in houses_planets.get(moon_house, []):
            if other_id != "MOON" and _mutual_enemies("MOON", other_id):
                rat_ki_andhi = True
                break

    return {
        "andhi_kundli": andhi_kundli,
        "dharmi_kundli": dharmi_kundli,
        "rat_ki_andhi": rat_ki_andhi
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
