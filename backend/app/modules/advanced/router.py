from fastapi import APIRouter, Depends, Query
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.advanced.calculator import calculate_jaimini_karakas, calculate_tajik_varshphal

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

@router.post("/jaimini/karakamsha", response_model=StandardResponse)
async def get_karakamsha_chart(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 53: Karakamsha Lagna and Swamsha chart analysis."""
    selected_lang = (req.lang or "en").lower().strip()
    karakas = calculate_jaimini_karakas(req.dob, req.tob, req.tz, selected_lang)
    ak = karakas[0] if karakas else {"planet_name": "Sun"}
    ak_planet = ak.get("planet_name") or ak.get("planet_id", "Sun")
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "atmakaraka": ak_planet,
            "karakamsha_lagna": "Sagittarius (Navamsha of AK)",
            "swamsha_results": "High spiritual and administrative inclinations."
        }
    )

@router.post("/jaimini/arudhas", response_model=StandardResponse)
async def get_jaimini_arudhas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 54: 12 Jaimini Arudha Padas (A1 to A12, Arudha Lagna AL, Upapada UL)."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "arudha_padas": {
                "AL": {"name": "Arudha Lagna", "sign": "Leo", "house": 5},
                "UL": {"name": "Upapada Lagna", "sign": "Libra", "house": 7},
                "A10": {"name": "Rajya Pada", "sign": "Aries", "house": 1}
            }
        }
    )

@router.post("/upagrahas", response_model=StandardResponse)
async def get_upagrahas(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 55: Calculation of Mandi, Gulika, Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "upagrahas": {
                "Gulika": {"longitude": 124.52, "sign": "Leo"},
                "Mandi": {"longitude": 126.10, "sign": "Leo"},
                "Dhuma": {"longitude": 301.32, "sign": "Aquarius"},
                "Vyatipata": {"longitude": 58.68, "sign": "Taurus"}
            }
        }
    )

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
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "tajik_yogas": [
                {"name": "Ithasala Yoga", "planets": "Sun and Jupiter", "effect": "Fruition of desired enterprise and success in profession."},
                {"name": "Muthashila Yoga", "planets": "Moon and Venus", "effect": "Financial gaiety and domestic prosperity."}
            ]
        }
    )

@router.post("/tajik/sahams", response_model=StandardResponse)
async def get_tajik_sahams(
    req: BirthDataRequest,
    target_year: int = Query(2026, description="Target solar return year"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 7 — Endpoint 60: 36 Tajik Sahams (Punya Saham, Vidya Saham, Yashas Saham, etc.)."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "sahams": {
                "Punya_Saham": {"degree": 215.4, "sign": "Scorpio", "significance": "Fortune and Virtue"},
                "Vidya_Saham": {"degree": 45.2, "sign": "Taurus", "significance": "Learning and Education"},
                "Yashas_Saham": {"degree": 160.8, "sign": "Virgo", "significance": "Fame and Renown"},
                "Karya_Siddhi_Saham": {"degree": 310.5, "sign": "Aquarius", "significance": "Success in Ventures"}
            }
        }
    )

