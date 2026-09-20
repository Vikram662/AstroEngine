"""
Tarot API Router
Endpoints:
- POST /api/v1/tarot/daily-card
- POST /api/v1/tarot/spread/3-card
- POST /api/v1/tarot/spread/celtic-cross
- GET  /api/v1/tarot/deck
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from app.modules.tarot.spreads import (
    get_daily_card_reading,
    get_three_card_spread,
    get_celtic_cross_spread
)
from app.modules.tarot.deck import ALL_TAROT_CARDS

router = APIRouter(prefix="/api/v1/tarot", tags=["Tarot Card Readings"])

class QuestionRequest(BaseModel):
    question: Optional[str] = Field(None, description="User's query or focus intention")
    spread_mode: Optional[str] = Field("time", description="time | mind_body_spirit | situation")

@router.post("/daily-card")
def daily_card_endpoint(req: Optional[QuestionRequest] = None):
    q = req.question if req else None
    return get_daily_card_reading(question=q)

@router.post("/spread/3-card")
def three_card_endpoint(req: Optional[QuestionRequest] = None):
    mode = req.spread_mode if req and req.spread_mode else "time"
    q = req.question if req else None
    return get_three_card_spread(spread_mode=mode, question=q)

@router.post("/spread/celtic-cross")
def celtic_cross_endpoint(req: Optional[QuestionRequest] = None):
    q = req.question if req else None
    return get_celtic_cross_spread(question=q)

@router.get("/deck")
def get_deck_library():
    return {
        "status": "success",
        "total_cards": len(ALL_TAROT_CARDS),
        "cards": ALL_TAROT_CARDS
    }
