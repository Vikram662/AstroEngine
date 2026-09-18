import swisseph as swe
import math
from typing import Dict, Any, List, Tuple
from app.core.swisseph import (
    calculate_julian_day,
    get_zodiac_sign_info,
    VEDIC_PLANETS
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

def generate_western_wheel_svg(planets: List[Dict[str, Any]]) -> str:
    """Generate dynamic Circular Western Natal Chart Wheel in clean SVG."""
    # 500x500 circular layout
    center_x, center_y = 250, 250
    outer_radius = 220
    inner_radius = 160

    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%" style="font-family:sans-serif; background:#0f172a; border-radius:50%;">',
        f'<circle cx="{center_x}" cy="{center_y}" r="{outer_radius}" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>',
        f'<circle cx="{center_x}" cy="{center_y}" r="{inner_radius}" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>',
    ]

    # Draw 12 30-degree sector lines
    for i in range(12):
        angle_rad = math.radians(i * 30.0)
        x1 = center_x + inner_radius * math.cos(angle_rad)
        y1 = center_y + inner_radius * math.sin(angle_rad)
        x2 = center_x + outer_radius * math.cos(angle_rad)
        y2 = center_y + outer_radius * math.sin(angle_rad)
        svg_parts.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#475569" stroke-width="1"/>')

    # Draw planets on the circle
    for p in planets:
        # Western wheel typically maps 0° Aries to 9 o'clock or standard math circle
        deg = p["full_degree"]
        rad = math.radians(-deg) # Counter-clockwise
        px = center_x + (inner_radius + 30) * math.cos(rad)
        py = center_y + (inner_radius + 30) * math.sin(rad)
        abbr = p["id"][:2].capitalize()
        svg_parts.append(f'<text x="{px:.1f}" y="{py:.1f}" text-anchor="middle" font-size="11" fill="#38bdf8" font-weight="bold">{abbr}</text>')

    svg_parts.append(f'<text x="{center_x}" y="{center_y}" text-anchor="middle" font-size="14" fill="#94a3b8" font-weight="bold">Western Wheel</text>')
    svg_parts.append('</svg>')
    return "".join(svg_parts)
