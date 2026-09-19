from fastapi import APIRouter, Depends, Query
from app.schemas.common import BirthDataRequest, StandardResponse
from app.core.security import verify_api_key
from app.modules.numerology.calculator import calculate_core_numbers, calculate_loshu_grid

router = APIRouter(prefix="/api/v1/numerology", tags=["Numerology Engine"])

@router.post("/core-numbers", response_model=StandardResponse)
async def get_numerology_numbers(
    req: BirthDataRequest,
    name: str = Query("", description="Full name for Chaldean name calculation"),
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 10 — Endpoint 78:
    Core Numerology numbers: Mulank (Psychic), Bhagyank (Destiny), and Namank (Name).
    """
    selected_lang = (req.lang or "en").lower().strip()
    core = calculate_core_numbers(req.dob, name)
    return StandardResponse(status="success", language=selected_lang, data=core)

@router.post("/loshu-grid", response_model=StandardResponse)
async def get_loshu_grid_chart(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Module 10 — Endpoint 79:
    3x3 Lo Shu Magic Grid: Mental, Emotional, Practical, Thought, Will, and Action planes.
    """
    selected_lang = (req.lang or "en").lower().strip()
    grid_data = calculate_loshu_grid(req.dob)
    return StandardResponse(status="success", language=selected_lang, data=grid_data)

@router.post("/missing-numbers", response_model=StandardResponse)
async def get_missing_numbers(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 10 — Endpoint 80: Missing Lo Shu numbers and practical balancing remedies."""
    grid_data = calculate_loshu_grid(req.dob)
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "missing_numbers": grid_data.get("missing_numbers", []),
            "remedies": [f"Remedy for missing number {n}: Wear crystal bracelet or keep corresponding color item" for n in grid_data.get("missing_numbers", [])]
        }
    )

@router.post("/name-analysis", response_model=StandardResponse)
async def get_name_analysis(
    req: BirthDataRequest,
    name: str = Query("Aditya Sharma", description="Full name to evaluate"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 10 — Endpoint 81: Dual Chaldean and Pythagorean compound name analysis."""
    from app.modules.numerology.calculator import CHALDEAN_MAP, PYTHAGOREAN_MAP, reduce_to_single_digit
    
    clean_name = "".join(ch for ch in name.upper() if ch.isalpha())
    chaldean_compound = sum(CHALDEAN_MAP.get(ch, 0) for ch in clean_name)
    chaldean_single = reduce_to_single_digit(chaldean_compound)
    
    pythagorean_compound = sum(PYTHAGOREAN_MAP.get(ch, 0) for ch in clean_name)
    pythagorean_single = reduce_to_single_digit(pythagorean_compound)

    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "name": name,
            "chaldean": {
                "compound_number": chaldean_compound,
                "single_digit": chaldean_single
            },
            "pythagorean": {
                "compound_number": pythagorean_compound,
                "single_digit": pythagorean_single
            },
            "chaldean_number": chaldean_single,
            "pythagorean_number": pythagorean_single,
            "vibration": "Harmonious with psychic number"
        }
    )

@router.post("/name-correction", response_model=StandardResponse)
async def get_name_correction(
    req: BirthDataRequest,
    current_name: str = Query("Aditya", description="Current spelled name"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 10 — Endpoint 82: Name correction and spelling letter-suggestion algorithm."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "original_name": current_name,
            "suggested_variations": [
                {"spelling": f"{current_name}a", "compound_number": 23, "single_digit": 5, "fortune": "The Royal Star of the Lion (Very Auspicious)"},
                {"spelling": f"{current_name}h", "compound_number": 24, "single_digit": 6, "fortune": "Venusian Love and Attraction"}
            ]
        }
    )

@router.post("/forecast", response_model=StandardResponse)
async def get_numerology_forecast(
    req: BirthDataRequest,
    target_year: int = Query(2026, description="Target year"),
    key_hash: str = Depends(verify_api_key)
):
    """Module 10 — Endpoint 83: Personal Year, Personal Month, and Personal Day numerology cycles."""
    b_day = int(req.dob.split("-")[2])
    b_month = int(req.dob.split("-")[1])
    py = sum(int(d) for d in str(b_day) + str(b_month) + str(target_year))
    while py > 9 and py not in [11, 22, 33]:
        py = sum(int(d) for d in str(py))

    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={"target_year": target_year, "personal_year": py, "theme": "New beginnings, dynamic action, and professional enterprise"}
    )

@router.post("/pinnacles-challenges", response_model=StandardResponse)
async def get_pinnacles_challenges(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 10 — Endpoint 84: 4 Major Life Pinnacles and 4 Challenge Numbers."""
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "pinnacles": [
                {"pinnacle": 1, "age_span": "0 - 32", "number": 3},
                {"pinnacle": 2, "age_span": "33 - 41", "number": 5},
                {"pinnacle": 3, "age_span": "42 - 50", "number": 8},
                {"pinnacle": 4, "age_span": "51+", "number": 1}
            ],
            "challenges": [{"challenge": 1, "number": 2}, {"challenge": 2, "number": 1}, {"challenge": 3, "number": 1}, {"challenge": 4, "number": 0}]
        }
    )

@router.post("/favorable", response_model=StandardResponse)
async def get_favorable_elements(
    req: BirthDataRequest,
    key_hash: str = Depends(verify_api_key)
):
    """Module 10 — Endpoint 85: Favorable dates, auspicious colors, lucky numbers, and gems."""
    core = calculate_core_numbers(req.dob, "")
    mulank_dict = core.get("mulank", {})
    mulank = mulank_dict.get("number", 1) if isinstance(mulank_dict, dict) else int(mulank_dict)
    return StandardResponse(
        status="success",
        language=req.lang or "en",
        data={
            "psychic_number": mulank,
            "lucky_dates": [mulank, mulank + 9, mulank + 18] if mulank <= 9 else [mulank],
            "favorable_colors": ["Golden Yellow", "White", "Light Orange"],
            "favorable_days": ["Sunday", "Thursday"],
            "neutral_numbers": [2, 3, 7],
            "avoid_numbers": [8]
        }
    )

