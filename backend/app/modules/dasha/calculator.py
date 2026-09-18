import swisseph as swe
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.core.swisseph import calculate_julian_day, get_nakshatra_info
from app.locales.i18n import translate_entity

# Classical 120-Year Vimshottari Dasha planetary sequence and year durations
VIMSHOTTARI_CYCLE = [
    {"planet": "KETU", "years": 7.0},
    {"planet": "VENUS", "years": 20.0},
    {"planet": "SUN", "years": 6.0},
    {"planet": "MOON", "years": 10.0},
    {"planet": "MARS", "years": 7.0},
    {"planet": "RAHU", "years": 18.0},
    {"planet": "JUPITER", "years": 16.0},
    {"planet": "SATURN", "years": 19.0},
    {"planet": "MERCURY", "years": 17.0},
]
TOTAL_VIMSHOTTARI_YEARS = 120.0

# 27 Nakshatras starting lords mapping
NAKSHATRA_LORD_SEQUENCE = [
    "KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER", "SATURN", "MERCURY", # Ashwini to Ashlesha
    "KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER", "SATURN", "MERCURY", # Magha to Jyeshtha
    "KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER", "SATURN", "MERCURY", # Mula to Revati
]

def add_years_to_datetime(dt: datetime, years_float: float) -> datetime:
    """Add decimal years accurately (accounting for leap years ~365.2422 days/year)."""
    days = years_float * 365.2422
    return dt + timedelta(days=days)

