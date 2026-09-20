from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.schemas.common import StandardResponse
from app.core.security import verify_api_key
from app.modules.ai_astrologer.engine import generate_astrological_response
from app.modules.ai_astrologer.knowledge import QUERY_CATEGORIES

router = APIRouter(prefix="/api/v1/ai-astrologer", tags=["AI Astrologer Engine"])

class AstrologerQueryRequest(BaseModel):
    dob: str = Field(..., description="Date of birth YYYY-MM-DD", example="1995-10-05")
    tob: str = Field(..., description="Time of birth HH:MM (24-hr)", example="14:30")
    lat: float = Field(..., description="Birth Latitude", example=24.5854)
    lon: float = Field(..., description="Birth Longitude", example=73.7125)
    tz: float = Field(5.5, description="Timezone offset from UTC in hours", example=5.5)
    question: str = Field(..., description="User's natural language question", example="When will I get a promotion in my job?")
    category: Optional[str] = Field(None, description="Optional topic category: career, marriage, wealth, health, foreign, children, general", example="career")
    lang: Optional[str] = Field("hi", description="Response language: 'hi' or 'en'", example="hi")

class QuickInsightsRequest(BaseModel):
    dob: str = Field(..., example="1995-10-05")
    tob: str = Field(..., example="14:30")
    lat: float = Field(..., example=24.5854)
    lon: float = Field(..., example=73.7125)
    tz: float = Field(5.5, example=5.5)
    lang: Optional[str] = Field("hi", example="hi")

@router.post("/ask", response_model=StandardResponse)
async def ask_ai_astrologer(
    req: AstrologerQueryRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    AI Astrologer: Ask any natural language astrological question.
    Synthesizes D1 Lagna Kundli, running Vimshottari Mahadasha/Antardasha,
    house lord dignities, and transit influences.
    """
    selected_lang = (req.lang or "hi").lower().strip()
    result = generate_astrological_response(
        dob=req.dob,
        tob=req.tob,
        lat=req.lat,
        lon=req.lon,
        tz=req.tz,
        question=req.question,
        category=req.category,
        lang=selected_lang
    )
    return StandardResponse(
        status="success",
        language=selected_lang,
        data=result
    )

@router.post("/quick-insights", response_model=StandardResponse)
async def get_quick_astrology_insights(
    req: QuickInsightsRequest,
    key_hash: str = Depends(verify_api_key)
):
    """
    Generate instant AI Astrologer readings across all 5 key life pillars:
    1. Career & Profession (करियर)
    2. Marriage & Love (विवाह)
    3. Wealth & Finance (धन-समृद्धि)
    4. Health & Energy (स्वास्थ्य)
    5. Foreign Travel & Higher Education (विदेश यात्रा)
    """
    selected_lang = (req.lang or "hi").lower().strip()
    pillars = [
        ("career", "मेरी नौकरी और करियर में आगे क्या संभावनाएं हैं?"),
        ("marriage", "मेरे विवाह और जीवनसाथी के योग कैसे हैं?"),
        ("wealth", "मेरी आर्थिक स्थिति और धन लाभ के क्या योग हैं?"),
        ("health", "मेरे स्वास्थ्य और ऊर्जा के संबंध में क्या ग्रह योग हैं?"),
        ("foreign", "क्या मेरी कुंडली में विदेश यात्रा या दूरस्थ स्थान में सफलता के योग हैं?")
    ]

    insights = []
    for cat, default_q in pillars:
        resp = generate_astrological_response(
            dob=req.dob,
            tob=req.tob,
            lat=req.lat,
            lon=req.lon,
            tz=req.tz,
            question=default_q,
            category=cat,
            lang=selected_lang
        )
        insights.append(resp)

    return StandardResponse(
        status="success",
        language=selected_lang,
        data={"pillars": insights}
    )

@router.get("/suggested-prompts", response_model=StandardResponse)
async def get_suggested_prompts(lang: str = Query("hi")):
    """Get curated suggested questions for user quick selection."""
    prompts = [
        {
            "id": "job_timing",
            "category": "career",
            "title_hi": "नौकरी में पदोन्नति कब होगी?",
            "title_en": "When will I get a job promotion?",
            "icon": "💼"
        },
        {
            "id": "marriage_timing",
            "category": "marriage",
            "title_hi": "विवाह के योग कब बन रहे हैं?",
            "title_en": "When are the indications for marriage?",
            "icon": "💍"
        },
        {
            "id": "wealth_growth",
            "category": "wealth",
            "title_hi": "आर्थिक लाभ और धन वृद्धि के योग कब हैं?",
            "title_en": "When will financial wealth increase?",
            "icon": "💰"
        },
        {
            "id": "foreign_pr",
            "category": "foreign",
            "title_hi": "विदेश यात्रा या पीआर के क्या योग हैं?",
            "title_en": "What are my foreign travel & settlement chances?",
            "icon": "✈️"
        },
        {
            "id": "business_startup",
            "category": "career",
            "title_hi": "क्या नया व्यवसाय या स्टार्टअप शुरू करना शुभ रहेगा?",
            "title_en": "Is starting a new business or startup favorable?",
            "icon": "🚀"
        },
        {
            "id": "health_care",
            "category": "health",
            "title_hi": "स्वास्थ्य की दृष्टि से क्या सावधानियां रखनी चाहिए?",
            "title_en": "What health precautions should I observe?",
            "icon": "🧘"
        }
    ]
    return StandardResponse(
        status="success",
        language=lang,
        data={"prompts": prompts}
    )
