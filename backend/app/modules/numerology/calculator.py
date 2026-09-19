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
