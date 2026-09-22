from typing import Dict, Any, List
from datetime import datetime

CHALDEAN_MAP = {
    'A': 1, 'I': 1, 'J': 1, 'Q': 1, 'Y': 1,
    'B': 2, 'K': 2, 'R': 2,
    'C': 3, 'G': 3, 'L': 3, 'S': 3,
    'D': 4, 'M': 4, 'T': 4,
    'E': 5, 'H': 5, 'N': 5, 'X': 5,
    'U': 6, 'V': 6, 'W': 6,
    'O': 7, 'Z': 7,
    'F': 8, 'P': 8
}

PYTHAGOREAN_MAP = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
}

PLANET_NUMBERS = {
    1: {"planet": "SUN", "traits": "Leadership, Pioneer, Confidence, Vitality"},
    2: {"planet": "MOON", "traits": "Diplomacy, Intuition, Harmony, Sensitivity"},
    3: {"planet": "JUPITER", "traits": "Wisdom, Creativity, Expression, Optimism"},
    4: {"planet": "RAHU", "traits": "Discipline, Practicality, System, Hard work"},
    5: {"planet": "MERCURY", "traits": "Versatility, Freedom, Communication, Speed"},
    6: {"planet": "VENUS", "traits": "Harmony, Luxury, Aesthetics, Responsibility"},
    7: {"planet": "KETU", "traits": "Analysis, Research, Spirituality, Depth"},
    8: {"planet": "SATURN", "traits": "Authority, Ambition, Karma, Material Mastery"},
    9: {"planet": "MARS", "traits": "Courage, Universal Love, Humanitarian, Energy"}
}

# Lucky color(s) + day of week per Mulank's ruling planet. Rahu/Ketu (4, 7) have
# no classical weekday of their own (only the 7 classical grahas do) — using the
# common numerology-practice convention of treating Rahu like Saturn's shadow and
# Ketu like Mars's, which also drives the friend/enemy derivation below.
MULANK_COLOR_DAY = {
    1: {"colors": ["Gold", "Orange", "Saffron"], "day": "Sunday"},
    2: {"colors": ["White", "Silver", "Cream"], "day": "Monday"},
    3: {"colors": ["Yellow", "Golden"], "day": "Thursday"},
    4: {"colors": ["Grey", "Smoky Blue"], "day": "Saturday"},
    5: {"colors": ["Green"], "day": "Wednesday"},
    6: {"colors": ["White", "Pink", "Light Blue"], "day": "Friday"},
    7: {"colors": ["Sea Green", "White", "Pale Yellow"], "day": "Tuesday"},
    8: {"colors": ["Dark Blue", "Black", "Grey"], "day": "Saturday"},
    9: {"colors": ["Red", "Crimson"], "day": "Tuesday"},
}

# Naisargika Maitri (natural friendship) for the 7 classical grahas — same table
# used by the Ashtakoot Graha Maitri fix. Rahu/Ketu proxy to Saturn/Mars here.
_NUMEROLOGY_FRIENDSHIP = {
    "SUN": {"friends": {"MOON", "MARS", "JUPITER"}, "enemies": {"VENUS", "SATURN"}},
    "MOON": {"friends": {"SUN", "MERCURY"}, "enemies": set()},
    "MARS": {"friends": {"SUN", "MOON", "JUPITER"}, "enemies": {"MERCURY"}},
    "MERCURY": {"friends": {"SUN", "VENUS"}, "enemies": {"MOON"}},
    "JUPITER": {"friends": {"SUN", "MOON", "MARS"}, "enemies": {"MERCURY", "VENUS"}},
    "VENUS": {"friends": {"MERCURY", "SATURN"}, "enemies": {"SUN", "MOON"}},
    "SATURN": {"friends": {"MERCURY", "VENUS"}, "enemies": {"SUN", "MOON", "MARS"}},
}
_SHADOW_PROXY = {"RAHU": "SATURN", "KETU": "MARS"}


def _number_relation(n1: int, n2: int) -> str:
    if n1 == n2:
        return "SELF"
    p1 = _SHADOW_PROXY.get(PLANET_NUMBERS[n1]["planet"], PLANET_NUMBERS[n1]["planet"])
    p2 = _SHADOW_PROXY.get(PLANET_NUMBERS[n2]["planet"], PLANET_NUMBERS[n2]["planet"])
    if p1 == p2:
        return "FRIEND"
    rel_ab = "ENEMY" if p2 in _NUMEROLOGY_FRIENDSHIP[p1]["enemies"] else ("FRIEND" if p2 in _NUMEROLOGY_FRIENDSHIP[p1]["friends"] else "NEUTRAL")
    rel_ba = "ENEMY" if p1 in _NUMEROLOGY_FRIENDSHIP[p2]["enemies"] else ("FRIEND" if p1 in _NUMEROLOGY_FRIENDSHIP[p2]["friends"] else "NEUTRAL")
    if "ENEMY" in (rel_ab, rel_ba):
        return "ENEMY"
    if "FRIEND" in (rel_ab, rel_ba):
        return "FRIEND"
    return "NEUTRAL"


