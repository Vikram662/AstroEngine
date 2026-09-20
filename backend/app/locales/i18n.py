import json
import os
from typing import Dict, Any

LOCALES_CACHE: Dict[str, Dict[str, Any]] = {}
LOCALES_DIR = os.path.dirname(__file__)

SUPPORTED_LOCALES = {"en", "hi", "ta", "te", "bn", "gu", "mr"}

def get_locale_data(lang: str) -> Dict[str, Any]:
    """Load and cache locale JSON dictionary."""
    clean_lang = (lang or "en").lower().strip()
    if clean_lang not in SUPPORTED_LOCALES:
        clean_lang = "en"

    if clean_lang in LOCALES_CACHE:
        return LOCALES_CACHE[clean_lang]
    
    file_path = os.path.join(LOCALES_DIR, f"{clean_lang}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            LOCALES_CACHE[clean_lang] = data
            return data
    return {}

def translate_entity(category: str, token_id: str, lang: str, fallback: str) -> str:
    """Lookup translated string for given entity token e.g. planets.SUN -> सूर्य."""
    if not lang or lang.lower() == "en":
        return fallback
    clean_lang = lang.lower().strip()
    if clean_lang not in SUPPORTED_LOCALES:
        return fallback

    loc = get_locale_data(clean_lang)
    cat_dict = loc.get(category, {})

    clean_token = str(token_id or "").strip()
    # Try exact match, upper match, underscore match
    if clean_token in cat_dict:
        return cat_dict[clean_token]
    
    upper_token = clean_token.upper().replace(" ", "_")
    if upper_token in cat_dict:
        return cat_dict[upper_token]

    return fallback

def get_localized_planet(p_id: str, lang: str, fallback: str = "") -> str:
    return translate_entity("planets", p_id, lang, fallback or p_id)

def get_localized_sign(s_id: str, lang: str, fallback: str = "") -> str:
    return translate_entity("signs", s_id, lang, fallback or s_id)

def get_localized_nakshatra(n_id: str, lang: str, fallback: str = "") -> str:
    return translate_entity("nakshatras", n_id, lang, fallback or n_id)

def get_localized_vaar(v_id: str, lang: str, fallback: str = "") -> str:
    return translate_entity("vaars", v_id, lang, fallback or v_id)

def get_localized_choghadiya(c_id: str, lang: str, fallback: str = "") -> str:
    return translate_entity("choghadiya", c_id, lang, fallback or c_id)

def get_localized_dosha(d_id: str, lang: str, fallback: str = "") -> str:
    return translate_entity("doshas", d_id, lang, fallback or d_id)
