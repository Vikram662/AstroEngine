"""
Vastu Shastra Energy Calculation Engine
Calculates 16-zone elemental harmony, room placement scores, identifies Vastu Doshas,
and prescribes non-demolition remedies (color therapy, metal strips, pyramid energy, yantras).
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# 16 MahaVastu Zones with Elements, Deities, and Beneficial Uses
VASTU_ZONES_CONFIG: Dict[str, Dict[str, Any]] = {
    "N": {
        "name": "North (उत्तर)",
        "degrees": "348.75° - 11.25°",
        "element": "Water",
        "element_hi": "जल तत्व",
        "deity": "Kubera (कुबेर)",
        "attributes": "Money, Wealth, New Opportunities, Career Growth",
        "attributes_hi": "धन, नए अवसर, करियर में प्रगति",
        "ideal_for": ["Living Room", "Entrance", "Cash Safe", "Study Room"],
        "avoid": ["Toilet", "Kitchen", "Red Color", "Septic Tank"],
        "favorable_colors": ["Blue", "Green", "White"],
        "anti_colors": ["Red", "Pink", "Orange", "Yellow"]
    },
    "NNE": {
        "name": "North-North-East (उत्तर-उत्तर-पूर्व)",
        "degrees": "11.25° - 33.75°",
        "element": "Water",
        "element_hi": "जल तत्व",
        "deity": "Dhanvantari (धन्वंतरि)",
        "attributes": "Health, Immunity, Healing, Vitality",
        "attributes_hi": "स्वास्थ्य, रोग प्रतिरोधक क्षमता, आरोग्य",
        "ideal_for": ["Medicine Storage", "Guest Room", "Meditation Space"],
        "avoid": ["Toilet", "Dustbin", "Clutter"],
        "favorable_colors": ["Light Blue", "Off-White"],
        "anti_colors": ["Red", "Bright Yellow"]
    },
    "NE": {
        "name": "North-East (ईशान कोण)",
        "degrees": "33.75° - 56.25°",
        "element": "Water",
        "element_hi": "जल तत्व (सर्वोच्च पवित्र)",
        "deity": "Lord Shiva / Ishanya (ईशान)",
        "attributes": "Spiritual Enlightenment, Clarity of Mind, Divine Wisdom",
        "attributes_hi": "मानसिक शांति, ज्ञान, ईश्वर आराधना, बुद्धि",
        "ideal_for": ["Pooja Mandir", "Meditation", "Open Terrace", "Water Fountain"],
        "avoid": ["Toilet", "Kitchen (Agni)", "Master Bedroom", "Heavy Overhead Tank"],
        "favorable_colors": ["White", "Light Yellow", "Pale Blue"],
        "anti_colors": ["Red", "Dark Colors", "Black"]
    },
    "ENE": {
        "name": "East-North-East (पूर्व-उत्तर-पूर्व)",
        "degrees": "56.25° - 78.75°",
        "element": "Air",
        "element_hi": "वायु / काष्ठ तत्व",
        "deity": "Parjanya",
        "attributes": "Fun, Recreation, Joy, Refreshment",
        "attributes_hi": "आनंद, मनोरंजन, नई स्फूर्ति",
        "ideal_for": ["Family Lounge", "Garden", "Kids Play Area"],
        "avoid": ["Heavy Storage", "Toilet"],
        "favorable_colors": ["Light Green", "Mint"],
        "anti_colors": ["Red", "Dark Yellow"]
    },
    "E": {
        "name": "East (पूर्व)",
        "degrees": "78.75° - 101.25°",
        "element": "Air",
        "element_hi": "वायु तत्व",
        "deity": "Indra / Surya (सूर्य देव)",
        "attributes": "Social Connectivity, Networking, Fame, Government Support",
        "attributes_hi": "सामाजिक संबंध, यश, मान-प्रतिष्ठा, संपर्क",
        "ideal_for": ["Main Entrance", "Living Room", "Balcony"],
        "avoid": ["Toilet", "Heavy Clutter"],
        "favorable_colors": ["Green", "Brown"],
        "anti_colors": ["Yellow", "Grey"]
    },
    "ESE": {
        "name": "East-South-East (पूर्व-दक्षिण-पूर्व)",
        "degrees": "101.25° - 123.75°",
        "element": "Air",
        "element_hi": "वायु तत्व",
        "deity": "Aryama",
        "attributes": "Analysis, Over-Thinking, Churning",
        "attributes_hi": "मंथन, विश्लेषण, अत्यधिक सोच",
        "ideal_for": ["Mixer/Grinder", "Washing Machine", "Research Desk"],
        "avoid": ["Master Bedroom (creates anxiety)", "Pooja Room"],
        "favorable_colors": ["Cream", "Pastel Green"],
        "anti_colors": ["Red", "Bright Blue"]
    },
    "SE": {
        "name": "South-East (आग्नेय कोण)",
        "degrees": "123.75° - 146.25°",
        "element": "Fire",
        "element_hi": "अग्नि तत्व",
        "deity": "Agni Dev (अग्नि देव)",
        "attributes": "Cash Flow, Liquidity, Energy, Zeal, Fast Results",
        "attributes_hi": "नकद धन प्रवाह (Cash Flow), गति, उत्साह",
        "ideal_for": ["Kitchen (Gas Stove)", "Electrical Inverter/Panel", "Boiler"],
        "avoid": ["Underground Water Tank", "Toilet", "Blue/Black Color"],
        "favorable_colors": ["Red", "Orange", "Pink", "Purple"],
        "anti_colors": ["Blue", "Black", "Grey"]
    },
    "SSE": {
        "name": "South-South-East (दक्षिण-दक्षिण-पूर्व)",
        "degrees": "146.25° - 168.75°",
        "element": "Fire",
        "element_hi": "अग्नि तत्व",
        "deity": "Pushan",
        "attributes": "Confidence, Strength, Fearlessness, Stamina",
        "attributes_hi": "आत्मविश्वास, शारीरिक बल, निर्भीकता",
        "ideal_for": ["Gym / Exercise Room", "Security Station"],
        "avoid": ["Toilet", "Water Borewell"],
        "favorable_colors": ["Orange", "Red", "Yellow"],
        "anti_colors": ["Blue", "Black"]
    },
    "S": {
        "name": "South (दक्षिण)",
        "degrees": "168.75° - 191.25°",
        "element": "Fire",
        "element_hi": "अग्नि तत्व",
        "deity": "Yama (यमराज)",
        "attributes": "Name, Fame, Public Recognition, Peaceful Rest",
        "attributes_hi": "नाम, ख्याति, चैन की नींद, प्रतिष्ठा",
        "ideal_for": ["Bedroom", "Office Cabin", "Awards Display"],
        "avoid": ["Water Boring", "Main Entrance (if defective pada)"],
        "favorable_colors": ["Red", "Warm Yellow", "Maroon"],
        "anti_colors": ["Blue", "Dark Green"]
    },
    "SSW": {
        "name": "South-South-West (दक्षिण-दक्षिण-पश्चिम)",
        "degrees": "191.25° - 213.75°",
        "element": "Earth",
        "element_hi": "पृथ्वी तत्व",
        "deity": "Gandharva",
        "attributes": "Disposal, Expenditure, Waste Elimination",
        "attributes_hi": "विसर्जन, व्यर्थ व्यय, निष्कासन",
        "ideal_for": ["Toilet (Best Position)", "Drainage", "Dustbin"],
        "avoid": ["Master Bedroom", "Mandir", "Cash Locker", "Study Desk"],
        "favorable_colors": ["Yellow", "Beige"],
        "anti_colors": ["Red", "Green", "Blue"]
    },
    "SW": {
        "name": "South-West (नैऋत्य कोण)",
        "degrees": "213.75° - 236.25°",
        "element": "Earth",
        "element_hi": "पृथ्वी तत्व (स्थिरता का केंद्र)",
        "deity": "Nirriti / Pitras (पितृ देव)",
        "attributes": "Stability, Relationships, Mastery, Leadership, Longevity",
        "attributes_hi": "स्थिरता, पारिवारिक संबंध, दक्षता, दीर्घायु",
        "ideal_for": ["Master Bedroom", "Head of Family Room", "Heavy Wardrobes"],
        "avoid": ["Toilet (Major Dosha)", "Kitchen", "Underground Borewell", "Mandir"],
        "favorable_colors": ["Golden Yellow", "Earthy Brown", "Ochre"],
        "anti_colors": ["Green", "Red", "Blue"]
    },
    "WSW": {
        "name": "West-South-West (पश्चिम-दक्षिण-पश्चिम)",
        "degrees": "236.25° - 258.75°",
        "element": "Space",
        "element_hi": "आकाश तत्व",
        "deity": "Dauvarika",
        "attributes": "Education, Knowledge Retention, Savings",
        "attributes_hi": "विद्याभ्यास, ज्ञान अर्जन, बचत",
        "ideal_for": ["Study Desk", "Bookshelf", "Children Study Room"],
        "avoid": ["Toilet", "Clutter"],
        "favorable_colors": ["White", "Silver", "Light Yellow"],
        "anti_colors": ["Red", "Green"]
    },
    "W": {
        "name": "West (पश्चिम)",
        "degrees": "258.75° - 281.25°",
        "element": "Space",
        "element_hi": "आकाश तत्व",
        "deity": "Varuna (वरुण देव)",
        "attributes": "Gains, Profits, Business Growth, Manifestation of Goals",
        "attributes_hi": "व्यापार में लाभ, मुनाफा, मनोकामना पूर्ति",
        "ideal_for": ["Dining Room", "Sales Cabin", "Safe/Locker"],
        "avoid": ["Underground Water Borewell", "Green Plants"],
        "favorable_colors": ["White", "Grey", "Metallic Silver"],
        "anti_colors": ["Red", "Bright Green"]
    },
    "WNW": {
        "name": "West-North-West (पश्चिम-उत्तर-पश्चिम)",
        "degrees": "281.25° - 303.75°",
        "element": "Space",
        "element_hi": "आकाश तत्व",
        "deity": "Roga",
        "attributes": "Detoxification, Emotional Release, Depression relief",
        "attributes_hi": "मानसिक तनाव मुक्ति, भावनाओं का निष्कासन",
        "ideal_for": ["Toilet", "Crying/Venting Room", "Store for Discarded Goods"],
        "avoid": ["Master Bedroom", "Mandir", "Living Room"],
        "favorable_colors": ["White", "Light Grey"],
        "anti_colors": ["Red", "Green"]
    },
    "NW": {
        "name": "North-West (वायव्य कोण)",
        "degrees": "303.75° - 326.25°",
        "element": "Air / Space",
        "element_hi": "वायु तत्व",
        "deity": "Vayu Dev (वायु देव)",
        "attributes": "Support, Banking/Loans, Mentors, Helpful Friends",
        "attributes_hi": "सहयोग, बैंक लोन, मित्र सहायता, सरकारी सहयोग",
        "ideal_for": ["Guest Bedroom", "Finished Goods Storage", "Daughter's Bedroom"],
        "avoid": ["Overhead Water Tank", "Toilet directly on junction"],
        "favorable_colors": ["White", "Cream", "Silver"],
        "anti_colors": ["Red"]
    },
    "NNW": {
        "name": "North-North-West (उत्तर-उत्तर-पश्चिम)",
        "degrees": "326.25° - 348.75°",
        "element": "Water",
        "element_hi": "जल तत्व",
        "deity": "Soma",
        "attributes": "Attraction, Marital Bliss, Romance, Sensuality",
        "attributes_hi": "आकर्षण, वैवाहिक सुख, रोमांस",
        "ideal_for": ["Newlyweds Bedroom", "Dressing Room", "Cosmetics Vanity"],
        "avoid": ["Toilet", "Heavy Storage", "Dark Colors"],
        "favorable_colors": ["Light Blue", "White"],
        "anti_colors": ["Red", "Yellow"]
    }
}

class RoomInput(BaseModel):
    room_type: str = Field(..., description="kitchen | master_bedroom | pooja_mandir | toilet | entrance | living_room | locker | study")
    zone: str = Field(..., description="Zone code (e.g. NE, N, SE, SW, SSW, etc.)")
    color: Optional[str] = Field(None, description="Dominant room wall color")

class VastuEvaluationRequest(BaseModel):
    property_type: Optional[str] = Field("residential", description="residential | commercial | industrial")
    rooms: List[RoomInput]
    facing_direction: Optional[str] = Field("East", description="Main property facing (North, East, South, West)")

def evaluate_vastu_harmony(req: VastuEvaluationRequest) -> Dict[str, Any]:
    evaluated_rooms = []
    total_score = 0
    max_possible = len(req.rooms) * 100 if req.rooms else 100
    doshas_found = []
    remedies_prescribed = []
    
    # Priority weighting for critical spaces
    critical_weights = {
        "pooja_mandir": 1.4,
        "kitchen": 1.3,
        "master_bedroom": 1.3,
        "toilet": 1.4,
        "entrance": 1.2,
        "locker": 1.1,
        "study": 1.0,
        "living_room": 1.0
    }
    
    total_weighted_points = 0
    total_max_weights = 0

    for room in req.rooms:
        r_type = room.room_type.lower()
        z_code = room.zone.upper()
        z_info = VASTU_ZONES_CONFIG.get(z_code, VASTU_ZONES_CONFIG["NE"])
        
        weight = critical_weights.get(r_type, 1.0)
        base_score = 70
        verdict = "Neutral"
        verdict_hi = "सामान्य"
        severity = "Low"
        issues = []
        cures = []

        # 1. Pooja Mandir Check
        if r_type in ["pooja_mandir", "mandir"]:
            if z_code in ["NE", "N", "ENE"]:
                base_score = 100
                verdict = "Excellent (Dev Kripa)"
                verdict_hi = "अति उत्तम (ईश्वर कृपा)"
            elif z_code in ["SW", "SSW", "SE"]:
                base_score = 25
                verdict = "Severe Vastu Dosha"
                verdict_hi = "गंभीर वास्तु दोष (अशुभ स्थिति)"
                severity = "High"
                issues.append(f"Pooja Mandir in {z_code} disrupts spiritual peace and drains family fortune.")
                cures.append({
                    "type": "Yantra & Mirror Cure",
                    "action": "Place a Brass Brihaspati Yantra and install a soft yellow light. Shift deity idols towards NE if possible.",
                    "action_hi": "पीतल का गुरु/सूर्य यंत्र लगाएं और मंदिर में हल्का पीला प्रकाश रखें।"
                })
            else:
                base_score = 65

        # 2. Kitchen (Agni) Check
        elif r_type in ["kitchen", "gas_stove"]:
            if z_code in ["SE", "SSE"]:
                base_score = 100
                verdict = "Ideal (Agni Sthana)"
                verdict_hi = "सर्वोत्तम (आग्नेय अग्नि स्थान)"
            elif z_code in ["NW", "W"]:
                base_score = 75
                verdict = "Good Alternative"
                verdict_hi = "स्वीकार्य विकल्प"
            elif z_code in ["NE", "N"]:
                base_score = 20
                verdict = "Severe Fire-Water Clash"
                verdict_hi = "गंभीर अग्नि-जल महादोष"
                severity = "High"
                issues.append(f"Kitchen in {z_code} clashes with sacred Water element, creating financial stress & health issues.")
                cures.append({
                    "type": "Green Baroda Marble Slab Cure",
                    "action": "Place a 1-inch Green Baroda marble slab under the gas burner stove to cut the fire element from the water zone.",
                    "action_hi": "गैस चूल्हे के नीचे 1 इंच हरा बड़ौदा मार्बल स्लैब रखें जिससे अग्नि और जल तत्व का टकराव समाप्त हो जाए।"
                })
            elif z_code in ["SW"]:
                base_score = 30
                verdict = "Harmful for Stability"
                verdict_hi = "गृहस्वामी के स्वास्थ्य व स्थिरता हेतु बाधक"
                severity = "Medium"
                cures.append({
                    "type": "Yellow Jasper & Brass Strip",
                    "action": "Install a 3mm Brass metal strip along the kitchen threshold.",
                    "action_hi": "रसोई की चौखट पर पीतल की पट्टी (Brass strip) लगाएं।"
                })

        # 3. Master Bedroom Check
        elif r_type in ["master_bedroom", "bedroom"]:
            if z_code in ["SW", "S", "SSW"]:
                base_score = 95
                verdict = "Supreme Stability"
                verdict_hi = "उत्कृष्ट स्थिरता व पारिवारिक सौहार्द"
            elif z_code in ["NE"]:
                base_score = 35
                verdict = "Mental Restlessness"
                verdict_hi = "अति संवेदनशीलता व अनिद्रा दोष"
                severity = "Medium"
                issues.append("Master bedroom in NE induces over-thinking, restlessness, and lack of assertiveness.")
                cures.append({
                    "type": "Headboard Direction & Crystal",
                    "action": "Ensure head faces South while sleeping. Place an Amethyst geode cluster near bedside.",
                    "action_hi": "सोते समय सिर दक्षिण दिशा की ओर रखें और बेडसाइड पर अमेथिस्ट क्रिस्टल रखें।"
                })
            elif z_code in ["ESE"]:
                base_score = 40
                verdict = "Anxiety & Arguments"
                verdict_hi = "पारिवारिक कलह व चिंता"
                cures.append({
                    "type": "Color Therapy",
                    "action": "Repaint walls in soft pastel cream or off-white. Remove any bright red or blue curtains.",
                    "action_hi": "कमरे की दीवारों पर हल्का क्रीम रंग कराएं और लाल या गहरे नीले पर्दे हटाएं।"
                })

        # 4. Toilet / Drainage Check
        elif r_type in ["toilet", "bathroom", "septic_tank"]:
            if z_code in ["SSW", "WSW", "WNW"]:
                base_score = 100
                verdict = "Perfect Elimination Zone"
                verdict_hi = "सर्वोत्तम निष्कासन क्षेत्र"
            elif z_code in ["NE"]:
                base_score = 10
                verdict = "Fatal Vastu Calamity"
                verdict_hi = "महावास्तु दोष (ईशान शौचालय)"
                severity = "Critical"
                issues.append("Toilet in North-East severely damages health, prosperity, and spiritual growth.")
                cures.append({
                    "type": "Zero-Demolition Elemental Strip & Pyramid",
                    "action": "Place a 4-inch wide Blue Color Tape or Aluminium metal strip around the entire commode base on 3 sides. Keep a bowl of sea salt inside.",
                    "action_hi": "कमोड सीट के चारों ओर एल्युमिनियम पट्टी या नीले रंग का वास्तु टेप चिपकाएं और कटोरी में समुद्री नमक रखें।"
                })
            elif z_code in ["SW"]:
                base_score = 25
                verdict = "Relationship & Career Drain"
                verdict_hi = "स्थिरता व संबंधों में दरार"
                severity = "High"
                cures.append({
                    "type": "Brass Metal Strip Embedding",
                    "action": "Affix a continuous 25mm Brass metallic strip on the floor around the toilet pot to block negative earth vibrations.",
                    "action_hi": "टॉयलेट पॉट के चारों ओर 25mm पीतल की पत्ती (Brass Strip) फर्श पर लगाएं।"
                })
            elif z_code in ["SE"]:
                base_score = 30
                verdict = "Cash Flow Drainage"
                verdict_hi = "धन हानि व आर्थिक तंगी"
                cures.append({
                    "type": "Copper Strip Cure",
                    "action": "Embed a Red Copper strip around the toilet perimeter to pacify Fire drainage.",
                    "action_hi": "टॉयलेट के चारों ओर तांबे की पत्ती (Copper strip) लगाएं।"
                })

        # 5. Cash Locker / Safe Check
        elif r_type in ["locker", "safe", "cash"]:
            if z_code in ["N", "W"]:
                base_score = 100
                verdict = "Kuber Laxmi Alignment"
                verdict_hi = "कुबेर-लक्ष्मी संचित धन योग"
            elif z_code in ["SSW", "SE"]:
                base_score = 30
                verdict = "Rapid Drainage of Wealth"
                verdict_hi = "अनावश्यक फिजूलखर्ची व धन अपव्यय"
                cures.append({
                    "type": "Mirror & Kuber Yantra",
                    "action": "Place a genuine Kuber Yantra inside the safe door facing East or North. Place a small mirror reflecting cash.",
                    "action_hi": "तिजोरी के अंदर उत्तर दिशा में मुख करके कुबेर यंत्र रखें और नकदी का प्रतिबिंब दिखाने वाला छोटा दर्पण लगाएं।"
                })

        # Overall item score calculation
        weighted_score = base_score * weight
        total_weighted_points += weighted_score
        total_max_weights += (100 * weight)

        if issues:
            for iss in issues:
                doshas_found.append({"room": r_type, "zone": z_code, "severity": severity, "desc": iss})
        if cures:
            remedies_prescribed.extend(cures)

        evaluated_rooms.append({
            "room_type": r_type,
            "zone": z_code,
            "zone_name": z_info["name"],
            "element": z_info["element"],
            "element_hi": z_info["element_hi"],
            "score": base_score,
            "verdict": verdict,
            "verdict_hi": verdict_hi,
            "issues": issues,
            "suggested_cures": cures
        })

    final_score_percent = round((total_weighted_points / total_max_weights) * 100, 1) if total_max_weights > 0 else 75.0

    # Overall category assessment
    if final_score_percent >= 85:
        overall_status = "Excellent MahaVastu Harmony"
        overall_status_hi = "अति उत्तम महावास्तु समन्वय (सुख-समृद्धि प्रदायक)"
        bg_grade = "A+"
    elif final_score_percent >= 70:
        overall_status = "Good Vastu Balance (Minor adjustments needed)"
        overall_status_hi = "अच्छा वास्तु संतुलन (हल्के उपायों से उत्तम परिणाम)"
        bg_grade = "B+"
    elif final_score_percent >= 50:
        overall_status = "Moderate Vastu Dosha Detected"
        overall_status_hi = "मध्यम वास्तु दोष (सुधार की आवश्यकता)"
        bg_grade = "C"
    else:
        overall_status = "High Stress Vastu Imbalance"
        overall_status_hi = "गंभीर वास्तु असंतुलन (तत्काल वैदिक व वैज्ञानिक उपचार आवश्यक)"
        bg_grade = "D"

    return {
        "status": "success",
        "property_type": req.property_type,
        "facing_direction": req.facing_direction,
        "overall_score_percent": final_score_percent,
        "grade": bg_grade,
        "overall_status": overall_status,
        "overall_status_hi": overall_status_hi,
        "total_rooms_evaluated": len(evaluated_rooms),
        "total_doshas_identified": len(doshas_found),
        "evaluated_rooms": evaluated_rooms,
        "critical_doshas": doshas_found,
        "non_demolition_remedies": remedies_prescribed,
        "all_16_zones_reference": VASTU_ZONES_CONFIG
    }
