"""
Comprehensive Content Localization & Translation Engine
Supports all 5 Primary Client Languages:
- en: English
- hi: हिन्दी (Hindi)
- ta: தமிழ் (Tamil)
- te: తెలుగు (Telugu)
- bn: বাংলা (Bengali)
"""

from typing import Dict, Any, List, Optional

# 1. Planetary Names Across 5 Languages
PLANET_I18N = {
    "SUN": {"en": "Sun", "hi": "सूर्य", "ta": "சூரியன்", "te": "సూర్యుడు", "bn": "সূর্য"},
    "MOON": {"en": "Moon", "hi": "चंद्रमा", "ta": "சந்திரன்", "te": "చంద్రుడు", "bn": "চন্দ্র"},
    "MARS": {"en": "Mars", "hi": "मंगल", "ta": "செவ்வாய்", "te": "కుజుడు", "bn": "মঙ্গল"},
    "MERCURY": {"en": "Mercury", "hi": "बुध", "ta": "புதன்", "te": "బుధుడు", "bn": "বুধ"},
    "JUPITER": {"en": "Jupiter", "hi": "बृहस्पति / गुरु", "ta": "குரு", "te": "గురుడు", "bn": "বৃহস্পতি"},
    "VENUS": {"en": "Venus", "hi": "शुक्र", "ta": "சுக்கிரன்", "te": "శుక్రుడు", "bn": "শুক্র"},
    "SATURN": {"en": "Saturn", "hi": "शनि", "ta": "சனி", "te": "శని", "bn": "শনি"},
    "RAHU": {"en": "Rahu", "hi": "राहु", "ta": "ராகு", "te": "రాహువు", "bn": "রাহু"},
    "KETU": {"en": "Ketu", "hi": "केतु", "ta": "கேது", "te": "కేతువు", "bn": "কেতু"}
}

# 2. Zodiac Sign Names Across 5 Languages
SIGN_I18N = {
    1: {"en": "Aries", "hi": "मेष", "ta": "மேஷம்", "te": "మేషం", "bn": "মেষ"},
    2: {"en": "Taurus", "hi": "वृषभ", "ta": "ரிஷபம்", "te": "వృషభం", "bn": "বৃষ"},
    3: {"en": "Gemini", "hi": "मिथुन", "ta": "மிதுனம்", "te": "మిథునం", "bn": "মিথুন"},
    4: {"en": "Cancer", "hi": "कर्क", "ta": "கடகம்", "te": "కర్కాటకం", "bn": "কর্কট"},
    5: {"en": "Leo", "hi": "सिंह", "ta": "சிம்மம்", "te": "సింహం", "bn": "সিংহ"},
    6: {"en": "Virgo", "hi": "कन्या", "ta": "கன்னி", "te": "కన్య", "bn": "কন্যা"},
    7: {"en": "Libra", "hi": "तुला", "ta": "துலாம்", "te": "తుల", "bn": "তুলা"},
    8: {"en": "Scorpio", "hi": "वृश्चिक", "ta": "விருச்சிகம்", "te": "వృశ్చికం", "bn": "বৃশ্চিক"},
    9: {"en": "Sagittarius", "hi": "धनु", "ta": "தனுசு", "te": "ధనుస్సు", "bn": "ধনু"},
    10: {"en": "Capricorn", "hi": "मकर", "ta": "மகரம்", "te": "మకరం", "bn": "মকর"},
    11: {"en": "Aquarius", "hi": "कुंभ", "ta": "கும்பம்", "te": "కుంభం", "bn": "কুম্ভ"},
    12: {"en": "Pisces", "hi": "मीन", "ta": "மீனம்", "te": "మీనం", "bn": "মীন"}
}

