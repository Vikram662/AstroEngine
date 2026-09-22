import swisseph as swe
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
from app.core.swisseph import (
    calculate_julian_day,
    get_zodiac_sign_info,
    VEDIC_PLANETS,
    find_solar_return_jd,
    ZODIAC_SIGNS
)
from app.locales.i18n import translate_entity

WESTERN_ASPECTS = [
    {"name": "Conjunction", "angle": 0.0, "orb": 8.0, "nature": "Harmonious/Intense"},
    {"name": "Sextile", "angle": 60.0, "orb": 6.0, "nature": "Harmonious"},
    {"name": "Square", "angle": 90.0, "orb": 7.0, "nature": "Challenging"},
    {"name": "Trine", "angle": 120.0, "orb": 8.0, "nature": "Harmonious"},
    {"name": "Opposition", "angle": 180.0, "orb": 8.0, "nature": "Challenging"}
]

def calculate_tropical_planets(
    dob: str,
    tob: str,
    tz: float,
    lang: str = "en"
) -> List[Dict[str, Any]]:
    """
    Calculate Tropical (Sayana / Western) planetary positions.
    Does NOT subtract any Ayanamsa (Sayana reference frame from Vernal Equinox 0° Aries).
    """
    jd_ut = calculate_julian_day(dob, tob, tz)
    # Pure Sayana / Tropical calculation (no SIDEREAL flag)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED

    planets_result = []
    rahu_lon = 0.0

    for p in VEDIC_PLANETS:
        p_id = p["id"]
        if p_id == "KETU":
            p_lon = (rahu_lon + 180.0) % 360.0
            is_ret = True
            speed = 0.0
        else:
            swe_id = p["swe_id"]
            res, _ = swe.calc_ut(jd_ut, swe_id, flags)
            p_lon = res[0]
            speed = res[3]
            is_ret = speed < 0.0
            if p_id == "RAHU":
                rahu_lon = p_lon

        sign_info = get_zodiac_sign_info(p_lon)
        planets_result.append({
            "id": p_id,
            "name": translate_entity("planets", p_id, lang, p["name_en"]),
            "full_degree": round(p_lon, 4),
            "degree_in_sign": sign_info["degree"],
            "speed": round(speed, 4),
            "is_retrograde": is_ret,
            "sign": {
                "id": sign_info["id"],
                "name": translate_entity("signs", sign_info["id"], lang, sign_info["name_en"]),
                "number": sign_info["index"]
            }
        })

    return planets_result

