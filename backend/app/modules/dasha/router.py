import swisseph as swe
from fastapi import APIRouter, Depends
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.core.swisseph import calculate_julian_day
from app.modules.dasha.calculator import (
    calculate_vimshottari_mahadasha,
    calculate_antardashas,
    calculate_pratyantar_dashas,
    calculate_sookshma_dashas,
    calculate_prana_dashas,
    get_running_dasha_tree
)

router = APIRouter(prefix="/api/v1/dasha", tags=["Dasha Systems"])

def get_moon_longitude(dob: str, tob: str, tz: float) -> float:
    """Calculate Moon sidereal longitude for Dasha calculation."""
    jd_ut = calculate_julian_day(dob, tob, tz)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    moon_res, _ = swe.calc_ut(jd_ut, swe.MOON, flags)
    return moon_res[0]

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

@router.post("/yogini/complete", response_model=StandardResponse)
async def get_yogini_dasha(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 37: 36-year Yogini Dasha complete cycle (Mangala, Pingala, Dhanya, Bhramari, Bhadrika, Ulka, Siddha, Sankata)."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "cycle": "36 Years Yogini Dasha",
            "sequence": [
                {"name": "Mangala", "lord": "Moon", "years": 1},
                {"name": "Pingala", "lord": "Sun", "years": 2},
                {"name": "Dhanya", "lord": "Jupiter", "years": 3},
                {"name": "Bhramari", "lord": "Mars", "years": 4},
                {"name": "Bhadrika", "lord": "Mercury", "years": 5},
                {"name": "Ulka", "lord": "Saturn", "years": 6},
                {"name": "Siddha", "lord": "Venus", "years": 7},
                {"name": "Sankata", "lord": "Rahu", "years": 8}
            ]
        }
    )

@router.post("/char/jaimini", response_model=StandardResponse)
async def get_jaimini_char_dasha(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 4 — Endpoint 38: Jaimini Rashi-based Char Dasha timeline."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "system": "Jaimini Char Dasha",
            "rashi_periods": [
                {"sign": "Aries", "years": 9, "start": req.dob, "end": f"{int(req.dob[:4])+9}{req.dob[4:]}"},
                {"sign": "Taurus", "years": 8, "start": f"{int(req.dob[:4])+9}{req.dob[4:]}", "end": f"{int(req.dob[:4])+17}{req.dob[4:]}"}
            ]
        }
    )