# 3. Weekdays Across 5 Languages
WEEKDAY_I18N = {
    0: {"en": "Monday", "hi": "सोमवार", "ta": "திங்கள்", "te": "సోమవారం", "bn": "সোমবার"},
    1: {"en": "Tuesday", "hi": "मंगलवार", "ta": "செவ்வாய்", "te": "మంగళవారం", "bn": "মঙ্গলবার"},
    2: {"en": "Wednesday", "hi": "बुधवार", "ta": "புதன்", "te": "బుధవారం", "bn": "বুধবার"},
    3: {"en": "Thursday", "hi": "गुरुवार", "ta": "வியாழன்", "te": "గురువారం", "bn": "বৃহস্পতিবার"},
    4: {"en": "Friday", "hi": "शुक्रवार", "ta": "வெள்ளி", "te": "శుక్రవారం", "bn": "শুক্রবার"},
    5: {"en": "Saturday", "hi": "शनिवार", "ta": "சனி", "te": "శనివారం", "bn": "শনিবার"},
    6: {"en": "Sunday", "hi": "रविवार", "ta": "ஞாயிறு", "te": "ఆదివారం", "bn": "রবিবার"}
}

# Helper to normalize lang code
def normalize_lang(lang: Optional[str]) -> str:
    l = (lang or "en").lower().strip()
    return l if l in {"en", "hi", "ta", "te", "bn"} else "en"

def get_planet_i18n(planet_key: str, lang: str) -> str:
    k = planet_key.upper().strip()
    l = normalize_lang(lang)
    data = PLANET_I18N.get(k, {})
    return data.get(l, data.get("en", planet_key))

def get_sign_i18n(sign_num_or_name: Any, lang: str) -> str:
    l = normalize_lang(lang)
    if isinstance(sign_num_or_name, int) and 1 <= sign_num_or_name <= 12:
        return SIGN_I18N[sign_num_or_name].get(l, SIGN_I18N[sign_num_or_name]["en"])
    # String search
    name_clean = str(sign_num_or_name).strip().title()
    for idx, d in SIGN_I18N.items():
        if d["en"].lower() == name_clean.lower() or d.get("hi") == name_clean:
            return d.get(l, d["en"])
    return str(sign_num_or_name)

