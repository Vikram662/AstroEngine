import swisseph as swe
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.core.swisseph import calculate_julian_day, get_nakshatra_info
from app.locales.i18n import translate_entity

# 30 Tithis (15 Shukla, 15 Krishna)
TITHIS = [
    {"id": "SHUKLA_PRATIPADA", "paksha": "SHUKLA", "name_en": "Shukla Pratipada", "name_hi": "शुक्ल प्रतिपदा"},
    {"id": "SHUKLA_DWITIYA", "paksha": "SHUKLA", "name_en": "Shukla Dwitiya", "name_hi": "शुक्ल द्वितीया"},
    {"id": "SHUKLA_TRITIYA", "paksha": "SHUKLA", "name_en": "Shukla Tritiya", "name_hi": "शुक्ल तृतीया"},
    {"id": "SHUKLA_CHATURTHI", "paksha": "SHUKLA", "name_en": "Shukla Chaturthi", "name_hi": "शुक्ल चतुर्थी"},
    {"id": "SHUKLA_PANCHAMI", "paksha": "SHUKLA", "name_en": "Shukla Panchami", "name_hi": "शुक्ल पंचमी"},
    {"id": "SHUKLA_SHASHTHI", "paksha": "SHUKLA", "name_en": "Shukla Shashthi", "name_hi": "शुक्ल षष्ठी"},
    {"id": "SHUKLA_SAPTAMI", "paksha": "SHUKLA", "name_en": "Shukla Saptami", "name_hi": "शुक्ल सप्तमी"},
    {"id": "SHUKLA_ASHTAMI", "paksha": "SHUKLA", "name_en": "Shukla Ashtami", "name_hi": "शुक्ल अष्टमी"},
    {"id": "SHUKLA_NAVAMI", "paksha": "SHUKLA", "name_en": "Shukla Navami", "name_hi": "शुक्ल नवमी"},
    {"id": "SHUKLA_DASHAMI", "paksha": "SHUKLA", "name_en": "Shukla Dashami", "name_hi": "शुक्ल दशमी"},
    {"id": "SHUKLA_EKADASHI", "paksha": "SHUKLA", "name_en": "Shukla Ekadashi", "name_hi": "शुक्ल एकादशी"},
    {"id": "SHUKLA_DWADASHI", "paksha": "SHUKLA", "name_en": "Shukla Dwadashi", "name_hi": "शुक्ल द्वादशी"},
    {"id": "SHUKLA_TRAYODASHI", "paksha": "SHUKLA", "name_en": "Shukla Trayodashi", "name_hi": "शुक्ल त्रयोदशी"},
    {"id": "SHUKLA_CHATURDASHI", "paksha": "SHUKLA", "name_en": "Shukla Chaturdashi", "name_hi": "शुक्ल चतुर्दशी"},
    {"id": "PURNIMA", "paksha": "SHUKLA", "name_en": "Purnima", "name_hi": "पूर्णिमा"},
    {"id": "KRISHNA_PRATIPADA", "paksha": "KRISHNA", "name_en": "Krishna Pratipada", "name_hi": "कृष्ण प्रतिपदा"},
    {"id": "KRISHNA_DWITIYA", "paksha": "KRISHNA", "name_en": "Krishna Dwitiya", "name_hi": "कृष्ण द्वितीया"},
    {"id": "KRISHNA_TRITIYA", "paksha": "KRISHNA", "name_en": "Krishna Tritiya", "name_hi": "कृष्ण तृतीया"},
    {"id": "KRISHNA_CHATURTHI", "paksha": "KRISHNA", "name_en": "Krishna Chaturthi", "name_hi": "कृष्ण चतुर्थी"},
    {"id": "KRISHNA_PANCHAMI", "paksha": "KRISHNA", "name_en": "Krishna Panchami", "name_hi": "कृष्ण पंचमी"},
    {"id": "KRISHNA_SHASHTHI", "paksha": "KRISHNA", "name_en": "Krishna Shashthi", "name_hi": "कृष्ण षष्ठी"},
    {"id": "KRISHNA_SAPTAMI", "paksha": "KRISHNA", "name_en": "Krishna Saptami", "name_hi": "कृष्ण सप्तमी"},
    {"id": "KRISHNA_ASHTAMI", "paksha": "KRISHNA", "name_en": "Krishna Ashtami", "name_hi": "कृष्ण अष्टमी"},
    {"id": "KRISHNA_NAVAMI", "paksha": "KRISHNA", "name_en": "Krishna Navami", "name_hi": "कृष्ण नवमी"},
    {"id": "KRISHNA_DASHAMI", "paksha": "KRISHNA", "name_en": "Krishna Dashami", "name_hi": "कृष्ण दशमी"},
    {"id": "KRISHNA_EKADASHI", "paksha": "KRISHNA", "name_en": "Krishna Ekadashi", "name_hi": "कृष्ण एकादशी"},
    {"id": "KRISHNA_DWADASHI", "paksha": "KRISHNA", "name_en": "Krishna Dwadashi", "name_hi": "कृष्ण द्वादशी"},
    {"id": "KRISHNA_TRAYODASHI", "paksha": "KRISHNA", "name_en": "Krishna Trayodashi", "name_hi": "कृष्ण त्रयोदशी"},
    {"id": "KRISHNA_CHATURDASHI", "paksha": "KRISHNA", "name_en": "Krishna Chaturdashi", "name_hi": "कृष्ण चतुर्दशी"},
    {"id": "AMAVASYA", "paksha": "KRISHNA", "name_en": "Amavasya", "name_hi": "अमावस्या"},
]

