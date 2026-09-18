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
    clean_tob = tob.strip()
    if len(clean_tob) == 5:
        birth_dt = datetime.strptime(f"{dob} {clean_tob}", "%Y-%m-%d %H:%M")
    elif len(clean_tob) >= 8:
        birth_dt = datetime.strptime(f"{dob} {clean_tob[:8]}", "%Y-%m-%d %H:%M:%S")
    else:
        birth_dt = datetime.strptime(f"{dob} 00:00:00", "%Y-%m-%d %H:%M:%S")
    
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
            "start_time": current_start.strftime("%H:%M:%S"),
            "start_datetime": current_start.strftime("%Y-%m-%d %H:%M:%S"),
            "end_date": current_end.strftime("%Y-%m-%d"),
            "end_time": current_end.strftime("%H:%M:%S"),
            "end_datetime": current_end.strftime("%Y-%m-%d %H:%M:%S"),
            "is_birth_dasha": i == 0
        })
        current_start = current_end
        
    return {
        "birth_datetime": birth_dt.strftime("%Y-%m-%d %H:%M:%S"),
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
    md_start = parse_dasha_datetime(start_date_str)
    
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
            "start_time": curr_start.strftime("%H:%M:%S"),
            "start_datetime": curr_start.strftime("%Y-%m-%d %H:%M:%S"),
            "end_date": curr_end.strftime("%Y-%m-%d"),
            "end_time": curr_end.strftime("%H:%M:%S"),
            "end_datetime": curr_end.strftime("%Y-%m-%d %H:%M:%S")
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
    ad_start = parse_dasha_datetime(ad_start_str)
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
            "start_time": curr_start.strftime("%H:%M:%S"),
            "start_datetime": curr_start.strftime("%Y-%m-%d %H:%M:%S"),
            "end_date": curr_end.strftime("%Y-%m-%d"),
            "end_time": curr_end.strftime("%H:%M:%S"),
            "end_datetime": curr_end.strftime("%Y-%m-%d %H:%M:%S")
        })
        curr_start = curr_end
        
    return pratyantars

def calculate_sookshma_dashas(
    mahadasha_planet: str,
    antardasha_planet: str,
    pratyantar_planet: str,
    pd_start_str: str,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """
    Calculate 9 Sookshma Dashas (Level 4) within a given Pratyantar Dasha.
    Duration = (MD_years * AD_years * PD_years * SD_years) / (120^3)
    """
    pd_start = parse_dasha_datetime(pd_start_str)
    md_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == mahadasha_planet)
    ad_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == antardasha_planet)
    pd_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == pratyantar_planet)
    
    start_idx = next(i for i, item in enumerate(VIMSHOTTARI_CYCLE) if item["planet"] == pratyantar_planet)
    
    sookshmas = []
    curr_start = pd_start
    divisor = TOTAL_VIMSHOTTARI_YEARS ** 3
    
    for i in range(9):
        sd_item = VIMSHOTTARI_CYCLE[(start_idx + i) % 9]
        sd_planet = sd_item["planet"]
        sd_years = sd_item["years"]
        
        duration = (md_years * ad_years * pd_years * sd_years) / divisor
        curr_end = add_years_to_datetime(curr_start, duration)
        
        duration_days = duration * 365.2422
        duration_hours = duration_days * 24.0
        
        sookshmas.append({
            "order": i + 1,
            "chain": f"{mahadasha_planet}-{antardasha_planet}-{pratyantar_planet}-{sd_planet}",
            "sookshma_planet": sd_planet,
            "sookshma_name": translate_entity("planets", sd_planet, lang, sd_planet.capitalize()),
            "duration_days": round(duration_days, 2),
            "duration_hours": round(duration_hours, 1),
            "start_date": curr_start.strftime("%Y-%m-%d"),
            "start_time": curr_start.strftime("%H:%M:%S"),
            "start_datetime": curr_start.strftime("%Y-%m-%d %H:%M:%S"),
            "end_date": curr_end.strftime("%Y-%m-%d"),
            "end_time": curr_end.strftime("%H:%M:%S"),
            "end_datetime": curr_end.strftime("%Y-%m-%d %H:%M:%S")
        })
        curr_start = curr_end
        
    return sookshmas

