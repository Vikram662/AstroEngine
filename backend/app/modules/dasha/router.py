from fastapi import APIRouter, Depends
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.core.swisseph import calculate_moon_longitude
from app.modules.dasha.calculator import (
    calculate_vimshottari_mahadasha,
    calculate_antardashas,
    calculate_pratyantar_dashas,
    calculate_sookshma_dashas,
    calculate_prana_dashas,
    get_running_dasha_tree,
    calculate_yogini_dasha,
    calculate_jaimini_char_dasha
)

router = APIRouter(prefix="/api/v1/dasha", tags=["Dasha Systems"])

def get_moon_longitude(dob: str, tob: str, tz: float) -> float:
    """Calculate Moon sidereal longitude for Dasha calculation."""
    return calculate_moon_longitude(dob, tob, tz)


@router.post("/vimshottari/mahadasha", response_model=StandardResponse)
async def get_mahadashas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 31: 120-Year Vimshottari Mahadasha full timeline."""
    selected_lang = (req.lang or "en").lower().strip()
    moon_lon = get_moon_longitude(req.dob, req.tob, req.tz)
    res = calculate_vimshottari_mahadasha(
        dob=req.dob,
        tob=req.tob,
        tz=req.tz,
        moon_lon=moon_lon,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=res)

@router.post("/vimshottari/current", response_model=StandardResponse)
async def get_current_dasha(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 36: Live running Vimshottari Dasha tree (MD > AD > PD)."""
    selected_lang = (req.lang or "en").lower().strip()
    moon_lon = get_moon_longitude(req.dob, req.tob, req.tz)
    res = get_running_dasha_tree(
        dob=req.dob,
        tob=req.tob,
        tz=req.tz,
        moon_lon=moon_lon,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=res)

@router.post("/vimshottari/antardasha", response_model=StandardResponse)
async def get_antardashas(
    req: BirthDataRequest,
    planet: str = "JUPITER",
    start_date: str = "2020-01-01",
    end_date: str = "2036-01-01",
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 32: Level 2 Antardasha breakdown for a selected Mahadasha."""
    selected_lang = (req.lang or "en").lower().strip()
    ad_list = calculate_antardashas(
        mahadasha_planet=planet.upper(),
        start_date_str=start_date,
        end_date_str=end_date,
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={"mahadasha": planet.upper(), "antardashas": ad_list}
    )

@router.post("/vimshottari/pratyantar", response_model=StandardResponse)
async def get_pratyantardashas(
    req: BirthDataRequest,
    mahadasha: str = "JUPITER",
    antardasha: str = "SATURN",
    start_date: str = "2024-01-01 00:00:00",
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 33: Level 3 Pratyantar Dasha breakdown with exact timestamps."""
    selected_lang = (req.lang or "en").lower().strip()
    pd_list = calculate_pratyantar_dashas(
        mahadasha_planet=mahadasha.upper(),
        antardasha_planet=antardasha.upper(),
        ad_start_str=start_date,
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "mahadasha": mahadasha.upper(),
            "antardasha": antardasha.upper(),
            "pratyantardashas": pd_list
        }
    )

@router.post("/vimshottari/sookshma", response_model=StandardResponse)
async def get_sookshmadashas(
    req: BirthDataRequest,
    mahadasha: str = "JUPITER",
    antardasha: str = "SATURN",
    pratyantar: str = "MERCURY",
    start_date: str = "2024-05-27 00:00:00",
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 34: Level 4 Sookshma Dasha sub-periods with exact start/end time."""
    selected_lang = (req.lang or "en").lower().strip()
    sd_list = calculate_sookshma_dashas(
        mahadasha_planet=mahadasha.upper(),
        antardasha_planet=antardasha.upper(),
        pratyantar_planet=pratyantar.upper(),
        pd_start_str=start_date,
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "level": "Level 4 Sookshma Dasha",
            "parent_chain": f"{mahadasha.upper()} > {antardasha.upper()} > {pratyantar.upper()}",
            "sookshmadashas": sd_list
        }
    )

@router.post("/vimshottari/prana", response_model=StandardResponse)
async def get_pranadashas(
    req: BirthDataRequest,
    mahadasha: str = "JUPITER",
    antardasha: str = "SATURN",
    pratyantar: str = "MERCURY",
    sookshma: str = "VENUS",
    start_date: str = "2024-06-15 00:00:00",
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 35: Level 5 Prana Dasha fine-grain event timing down to exact hour & minute."""
    selected_lang = (req.lang or "en").lower().strip()
    pr_list = calculate_prana_dashas(
        mahadasha_planet=mahadasha.upper(),
        antardasha_planet=antardasha.upper(),
        pratyantar_planet=pratyantar.upper(),
        sookshma_planet=sookshma.upper(),
        sd_start_str=start_date,
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "level": "Level 5 Prana Dasha",
            "parent_chain": f"{mahadasha.upper()} > {antardasha.upper()} > {pratyantar.upper()} > {sookshma.upper()}",
            "pranadashas": pr_list
        }
    )

from fastapi import HTTPException

@router.post("/yogini/complete", response_model=StandardResponse)
async def get_yogini_dasha(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 37: 36-year Yogini Dasha complete cycle (Mangala, Pingala, Dhanya, Bhramari, Bhadrika, Ulka, Siddha, Sankata)."""
    selected_lang = (req.lang or "en").lower().strip()
    moon_lon = get_moon_longitude(req.dob, req.tob, req.tz)
    data = calculate_yogini_dasha(req.dob, req.tob, req.tz, moon_lon)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/char/jaimini", response_model=StandardResponse)
async def get_jaimini_char_dasha(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 38: Jaimini Rashi-based Char Dasha timeline."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_jaimini_char_dasha(req.dob, req.tob, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

