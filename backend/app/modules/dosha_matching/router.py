import swisseph as swe
from fastapi import APIRouter, Depends
from app.schemas.common import BirthDataRequest, StandardResponse
from app.schemas.matchmaking import MatchmakingRequest
from app.core.security import verify_api_key
from app.core.swisseph import calculate_julian_day
from app.modules.dosha_matching.calculator import (
    calculate_manglik_dosha,
    calculate_kaal_sarp_dosha,
    calculate_ashtakoot_guna_milan,
    calculate_sadesati_status,
    calculate_pitra_dosha,
    calculate_guru_chandal_dosha,
    calculate_matchmaking_exceptions,
    calculate_dashakoota_milan,
    calculate_papasmya_balance,
    calculate_sadesati_timeline
)

router = APIRouter(prefix="/api/v1/dosha-matching", tags=["Dosha Analysis & Matchmaking"])

@router.post("/manglik", response_model=StandardResponse)
async def get_manglik_analysis(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 8 — Endpoint 61:
    Manglik Dosha analysis from Lagna, Moon, Venus with 20+ classical cancellation checks.
    """
    selected_lang = (req.lang or "en").lower().strip()
    res = calculate_manglik_dosha(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=res)

@router.post("/kalsarpa", response_model=StandardResponse)
async def get_kalsarpa_analysis(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 8 — Endpoint 62:
    Kaal Sarp Dosha status across all 12 types (Anant, Kulik, Vasuki, etc.).
    """
    selected_lang = (req.lang or "en").lower().strip()
    res = calculate_kaal_sarp_dosha(
        dob=req.dob,
        tob=req.tob,
        tz=req.tz,
        lat=req.lat,
        lon=req.lon
    )
    return StandardResponse(status="success", language=selected_lang, data=res)

@router.post("/matchmaking/ashtakoot", response_model=StandardResponse)
async def get_matchmaking(
    req: MatchmakingRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 8 — Endpoint 67:
    Comprehensive 36 Guna Ashtakoot Milan for Bride and Groom with Nadi & Bhakoot evaluations.
    """
    selected_lang = (req.lang or "en").lower().strip()
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    # Groom Moon
    g_jd = calculate_julian_day(req.groom_dob, req.groom_tob, req.groom_tz)
    g_moon, _ = swe.calc_ut(g_jd, swe.MOON, flags)

    # Bride Moon
    b_jd = calculate_julian_day(req.bride_dob, req.bride_tob, req.bride_tz)
    b_moon, _ = swe.calc_ut(b_jd, swe.MOON, flags)

    milan_data = calculate_ashtakoot_guna_milan(
        groom_moon_deg=g_moon[0],
        bride_moon_deg=b_moon[0]
    )
    return StandardResponse(status="success", language=selected_lang, data=milan_data)

from fastapi import HTTPException

@router.post("/sade-sati/status", response_model=StandardResponse)
async def get_sadesati_status(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 8 — Endpoint 63: Real-time Saturn Sade Sati / Dhaiya phase check."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_sadesati_status(req.dob, req.tob, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/sade-sati/timeline", response_model=StandardResponse)
async def get_sadesati_timeline(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 8 — Endpoint 64: Lifetime Saturn Sade Sati cycles (Rising, Peak, Setting)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_sadesati_timeline(req.dob, req.tob, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/pitra-dosha", response_model=StandardResponse)
async def get_pitra_dosha(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 8 — Endpoint 65: Pitra Dosha analysis (Sun-Rahu conjunction, 9th house afflictions)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_pitra_dosha(req.dob, req.tob, req.tz, req.lat, req.lon)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/guru-chandal", response_model=StandardResponse)
async def get_guru_chandal_dosha(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 8 — Endpoint 66: Guru Chandal Dosha evaluation (Jupiter-Rahu conjunction / mutual aspect)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_guru_chandal_dosha(req.dob, req.tob, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/matchmaking/exceptions", response_model=StandardResponse)
async def get_matchmaking_exceptions(
    req: MatchmakingRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 8 — Endpoint 68: Nadi Dosha and Bhakoot Dosha cancellation exceptions."""
    selected_lang = (req.lang or "en").lower().strip()
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    # Groom Moon
    g_jd = calculate_julian_day(req.groom_dob, req.groom_tob, req.groom_tz)
    g_moon, _ = swe.calc_ut(g_jd, swe.MOON, flags)

    # Bride Moon
    b_jd = calculate_julian_day(req.bride_dob, req.bride_tob, req.bride_tz)
    b_moon, _ = swe.calc_ut(b_jd, swe.MOON, flags)

    exceptions_data = calculate_matchmaking_exceptions(
        groom_moon_deg=g_moon[0],
        bride_moon_deg=b_moon[0]
    )
    return StandardResponse(status="success", language=selected_lang, data=exceptions_data)

@router.post("/matchmaking/dashakoot", response_model=StandardResponse)
async def get_dashakoot_milan(
    req: MatchmakingRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 8 — Endpoint 69: South Indian 10-Porutham (Dashakoota) matching system."""
    selected_lang = (req.lang or "en").lower().strip()
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    # Groom Moon
    g_jd = calculate_julian_day(req.groom_dob, req.groom_tob, req.groom_tz)
    g_moon, _ = swe.calc_ut(g_jd, swe.MOON, flags)

    # Bride Moon
    b_jd = calculate_julian_day(req.bride_dob, req.bride_tob, req.bride_tz)
    b_moon, _ = swe.calc_ut(b_jd, swe.MOON, flags)

    dashakoot_data = calculate_dashakoota_milan(
        groom_moon_deg=g_moon[0],
        bride_moon_deg=b_moon[0]
    )
    return StandardResponse(status="success", language=selected_lang, data=dashakoot_data)

@router.post("/matchmaking/papasmya", response_model=StandardResponse)
async def get_papasmya_balance(
    req: MatchmakingRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 8 — Endpoint 70: Relative dosha / malefic point balance (Papasmya) between partners."""
    selected_lang = (req.lang or "en").lower().strip()
    papasmya_data = calculate_papasmya_balance(
        groom_dob=req.groom_dob,
        groom_tob=req.groom_tob,
        groom_tz=req.groom_tz,
        groom_lat=req.groom_lat,
        groom_lon=req.groom_lon,
        bride_dob=req.bride_dob,
        bride_tob=req.bride_tob,
        bride_tz=req.bride_tz,
        bride_lat=req.bride_lat,
        bride_lon=req.bride_lon
    )
    return StandardResponse(status="success", language=selected_lang, data=papasmya_data)