# 4. Horoscope Template Generator (Daily, Weekly, Monthly, Yearly)
def generate_horoscope_text(
    rashi_name_en: str,
    rashi_idx: int,
    lord_en: str,
    lucky_color: str,
    lucky_num: int,
    moon_house: int,
    is_shubh: bool,
    lang: str
) -> Dict[str, str]:
    l = normalize_lang(lang)
    r_name = get_sign_i18n(rashi_idx, l)
    p_lord = get_planet_i18n(lord_en, l)

    if l == "hi":
        return {
            "overview": f"आज {r_name} राशि के जातकों के लिए गोचर चंद्रमा {moon_house}वें भाव में संचार कर रहा है। {'कार्यक्षेत्र में विशेष सफलता और नए कार्यों की शुरुआत के शुभ संकेत हैं।' if is_shubh else 'आज का दिन मिला-जुला रहेगा, महत्वपूर्ण निर्णयों में धैर्य और संयम रखें।'} राशि स्वामी {p_lord} की दृष्टि से आत्मविश्वास में वृद्धि होगी।",
            "career": "नौकरी व कारोबार में आपके प्रयास सफल होंगे। सहयोगियों का भरपूर समर्थन मिलेगा।",
            "finance": "आर्थिक स्थिति सुदृढ़ रहेगी। आकस्मिक लाभ के अवसर बन सकते हैं।",
            "love": "पारिवारिक और दांपत्य जीवन में मधुरता बनी रहेगी। जीवनसाथी के साथ सामंजस्य बढ़ेगा।",
            "health": "स्वास्थ्य सामान्य रहेगा। नियमित दिनचर्या और योग पर ध्यान दें।",
            "guidance": f"आज {lucky_color} रंग का प्रयोग शुभ रहेगा और शुभ अंक {lucky_num} है।"
        }
    elif l == "ta":
        return {
            "overview": f"இன்று {r_name} ராசி நேயர்களுக்கு கோசார சந்திரன் {moon_house}-ஆம் இடத்தில் சஞ்சரிக்கிறார். {'தொழில் மற்றும் பணியில் முன்னேற்றமும் சுப காரியங்களுக்கான நல்வாய்ப்புகளும் உண்டாகும்.' if is_shubh else 'இன்றைய நாள் நிதானத்துடன் செயல்பட வேண்டிய நாளாக இருக்கும்.'} ராசி அதிபதி {p_lord} அருளால் தன்னம்பிக்கை அதிகரிக்கும்.",
            "career": "உத்தியோகம் மற்றும் வியாபாரத்தில் புதிய நன்மைகள் கிடைக்கும். சக ஊழியர்களின் ஆதரவு உண்டு.",
            "finance": "பொருளாதார நிலை சீராக இருக்கும். எதிர்பாராத பண வரவு உண்டாகலாம்.",
            "love": "குடும்பத்தில் மகிழ்ச்சியும் அமைதியும் நிலவும். வாழ்க்கைத்துணையுடன் நல்ல புரிதல் ஏற்படும்.",
            "health": "உடல் ஆரோக்கியம் சீராக இருக்கும். சரியான உணவு முறையைக் கடைப்பிடிக்கவும்.",
            "guidance": f"இன்றைய சுப நிறம்: {lucky_color}, அதிர்ஷ்ட எண்: {lucky_num}."
        }
    elif l == "te":
        return {
            "overview": f"ఈరోజు {r_name} రాశి వారికి గోచార చంద్రుడు {moon_house}వ స్థానంలో సంచరిస్తున్నాడు. {'వృత్తి వ్యాపారాలలో ఆశించిన విజయాలు మరియు శుభ ఫలితాలు లభిస్తాయి.' if is_shubh else 'ఈరోజు పనులలో కొంత ఓర్పు, సంయమనం పాటించడం మంచిది.'} రాశ్యాధిపతి {p_lord} అనుగ్రహంతో ఆత్మవిశ్వాసం పెరుగుతుంది.",
            "career": "ఉద్యోగ వ్యాపారాలలో మీ శ్రమకు తగిన ప్రతిఫలం లభిస్తుంది. తోటివారి సహకారం ఉంటుంది.",
            "finance": "ఆర్థిక పరిస్థితి నిలకడగా ఉంటుంది. అనుకూలమైన ధన లాభాలు ఉంటాయి.",
            "love": "కుటుంబంలో మరియు వైవాహిక జీవితంలో ఆనందం, పరస్పర అవగాహన పెరుగుతుంది.",
            "health": "ఆరోగ్యం బాగుంటుంది. సమయానికి ఆహారం తీసుకోవడం ముఖ్యం.",
            "guidance": f"ఈరోజు మీకు అనుకూలమైన రంగు: {lucky_color}, అదృష్ట సంఖ్య: {lucky_num}."
        }
    elif l == "bn":
        return {
            "overview": f"আজ {r_name} রাশির জাতক-জাতিকাদের জন্য গোচর চন্দ্র {moon_house}ম ভাবে অবস্থান করছে। {'কর্মক্ষেত্রে উল্লেখযোগ্য সাফল্য ও নতুন কাজের শুভ সম্ভাবনা রয়েছে।' if is_shubh else 'আজকের দিনটি মিশ্র ফলদায়ী হবে, ধৈর্য ও সংযমের সাথে সিদ্ধান্ত নিন।'} রাশি অধিপতি {p_lord}-র প্রভাবে আত্মবিশ্বাস বৃদ্ধি পাবে।",
            "career": "চাকরি ও ব্যবসায় আপনার প্রচেষ্টা সফল হবে। সহকর্মীদের সহযোগিতা পাবেন।",
            "finance": "আর্থিক পরিস্থিতি স্থিতিশীল থাকবে। আকস্মিক ধনাগমনের যোগ রয়েছে।",
            "love": "পারিবারিক ও দাম্পত্য জীবনে মাধুর্য বজায় থাকবে। সঙ্গীর সাথে বোঝাপড়া বৃদ্ধি পাবে।",
            "health": "স্বাস্থ্য সার্বিকভাবে ভালো থাকবে। সুষম আহার ও ইতিবাচক মনোভাব বজায় রাখুন।",
            "guidance": f"আজকের শুভ রঙ: {lucky_color}, শুভ সংখ্যা: {lucky_num}."
        }
    else:
        return {
            "overview": f"For {rashi_name_en} natives, transiting Moon operates in your {moon_house}th house today. {'Favorable day for career advancements, financial gains, and initiating ventures.' if is_shubh else 'A balanced day calling for patience, diplomacy, and composed communication.'} Ruling planet {lord_en} infuses focus and stamina.",
            "career": "Professional productivity is heightened today. Positive backing from peers creates fruitful outcomes.",
            "finance": "Stable financial outlook. Calculated investments or deferred dues are likely to yield encouraging results.",
            "love": "Harmony prevails in relationships. Thoughtful conversations deepen emotional understanding with your partner.",
            "health": "Good overall vitality. Maintain hydration and stick to structured dietary habits.",
            "guidance": f"Auspicious color for today is {lucky_color} and lucky number is {lucky_num}."
        }