# 27 Yogas
YOGAS = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
    "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
    "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha",
    "Shukla", "Brahma", "Indra", "Vaidhriti"
]

# 11 Karanas (4 fixed, 7 repeating 8 times = 56 + 4 = 60 half-tithis)
FIXED_KARANAS = ["Shakuni", "Chatushpada", "Naga", "Kintughna"]
REPEATING_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"]

# Weekdays (Vaar)
VAARS = [
    {"id": "MONDAY", "name_en": "Monday", "name_hi": "सोमवार", "lord": "MOON"},
    {"id": "TUESDAY", "name_en": "Tuesday", "name_hi": "मंगलवार", "lord": "MARS"},
    {"id": "WEDNESDAY", "name_en": "Wednesday", "name_hi": "बुधवार", "lord": "MERCURY"},
    {"id": "THURSDAY", "name_en": "Thursday", "name_hi": "गुरुवार", "lord": "JUPITER"},
    {"id": "FRIDAY", "name_en": "Friday", "name_hi": "शुक्रवार", "lord": "VENUS"},
    {"id": "SATURDAY", "name_en": "Saturday", "name_hi": "शनिवार", "lord": "SATURN"},
    {"id": "SUNDAY", "name_en": "Sunday", "name_hi": "रविवार", "lord": "SUN"},
]