def get_favorable_profile(mulank: int) -> Dict[str, Any]:
    """Mulank-specific favorable colors/day/lucky numbers, derived from planetary
    friendship rather than a constant list for every psychic number."""
    mulank = mulank if mulank in MULANK_COLOR_DAY else 1
    friendly = [n for n in range(1, 10) if n != mulank and _number_relation(mulank, n) == "FRIEND"]
    neutral = [n for n in range(1, 10) if n != mulank and _number_relation(mulank, n) == "NEUTRAL"]
    avoid = [n for n in range(1, 10) if n != mulank and _number_relation(mulank, n) == "ENEMY"]
    profile = MULANK_COLOR_DAY[mulank]
    return {
        "psychic_number": mulank,
        "ruling_planet": PLANET_NUMBERS[mulank]["planet"],
        "lucky_dates": [mulank, mulank + 9, mulank + 18, mulank + 27],
        "favorable_colors": profile["colors"],
        "favorable_days": [profile["day"]],
        "friendly_numbers": friendly,
        "neutral_numbers": neutral,
        "avoid_numbers": avoid
    }


PERSONAL_YEAR_THEMES = {
    1: "New beginnings, independence, and launching fresh initiatives.",
    2: "Cooperation, patience, and building partnerships and relationships.",
    3: "Creativity, self-expression, socializing, and communication.",
    4: "Hard work, discipline, and laying stable foundations.",
    5: "Change, freedom, travel, and unexpected developments.",
    6: "Responsibility, family, home, and service to others.",
    7: "Introspection, analysis, and inner/spiritual growth.",
    8: "Material success, authority, business, and financial gain.",
    9: "Completion, release, and closing out a nine-year cycle.",
    11: "Heightened intuition and spiritual illumination (Master Number).",
    22: "Large-scale achievement, turning big plans into reality (Master Number).",
    33: "Selfless service, compassion, and healing (Master Number).",
}

MISSING_NUMBER_REMEDIES = {
    1: "Strengthen the Sun: greet the morning sun, wear copper, take up a leadership role.",
    2: "Strengthen the Moon: keep silver nearby, favor white/cream, prioritize rest and emotional balance.",
    3: "Strengthen Jupiter: study or teach something, wear yellow on Thursdays, respect elders/gurus.",
    4: "Strengthen Rahu: bring more structure and discipline into routine, avoid shortcuts and hoarding.",
    5: "Strengthen Mercury: read and write daily, favor green, practice clear communication.",
    6: "Strengthen Venus: cultivate an aesthetic hobby (art/music), favor white or pastel colors, nurture relationships.",
    7: "Strengthen Ketu: spend time in solitude/meditation, avoid overanalyzing, favor sea-green tones.",
    8: "Strengthen Saturn: build patience and consistency, avoid shortcuts, favor dark blue/black.",
    9: "Strengthen Mars: take up physical activity, favor red, channel energy into decisive action.",
}

def reduce_to_single_digit(num: int, keep_master: bool = False) -> int:
    """Reduce an integer to a single digit (1-9)."""
    while num > 9:
        if keep_master and num in [11, 22, 33]:
            return num
        num = sum(int(d) for d in str(num))
    return num

def calculate_core_numbers(dob_str: str, name: str = "") -> Dict[str, Any]:
    """
    Calculate Core Numerology Numbers:
    - Mulank (Birth/Psychic Number): Sum of Day digits.
    - Bhagyank (Destiny/Life Path Number): Sum of entire DOB (DD+MM+YYYY).
    - Namank (Name Number): Chaldean reduction of name.
    """
    dt = datetime.strptime(dob_str, "%Y-%m-%d")
    
    # 1. Mulank (Day of birth)
    mulank = reduce_to_single_digit(dt.day)
    
    # 2. Bhagyank (Full date sum)
    dob_digits_sum = sum(int(d) for d in dob_str.replace("-", ""))
    bhagyank = reduce_to_single_digit(dob_digits_sum)
    
    # 3. Namank
    clean_name = "".join(ch for ch in name.upper() if ch.isalpha()) if name else ""
    namank = 0
    if clean_name:
        namank_sum = sum(CHALDEAN_MAP.get(ch, 0) for ch in clean_name)
        namank = reduce_to_single_digit(namank_sum)

    return {
        "mulank": {
            "number": mulank,
            "ruler": PLANET_NUMBERS[mulank]["planet"],
            "traits": PLANET_NUMBERS[mulank]["traits"]
        },
        "bhagyank": {
            "number": bhagyank,
            "ruler": PLANET_NUMBERS[bhagyank]["planet"],
            "traits": PLANET_NUMBERS[bhagyank]["traits"]
        },
        "namank": {
            "number": namank,
            "ruler": PLANET_NUMBERS.get(namank, {}).get("planet", "None") if namank else None,
            "calculated_from": clean_name
        }
    }