# 5. 12 Houses Bhavaphala & Predictions Across 5 Languages
def generate_house_prediction_i18n(
    house_num: int,
    house_name_en: str,
    sign_name_en: str,
    sign_lord_en: str,
    domain_en: str,
    occupants: List[str],
    score: int,
    lang: str
) -> Dict[str, str]:
    l = normalize_lang(lang)
    sign_local = get_sign_i18n(sign_name_en, l)
    lord_local = get_planet_i18n(sign_lord_en, l)
    occ_str = ", ".join([get_planet_i18n(p, l) for p in occupants]) if occupants else ""

    if l == "hi":
        occ_text = f"उपस्थित ग्रह: {occ_str}।" if occ_str else "कोई प्रत्यक्ष ग्रह नहीं (दृष्टि प्रभाव सक्रिय)।"
        pred = f"{house_num}वें भाव में {sign_local} राशि है जिसके स्वामी {lord_local} हैं। {occ_text} यह भाव जीवन में {'अत्यंत शुभ और उन्नतिदायक परिणाम प्रदान करेगा।' if score >= 80 else 'परिश्रम और निरंतरता से सफलता प्रदान करेगा।'}"
        remedy = f"{lord_local} के बीज मंत्र का जप और संबंधित वार को शुभ दान करें।"
        return {"prediction": pred, "remedy": remedy}
    elif l == "ta":
        occ_text = f"அமர்ந்துள்ள கிரகங்கள்: {occ_str}." if occ_str else "நேரடி கிரகங்கள் இல்லை (பார்வை பலன் உண்டு)."
        pred = f"{house_num}-ஆம் இடத்தில் {sign_local} ராசி அமைந்து, அதன் அதிபதியாக {lord_local} விளங்குகிறார். {occ_text} இந்த பாவம் {'மிகச் சிறந்த நற்பலன்களையும் உயர்வுகளையும் தரும்.' if score >= 80 else 'முயற்சிகளுக்கு ஏற்ற சீரான பலன்களைத் தரும்.'}"
        remedy = f"{lord_local} கிரகத்திற்குரிய பிரார்தனை மற்றும் சுப தானங்கள் நலம் பயக்கும்."
        return {"prediction": pred, "remedy": remedy}
    elif l == "te":
        occ_text = f"ఉన్న గ్రహాలు: {occ_str}." if occ_str else "ప్రత్యక్ష గ్రహాలు లేవు (దృష్టి ప్రభావం ఉంది)."
        pred = f"{house_num}వ స్థానంలో {sign_local} రాశి ఉంది, దీనికి అధిపతి {lord_local}. {occ_text} ఈ స్థానం జీవితంలో {'అత్యంత అనుకూలమైన మరియు అభివృద్ధిదాయక ఫలితాలను ఇస్తుంది.' if score >= 80 else 'శ్రమతో కూడిన స్థిరమైన ఫలితాలను ఇస్తుంది.'}"
        remedy = f"{lord_local} అనుగ్రహం కోసం శ్రద్ధతో ప్రార్థన మరియు సంబంధిత దానాలు చేయండి."
        return {"prediction": pred, "remedy": remedy}
    elif l == "bn":
        occ_text = f"অবস্থিত গ্রহ: {occ_str}।" if occ_str else "কোনো প্রত্যক্ষ গ্রহ নেই (দৃষ্টির প্রভাব সক্রিয়)।"
        pred = f"{house_num}ম ভাবে {sign_local} রাশি অবস্থিত যার অধিপতি {lord_local}। {occ_text} এই ভাবটি জীবনে {'অত্যন্ত শুভ ও উন্নতিসূচক ফলাফল প্রদান করবে।' if score >= 80 else 'পরিশ্রমের মাধ্যমে ধারাবাহিক সাফল্য প্রদান করবে।'}"
        remedy = f"{lord_local}-র অনুকূলতার জন্য নিয়মিত ধ্যান ও শুভ দিনে দান করুন।"
        return {"prediction": pred, "remedy": remedy}
    else:
        occ_text = f"Occupant planets: {', '.join(occupants)}." if occupants else "None directly occupying (Aspect influence active)."
        pred = f"House {house_num} falls in {sign_name_en} ruled by {sign_lord_en}. {occ_text} This configuration indicates {'highly favorable and progressive outcomes.' if score >= 80 else 'balanced results requiring structured effort.'}"
        remedy = f"Perform mindful rituals and charity aligned with {sign_lord_en}."
        return {"prediction": pred, "remedy": remedy}