def calculate_vimshottari_mahadasha(
    dob: str,
    tob: str,
    tz: float,
    moon_lon: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Calculate complete 120-Year Vimshottari Mahadasha timeline starting from birth.
    Calculates exact balance of birth dasha from Moon's nakshatra traversal percentage.
    """
    birth_dt = datetime.strptime(f"{dob} {tob[:5]}", "%Y-%m-%d %H:%M")
    
    # Nakshatra calculation (13° 20' = 13.333333333333334°)
    norm_moon = moon_lon % 360.0
    nak_span = 360.0 / 27.0
    nak_index = int(norm_moon // nak_span)
    degrees_traversed = norm_moon - (nak_index * nak_span)
    
    fraction_remaining = 1.0 - (degrees_traversed / nak_span) # Portion of dasha yet to be lived
    
    birth_lord = NAKSHATRA_LORD_SEQUENCE[nak_index]
    
    # Find start index in the 9-planet cycle
    start_cycle_idx = next(i for i, item in enumerate(VIMSHOTTARI_CYCLE) if item["planet"] == birth_lord)
    
    mahadashas = []
    current_start = birth_dt
    
    for i in range(9):
        cycle_item = VIMSHOTTARI_CYCLE[(start_cycle_idx + i) % 9]
        planet_id = cycle_item["planet"]
        full_duration = cycle_item["years"]
        
        # If it's the birth dasha, only the remaining fraction applies
        if i == 0:
            duration = full_duration * fraction_remaining
        else:
            duration = full_duration
            
        current_end = add_years_to_datetime(current_start, duration)
        
        mahadashas.append({
            "order": i + 1,
            "planet_id": planet_id,
            "planet_name": translate_entity("planets", planet_id, lang, planet_id.capitalize()),
            "duration_years": round(duration, 3),
            "start_date": current_start.strftime("%Y-%m-%d"),
            "end_date": current_end.strftime("%Y-%m-%d"),
            "is_birth_dasha": i == 0
        })
        current_start = current_end
        
    return {
        "birth_datetime": birth_dt.strftime("%Y-%m-%d %H:%M"),
        "birth_nakshatra_lord": birth_lord,
        "balance_fraction": round(fraction_remaining, 4),
        "mahadashas": mahadashas
    }

def calculate_antardashas(
    mahadasha_planet: str,
    start_date_str: str,
    end_date_str: str,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """
    Calculate 9 Antardashas (Level 2) within a given Mahadasha.
    Antardasha duration = (MD_years * AD_years) / 120
    """
    md_start = datetime.strptime(start_date_str, "%Y-%m-%d")
    
    # Find start planet in cycle
    start_idx = next(i for i, item in enumerate(VIMSHOTTARI_CYCLE) if item["planet"] == mahadasha_planet)
    md_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == mahadasha_planet)
    
    antardashas = []
    curr_start = md_start
    
    for i in range(9):
        ad_item = VIMSHOTTARI_CYCLE[(start_idx + i) % 9]
        ad_planet = ad_item["planet"]
        ad_years_base = ad_item["years"]
        
        # Duration formula
        ad_duration = (md_years * ad_years_base) / TOTAL_VIMSHOTTARI_YEARS
        curr_end = add_years_to_datetime(curr_start, ad_duration)
        
        antardashas.append({
            "order": i + 1,
            "mahadasha": mahadasha_planet,
            "antardasha": ad_planet,
            "antardasha_name": translate_entity("planets", ad_planet, lang, ad_planet.capitalize()),
            "duration_years": round(ad_duration, 4),
            "start_date": curr_start.strftime("%Y-%m-%d"),
            "end_date": curr_end.strftime("%Y-%m-%d")
        })
        curr_start = curr_end
        
    return antardashas

def calculate_pratyantar_dashas(
    mahadasha_planet: str,
    antardasha_planet: str,
    ad_start_str: str,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """
    Calculate 9 Pratyantar Dashas (Level 3) within a given Antardasha.
    Pratyantar duration = (MD_years * AD_years * PD_years) / (120 * 120)
    """
    ad_start = datetime.strptime(ad_start_str, "%Y-%m-%d")
    md_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == mahadasha_planet)
    ad_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == antardasha_planet)
    
    start_idx = next(i for i, item in enumerate(VIMSHOTTARI_CYCLE) if item["planet"] == antardasha_planet)
    
    pratyantars = []
    curr_start = ad_start
    
    for i in range(9):
        pd_item = VIMSHOTTARI_CYCLE[(start_idx + i) % 9]
        pd_planet = pd_item["planet"]
        pd_years = pd_item["years"]
        
        duration = (md_years * ad_years * pd_years) / (TOTAL_VIMSHOTTARI_YEARS * TOTAL_VIMSHOTTARI_YEARS)
        curr_end = add_years_to_datetime(curr_start, duration)
        
        pratyantars.append({
            "order": i + 1,
            "chain": f"{mahadasha_planet}-{antardasha_planet}-{pd_planet}",
            "pratyantar_planet": pd_planet,
            "pratyantar_name": translate_entity("planets", pd_planet, lang, pd_planet.capitalize()),
            "start_date": curr_start.strftime("%Y-%m-%d"),
            "end_date": curr_end.strftime("%Y-%m-%d")
        })
        curr_start = curr_end
        
    return pratyantars

def get_running_dasha_tree(
    dob: str,
    tob: str,
    tz: float,
    moon_lon: float,
    target_dt: datetime = None,
    lang: str = "en"
) -> Dict[str, Any]:
    """Calculate currently running real-time Dasha hierarchy (MD - AD - PD)."""
    if not target_dt:
        target_dt = datetime.now()
        
    md_info = calculate_vimshottari_mahadasha(dob, tob, tz, moon_lon, lang)
    
    # Find running Mahadasha
    active_md = None
    for md in md_info["mahadashas"]:
        s = datetime.strptime(md["start_date"], "%Y-%m-%d")
        e = datetime.strptime(md["end_date"], "%Y-%m-%d")
        if s <= target_dt <= e:
            active_md = md
            break
            
    if not active_md:
        active_md = md_info["mahadashas"][-1]
        
    # Find running Antardasha
    ad_list = calculate_antardashas(active_md["planet_id"], active_md["start_date"], active_md["end_date"], lang)
    active_ad = None
    for ad in ad_list:
        s = datetime.strptime(ad["start_date"], "%Y-%m-%d")
        e = datetime.strptime(ad["end_date"], "%Y-%m-%d")
        if s <= target_dt <= e:
            active_ad = ad
            break
            
    if not active_ad:
        active_ad = ad_list[-1]
        
    # Find running Pratyantar Dasha
    pd_list = calculate_pratyantar_dashas(active_md["planet_id"], active_ad["antardasha"], active_ad["start_date"], lang)
    active_pd = None
    for pd in pd_list:
        s = datetime.strptime(pd["start_date"], "%Y-%m-%d")
        e = datetime.strptime(pd["end_date"], "%Y-%m-%d")
        if s <= target_dt <= e:
            active_pd = pd
            break
            
    if not active_pd:
        active_pd = pd_list[-1]
        
    return {
        "as_of_date": target_dt.strftime("%Y-%m-%d %H:%M"),
        "running_dasha": {
            "hierarchy": f"{active_md['planet_id']} > {active_ad['antardasha']} > {active_pd['pratyantar_planet']}",
            "mahadasha": active_md,
            "antardasha": active_ad,
            "pratyantar_dasha": active_pd
        }
    }
