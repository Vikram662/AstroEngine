"""
Tarot Reading Engine and Spread Processors.
Provides:
1. Daily Single Card Draw
2. 3-Card Spread (Past - Present - Future / Mind - Body - Spirit)
3. 10-Card Celtic Cross Spread
"""

import random
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.modules.tarot.deck import ALL_TAROT_CARDS, MAJOR_ARCANA

class TarotCardDraw(BaseModel):
    card_id: str
    name: str
    name_hi: str
    arcana: str
    is_reversed: bool
    position_title: str
    position_title_hi: str
    element: Optional[str] = None
    keywords: List[str]
    meaning: str
    advice: str

def draw_random_cards(count: int = 1, major_only: bool = False) -> List[Dict[str, Any]]:
    pool = list(MAJOR_ARCANA) if major_only else list(ALL_TAROT_CARDS)
    chosen = random.sample(pool, min(count, len(pool)))
    
    results = []
    for c in chosen:
        is_reversed = random.choice([False, False, True]) # ~33% chance of reversed
        orientation_key = "reversed" if is_reversed else "upright"
        data = c[orientation_key]
        
        card_obj = {
            "card_id": c["id"],
            "name": c["name"],
            "name_hi": c["name_hi"],
            "arcana": c.get("arcana", "major"),
            "element": c.get("element"),
            "is_reversed": is_reversed,
            "keywords": data["keywords"],
            "keywords_hi": data.get("keywords_hi", []),
            "meaning": data["meaning"],
            "meaning_hi": data.get("meaning_hi", ""),
            "advice": data["advice"],
            "advice_hi": data.get("advice_hi", "")
        }
        results.append(card_obj)
    return results

def get_daily_card_reading(question: Optional[str] = None) -> Dict[str, Any]:
    cards = draw_random_cards(1)
    card = cards[0]
    card["position_title"] = "Card of the Day"
    card["position_title_hi"] = "आज का मार्गदर्शन कार्ड"
    
    return {
        "status": "success",
        "question": question or "Daily Cosmic Energy & Advice",
        "spread_type": "daily_card",
        "card": card,
        "summary": (
            f"{'Reversed: ' if card['is_reversed'] else 'Upright: '} {card['name']} speaks into your day. "
            f"{card['meaning']}"
        ),
        "summary_hi": (
            f"{'उल्टा (Reversed): ' if card['is_reversed'] else 'सीधा (Upright): '} {card['name_hi']} का संदेश: "
            f"{card['meaning_hi']} सलाह: {card['advice_hi']}"
        )
    }

def get_three_card_spread(spread_mode: str = "time", question: Optional[str] = None) -> Dict[str, Any]:
    """
    spread_mode: 'time' (Past, Present, Future) or 'mind_body_spirit' or 'situation' (Situation, Action, Outcome)
    """
    positions = [
        {"title": "The Past (Root)", "title_hi": "अतीत (कारण/नींव)", "desc": "Foundational influences leading to now"},
        {"title": "The Present (Current Energy)", "title_hi": "वर्तमान (ताज़ा स्थिति)", "desc": "Energy actively operating around you"},
        {"title": "The Future (Likely Outcome)", "title_hi": "भविष्य (संभावित परिणाम)", "desc": "Where your path flows if current energy holds"}
    ]
    
    if spread_mode == "mind_body_spirit":
        positions = [
            {"title": "Mind (Intellect & Vision)", "title_hi": "मन (विचार व दृष्टि)", "desc": "Mental focus and intellectual attitude"},
            {"title": "Body (Action & Physical Reality)", "title_hi": "तन (कर्म व भौतिक स्थिति)", "desc": "Physical vitality and tangible action"},
            {"title": "Spirit (Intuition & Purpose)", "title_hi": "आत्मा (अंतर्ज्ञान व उद्देश्य)", "desc": "Spiritual guidance and soul alignment"}
        ]
    elif spread_mode == "situation":
        positions = [
            {"title": "Situation (What is)", "title_hi": "वर्तमान स्थिति (सच्चाई)", "desc": "The reality of the matter"},
            {"title": "Action (What to do)", "title_hi": "उचित कर्म (क्या करें)", "desc": "The recommended approach"},
            {"title": "Outcome (The Result)", "title_hi": "परिणाम (अंतिम फल)", "desc": "The resultant breakthrough"}
        ]

    cards = draw_random_cards(3)
    processed_cards = []
    for idx, c in enumerate(cards):
        c["position_title"] = positions[idx]["title"]
        c["position_title_hi"] = positions[idx]["title_hi"]
        c["position_desc"] = positions[idx]["desc"]
        processed_cards.append(c)

    return {
        "status": "success",
        "question": question or "Past, Present, and Future Outlook",
        "spread_type": f"3_card_{spread_mode}",
        "cards": processed_cards,
        "synthesis": (
            f"The reading opens with {processed_cards[0]['name']} revealing the root. "
            f"Presently, {processed_cards[1]['name']} holds the key energetic focus. "
            f"Following this trajectory, {processed_cards[2]['name']} crowns the outcome."
        ),
        "synthesis_hi": (
            f"अतीत की नींव में {processed_cards[0]['name_hi']} का प्रभाव रहा है। "
            f"वर्तमान समय में {processed_cards[1]['name_hi']} आपकी मुख्य ऊर्जा का केंद्र है। "
            f"यदि आप सही कर्म करते हैं, तो भविष्य में {processed_cards[2]['name_hi']} का सकारात्मक परिणाम प्राप्त होगा।"
        )
    }

def get_celtic_cross_spread(question: Optional[str] = None) -> Dict[str, Any]:
    cross_positions = [
        {"title": "1. Present Situation", "title_hi": "1. वर्तमान स्थिति (केंद्र)"},
        {"title": "2. Challenge / Cross", "title_hi": "2. मुख्य बाधा / चुनौती"},
        {"title": "3. Distant Past / Root", "title_hi": "3. अतीत की जड़ें"},
        {"title": "4. Recent Past", "title_hi": "4. हालिया घटनाएं"},
        {"title": "5. Higher Purpose / Potential", "title_hi": "5. उच्च ध्येय / लक्ष्य"},
        {"title": "6. Near Future", "title_hi": "6. निकट भविष्य"},
        {"title": "7. Your Inner Attitude", "title_hi": "7. आपका आंतरिक दृष्टिकोण"},
        {"title": "8. Environment & Others", "title_hi": "8. बाहरी माहौल व अन्य लोग"},
        {"title": "9. Hopes and Fears", "title_hi": "9. उम्मीदें व आंतरिक भय"},
        {"title": "10. Ultimate Outcome", "title_hi": "10. अंतिम परिणाम व सिद्धि"}
    ]
    
    cards = draw_random_cards(10)
    for idx, c in enumerate(cards):
        c["position_title"] = cross_positions[idx]["title"]
        c["position_title_hi"] = cross_positions[idx]["title_hi"]
        
    return {
        "status": "success",
        "question": question or "Comprehensive 10-Card Celtic Cross Life Path",
        "spread_type": "celtic_cross",
        "cards": cards,
        "core_conflict": f"{cards[0]['name']} is crossed by {cards[1]['name']}.",
        "core_conflict_hi": f"वर्तमान ऊर्जा ({cards[0]['name_hi']}) को चुनौती दे रही ऊर्जा: ({cards[1]['name_hi']})।",
        "ultimate_outcome": cards[9]['name'],
        "ultimate_outcome_hi": cards[9]['name_hi']
    }
