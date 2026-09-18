import json
import os
from typing import Dict, Any

LOCALES_CACHE: Dict[str, Dict[str, Any]] = {}
LOCALES_DIR = os.path.dirname(__file__)

def get_locale_data(lang: str) -> Dict[str, Any]:
    """Load and cache locale JSON dictionary."""
    clean_lang = lang.lower() if lang else "en"
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
    loc = get_locale_data(lang)
    cat_dict = loc.get(category, {})
    return cat_dict.get(token_id, fallback)