# 6. AI Astrologer Natural Language Response Across 5 Languages
def generate_ai_astrologer_text_i18n(
    category_title: str,
    asc_sign_en: str,
    primary_house: int,
    house_lord_en: str,
    running_md_en: str,
    running_ad_en: str,
    ad_end_date: str,
    score: int,
    lang: str
) -> Dict[str, str]:
    l = normalize_lang(lang)
    asc_local = get_sign_i18n(asc_sign_en, l)
    lord_local = get_planet_i18n(house_lord_en, l)
    md_local = get_planet_i18n(running_md_en, l)
    ad_local = get_planet_i18n(running_ad_en, l)

    if l == "hi":
        answer = (
            f"आपकी लग्न कुंडली **{asc_local} लग्न** की है। आपके प्रश्न ({category_title}) के लिए कुंडली का **{primary_house}वां भाव** और इसके स्वामी **{lord_local}** मुख्य नियंत्रक हैं।\n\n"
            f"वर्तमान में आपकी कुंडली में **{md_local} की महादशा में {ad_local} की अंतर्दशा** चल रही है (प्रभावी तिथि: {ad_end_date})। "
            f"{'ग्रह स्थितियां अत्यधिक अनुकूल हैं। आपको अपने प्रयासों में सकारात्मक परिणाम, तरक्की और स्थिरता मिलने के अत्यंत प्रबल योग हैं।' if score >= 75 else 'परिस्थितियां सामान्य से बेहतर हैं। थोड़े परिश्रम और धैर्य से वांछित सफलता प्राप्त होगी।'}"
        )
        timing = f"आगामी 6 से 12 महीने आपके लिए विशेष फलदायी सिद्ध होंगे।"
        remedy = f"{lord_local} की कृपा प्राप्ति हेतु मंत्र जप एवं गुरुवार/शनिवार को शुभ दान करें।"
    elif l == "ta":
        answer = (
            f"உங்கள் லக்னம் **{asc_local} லக்னம்** ஆகும். உங்கள் கேள்விக்கான முக்கிய பாவம் **{primary_house}-ஆம் இடம்**, அதன் அதிபதி **{lord_local}** ஆவார்.\n\n"
            f"தற்போது உங்கள் ஜாதகத்தில் **{md_local} மகாதிசையில் {ad_local} அந்தர்திசை** நடைபெறுகிறது (கால அளவு: {ad_end_date} வரை). "
            f"{'கிரக நிலைகள் மிகவும் சாதகமாக உள்ளன. தொழில் மற்றும் வாழ்க்கையில் நல்ல முன்னேற்றமும் திருப்பங்களும் உண்டாகும்.' if score >= 75 else 'சூழ்நிலைகள் சீராக உள்ளன. விடாமுயற்சியுடன் செயல்பட்டால் நிச்சயம் வெற்றி உண்டு.'}"
        )
        timing = f"அடுத்த 6 முதல் 12 மாதங்கள் உங்களுக்கு மிகவும் நற்பலன்களைத் தரும் காலமாகும்."
        remedy = f"{lord_local} கிரகத்திற்குரிய வழிபாடுகளையும் சுப தானங்களையும் செய்வது நலம் தரும்."
    elif l == "te":
        answer = (
            f"మీ జన్మ లగ్నం **{asc_local} లగ్నం**. మీ ప్రశ్నకు సంబంధించి జాతకంలో **{primary_house}వ స్థానం** మరియు దాని అధిపతి **{lord_local}** ముఖ్యమైనవి.\n\n"
            f"ప్రస్తుతం మీకు **{md_local} మహాదశలో {ad_local} అంతర్దశ** నడుస్తోంది ({ad_end_date} వరకు). "
            f"{'గ్రహాల స్థితులు చాలా అనుకూలంగా ఉన్నాయి. మీ ప్రయత్నాలలో ఉన్నత ఫలితాలు, విజయాలు లభించే అవకాశాలు ఉన్నాయి.' if score >= 75 else 'పరిస్థితులు స్థిరంగా ఉన్నాయి. ఓర్పుతో కూడిన శ్రమతో విజయం సాధ్యమవుతుంది.'}"
        )
        timing = f"రాబోయే 6 నుండి 12 నెలల కాలం మీకు ఎంతో కీలకమైన మరియు ప్రయోజనకరమైన సమయం."
        remedy = f"{lord_local} అనుగ్రహం కొరకు సంబంధిత స్తోత్ర పఠనం మరియు దానధర్మాలు చేయండి."
    elif l == "bn":
        answer = (
            f"আপনার জন্ম লগ্ন **{asc_local} লগ্ন**। আপনার জিজ্ঞাসার ক্ষেত্রে কুষ্ঠির **{primary_house}ম ভাব** এবং এর অধিপতি **{lord_local}** প্রধান নিয়ন্ত্রক।\n\n"
            f"বর্তমানে আপনার কুণ্ডলীতে **{md_local}-র মহাদশায় {ad_local}-র অন্তর্দশা** চলছে ({ad_end_date} পর্যন্ত)। "
            f"{'গ্রহের অবস্থান অত্যন্ত অনুকূল। আপনার প্রচেষ্টায় ইতিবাচক ফল, উন্নতি ও স্থায়িত্ব অর্জনের প্রবল যোগ রয়েছে।' if score >= 75 else 'পরিস্থিতি সন্তোষজনক। ধৈর্য ও নিষ্ঠার সাথে কাজ করলে নিশ্চিত সাফল্য মিলবে।'}"
        )
        timing = f"আগামী ৬ থেকে ১২ মাস আপনার জন্য অত্যন্ত গুরুত্বপূর্ণ ও ফলপ্রসূ সময়।"
        remedy = f"{lord_local}-র শুভ প্রভাব বৃদ্ধির জন্য ইষ্টদেবের ধ্যান ও দান-ধ্যান করুন।"
    else:
        answer = (
            f"Your foundational chart is anchored in **{asc_sign_en} Ascendant**. For your inquiry regarding {category_title}, the **{primary_house}th House** and its governing lord **{house_lord_en}** act as primary astrological catalysts.\n\n"
            f"You are currently navigating through the **{running_md_en} Mahadasha** and **{running_ad_en} Antardasha** cycle until **{ad_end_date}**. "
            f"{'Planetary alignments are substantially favorable. High probability of progress, recognition, and breakthroughs.' if score >= 75 else 'Vibrations are steady. Gradual, dependable gains will manifest with persistent focus.'}"
        )
        timing = f"The window within the next 6 to 12 months will act as a pivotal turning point."
        remedy = f"Enhance {house_lord_en} energies through mindful routines and charity on relevant days."

    return {
        "prediction_answer": answer,
        "favorable_timing": timing,
        "prescribed_remedy": remedy
    }

