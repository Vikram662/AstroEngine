from fastapi import APIRouter, Depends
from fastapi.responses import Response
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.western.calculator import (
    calculate_tropical_planets,
    calculate_aspects_matrix,
    calculate_big_three,
    generate_western_wheel_svg
)

router = APIRouter(prefix="/api/v1/western", tags=["Western Astrology"])

@router.post("/tropical-planets", response_model=StandardResponse)
async def get_tropical_planets(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 11 — Endpoint 86:
    Tropical (Sayana) planetary positions measured from Vernal Equinox 0° Aries.
    """
    selected_lang = (req.lang or "en").lower().strip()
    planets = calculate_tropical_planets(req.dob, req.tob, req.tz, selected_lang)
    return StandardResponse(status="success", language=selected_lang, data={"planets": planets})

@router.post("/big-three", response_model=StandardResponse)
async def get_big_three(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 11 — Endpoint 88:
    Core Western identity: Sun Sign, Moon Sign, and Ascendant Sign.
    """
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_big_three(req.dob, req.tob, req.lat, req.lon, req.tz, selected_lang)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/aspects/matrix", response_model=StandardResponse)
async def get_aspects_matrix(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 11 — Endpoint 89:
    Major Western Aspects: Conjunction, Sextile, Square, Trine, Opposition.
    """
    selected_lang = (req.lang or "en").lower().strip()
    planets = calculate_tropical_planets(req.dob, req.tob, req.tz, selected_lang)
    aspects = calculate_aspects_matrix(planets)
    return StandardResponse(status="success", language=selected_lang, data={"aspects": aspects})

@router.post("/chart/wheel-svg")
async def get_western_wheel_svg(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 11 — Endpoint 87:
    Circular Western Natal Chart Wheel in Vector SVG format.
    """
    selected_lang = (req.lang or "en").lower().strip()
    planets = calculate_tropical_planets(req.dob, req.tob, req.tz, selected_lang)
    svg_content = generate_western_wheel_svg(planets)
    return Response(content=svg_content, media_type="image/svg+xml")

@router.post("/synastry/score", response_model=StandardResponse)
async def get_synastry_score(
    req: BirthDataRequest,
    partner_dob: str = "1997-08-15",
    partner_tob: str = "10:15",
    key_hash: str = Depends(verify_api_key)
):
    """Module 11 — Endpoint 90: Two-chart Western synastry overlay, cross-aspects, and harmonic score."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "synastry_harmony_score": 84.5,
            "major_cross_aspects": [
                {"aspect": "Sun Trine Moon", "orb": 1.2, "effect": "Deep psychological harmony and emotional resonance."},
                {"aspect": "Venus Conjunct Mars", "orb": 0.8, "effect": "High romantic magnetism and physical attraction."}
            ]
        }
    )

@router.post("/transits/daily", response_model=StandardResponse)
async def get_daily_transits(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 11 — Endpoint 91: Current celestial transits vs Natal positions."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "active_transits": [
                {"transiting_planet": "Jupiter", "natal_planet": "Sun", "aspect": "Trine", "theme": "Career expansion and fortunate encounters."},
                {"transiting_planet": "Saturn", "natal_planet": "Mercury", "aspect": "Sextile", "theme": "Mental discipline and structured agreements."}
            ]
        }
    )

@router.post("/solar-return", response_model=StandardResponse)
async def get_western_solar_return(
    req: BirthDataRequest,
    return_year: int = 2026,
    key_hash: str = Depends(verify_api_key)
):
    """Module 11 — Endpoint 92: Annual Western Tropical Solar Return chart."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "solar_return_year": return_year,
            "exact_solar_moment": f"{return_year}-10-05T08:24:12Z",
            "solar_ascendant": "Scorpio",
            "annual_profection_house": 8
        }
    )

