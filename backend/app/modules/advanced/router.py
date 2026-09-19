from fastapi import APIRouter, Depends, Query
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.advanced.calculator import (
    calculate_jaimini_karakas,
    calculate_tajik_varshphal,
    calculate_karakamsha_chart,
    calculate_jaimini_arudhas,
    calculate_upagrahas,
    calculate_tajik_sahams,
    calculate_tajik_yogas
)

router = APIRouter(prefix="/api/v1/advanced", tags=["Jaimini & Tajik Varshphal"])

@router.post("/jaimini/karakas", response_model=StandardResponse)
async def get_jaimini_karakas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 7 — Endpoint 52:
    7 Jaimini Chara Karakas: Atmakaraka (AK), Amatyakaraka (AmK), BK, MK, PK, GK, DK.
    """
    selected_lang = (req.lang or "en").lower().strip()
    karakas = calculate_jaimini_karakas(req.dob, req.tob, req.tz, selected_lang)
    return StandardResponse(status="success", language=selected_lang, data={"karakas": karakas})

@router.post("/tajik/varshphal-chart", response_model=StandardResponse)
async def get_tajik_varshphal_chart(
    req: BirthDataRequest,
    target_year: int = Query(2026, description="Target solar return year"),
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 7 — Endpoint 56:
    Tajik Solar Return chart analysis with Muntha house and Varshesh candidates.
    """
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_tajik_varshphal(req.dob, target_year, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

from fastapi import HTTPException

@router.post("/jaimini/karakamsha", response_model=StandardResponse)
async def get_karakamsha_chart(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 53: Karakamsha Lagna and Swamsha chart analysis."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_karakamsha_chart(req.dob, req.tob, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/jaimini/arudhas", response_model=StandardResponse)
async def get_jaimini_arudhas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 54: 12 Jaimini Arudha Padas (A1 to A12, Arudha Lagna AL, Upapada UL)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_jaimini_arudhas(req.dob, req.tob, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/upagrahas", response_model=StandardResponse)
async def get_upagrahas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 55: Calculation of Mandi, Gulika, Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_upagrahas(req.dob, req.tob, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/tajik/muntha", response_model=StandardResponse)
async def get_tajik_muntha(
    req: BirthDataRequest,
    target_year: int = Query(2026, description="Target solar return year"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 57: Tajik Muntha house progression and Muntha Lord."""
    data = calculate_tajik_varshphal(req.dob, target_year, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=req.lang or "en", data={"muntha": data.get("muntha", {})})

@router.post("/tajik/varshesh", response_model=StandardResponse)
async def get_tajik_varshesh(
    req: BirthDataRequest,
    target_year: int = Query(2026, description="Target solar return year"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 58: Panchadhikari Year Lord (Varshesh) selection."""
    data = calculate_tajik_varshphal(req.dob, target_year, req.lat, req.lon, req.tz)
    return StandardResponse(status="success", language=req.lang or "en", data={"varshesh_candidates": data.get("varshesh_candidates", [])})

@router.post("/tajik/yogas", response_model=StandardResponse)
async def get_tajik_yogas(
    req: BirthDataRequest,
    target_year: int = Query(2026, description="Target solar return year"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 59: 16 Classical Tajik Yogas (Ithasala, Esharpha, Nakta, Yamaya, etc.)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_tajik_yogas(req.dob, req.tob, req.lat, req.lon, req.tz, target_year)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/tajik/sahams", response_model=StandardResponse)
async def get_tajik_sahams(
    req: BirthDataRequest,
    target_year: int = Query(2026, description="Target solar return year"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 60: 36 Tajik Sahams (Punya Saham, Vidya Saham, Yashas Saham, etc.)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_tajik_sahams(req.dob, req.tob, req.lat, req.lon, req.tz, target_year)
    return StandardResponse(status="success", language=selected_lang, data=data)