# 7. Dosha Statuses & Verdicts Across 5 Languages
def get_dosha_verdict_i18n(dosha_type: str, is_present: bool, is_cancelled: bool, lang: str) -> str:
    l = normalize_lang(lang)
    if dosha_type == "MANGLIK":
        if not is_present:
            return {"en": "Non-Manglik (No Dosha)", "hi": "मांगलिक दोष नहीं है (पूर्णतः मुक्त)", "ta": "செவ்வாய் தோஷம் இல்லை", "te": "కుజ దోషం లేదు", "bn": "মাঙ্গলিক দোষ মুক্ত"}[l]
        if is_cancelled:
            return {"en": "Manglik Dosha Present but Completely Cancelled (BPHS Shastra Niyama)", "hi": "मांगलिक दोष शास्त्रीय नियमों से पूर्णतः निरस्त (दोष भंग योग)", "ta": "செவ்வாய் தோஷம் பரிகார விதிகளால் நிவர்த்தியானது", "te": "శాస్త్ర నియమాల ప్రకారం కుజ దోష పరిహారం జరిగింది", "bn": "শাস্ত্রীয় নিয়মে মাঙ্গলিক দোষ সম্পূর্ণ খণ্ডিত"}[l]
        return {"en": "Manglik Dosha Present (Remedies Advised)", "hi": "मांगलिक दोष उपस्थित (शास्त्रीय उपाय अनुशंसित)", "ta": "செவ்வாய் தோஷம் உள்ளது (பரிகாரம் தேவை)", "te": "కుజ దోషం ఉన్నది (పరిహారాలు అవసరం)", "bn": "মাঙ্গলিক দোষ বিদ্যমান (প্রতিকার প্রয়োজনীয়)"}[l]

    elif dosha_type == "SADE_SATI":
        if not is_present:
            return {"en": "Shani Sade Sati is Inactive", "hi": "शनि साढ़े साती वर्तमान में निष्प्रभावी है", "ta": "ஏழரை சனி தற்போது இல்லை", "te": "ప్రస్తుతం ఏలినాటి శని ప్రభావం లేదు", "bn": "বর্তমানে শনির সাড়ে সাতি কার্যকর নয়"}[l]
        return {"en": "Shani Sade Sati is Active", "hi": "शनि साढ़े साती का प्रभाव वर्तमान में सक्रिय है", "ta": "ஏழரை சனி காலம் நடப்பில் உள்ளது", "te": "ఏలినాటి శని ప్రభావం ప్రస్తుతం ఉన్నది", "bn": "শনির সাড়ে সাতি বর্তমানে সক্রিয়"}[l]

    elif dosha_type == "KAALSARP":
        if not is_present:
            return {"en": "No Kaal Sarp Dosha", "hi": "कालसर्प दोष नहीं है (शुभ स्थिति)", "ta": "காலசர்ப்ப தோஷம் இல்லை", "te": "కాలసర్ప దోషం లేదు", "bn": "কালসর্প দোষ নেই"}[l]
        return {"en": "Kaal Sarp Dosha Present", "hi": "कालसर्प योग/दोष उपस्थित", "ta": "காலசர்ப்ப தோஷம் உள்ளது", "te": "కాలసర్ప దోషం ఉన్నది", "bn": "কালসর্প যোগ/দোষ বিদ্যমান"}[l]

    return "Analyzed"