def calculate_pinnacles_challenges(dob_str: str) -> Dict[str, Any]:
    """
    Standard Pythagorean 4 Pinnacles and 4 Challenge Numbers from DOB.
    Pinnacle 1 = reduce(month + day); Pinnacle 2 = reduce(day + year);
    Pinnacle 3 = reduce(Pinnacle1 + Pinnacle2); Pinnacle 4 = reduce(month + year).
    Challenge numbers mirror the same pairings using absolute difference instead of sum.
    Pinnacle 1 ends at age (36 - Life Path Number); Pinnacles 2 and 3 each span the
    following 9 years; Pinnacle 4 covers the rest of life.
    """
    dt = datetime.strptime(dob_str, "%Y-%m-%d")
    month = reduce_to_single_digit(dt.month, keep_master=True)
    day = reduce_to_single_digit(dt.day, keep_master=True)
    year = reduce_to_single_digit(dt.year, keep_master=True)

    life_path = calculate_core_numbers(dob_str)["bhagyank"]["number"]

    pinnacle_1 = reduce_to_single_digit(month + day, keep_master=True)
    pinnacle_2 = reduce_to_single_digit(day + year, keep_master=True)
    pinnacle_3 = reduce_to_single_digit(pinnacle_1 + pinnacle_2, keep_master=True)
    pinnacle_4 = reduce_to_single_digit(month + year, keep_master=True)

    challenge_1 = reduce_to_single_digit(abs(month - day))
    challenge_2 = reduce_to_single_digit(abs(day - year))
    challenge_3 = reduce_to_single_digit(abs(challenge_1 - challenge_2))
    challenge_4 = reduce_to_single_digit(abs(month - year))

    end_1 = 36 - (life_path if life_path <= 9 else reduce_to_single_digit(life_path))
    end_2 = end_1 + 9
    end_3 = end_2 + 9

    return {
        "life_path_number_used": life_path,
        "pinnacles": [
            {"pinnacle": 1, "age_span": f"0 - {end_1}", "number": pinnacle_1},
            {"pinnacle": 2, "age_span": f"{end_1 + 1} - {end_2}", "number": pinnacle_2},
            {"pinnacle": 3, "age_span": f"{end_2 + 1} - {end_3}", "number": pinnacle_3},
            {"pinnacle": 4, "age_span": f"{end_3 + 1}+", "number": pinnacle_4},
        ],
        "challenges": [
            {"challenge": 1, "number": challenge_1},
            {"challenge": 2, "number": challenge_2},
            {"challenge": 3, "number": challenge_3},
            {"challenge": 4, "number": challenge_4},
        ],
    }


def calculate_loshu_grid(dob_str: str) -> Dict[str, Any]:
    """
    Generate Lo Shu 3x3 Magic Grid from DOB:
    Standard Lo Shu layout:
    [ 4, 9, 2 ]  -> Mental Plane
    [ 3, 5, 7 ]  -> Emotional/Thought Plane
    [ 8, 1, 6 ]  -> Practical Plane
    """
    dt = datetime.strptime(dob_str, "%Y-%m-%d")
    clean_digits = [int(d) for d in dob_str.replace("-", "") if d != '0']
    
    # Also add Mulank and Bhagyank to grid digits
    core = calculate_core_numbers(dob_str)
    grid_digits = clean_digits + [core["mulank"]["number"], core["bhagyank"]["number"]]
    
    digit_counts = {i: grid_digits.count(i) for i in range(1, 10)}
    
    # Plane strengths
    mental_plane = all(digit_counts[d] > 0 for d in [4, 9, 2])
    emotional_plane = all(digit_counts[d] > 0 for d in [3, 5, 7])
    practical_plane = all(digit_counts[d] > 0 for d in [8, 1, 6])
    
    thought_plane = all(digit_counts[d] > 0 for d in [4, 3, 8])
    will_plane = all(digit_counts[d] > 0 for d in [9, 5, 1])
    action_plane = all(digit_counts[d] > 0 for d in [2, 7, 6])
    
    # Missing numbers
    missing_numbers = [i for i in range(1, 10) if digit_counts[i] == 0]

    return {
        "grid_matrix": [
            [digit_counts[4], digit_counts[9], digit_counts[2]],
            [digit_counts[3], digit_counts[5], digit_counts[7]],
            [digit_counts[8], digit_counts[1], digit_counts[6]]
        ],
        "planes": {
            "mental_plane_4_9_2": mental_plane,
            "emotional_plane_3_5_7": emotional_plane,
            "practical_plane_8_1_6": practical_plane,
            "thought_plane_4_3_8": thought_plane,
            "will_plane_9_5_1": will_plane,
            "action_plane_2_7_6": action_plane
        },
        "missing_numbers": missing_numbers
    }