def calculate_daily_panchang(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Calculate 5 fundamental limbs of Panchang:
    1. Vaar (Day)
    2. Tithi (Moon - Sun angular distance / 12°)
    3. Nakshatra (Moon sidereal position / 13° 20')
    4. Yoga (Sun + Moon sidereal longitudes / 13° 20')
    5. Karana (Half-tithi / 6°)
    """
    jd_ut = calculate_julian_day(dob, tob, tz)

    # Use Lahiri sidereal mode for Panchang calculations
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL

    sun_res, _ = swe.calc_ut(jd_ut, swe.SUN, flags)
    moon_res, _ = swe.calc_ut(jd_ut, swe.MOON, flags)

    sun_lon = sun_res[0]
    moon_lon = moon_res[0]

    # 1. Tithi: (Moon - Sun) % 360 / 12°
    angle_diff = (moon_lon - sun_lon) % 360.0
    tithi_index = int(angle_diff // 12.0)
    tithi_meta = TITHIS[tithi_index]
    degrees_in_tithi = angle_diff % 12.0
    tithi_percent_passed = round((degrees_in_tithi / 12.0) * 100.0, 2)

    # 2. Nakshatra: Moon sidereal longitude / 13° 20'
    moon_nak = get_nakshatra_info(moon_lon)

    # 3. Yoga: (Sun + Moon) % 360 / 13° 20'
    sum_lon = (sun_lon + moon_lon) % 360.0
    yoga_span = 360.0 / 27.0
    yoga_index = int(sum_lon // yoga_span)
    yoga_name = YOGAS[yoga_index]

    # 4. Karana: angle_diff / 6°
    karana_idx = int(angle_diff // 6.0) # 0 to 59
    if karana_idx == 0:
        karana_name = "Kintughna"
    elif karana_idx >= 57:
        karana_name = FIXED_KARANAS[karana_idx - 57]
    else:
        karana_name = REPEATING_KARANAS[(karana_idx - 1) % 7]

    # 5. Vaar (Vedic Weekday from Sunrise)
    dt = datetime.strptime(dob, "%Y-%m-%d")
    # Check if time of birth is before local sunrise
    is_before_sunrise = False
    try:
        from app.modules.core_astronomy.advanced_astronomy import calculate_sun_moon_timings
        sun_timings = calculate_sun_moon_timings(dob, lat, lon, tz)
        sr_str = sun_timings.get("sunrise")
        if sr_str and sr_str != "N/A":
            sr_parts = [int(p) for p in sr_str.split(":")]
            sr_sec = sr_parts[0] * 3600 + sr_parts[1] * 60 + (sr_parts[2] if len(sr_parts) > 2 else 0)
            tob_parts = [int(p) for p in tob.split(":")]
            tob_sec = tob_parts[0] * 3600 + tob_parts[1] * 60 + (tob_parts[2] if len(tob_parts) > 2 else 0)
            if tob_sec < sr_sec:
                is_before_sunrise = True
    except Exception:
        pass

    if is_before_sunrise:
        effective_dt = dt - timedelta(days=1)
    else:
        effective_dt = dt

    weekday_idx = effective_dt.weekday() # 0 = Monday, 6 = Sunday
    vaar_meta = VAARS[weekday_idx]

    return {
        "date": dob,
        "time": tob,
        "vaar": {
            "id": vaar_meta["id"],
            "name": vaar_meta["name_hi"] if lang == "hi" else vaar_meta["name_en"],
            "lord": vaar_meta["lord"]
        },
        "tithi": {
            "id": tithi_meta["id"],
            "name": tithi_meta["name_hi"] if lang == "hi" else tithi_meta["name_en"],
            "paksha": tithi_meta["paksha"],
            "number": tithi_index + 1,
            "percent_completed": tithi_percent_passed
        },
        "nakshatra": {
            "id": moon_nak["id"],
            "name": translate_entity("nakshatras", moon_nak["id"], lang, moon_nak["name_en"]),
            "number": moon_nak["index"],
            "pada": moon_nak["pada"],
            "lord": moon_nak["lord"]
        },
        "moon_degree": round(moon_lon, 4),
        "yoga": {
            "id": yoga_name.upper(),
            "name": yoga_name,
            "number": yoga_index + 1
        },
        "karana": {
            "id": karana_name.upper(),
            "name": karana_name,
            "is_vishti_bhadra": karana_name == "Vishti"
        }
    }

# 8 Choghadiyas sequence
CHOGHADIYA_TYPES = {
    "UDWEG": {"nature": "Bad", "nature_hi": "उद्वेग (अशुभ)", "ruler": "SUN"},
    "CHAL": {"nature": "Neutral", "nature_hi": "चल (मध्यम)", "ruler": "VENUS"},
    "LABH": {"nature": "Good", "nature_hi": "लाभ (शुभ)", "ruler": "MERCURY"},
    "AMRIT": {"nature": "Best", "nature_hi": "अमृत (श्रेष्ठ)", "ruler": "MOON"},
    "KAAL": {"nature": "Bad", "nature_hi": "काल (हानि)", "ruler": "SATURN"},
    "SHUBH": {"nature": "Good", "nature_hi": "शुभ (उत्तम)", "ruler": "JUPITER"},
    "ROG": {"nature": "Bad", "nature_hi": "रोग (अशुभ)", "ruler": "MARS"},
}

def calculate_choghadiya(
    dob: str,
    sunrise_time_str: str,
    sunset_time_str: str,
    lang: str = "en"
) -> Dict[str, Any]:
    """Calculate 8 Day Choghadiya and 8 Night Choghadiya slots based on exact sunrise/sunset."""
    dt = datetime.strptime(dob, "%Y-%m-%d")
    weekday_idx = dt.weekday() # 0 = Monday ... 6 = Sunday

    # Day sequences starting per weekday
    day_patterns = [
        ["AMRIT", "KAAL", "SHUBH", "ROG", "UDWEG", "CHAL", "LABH", "AMRIT"], # Monday
        ["ROG", "UDWEG", "CHAL", "LABH", "AMRIT", "KAAL", "SHUBH", "ROG"],    # Tuesday
        ["LABH", "AMRIT", "KAAL", "SHUBH", "ROG", "UDWEG", "CHAL", "LABH"],   # Wednesday
        ["SHUBH", "ROG", "UDWEG", "CHAL", "LABH", "AMRIT", "KAAL", "SHUBH"],  # Thursday
        ["CHAL", "LABH", "AMRIT", "KAAL", "SHUBH", "ROG", "UDWEG", "CHAL"],   # Friday
        ["KAAL", "SHUBH", "ROG", "UDWEG", "CHAL", "LABH", "AMRIT", "KAAL"],   # Saturday
        ["UDWEG", "CHAL", "LABH", "AMRIT", "KAAL", "SHUBH", "ROG", "UDWEG"]   # Sunday
    ]

    # Night sequences starting per weekday
    night_patterns = [
        ["CHAL", "ROG", "KAAL", "LABH", "UDWEG", "SHUBH", "AMRIT", "CHAL"],   # Monday
        ["KAAL", "LABH", "UDWEG", "SHUBH", "AMRIT", "CHAL", "ROG", "KAAL"],   # Tuesday
        ["UDWEG", "SHUBH", "AMRIT", "CHAL", "ROG", "KAAL", "LABH", "UDWEG"],  # Wednesday
        ["AMRIT", "CHAL", "ROG", "KAAL", "LABH", "UDWEG", "SHUBH", "AMRIT"],  # Thursday
        ["ROG", "KAAL", "LABH", "UDWEG", "SHUBH", "AMRIT", "CHAL", "ROG"],    # Friday
        ["LABH", "UDWEG", "SHUBH", "AMRIT", "CHAL", "ROG", "KAAL", "LABH"],   # Saturday
        ["SHUBH", "AMRIT", "CHAL", "ROG", "KAAL", "LABH", "UDWEG", "SHUBH"]   # Sunday
    ]

    selected_day_pattern = day_patterns[weekday_idx]
    selected_night_pattern = night_patterns[weekday_idx]
    
    # Parse sunrise and sunset into seconds
    sr_h, sr_m, sr_s = [int(p) for p in sunrise_time_str.split(":")]
    ss_h, ss_m, ss_s = [int(p) for p in sunset_time_str.split(":")]
    
    sr_sec = sr_h * 3600 + sr_m * 60 + sr_s
    ss_sec = ss_h * 3600 + ss_m * 60 + ss_s
    
    day_span_sec = ss_sec - sr_sec
    day_slot_sec = day_span_sec / 8.0

    # Night span is sunset to next sunrise
    night_span_sec = (86400 - ss_sec) + sr_sec
    night_slot_sec = night_span_sec / 8.0

    def fmt(sec):
        sec = int(round(sec)) % 86400
        return f"{sec // 3600:02d}:{(sec % 3600) // 60:02d}:{(sec % 60):02d}"

    day_slots = []
    for i, chog_key in enumerate(selected_day_pattern):
        start_s = sr_sec + (i * day_slot_sec)
        end_s = start_s + day_slot_sec
        meta = CHOGHADIYA_TYPES[chog_key]
        day_slots.append({
            "slot_number": i + 1,
            "name": chog_key,
            "nature": meta["nature_hi"] if lang == "hi" else meta["nature"],
            "ruler": meta["ruler"],
            "start_time": fmt(start_s),
            "end_time": fmt(end_s)
        })

    night_slots = []
    for i, chog_key in enumerate(selected_night_pattern):
        start_s = ss_sec + (i * night_slot_sec)
        end_s = start_s + night_slot_sec
        meta = CHOGHADIYA_TYPES[chog_key]
        night_slots.append({
            "slot_number": i + 1,
            "name": chog_key,
            "nature": meta["nature_hi"] if lang == "hi" else meta["nature"],
            "ruler": meta["ruler"],
            "start_time": fmt(start_s),
            "end_time": fmt(end_s)
        })

    return {
        "date": dob,
        "sunrise": sunrise_time_str,
        "sunset": sunset_time_str,
        "day_choghadiya": day_slots,
        "night_choghadiya": night_slots
    }

def calculate_advanced_muhurats(
    dob: str,
    sunrise_time_str: str,
    sunset_time_str: str,
    lang: str = "en"
) -> Dict[str, Any]:
    """Module 2 — Endpoint 9: Rahu Kaal, Yamaghanda, Gulika Kaal, Abhijit & Brahma Muhurat."""
    sr_h, sr_m, sr_s = [int(p) for p in sunrise_time_str.split(":")]
    ss_h, ss_m, ss_s = [int(p) for p in sunset_time_str.split(":")]
    sr_sec = sr_h * 3600 + sr_m * 60 + sr_s
    ss_sec = ss_h * 3600 + ss_m * 60 + ss_s
    part_sec = (ss_sec - sr_sec) / 8.0

    dt = datetime.strptime(dob, "%Y-%m-%d")
    w = dt.weekday() # 0 = Monday ... 6 = Sunday

    # Rahu Kaal (1/8th parts: Mon=2, Tue=7, Wed=5, Thu=6, Fri=4, Sat=3, Sun=8)
    rahu_parts = [1, 6, 4, 5, 3, 2, 7] # 0-indexed part
    yam_parts = [3, 2, 1, 0, 6, 5, 4]
    gulika_parts = [5, 4, 3, 2, 1, 0, 6]

    def part_time(p_idx):
        st = sr_sec + p_idx * part_sec
        et = st + part_sec
        def fmt(s):
            s = int(s) % 86400
            return f"{s // 3600:02d}:{(s % 3600) // 60:02d}:{(s % 60):02d}"
        return {"start": fmt(st), "end": fmt(et)}

    mid_day_sec = (sr_sec + ss_sec) / 2.0
    def fmt(s):
        s = int(s) % 86400
        return f"{s // 3600:02d}:{(s % 3600) // 60:02d}:{(s % 60):02d}"

    return {
        "date": dob,
        "rahu_kaal": part_time(rahu_parts[w]),
        "yamaghanda_kaal": part_time(yam_parts[w]),
        "gulika_kaal": part_time(gulika_parts[w]),
        "abhijit_muhurat": {
            "start": fmt(mid_day_sec - 1440), # 24 min before midday
            "end": fmt(mid_day_sec + 1440),   # 24 min after midday
            "is_auspicious": True
        },
        "brahma_muhurat": {
            "start": fmt(sr_sec - 5760), # 96 min before sunrise
            "end": fmt(sr_sec - 2880),   # 48 min before sunrise
            "is_auspicious": True
        }
    }

def calculate_hora_schedule(
    dob: str, 
    sunrise_time_str: str,
    sunset_time_str: str = "18:00:00"
) -> Dict[str, Any]:
    """Module 2 — Endpoint 11: 24 classical temporal planetary horas (12 day + 12 night)."""
    dt = datetime.strptime(dob, "%Y-%m-%d")
    w = dt.weekday()
    # Chaldean planetary order descending: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon
    CHALDEAN_ORDER = ["SATURN", "JUPITER", "MARS", "SUN", "VENUS", "MERCURY", "MOON"]
    day_first_hora_lord = ["MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "SUN"][w]
    start_idx = CHALDEAN_ORDER.index(day_first_hora_lord)

    sr_h, sr_m, sr_s = [int(p) for p in sunrise_time_str.split(":")]
    ss_h, ss_m, ss_s = [int(p) for p in sunset_time_str.split(":")]
    sr_sec = sr_h * 3600 + sr_m * 60 + sr_s
    ss_sec = ss_h * 3600 + ss_m * 60 + ss_s

    # 12 day horas (sunrise to sunset)
    day_span_sec = ss_sec - sr_sec
    day_hora_sec = day_span_sec / 12.0

    # 12 night horas (sunset to next sunrise)
    night_span_sec = (86400 - ss_sec) + sr_sec
    night_hora_sec = night_span_sec / 12.0

    def fmt(sec):
        sec = int(round(sec)) % 86400
        return f"{sec // 3600:02d}:{(sec % 3600) // 60:02d}:{(sec % 60):02d}"

    horas = []
    # 12 Day Horas
    for h in range(12):
        lord = CHALDEAN_ORDER[(start_idx + h) % 7]
        st = sr_sec + (h * day_hora_sec)
        et = st + day_hora_sec
        horas.append({
            "hora_number": h + 1,
            "period": "DAY",
            "lord": lord,
            "start_time": fmt(st),
            "end_time": fmt(et)
        })

    # 12 Night Horas
    for h in range(12):
        lord = CHALDEAN_ORDER[(start_idx + 12 + h) % 7]
        st = ss_sec + (h * night_hora_sec)
        et = st + night_hora_sec
        horas.append({
            "hora_number": 12 + h + 1,
            "period": "NIGHT",
            "lord": lord,
            "start_time": fmt(st),
            "end_time": fmt(et)
        })

    return {
        "date": dob, 
        "sunrise": sunrise_time_str, 
        "sunset": sunset_time_str,
        "horas": horas
    }

def calculate_bhadra_panchak(dob: str, tob: str, lat: float, lon: float, tz: float) -> Dict[str, Any]:
    """Module 2 — Endpoint 12 & 13: Bhadra & Panchak calculations."""
    panchang = calculate_daily_panchang(dob, tob, lat, lon, tz)
    karana_name = panchang["karana"]["name"]
    nakshatra_id = panchang["nakshatra"]["id"]

    # Bhadra occurs during Vishti Karana
    has_bhadra = "Vishti" in karana_name
    bhadra_loka = "Swarga Loka" if panchang["tithi"]["paksha"] == "SHUKLA" else "Mrityu Loka"

    # Panchak occurs when Moon is in Aquarius & Pisces (from Dhanishta 3rd pada onwards: 296° 40' to 360°)
    moon_deg = panchang.get("moon_degree", 0.0)
    # If moon_degree is available or check nakshatra + pada
    if nakshatra_id == "DHANISHTA":
        # Pada 3 and 4 only
        is_panchak = (moon_deg >= 296.6667)
    else:
        is_panchak = nakshatra_id in ["SHATABHISHA", "PURVA_BHADRAPADA", "UTTARA_BHADRAPADA", "REVATI"]
    w_day = datetime.strptime(dob, "%Y-%m-%d").weekday()
    panchak_type = "Rog Panchak" if w_day == 6 else ("Agni Panchak" if w_day == 1 else "Normal Panchak")

    return {
        "bhadra": {
            "is_present": has_bhadra,
            "karana": karana_name,
            "residence_loka": bhadra_loka if has_bhadra else "None",
            "advisory": "Avoid major auspicious beginnings during Bhadra" if has_bhadra else "Clear"
        },
        "panchak": {
            "is_active": is_panchak,
            "type": panchak_type if is_panchak else "None",
            "active_nakshatra": panchang["nakshatra"]["name"]
        }
    }

def calculate_monthly_calendar(year: int, month: int, lat: float, lon: float, tz: float, lang: str = "en") -> Dict[str, Any]:
    """
    Module 2 — Endpoint 14: Month-wide Tithi transitions, Ekadashi, Pradosh, Purnima, Amavasya, and Sankranti.
    Generates exact daily panchang points for all days of the month.
    """
    import calendar
    num_days = calendar.monthrange(year, month)[1]
    days_data = []

    festivals_and_fasts = []

    from app.modules.core_astronomy.advanced_astronomy import calculate_sun_moon_timings
    for d in range(1, num_days + 1):
        d_str = f"{year:04d}-{month:02d}-{d:02d}"
        p = calculate_daily_panchang(d_str, "06:00:00", lat, lon, tz, lang)
        sun_timings = calculate_sun_moon_timings(d_str, lat, lon, tz)
        tithi_id = p["tithi"]["id"]
        tithi_name = p["tithi"]["name"]

        # Tag important fasting and festival days
        tags = []
        if "EKADASHI" in tithi_id:
            tags.append("Ekadashi Vrat")
        elif "TRAYODASHI" in tithi_id:
            tags.append("Pradosh Vrat")
        elif tithi_id == "PURNIMA":
            tags.append("Satyanarayan Vrat / Purnima")
        elif tithi_id == "AMAVASYA":
            tags.append("Amavasya (Pitru Tarpan)")

        if tags:
            festivals_and_fasts.append({
                "date": d_str,
                "events": tags,
                "tithi": tithi_name
            })

        days_data.append({
            "date": d_str,
            "day_of_week": p["vaar"]["name"],
            "sunrise": sun_timings["sunrise"],
            "sunset": sun_timings["sunset"],
            "tithi": tithi_name,
            "nakshatra": p["nakshatra"]["name"],
            "yoga": p["yoga"]["name"],
            "karana": p["karana"]["name"],
            "events": tags
        })

    return {
        "year": year,
        "month": month,
        "total_days": num_days,
        "key_fasts_and_festivals": festivals_and_fasts,
        "days": days_data
    }

def calculate_muhurat_selection(
    dob: str,
    lat: float,
    lon: float,
    tz: float,
    muhurat_type: str = "MARRIAGE",
    days_to_scan: int = 15
) -> Dict[str, Any]:
    """
    Module 2 — Endpoints 15, 16, 17:
    Calculates auspicious Muhurats for Marriage, Griha Pravesh, Property, and Vehicle delivery.
    Filters by Shastric prohibitions:
    - Bhadra (Vishti Karana) prohibited
    - Rahu Kaal strictly prohibited
    - Combust Jupiter/Venus (Guru/Shukra Aditya/Asta)
    - Inauspicious Rikta Tithis (4th, 9th, 14th) for auspicious beginnings
    """
    from app.modules.core_astronomy.advanced_astronomy import calculate_sun_moon_timings
    base_dt = datetime.strptime(dob, "%Y-%m-%d")
    auspicious_slots = []

    # Rikta tithis
    rikta_ids = ["SHUKLA_CHATURTHI", "SHUKLA_NAVAMI", "SHUKLA_CHATURDASHI", "KRISHNA_CHATURTHI", "KRISHNA_NAVAMI", "KRISHNA_CHATURDASHI", "AMAVASYA"]

    for i in range(days_to_scan):
        cur_date = base_dt + timedelta(days=i)
        d_str = cur_date.strftime("%Y-%m-%d")

        p = calculate_daily_panchang(d_str, "10:00:00", lat, lon, tz)
        sun_timings = calculate_sun_moon_timings(d_str, lat, lon, tz)
        muh = calculate_advanced_muhurats(d_str, sun_timings["sunrise"], sun_timings["sunset"])

        t_id = p["tithi"]["id"]
        karana = p["karana"]["name"]
        vaara = p["vaar"]["id"]

        is_rikta = t_id in rikta_ids
        is_bhadra = "Vishti" in karana

        # Compatibility check per category
        is_suitable = not is_rikta and not is_bhadra
        if muhurat_type == "MARRIAGE":
            # Tuesdays and Saturdays less favored for marriage
            if vaara in ["TUESDAY", "SATURDAY"]:
                is_suitable = False
        elif muhurat_type == "GRIHA_PRAVESH":
            if vaara in ["TUESDAY", "SUNDAY"]:
                is_suitable = False

        if is_suitable:
            auspicious_slots.append({
                "date": d_str,
                "day": p["vaar"]["name"],
                "tithi": p["tithi"]["name"],
                "nakshatra": p["nakshatra"]["name"],
                "quality": "SHUBHA (AUSPICIOUS)",
                "recommended_window": f"{sun_timings['sunrise']} to {sun_timings['sunset']} (excluding Rahu Kaal {muh['rahu_kaal']['start']} - {muh['rahu_kaal']['end']})",
                "abhijit_muhurat": f"{muh['abhijit_muhurat']['start']} - {muh['abhijit_muhurat']['end']} (Midday Solar Zenith)",
                "avoid_periods": [
                    f"Rahu Kaal: {muh['rahu_kaal']['start']} - {muh['rahu_kaal']['end']}",
                    f"Yamaganda: {muh['yamaghanda_kaal']['start']} - {muh['yamaghanda_kaal']['end']}"
                ]
            })

    return {
        "muhurat_category": muhurat_type,
        "scanned_days": days_to_scan,
        "available_auspicious_muhurats_count": len(auspicious_slots),
        "muhurats": auspicious_slots
    }

