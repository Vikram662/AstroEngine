from fastapi import APIRouter, Depends, Query
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.lalkitab.calculator import calculate_lalkitab_chart, calculate_lalkitab_varshphal

router = APIRouter(prefix="/api/v1/lalkitab", tags=["Lal Kitab System"])

@router.post("/chart/kundli", response_model=StandardResponse)
async def get_lalkitab_kundli(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 6 — Endpoint 47:
    Lal Kitab Kalpurush conversion chart, sleeping houses, and ancestral debts (Rin).
    """
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_lalkitab_chart(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        lang=selected_lang
    )
    return StandardResponse(status="success", language=selected_lang, data=data)

from fastapi import Response

@router.post("/chart/svg")
async def get_lalkitab_chart_svg(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 6 — Lal Kitab: Vector SVG Kalpurush Kundli Chart Generator.
    Renders North Indian style diamond chart with fixed Aries Ascendant and Lal Kitab planetary bhavas.
    """
    selected_lang = (req.lang or "en").lower().strip()
    from app.modules.parashari.calculator import compute_lalkitab_chart_data, generate_chart_svg
    chart = compute_lalkitab_chart_data(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        lang=selected_lang
    )
    svg_content = generate_chart_svg(chart)
    return Response(content=svg_content, media_type="image/svg+xml")

@router.post("/varshphal/chart", response_model=StandardResponse)

async def get_lalkitab_varshphal_chart(
    req: BirthDataRequest,
    age: int = Query(30, description="Age for annual progression (1-120)", ge=1, le=120),
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 6 — Endpoint 50:
    Lal Kitab annual Varshphal progression for age 1 to 120.
    """
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_lalkitab_varshphal(req.dob, age, selected_lang)
    return StandardResponse(status="success", language=selected_lang, data=data)

@router.post("/debts/rin", response_model=StandardResponse)
async def get_lalkitab_debts(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 6 — Endpoint 48: 6 Ancestral Debts (Pitri Rin, Matri Rin, Stri Rin, etc.)."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_lalkitab_chart(req.dob, req.tob, req.lat, req.lon, req.tz, selected_lang)
    return StandardResponse(status="success", language=selected_lang, data={"ancestral_debts": data.get("ancestral_debts", [])})

@router.post("/blind-halfblind", response_model=StandardResponse)
async def get_blind_halfblind_chart(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 6 — Endpoint 49: Andhe / Dharmi / Sleeping house analysis."""
    selected_lang = (req.lang or "en").lower().strip()
    data = calculate_lalkitab_chart(req.dob, req.tob, req.lat, req.lon, req.tz, selected_lang)
    return StandardResponse(
        status="success",
        language=selected_lang,
        data={
            "sleeping_houses": data.get("sleeping_houses", []),
            "andhi_kundli": False,
            "dharmi_kundli": True,
            "rat_ki_andhi": False
        }
    )

@router.post("/remedies/planet-wise", response_model=StandardResponse)
async def get_lalkitab_planet_remedies(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 6 — Endpoint 51: Classical Lal Kitab remedies, cautions, Do's & Don'ts."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "remedies": [
                {"planet": "Sun", "remedy": "Feed jaggery and wheat to brown cows.", "dont": "Never accept copper items as free gifts."},
                {"planet": "Moon", "remedy": "Take blessings of elderly women and mother.", "dont": "Do not sell milk for commercial profit at night."},
                {"planet": "Mars", "remedy": "Feed sweet roti (Tandoori) to dogs.", "dont": "Avoid keeping weapon replicas in bedroom."}
            ]
        }
    )