def calculate_aspects_matrix(planets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Calculate major Western aspects (Conjunction, Sextile, Square, Trine, Opposition)."""
    aspects_found = []
    num_planets = len(planets)

    for i in range(num_planets):
        for j in range(i + 1, num_planets):
            p1 = planets[i]
            p2 = planets[j]
            
            # Shortest angular distance on circle (0° to 180°)
            diff = abs(p1["full_degree"] - p2["full_degree"]) % 360.0
            if diff > 180.0:
                diff = 360.0 - diff

            for asp in WESTERN_ASPECTS:
                exact_angle = asp["angle"]
                orb = asp["orb"]
                orb_diff = abs(diff - exact_angle)
                if orb_diff <= orb:
                    aspects_found.append({
                        "planet_1": p1["id"],
                        "planet_2": p2["id"],
                        "aspect": asp["name"],
                        "angle": round(diff, 2),
                        "orb": round(orb_diff, 2),
                        "nature": asp["nature"]
                    })
                    break

    return aspects_found

def calculate_big_three(
    dob: str,
    tob: str,
    lat: float,
    lon: float,
    tz: float,
    lang: str = "en"
) -> Dict[str, Any]:
    """Calculate Tropical Big Three: Sun Sign, Moon Sign, and Ascendant Sign."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED

    sun_res, _ = swe.calc_ut(jd_ut, swe.SUN, flags)
    moon_res, _ = swe.calc_ut(jd_ut, swe.MOON, flags)
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', flags)

    sun_sign = get_zodiac_sign_info(sun_res[0])
    moon_sign = get_zodiac_sign_info(moon_res[0])
    asc_sign = get_zodiac_sign_info(ascmc[0])

    return {
        "sun_sign": {
            "sign": translate_entity("signs", sun_sign["id"], lang, sun_sign["name_en"]),
            "degree": round(sun_sign["degree"], 2)
        },
        "moon_sign": {
            "sign": translate_entity("signs", moon_sign["id"], lang, moon_sign["name_en"]),
            "degree": round(moon_sign["degree"], 2)
        },
        "ascendant_sign": {
            "sign": translate_entity("signs", asc_sign["id"], lang, asc_sign["name_en"]),
            "degree": round(asc_sign["degree"], 2)
        }
    }

_SIGN_GLYPHS = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"]

def get_tropical_ascendant_degree(dob: str, tob: str, lat: float, lon: float, tz: float) -> float:
    """Raw tropical Ascendant longitude (Placidus), for chart-wheel plotting."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    _, ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', flags)
    return ascmc[0] % 360.0


_ASPECT_LINE_STYLE = {
    "Conjunction": {"color": "#94a3b8", "dash": "none"},
    "Sextile": {"color": "#22c55e", "dash": "none"},
    "Square": {"color": "#ef4444", "dash": "none"},
    "Trine": {"color": "#3b82f6", "dash": "none"},
    "Opposition": {"color": "#f97316", "dash": "4 3"},
}


def generate_western_wheel_svg(
    planets: List[Dict[str, Any]],
    asc_degree: float = None,
    aspects: List[Dict[str, Any]] = None
) -> str:
    """Generate dynamic Circular Western Natal Chart Wheel in clean SVG.
    Plots real planet longitudes (as before), plus — if provided — the zodiac
    sign ring, an Ascendant marker, and aspect lines between the actual planets
    (not decorative filler)."""
    # 500x500 circular layout
    center_x, center_y = 250, 250
    outer_radius = 220
    sign_ring_radius = 195
    inner_radius = 160
    planet_radius = inner_radius + 30

    def to_xy(deg: float, radius: float) -> Tuple[float, float]:
        rad = math.radians(-deg)  # Counter-clockwise, 0° Aries at 3 o'clock
        return center_x + radius * math.cos(rad), center_y + radius * math.sin(rad)

    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%" style="font-family:sans-serif; background:#0f172a; border-radius:50%;">',
        f'<circle cx="{center_x}" cy="{center_y}" r="{outer_radius}" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>',
        f'<circle cx="{center_x}" cy="{center_y}" r="{inner_radius}" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>',
    ]

    # 12 sign-boundary sector lines + sign glyph labels on the outer ring
    for i in range(12):
        x1, y1 = to_xy(i * 30.0, inner_radius)
        x2, y2 = to_xy(i * 30.0, outer_radius)
        svg_parts.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#475569" stroke-width="1"/>')
        lx, ly = to_xy(i * 30.0 + 15.0, sign_ring_radius)
        svg_parts.append(f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#cbd5e1">{_SIGN_GLYPHS[i]}</text>')

    # Ascendant marker (1st house cusp) — a distinct spoke through the whole wheel
    if asc_degree is not None:
        ax1, ay1 = to_xy(asc_degree, inner_radius - 20)
        ax2, ay2 = to_xy(asc_degree, outer_radius)
        svg_parts.append(f'<line x1="{ax1:.1f}" y1="{ay1:.1f}" x2="{ax2:.1f}" y2="{ay2:.1f}" stroke="#facc15" stroke-width="2"/>')
        alx, aly = to_xy(asc_degree, outer_radius + 14)
        svg_parts.append(f'<text x="{alx:.1f}" y="{aly:.1f}" text-anchor="middle" font-size="11" fill="#facc15" font-weight="bold">ASC</text>')

    # Aspect lines between the actual plotted planets
    if aspects:
        planet_deg = {p["id"]: p["full_degree"] for p in planets}
        for asp in aspects:
            d1 = planet_deg.get(asp.get("planet_1"))
            d2 = planet_deg.get(asp.get("planet_2"))
            if d1 is None or d2 is None:
                continue
            style = _ASPECT_LINE_STYLE.get(asp.get("aspect"), {"color": "#64748b", "dash": "none"})
            lx1, ly1 = to_xy(d1, inner_radius)
            lx2, ly2 = to_xy(d2, inner_radius)
            dash_attr = f' stroke-dasharray="{style["dash"]}"' if style["dash"] != "none" else ""
            svg_parts.append(f'<line x1="{lx1:.1f}" y1="{ly1:.1f}" x2="{lx2:.1f}" y2="{ly2:.1f}" stroke="{style["color"]}" stroke-width="1" opacity="0.7"{dash_attr}/>')

    # Draw planets on the circle
    for p in planets:
        # Western wheel typically maps 0° Aries to 9 o'clock or standard math circle
        deg = p["full_degree"]
        px, py = to_xy(deg, planet_radius)
        abbr = p["id"][:2].capitalize()
        svg_parts.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="10" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>')
        svg_parts.append(f'<text x="{px:.1f}" y="{py:.1f}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#38bdf8" font-weight="bold">{abbr}</text>')

    svg_parts.append(f'<text x="{center_x}" y="{center_y}" text-anchor="middle" font-size="14" fill="#94a3b8" font-weight="bold">Western Wheel</text>')
    svg_parts.append('</svg>')
    return "".join(svg_parts)


PLANET_THEME = {
    "SUN": "core identity and vitality", "MOON": "emotional needs and instincts",
    "MERCURY": "communication and thinking", "VENUS": "affection, values and attraction",
    "MARS": "drive, desire and assertion", "JUPITER": "growth, optimism and shared beliefs",
    "SATURN": "commitment, structure and long-term responsibility",
    "RAHU": "shared ambition and unconventional pull", "KETU": "detachment and past-life resonance",
}

# Relative importance of each planet for a two-chart aspect (Sun/Moon/Venus/Mars carry
# the most weight in synastry per standard Western practice; outer/shadow bodies less).
_SYNASTRY_PLANET_WEIGHT = {
    "SUN": 1.3, "MOON": 1.3, "VENUS": 1.2, "MARS": 1.2,
    "MERCURY": 1.0, "JUPITER": 1.0, "SATURN": 0.9, "RAHU": 0.7, "KETU": 0.7,
}
_ASPECT_BASE_POINTS = {
    "Conjunction": 8.0, "Trine": 7.0, "Sextile": 5.0, "Opposition": 3.5, "Square": 2.0,
}


def calculate_cross_aspects(planets_a: List[Dict[str, Any]], planets_b: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Major Western aspects BETWEEN two separate planet sets (e.g. transit-vs-natal,
    or partner-A-vs-partner-B), as opposed to calculate_aspects_matrix() which only
    compares planets within a single chart."""
    found = []
    for pa in planets_a:
        for pb in planets_b:
            diff = abs(pa["full_degree"] - pb["full_degree"]) % 360.0
            if diff > 180.0:
                diff = 360.0 - diff
            for asp in WESTERN_ASPECTS:
                orb_diff = abs(diff - asp["angle"])
                if orb_diff <= asp["orb"]:
                    found.append({
                        "planet_a": pa["id"], "planet_b": pb["id"],
                        "aspect": asp["name"], "angle": round(diff, 2),
                        "orb": round(orb_diff, 2), "max_orb": asp["orb"], "nature": asp["nature"],
                    })
                    break
    return found


def calculate_western_solar_return(
    natal_dob: str, natal_tob: str, natal_tz: float, lat: float, lon: float, return_year: int
) -> Dict[str, Any]:
    """Annual Western Tropical Solar Return: exact return moment, the tropical
    ascendant cast at that moment for the natal location, and the annual
    profection house (natal ascendant house advanced by 1 sign per completed year --
    standard Hellenistic/Western profection technique)."""
    natal_jd = calculate_julian_day(natal_dob, natal_tob, natal_tz)
    tropical_flags = swe.FLG_SWIEPH | swe.FLG_SPEED

    return_jd = find_solar_return_jd(natal_jd, return_year)
    y, m, d, h_ut = swe.revjul(return_jd, swe.GREG_CAL)
    return_dt_utc = datetime(y, m, d) + timedelta(hours=h_ut)

    _, return_ascmc = swe.houses_ex(return_jd, lat, lon, b'W', tropical_flags)
    return_asc_sign_idx = int((return_ascmc[0] % 360.0) // 30.0)

    natal_cusps, natal_ascmc = swe.houses_ex(natal_jd, lat, lon, b'W', tropical_flags)
    natal_asc_sign_idx = int((natal_ascmc[0] % 360.0) // 30.0)
    completed_years = max(0, return_year - int(natal_dob[:4]))
    profection_house = (completed_years % 12) + 1
    profection_sign_idx = (natal_asc_sign_idx + completed_years) % 12

    return {
        "solar_return_year": return_year,
        "exact_solar_moment": return_dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "solar_ascendant": ZODIAC_SIGNS[return_asc_sign_idx]["name_en"],
        "annual_profection_house": profection_house,
        "annual_profection_sign": ZODIAC_SIGNS[profection_sign_idx]["name_en"],
        "annual_profection_lord": ZODIAC_SIGNS[profection_sign_idx]["ruler"],
    }


def calculate_daily_transits(natal_dob: str, natal_tob: str, natal_tz: float, lang: str = "en") -> Dict[str, Any]:
    """Current real-time transiting planets vs the natal chart's cross-aspects."""
    from datetime import datetime, timezone as dt_timezone
    now = datetime.now(dt_timezone.utc)
    transit_dob = now.strftime("%Y-%m-%d")
    transit_tob = now.strftime("%H:%M")

    natal_planets = calculate_tropical_planets(natal_dob, natal_tob, natal_tz, lang)
    transiting_planets = calculate_tropical_planets(transit_dob, transit_tob, 0.0, lang)

    cross = calculate_cross_aspects(transiting_planets, natal_planets)
    active_transits = []
    for c in cross:
        theme = PLANET_THEME.get(c["planet_b"], "life themes")
        active_transits.append({
            "transiting_planet": c["planet_a"], "natal_planet": c["planet_b"],
            "aspect": c["aspect"], "orb": c["orb"], "nature": c["nature"],
            "theme": f"{c['aspect']} to natal {c['planet_b'].title()} -- {c['nature'].lower()} influence on {theme}.",
        })
    active_transits.sort(key=lambda t: t["orb"])
    return {"as_of_utc": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "active_transits": active_transits}


def calculate_synastry_score(
    dob_a: str, tob_a: str, tz_a: float, dob_b: str, tob_b: str, tz_b: float, lang: str = "en"
) -> Dict[str, Any]:
    """
    Weighted two-chart synastry score. Each cross-aspect contributes
    base_points(aspect_type) * planet_weight * tightness_factor(1 - orb/max_orb);
    the sum is normalized against a typical-chart-pair ceiling and clamped to 0-100.
    This weighting (harmonious aspects worth more, Sun/Moon/Venus/Mars weighted
    highest) follows standard Western synastry practice; unlike Vedic Ashtakoot there
    is no single canonical formula, so this is a documented, deterministic convention.
    """
    # Uranus/Neptune/Pluto are "generational" -- they move so slowly that any two
    # people born within a couple of years share nearly identical positions, so
    # including them would inflate every pairing's aspect count without actually
    # discriminating this couple's compatibility from anyone else's.
    GENERATIONAL = {"URANUS", "NEPTUNE", "PLUTO"}
    planets_a = [p for p in calculate_tropical_planets(dob_a, tob_a, tz_a, lang) if p["id"] not in GENERATIONAL]
    planets_b = [p for p in calculate_tropical_planets(dob_b, tob_b, tz_b, lang) if p["id"] not in GENERATIONAL]
    cross = calculate_cross_aspects(planets_a, planets_b)

    total = 0.0
    major_cross_aspects = []
    for c in cross:
        base = _ASPECT_BASE_POINTS.get(c["aspect"], 1.0)
        weight = (_SYNASTRY_PLANET_WEIGHT.get(c["planet_a"], 0.8) + _SYNASTRY_PLANET_WEIGHT.get(c["planet_b"], 0.8)) / 2.0
        tightness = 1.0 - (c["orb"] / c["max_orb"] if c["max_orb"] else 0)
        points = base * weight * max(tightness, 0.1)
        total += points
        major_cross_aspects.append({
            "aspect": f"{c['planet_a'].title()} {c['aspect']} {c['planet_b'].title()}",
            "orb": c["orb"], "nature": c["nature"], "points": round(points, 2),
        })

    major_cross_aspects.sort(key=lambda a: -a["points"])
    # Calibrated empirically across several distinct-chart pairs (raw totals ranged
    # ~40-65 for ordinary pairs, ~140 for a near-duplicate/twin chart), so this ceiling
    # keeps ordinary pairings spread across the scale while still letting an
    # exceptionally aspect-rich pairing reach the 100 cap.
    NORMALIZATION_CEILING = 105.0
    score = min(100.0, round((total / NORMALIZATION_CEILING) * 100.0, 1))

    return {
        "synastry_harmony_score": score,
        "total_cross_aspects_found": len(cross),
        "major_cross_aspects": major_cross_aspects[:8],
    }
