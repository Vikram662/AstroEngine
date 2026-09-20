"""
Vastu Shastra API Router
Endpoints:
- POST /api/v1/vastu/evaluate
- GET  /api/v1/vastu/zones-guide
- GET  /api/v1/vastu/preset-layouts
"""

from fastapi import APIRouter
from typing import Optional, List
from app.modules.vastu.engine import (
    evaluate_vastu_harmony,
    VastuEvaluationRequest,
    RoomInput,
    VASTU_ZONES_CONFIG
)

router = APIRouter(prefix="/api/v1/vastu", tags=["Vastu Shastra Engine"])

@router.post("/evaluate")
def evaluate_property_vastu(req: VastuEvaluationRequest):
    """
    Evaluates room placements across 16 directional zones,
    identifies elemental clashes (Fire vs Water, etc.), and returns
    zero-demolition remedies (metal strips, color tape, crystals, yantras).
    """
    return evaluate_vastu_harmony(req)

@router.get("/zones-guide")
def get_zones_guide():
    """Returns detailed characteristics of all 16 MahaVastu zones."""
    return {
        "status": "success",
        "total_zones": len(VASTU_ZONES_CONFIG),
        "zones": VASTU_ZONES_CONFIG
    }

@router.get("/preset-layouts")
def get_preset_layouts():
    """Returns sample standard floor configurations for instant demo testing."""
    return {
        "status": "success",
        "presets": [
            {
                "id": "ideal_home",
                "title": "Ideal Vedic Home (आदर्श वास्तु घर)",
                "facing": "East",
                "rooms": [
                    {"room_type": "pooja_mandir", "zone": "NE", "color": "White"},
                    {"room_type": "kitchen", "zone": "SE", "color": "Orange"},
                    {"room_type": "master_bedroom", "zone": "SW", "color": "Cream"},
                    {"room_type": "toilet", "zone": "SSW", "color": "Yellow"},
                    {"room_type": "locker", "zone": "N", "color": "Light Green"},
                    {"room_type": "living_room", "zone": "E", "color": "White"}
                ]
            },
            {
                "id": "typical_apartment_with_doshas",
                "title": "Urban Apartment with Common Doshas (शहरी फ्लैट - दोष युक्त)",
                "facing": "North",
                "rooms": [
                    {"room_type": "kitchen", "zone": "NE", "color": "Red"}, # Severe Agni-Jal clash!
                    {"room_type": "toilet", "zone": "SW", "color": "Blue"}, # Severe Stability drain!
                    {"room_type": "master_bedroom", "zone": "SE", "color": "Pink"},
                    {"room_type": "pooja_mandir", "zone": "WNW", "color": "Grey"},
                    {"room_type": "locker", "zone": "SSW", "color": "Dark Yellow"}
                ]
            }
        ]
    }