def calculate_prana_dashas(
    mahadasha_planet: str,
    antardasha_planet: str,
    pratyantar_planet: str,
    sookshma_planet: str,
    sd_start_str: str,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """
    Calculate 9 Prana Dashas (Level 5) within a given Sookshma Dasha.
    Fine-grain micro-timing down to exact hours and minutes.
    Duration = (MD_years * AD_years * PD_years * SD_years * PR_years) / (120^4)
    """
    sd_start = parse_dasha_datetime(sd_start_str)
    md_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == mahadasha_planet)
    ad_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == antardasha_planet)
    pd_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == pratyantar_planet)
    sd_years = next(item["years"] for item in VIMSHOTTARI_CYCLE if item["planet"] == sookshma_planet)
    
    start_idx = next(i for i, item in enumerate(VIMSHOTTARI_CYCLE) if item["planet"] == sookshma_planet)
    
    pranas = []
    curr_start = sd_start
    divisor = TOTAL_VIMSHOTTARI_YEARS ** 4
    
    for i in range(9):
        pr_item = VIMSHOTTARI_CYCLE[(start_idx + i) % 9]
        pr_planet = pr_item["planet"]
        pr_years = pr_item["years"]
        
        duration = (md_years * ad_years * pd_years * sd_years * pr_years) / divisor
        curr_end = add_years_to_datetime(curr_start, duration)
        
        duration_days = duration * 365.2422
        duration_hours = duration_days * 24.0
        
        pranas.append({
            "order": i + 1,
            "chain": f"{mahadasha_planet}-{antardasha_planet}-{pratyantar_planet}-{sookshma_planet}-{pr_planet}",
            "prana_planet": pr_planet,
            "prana_name": translate_entity("planets", pr_planet, lang, pr_planet.capitalize()),
            "duration_hours": round(duration_hours, 2),
            "start_date": curr_start.strftime("%Y-%m-%d"),
            "start_time": curr_start.strftime("%H:%M:%S"),
            "start_datetime": curr_start.strftime("%Y-%m-%d %H:%M:%S"),
            "end_date": curr_end.strftime("%Y-%m-%d"),
            "end_time": curr_end.strftime("%H:%M:%S"),
            "end_datetime": curr_end.strftime("%Y-%m-%d %H:%M:%S")
        })
        curr_start = curr_end
        
    return pranas

def parse_dasha_datetime(dt_str: str) -> datetime:
    """Parse string date with optional time into datetime object."""
    dt_str = dt_str.strip()
    if len(dt_str) == 10:
        return datetime.strptime(dt_str, "%Y-%m-%d")
    elif len(dt_str) == 16:
        return datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
    elif len(dt_str) >= 19:
        return datetime.strptime(dt_str[:19], "%Y-%m-%d %H:%M:%S")
    return datetime.strptime(dt_str[:10], "%Y-%m-%d")

def get_running_dasha_tree(
    dob: str,
    tob: str,
    tz: float,
    moon_lon: float,
    target_dt: datetime = None,
    lang: str = "en"
) -> Dict[str, Any]:
    """Calculate currently running real-time Dasha hierarchy (MD - AD - PD - SD - PR)."""
    if not target_dt:
        target_dt = datetime.now()
        
    md_info = calculate_vimshottari_mahadasha(dob, tob, tz, moon_lon, lang)
    
    # Find running Mahadasha
    active_md = None
    for md in md_info["mahadashas"]:
        s = parse_dasha_datetime(md["start_datetime"])
        e = parse_dasha_datetime(md["end_datetime"])
        if s <= target_dt <= e:
            active_md = md
            break
            
    if not active_md:
        active_md = md_info["mahadashas"][-1]
        
    # Find running Antardasha
    ad_list = calculate_antardashas(active_md["planet_id"], active_md["start_datetime"], active_md["end_datetime"], lang)
    active_ad = None
    for ad in ad_list:
        s = parse_dasha_datetime(ad["start_datetime"])
        e = parse_dasha_datetime(ad["end_datetime"])
        if s <= target_dt <= e:
            active_ad = ad
            break
            
    if not active_ad:
        active_ad = ad_list[-1]
        
    # Find running Pratyantar Dasha
    pd_list = calculate_pratyantar_dashas(active_md["planet_id"], active_ad["antardasha"], active_ad["start_datetime"], lang)
    active_pd = None
    for pd in pd_list:
        s = parse_dasha_datetime(pd["start_datetime"])
        e = parse_dasha_datetime(pd["end_datetime"])
        if s <= target_dt <= e:
            active_pd = pd
            break
            
    if not active_pd:
        active_pd = pd_list[-1]

    # Find running Sookshma Dasha (Level 4)
    sd_list = calculate_sookshma_dashas(active_md["planet_id"], active_ad["antardasha"], active_pd["pratyantar_planet"], active_pd["start_datetime"], lang)
    active_sd = None
    for sd in sd_list:
        s = parse_dasha_datetime(sd["start_datetime"])
        e = parse_dasha_datetime(sd["end_datetime"])
        if s <= target_dt <= e:
            active_sd = sd
            break
    if not active_sd:
        active_sd = sd_list[-1]

    # Find running Prana Dasha (Level 5)
    pr_list = calculate_prana_dashas(active_md["planet_id"], active_ad["antardasha"], active_pd["pratyantar_planet"], active_sd["sookshma_planet"], active_sd["start_datetime"], lang)
    active_pr = None
    for pr in pr_list:
        s = parse_dasha_datetime(pr["start_datetime"])
        e = parse_dasha_datetime(pr["end_datetime"])
        if s <= target_dt <= e:
            active_pr = pr
            break
    if not active_pr:
        active_pr = pr_list[-1]
        
    return {
        "as_of_datetime": target_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "running_dasha": {
            "hierarchy": f"{active_md['planet_id']} > {active_ad['antardasha']} > {active_pd['pratyantar_planet']} > {active_sd['sookshma_planet']} > {active_pr['prana_planet']}",
            "mahadasha": active_md,
            "antardasha": active_ad,
            "pratyantar_dasha": active_pd,
            "sookshma_dasha": active_sd,
            "prana_dasha": active_pr
        }
    }
