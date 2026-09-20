"""
Tarot Deck definitions with 78 cards:
22 Major Arcana and 56 Minor Arcana (Wands, Cups, Swords, Pentacles).
Includes upright/reversed keywords, astrological correspondences, and deep meanings in English and Hindi.
"""

from typing import Dict, Any, List

MAJOR_ARCANA: List[Dict[str, Any]] = [
    {
        "id": "major_0",
        "name": "The Fool",
        "name_hi": "द फूल (मूर्ख / नवीन आरंभ)",
        "arcana": "major",
        "number": 0,
        "element": "Air",
        "astrology": "Uranus",
        "upright": {
            "keywords": ["New Beginnings", "Innocence", "Spontaneity", "Free Spirit", "Adventure"],
            "keywords_hi": ["नई शुरुआत", "मासूमियत", "साहस", "स्वतंत्रता", "नई यात्रा"],
            "meaning": "A fresh adventure begins with boundless trust in the universe. Take the leap of faith.",
            "meaning_hi": "जीवन में नए अध्याय का आरंभ है। बिना किसी डर के ब्रह्मांड पर भरोसा करके नया कदम उठाएं।",
            "advice": "Embrace the unknown with an open heart. Do not let fear hold back your true potential.",
            "advice_hi": "अज्ञात का स्वागत करें। पुराने डर को पीछे छोड़कर आगे बढ़ें।"
        },
        "reversed": {
            "keywords": ["Recklessness", "Risk-taking", "Hesitation", "Foolishness", "Naivety"],
            "keywords_hi": ["लापरवाही", "अनावश्यक जोखिम", "झिझक", "नासमझी"],
            "meaning": "Be cautious of reckless impulses. Blind risks could lead to avoidable mistakes.",
            "meaning_hi": "बिना सोचे-समझे कदम उठाने से बचें। जल्दबाज़ी में किया फैसला नुकसान दे सकता है।",
            "advice": "Look before you leap. Verify facts and prepare before taking giant steps.",
            "advice_hi": "कदम बढ़ाने से पहले ज़मीन की मजबूती परख लें।"
        }
    },
    {
        "id": "major_1",
        "name": "The Magician",
        "name_hi": "द मैजिशियन (जादूगर / सृजनकर्ता)",
        "arcana": "major",
        "number": 1,
        "element": "Air",
        "astrology": "Mercury",
        "upright": {
            "keywords": ["Manifestation", "Resourcefulness", "Power", "Inspired Action", "Skill"],
            "keywords_hi": ["संकल्प सिद्धि", "कौशल", "सृजन शक्ति", "इच्छाशक्ति", "संसाधन"],
            "meaning": "You possess all the tools, skills, and energy needed to manifest your highest desires into reality.",
            "meaning_hi": "आपके पास अपने सपनों को हकीकत में बदलने की पूरी शक्ति और साधन मौजूद हैं।",
            "advice": "Focus your willpower and channel your inner resources. The time for action is now.",
            "advice_hi": "अपनी इच्छाशक्ति को एक लक्ष्य पर केंद्रित करें। कार्य शुरू करने का सही समय है।"
        },
        "reversed": {
            "keywords": ["Manipulation", "Untapped Talents", "Deception", "Wasted Potential", "Trickery"],
            "keywords_hi": ["प्रतिभा का दुरुपयोग", "छल", "अधूरा प्रयास", "भटकाव"],
            "meaning": "Potential is blocked by self-doubt, or energy is being misdirected deceptively.",
            "meaning_hi": "अपनी शक्तियों का गलत दिशा में उपयोग या अपनी क्षमता पर अनावश्यक संदेह हो रहा है।",
            "advice": "Realign with pure intentions and refine your skills with honesty.",
            "advice_hi": "अपने इरादों को पवित्र रखें और प्रतिभा का सदुपयोग करें।"
        }
    },
    {
        "id": "major_2",
        "name": "The High Priestess",
        "name_hi": "द हाई प्रीस्टेस (गूढ़ ज्ञान / अंतर्ज्ञान)",
        "arcana": "major",
        "number": 2,
        "element": "Water",
        "astrology": "Moon",
        "upright": {
            "keywords": ["Intuition", "Sacred Knowledge", "Divine Feminine", "Subconscious Mind", "Mystery"],
            "keywords_hi": ["अंतर्ज्ञान", "गूढ़ रहस्य", "आंतरिक ज्ञान", "शांत मन", "सूक्ष्म दृष्टि"],
            "meaning": "Trust your gut feeling and inner voice. Hidden truths will reveal themselves when you remain still.",
            "meaning_hi": "अपनी आंतरिक आवाज़ (Intuition) पर विश्वास करें। उत्तर बाहरी दुनिया में नहीं, भीतर छिपा है।",
            "advice": "Listen closely to your dreams and quiet instinct rather than noisy external opinions.",
            "advice_hi": "बाहरी शोर के बजाय अपने दिल की सूक्ष्म आवाज़ को सुनें।"
        },
        "reversed": {
            "keywords": ["Ignored Intuition", "Secrets", "Superficiality", "Repressed Emotions"],
            "keywords_hi": ["अंतर्मन की उपेक्षा", "छिपे हुए राज़", "भावनात्मक भटकाव"],
            "meaning": "You are ignoring your inner guidance, resulting in confusion or deceit.",
            "meaning_hi": "आप अपनी आंतरिक आवाज़ को दबा रहे हैं जिससे भ्रम की स्थिति बन रही है।",
            "advice": "Take time for silent meditation to restore your spiritual balance.",
            "advice_hi": "ध्यान और मौन का सहारा लें ताकि मन का भ्रम दूर हो सके।"
        }
    },
    {
        "id": "major_3",
        "name": "The Empress",
        "name_hi": "द एम्प्रेस (महारानी / उर्वरता व समृद्धि)",
        "arcana": "major",
        "number": 3,
        "element": "Earth",
        "astrology": "Venus",
        "upright": {
            "keywords": ["Abundance", "Nurturing", "Fertility", "Creativity", "Beauty", "Nature"],
            "keywords_hi": ["समृद्धि", "स्नेह", "उर्वरता", "सृजनात्मकता", "सुख-सुविधा"],
            "meaning": "A period of lavish abundance, creative fruition, and unconditional care envelops your life.",
            "meaning_hi": "जीवन में सुख, ऐश्वर्य और रचनात्मकता का पूर्ण विकास होने वाला है।",
            "advice": "Nurture your creations, loved ones, and yourself with love and appreciation.",
            "advice_hi": "अपने काम और रिश्तों को प्रेम व धैर्य से सींचें।"
        },
        "reversed": {
            "keywords": ["Creative Block", "Dependence", "Smothering", "Emptiness", "Disharmony"],
            "keywords_hi": ["रचनात्मक रुकावट", "अति-निर्भरता", "असंतोष", "थकान"],
            "meaning": "Neglecting self-care or giving too much to others without replenishing your own energy.",
            "meaning_hi": "खुद की देखभाल न करने से ऊर्जा में कमी आ रही है।",
            "advice": "Prioritize your personal wellness and reconnect with nature.",
            "advice_hi": "पहले स्वयं को मानसिक और शारीरिक रूप से स्वस्थ बनाएं।"
        }
    },
    {
        "id": "major_4",
        "name": "The Emperor",
        "name_hi": "द एम्परर (सम्राट / अनुशासन व सत्ता)",
        "arcana": "major",
        "number": 4,
        "element": "Fire",
        "astrology": "Aries",
        "upright": {
            "keywords": ["Authority", "Structure", "Stability", "Father Figure", "Leadership", "Protection"],
            "keywords_hi": ["सत्ता", "अनुशासन", "स्थिरता", "नेतृत्व", "मजबूत नींव"],
            "meaning": "Solid leadership, structured rules, and unwavering discipline create unstoppable success.",
            "meaning_hi": "अनुशासन, स्पष्ट नियम और मजबूत नेतृत्व से कठिन से कठिन लक्ष्य हासिल होगा।",
            "advice": "Take charge with calm authority and organize your plans with strategic clarity.",
            "advice_hi": "आत्मविश्वास के साथ नेतृत्व करें और अपने कार्य को व्यवस्थित करें।"
        },
        "reversed": {
            "keywords": ["Tyranny", "Rigidity", "Lack of Control", "Chaos", "Abuse of Power"],
            "keywords_hi": ["हठधर्मिता", "अत्यधिक सख्ती", "नियंत्रण खोना", "तानाशाही"],
            "meaning": "Excessive rigidity, micromanagement, or rebellious conflict against authority.",
            "meaning_hi": "अनावश्यक ज़िद या दूसरों पर अत्यधिक नियंत्रण करने की आदत तनाव दे रही है।",
            "advice": "Cultivate flexibility. True strength leads with wisdom, not fear.",
            "advice_hi": "लचीलापन अपनाएं। कठोरता के बजाय समझदारी से काम लें।"
        }
    },
    {
        "id": "major_5",
        "name": "The Hierophant",
        "name_hi": "द हायरोफैंट (धर्मगुरु / परंपरा व ज्ञान)",
        "arcana": "major",
        "number": 5,
        "element": "Earth",
        "astrology": "Taurus",
        "upright": {
            "keywords": ["Tradition", "Spiritual Wisdom", "Institutions", "Mentorship", "Belief Systems"],
            "keywords_hi": ["परंपरा", "मार्गदर्शन", "गुरु कृपा", "संस्कार", "आध्यात्मिक ज्ञान"],
            "meaning": "Adherence to proven principles, ethical wisdom, and seeking guidance from a trusted mentor.",
            "meaning_hi": "पारंपरिक ज्ञान, गुरु के मार्गदर्शन और नैतिक मूल्यों पर चलने से सफलता मिलेगी।",
            "advice": "Honor established traditions and learn from experienced teachers.",
            "advice_hi": "अनुभवी व्यक्तियों और बड़ों के मार्गदर्शन का सम्मान करें।"
        },
        "reversed": {
            "keywords": ["Rebellion", "Unconventional Wisdom", "Challenging Status Quo", "Dogma"],
            "keywords_hi": ["परंपराओं को चुनौती", "नया दृष्टिकोण", "हठधर्मिता का विरोध"],
            "meaning": "Outdated dogmas are restricting growth. Forge your own personal spiritual path.",
            "meaning_hi": "रूढ़िवादी सोच आपके विकास में बाधक बन रही है। नए रास्ते तलाशने का समय है।",
            "advice": "Question dogmatic rules that no longer serve your higher good.",
            "advice_hi": "उन मान्यताओं को त्यागें जो आपकी प्रगति रोक रही हैं।"
        }
    },
    {
        "id": "major_6",
        "name": "The Lovers",
        "name_hi": "द लवर्स (प्रेमी / सामंजस्य व निर्णय)",
        "arcana": "major",
        "number": 6,
        "element": "Air",
        "astrology": "Gemini",
        "upright": {
            "keywords": ["Love", "Harmony", "Relationships", "Values Alignment", "Choice"],
            "keywords_hi": ["प्रेम", "सामंजस्य", "मधुर संबंध", "सही चुनाव", "सद्भाव"],
            "meaning": "Soulmate connections, deep emotional bonds, and pivotal choices aligned with moral values.",
            "meaning_hi": "रिश्तों में गहरा तालमेल और जीवन में ऐसा महत्वपूर्ण चुनाव जो आपके जीवन मूल्यों से जुड़ा है।",
            "advice": "Choose from the heart with integrity. True partnerships thrive on mutual respect.",
            "advice_hi": "दिल और विवेक का संतुलन रखकर निर्णय लें।"
        },
        "reversed": {
            "keywords": ["Disharmony", "Misalignment of Values", "Broken Trust", "Difficult Choice"],
            "keywords_hi": ["मतभेद", "अविश्वास", "गलत चुनाव", "रिश्तों में खिंचाव"],
            "meaning": "Conflicts in values, communication breakdown, or fear of making an inevitable decision.",
            "meaning_hi": "रिश्तों में तालमेल की कमी या दो रास्तों के बीच दुविधा।",
            "advice": "Clear honest communication is essential to resolve underlying dissonance.",
            "advice_hi": "खुलकर संवाद करें और अपने मूल मूल्यों पर टिके रहें।"
        }
    },
    {
        "id": "major_7",
        "name": "The Chariot",
        "name_hi": "द चैरियट (रथ / विजय व संकल्प)",
        "arcana": "major",
        "number": 7,
        "element": "Water",
        "astrology": "Cancer",
        "upright": {
            "keywords": ["Victory", "Willpower", "Determination", "Focus", "Overcoming Obstacles"],
            "keywords_hi": ["विजय", "दृढ़ संकल्प", "एकाग्रता", "बाधाओं पर जीत", "प्रगति"],
            "meaning": "Triumphant breakthrough achieved by mastering opposing forces through sheer determination.",
            "meaning_hi": "दृढ़ इच्छाशक्ति और एकाग्रता से आप सभी कठिनाइयों को पार कर विजय प्राप्त करेंगे।",
            "advice": "Keep your eyes locked on the goal. Harness conflicting energies toward one triumph.",
            "advice_hi": "अपने लक्ष्य से न भटकें। अनुशासन ही जीत की कुंजी है।"
        },
        "reversed": {
            "keywords": ["Lack of Direction", "Aggression", "Loss of Control", "Obstacles"],
            "keywords_hi": ["दिशाहीनता", "अनावश्यक क्रोध", "नियंत्रण का अभाव"],
            "meaning": "Inner impatience or external friction is causing you to lose momentum and direction.",
            "meaning_hi": "जल्दबाज़ी या उतावलेपन के कारण नियंत्रण हाथ से फिसल रहा है।",
            "advice": "Re-evaluate your course. Patience and strategic reinvention are required.",
            "advice_hi": "गति धीमी करें और पहले अपनी दिशा सुनिश्चित करें।"
        }
    },
    {
        "id": "major_8",
        "name": "Strength",
        "name_hi": "स्ट्रेंथ (आत्मबल / धैर्य व साहस)",
        "arcana": "major",
        "number": 8,
        "element": "Fire",
        "astrology": "Leo",
        "upright": {
            "keywords": ["Courage", "Patience", "Compassion", "Gentle Power", "Inner Strength"],
            "keywords_hi": ["आत्मबल", "धैर्य", "करुणा", "मृदु शक्ति", "संयम"],
            "meaning": "True power is not brute force, but gentle mastery over fears and primal impulses.",
            "meaning_hi": "सच्ची शक्ति क्रोध में नहीं, बल्कि शांत रहकर धैर्य और करुणा से परिस्थितियों को जीतने में है।",
            "advice": "Handle tough situations with soft diplomacy and inner resilience.",
            "advice_hi": "क्रोध के बजाय धैर्य और समझदारी से काम लें।"
        },
        "reversed": {
            "keywords": ["Self-Doubt", "Weakness", "Raw Emotion", "Insecurity"],
            "keywords_hi": ["आत्म-संदेह", "कमजोरी महसूस होना", "असुरक्षा की भावना"],
            "meaning": "Self-doubt is temporarily dimming your innate lion-hearted courage.",
            "meaning_hi": "नकारात्मक विचारों के कारण आपका आत्मविश्वास डगमगा रहा है।",
            "advice": "Remember past triumphs. You are far stronger than your momentary anxieties.",
            "advice_hi": "अपनी पुरानी जीतों को याद करें और खुद पर भरोसा बनाए रखें।"
        }
    },
    {
        "id": "major_9",
        "name": "The Hermit",
        "name_hi": "द हर्मिट (एकांतवासी / आत्मचिंतन व प्रकाश)",
        "arcana": "major",
        "number": 9,
        "element": "Earth",
        "astrology": "Virgo",
        "upright": {
            "keywords": ["Soul-Searching", "Introspection", "Solitude", "Inner Guidance", "Wisdom"],
            "keywords_hi": ["आत्मचिंतन", "एकांत", "आत्मनिरीक्षण", "आंतरिक प्रकाश", "मार्गदर्शन"],
            "meaning": "A period of thoughtful retreat from outer chaos to discover profound spiritual clarity.",
            "meaning_hi": "बाहरी दुनिया की भागदौड़ से हटकर आत्मचिंतन करने का समय। उत्तर आपके भीतर है।",
            "advice": "Embrace quiet solitude to illuminate your true life direction.",
            "advice_hi": "कुछ समय एकांत में बिताएं और अपने लक्ष्यों की समीक्षा करें।"
        },
        "reversed": {
            "keywords": ["Loneliness", "Isolation", "Withdrawal", "Reclusiveness"],
            "keywords_hi": ["अकेलापन", "अलगाव", "अत्यधिक दूरी"],
            "meaning": "Unhealthy isolation turning into loneliness. It is time to re-engage with society.",
            "meaning_hi": "एकांत का अति हो जाना अकेलापन बन सकता है। समाज और अपनों से जुड़ें।",
            "advice": "Reach out to trusted companions and reconnect with life.",
            "advice_hi": "अपनों के साथ बातचीत करें और दुनिया से न कटें।"
        }
    },
    {
        "id": "major_10",
        "name": "Wheel of Fortune",
        "name_hi": "व्हील ऑफ फॉर्च्यून (भाग्य चक्र / परिवर्तन)",
        "arcana": "major",
        "number": 10,
        "element": "Fire",
        "astrology": "Jupiter",
        "upright": {
            "keywords": ["Good Luck", "Karma", "Life Cycles", "Destiny", "Turning Point"],
            "keywords_hi": ["सौभाग्य", "कर्म चक्र", "भाग्य का पलटना", "सकारात्मक बदलाव", "दैवीय कृपा"],
            "meaning": "The wheel is turning in your favor. Expect sudden positive breakthroughs and serendipity.",
            "meaning_hi": "किस्मत का पहिया आपके पक्ष में घूम रहा है। अचानक सुखद बदलाव और अवसर आएंगे।",
            "advice": "Seize the golden opportunities presented to you and stay humble.",
            "advice_hi": "आए हुए अवसरों का पूरा लाभ उठाएं और अहंकार से बचें।"
        },
        "reversed": {
            "keywords": ["Bad Luck", "Resistance to Change", "Cycles Repeating", "Setbacks"],
            "keywords_hi": ["अस्थाई रुकावट", "बदलाव का विरोध", "सख्त इम्तिहान"],
            "meaning": "A temporary dip in the cycle. Do not despair; what goes down will rise again.",
            "meaning_hi": "समय का एक कठिन दौर जो जल्द ही बीत जाएगा। धैर्य रखें।",
            "advice": "Flow with life rather than resisting inevitable change.",
            "advice_hi": "परिवर्तन का विरोध न करें, बल्कि नई परिस्थितियों के अनुसार ढलें।"
        }
    },
    {
        "id": "major_11",
        "name": "Justice",
        "name_hi": "जस्टिस (न्याय / निष्पक्षता व संतुलन)",
        "arcana": "major",
        "number": 11,
        "element": "Air",
        "astrology": "Libra",
        "upright": {
            "keywords": ["Justice", "Fairness", "Truth", "Cause and Effect", "Law"],
            "keywords_hi": ["न्याय", "सच्चाई", "संतुलन", "निष्पक्षता", "कर्म का फल"],
            "meaning": "Truth prevails. Legal affairs, contracts, and moral dilemmas will resolve fairly.",
            "meaning_hi": "सत्य और निष्पक्षता की जीत होगी। जो कर्म आपने किए हैं उसका उचित फल मिलेगा।",
            "advice": "Act with absolute honesty and weigh all perspectives objectively.",
            "advice_hi": "पूर्ण ईमानदारी बरतें और कोई भी फैसला पक्षपात रहित होकर लें।"
        },
        "reversed": {
            "keywords": ["Unfairness", "Lack of Accountability", "Dishonesty", "Bias"],
            "keywords_hi": ["अन्याय", "पक्षपात", "ज़िम्मेदारी से बचना"],
            "meaning": "Feeling treated unfairly, or attempting to evade personal responsibility.",
            "meaning_hi": "अन्याय का अनुभव या अपनी गलतियों को दूसरों पर थोपने की कोशिश।",
            "advice": "Take full responsibility for your role and speak truth.",
            "advice_hi": "अपनी गलतियों को स्वीकारें और सच्चाई का साथ दें।"
        }
    },
    {
        "id": "major_12",
        "name": "The Hanged Man",
        "name_hi": "द हैंग्ड मैन (समर्पण / नया दृष्टिकोण)",
        "arcana": "major",
        "number": 12,
        "element": "Water",
        "astrology": "Neptune",
        "upright": {
            "keywords": ["Surrender", "New Perspective", "Letting Go", "Pause", "Enlightenment"],
            "keywords_hi": ["समर्पण", "नया नज़रिया", "अस्थाई विराम", "त्याग", "प्रतीक्षा"],
            "meaning": "Voluntary pause that reveals life from a completely transformed, wiser angle.",
            "meaning_hi": "चीजों को देखने का नज़रिया बदलें। थोड़ा रुकना और समर्पण करना बड़ी सफलता देगा।",
            "advice": "Surrender the need to control every outcome. Allow things to unfold.",
            "advice_hi": "हर बात पर ज़ोर-ज़बरदस्ती छोड़ दें और स्थिति को समय दें।"
        },
        "reversed": {
            "keywords": ["Stalling", "Resistance", "Martyrdom", "Needless Sacrifice"],
            "keywords_hi": ["अनावश्यक देरी", "ज़िद", "व्यर्थ का बलिदान"],
            "meaning": "Stubborn resistance to acceptance is keeping you stuck in needless limbo.",
            "meaning_hi": "अनावश्यक रूप से खुद को पीड़ित महसूस करना या सही समय पर फैसला न लेना।",
            "advice": "Break out of self-imposed stagnation and take proactive action.",
            "advice_hi": "रुकावटों से बाहर निकलें और निर्णायक कदम उठाएं।"
        }
    },
    {
        "id": "major_13",
        "name": "Death",
        "name_hi": "डेथ (रूपांतरण / पुराने का अंत व नवसृजन)",
        "arcana": "major",
        "number": 13,
        "element": "Water",
        "astrology": "Scorpio",
        "upright": {
            "keywords": ["Transformation", "Endings", "Change", "Transition", "Rebirth"],
            "keywords_hi": ["रूपांतरण", "पुरानी बातों का अंत", "नव-जन्म", "परिवर्तन"],
            "meaning": "The closing of an outworn chapter to make sacred space for extraordinary rebirth.",
            "meaning_hi": "यह शारीरिक मृत्यु नहीं, बल्कि पुरानी आदतों और परिस्थितियों का अंत और एक नए जीवन की शुरुआत है।",
            "advice": "Release what no longer serves you with gratitude. Fresh blessings await.",
            "advice_hi": "पुरानी बातों और बंधनों को अलविदा कहें ताकि नई खुशियां आ सकें।"
        },
        "reversed": {
            "keywords": ["Fear of Change", "Holding On", "Stagnation", "Decay"],
            "keywords_hi": ["बदलाव का भय", "पुरानी यादों में जकड़े रहना", "रुकावट"],
            "meaning": "Clinging to dead situations or relationships prevents spiritual regeneration.",
            "meaning_hi": "जो बात समाप्त हो चुकी है उसे पकड़ कर रखने से मानसिक पीड़ा हो रही है।",
            "advice": "Accept natural conclusions so healing transformation can occur.",
            "advice_hi": "स्वीकार्यता लाएं और जीवन को आगे बहने दें।"
        }
    },
    {
        "id": "major_14",
        "name": "Temperance",
        "name_hi": "टेम्परेन्स (संयम / संतुलन व कीमिया)",
        "arcana": "major",
        "number": 14,
        "element": "Fire",
        "astrology": "Sagittarius",
        "upright": {
            "keywords": ["Balance", "Moderation", "Patience", "Purpose", "Harmony"],
            "keywords_hi": ["संतुलन", "संयम", "धैर्य", "शांति", "समन्वय"],
            "meaning": "Masterful blending of opposites in peaceful equilibrium. Calm patience yields divine results.",
            "meaning_hi": "जीवन में संतुलन, शांति और संयम। दो अलग-अलग विचारों का सुंदर तालमेल।",
            "advice": "Practice the middle path of moderation and cultivate deep patience.",
            "advice_hi": "किसी भी अति (extreme) से बचें और मध्यमार्ग अपनाएं।"
        },
        "reversed": {
            "keywords": ["Imbalance", "Excess", "Extremes", "Discord", "Lack of Patience"],
            "keywords_hi": ["असंतुलन", "अतिरेक", "अधैर्य", "झगड़ा"],
            "meaning": "Living in extremes or indulging impulsively is throwing life off course.",
            "meaning_hi": "खान-पान, खर्च या विचारों में संतुलन बिगड़ने से तनाव उत्पन्न हो रहा है।",
            "advice": "Restore daily grounding rituals and eliminate toxic excesses.",
            "advice_hi": "अपनी दिनचर्या और आदतों को पुनः संतुलित करें।"
        }
    },
    {
        "id": "major_15",
        "name": "The Devil",
        "name_hi": "द डेविल (माया / मोह व भ्रम)",
        "arcana": "major",
        "number": 15,
        "element": "Earth",
        "astrology": "Capricorn",
        "upright": {
            "keywords": ["Shadow Self", "Attachment", "Addiction", "Restriction", "Illusion"],
            "keywords_hi": ["अंध मोह", "बुरी लत", "बंधन", "माया", "नकारात्मक विचार"],
            "meaning": "Self-imposed chains of materialism, unhealthy habits, or toxic attachments.",
            "meaning_hi": "भौतिक आकर्षण, गलत संगति या पुरानी बुरी आदतों का बंधन। यह बंधन केवल आपके मन का भ्रम है।",
            "advice": "Recognize that the chains are loose. You hold the power to liberate yourself.",
            "advice_hi": "जागें और समझें कि कोई भी बुरी आदत आपके आत्मबल से बड़ी नहीं है।"
        },
        "reversed": {
            "keywords": ["Freedom", "Breaking Free", "Overcoming Addiction", "Restored Power"],
            "keywords_hi": ["मुक्ति", "आज़ादी", "लत से छुटकारा", "नई ऊर्जा"],
            "meaning": "Breaking out of toxic cycles and reclaiming sovereign freedom.",
            "meaning_hi": "आप पुरानी बेड़ियों और नकारात्मक आदतों को तोड़कर आज़ाद हो रहे हैं।",
            "advice": "Keep moving forward into the light. Do not look back.",
            "advice_hi": "अपनी आज़ादी को संजोएं और पुराने अंधकार में दोबारा न लौटें।"
        }
    },
    {
        "id": "major_16",
        "name": "The Tower",
        "name_hi": "द टॉवर (बिजली / भ्रम का टूटना व सत्य का उदय)",
        "arcana": "major",
        "number": 16,
        "element": "Fire",
        "astrology": "Mars",
        "upright": {
            "keywords": ["Sudden Change", "Upheaval", "Awakening", "Chaos", "Revelation"],
            "keywords_hi": ["आकस्मिक परिवर्तन", "भ्रम का टूटना", "सत्य का उद्घाटन", "पुनर्निर्माण"],
            "meaning": "Sudden disruption shatters false structures so genuine truth can be built upon bedrock.",
            "meaning_hi": "अचानक कोई अप्रत्याशित घटना जो पुराने झूठे आधार को गिराकर सच्चाई सामने लाती है।",
            "advice": "Do not fight the storm. It clears the debris for a genuine foundation.",
            "advice_hi": "परिवर्तन से न घबराएं। यह आपके भले के लिए पुराना ढांचा तोड़ रहा है।"
        },
        "reversed": {
            "keywords": ["Disaster Avoided", "Delaying Inevitable", "Fear of Suffering"],
            "keywords_hi": ["संकट टलना", "सच से मुंह मोड़ना", "डर"],
            "meaning": "Averting total collapse, or futilely trying to hold onto a crumbling facade.",
            "meaning_hi": "किसी बड़े संकट से बाल-बाल बचना या टूटने वाली चीज़ को ज़बरदस्ती थामने की कोशिश।",
            "advice": "Let what is broken fall with grace so healing can begin.",
            "advice_hi": "जो चीज़ खोखली हो चुकी है उसे गिर जाने दें।"
        }
    },
    {
        "id": "major_17",
        "name": "The Star",
        "name_hi": "द स्टार (तारा / आशा व दिव्य प्रकाश)",
        "arcana": "major",
        "number": 17,
        "element": "Air",
        "astrology": "Aquarius",
        "upright": {
            "keywords": ["Hope", "Faith", "Inspiration", "Healing", "Serenity", "Blessings"],
            "keywords_hi": ["आशा", "विश्वास", "उपचार", "शांति", "उज्ज्वल भविष्य", "सौभाग्य"],
            "meaning": "Profound healing, serene clarity, and luminous blessings raining from the cosmos.",
            "meaning_hi": "तूफान के बाद का उजाला। नई उम्मीद, शांति और ईश्वर का आशीर्वाद आपके साथ है।",
            "advice": "Keep your faith bright. The universe is actively aligning your highest dreams.",
            "advice_hi": "सकारात्मक रहें। आपके जीवन में सुखद सवेरा आ रहा है।"
        },
        "reversed": {
            "keywords": ["Hopelessness", "Despair", "Lack of Faith", "Discouragement"],
            "keywords_hi": ["निराशा", "विश्वास की कमी", "उदास मन"],
            "meaning": "Temporary disillusionment or feeling disconnected from divine blessings.",
            "meaning_hi": "निराशा और थकान के कारण भविष्य में कोई उम्मीद नज़र न आना।",
            "advice": "Rediscover gratitude. Look at the starlight even in deepest darkness.",
            "advice_hi": "उम्मीद का दामन न छोड़ें। ईश्वर पर विश्वास पुनः जाग्रत करें।"
        }
    },
    {
        "id": "major_18",
        "name": "The Moon",
        "name_hi": "द मून (चंद्रमा / भ्रम व अवचेतन मन)",
        "arcana": "major",
        "number": 18,
        "element": "Water",
        "astrology": "Pisces",
        "upright": {
            "keywords": ["Illusion", "Fear", "Anxiety", "Subconscious", "Intuition"],
            "keywords_hi": ["भ्रम", "अनजाना डर", "चिंता", "अवचेतन मन", "संदेह"],
            "meaning": "Things are not as they seem in the shadows. Navigate by inner instinct rather than fear.",
            "meaning_hi": "परिस्थितियां जैसी दिख रही हैं वैसी नहीं हैं। भ्रम या भय के साये में बड़ा फैसला न लें।",
            "advice": "Trust your dreams and deep intuition to pierce through waking illusions.",
            "advice_hi": "संदेह और डर को मन पर हावी न होने दें। सच्चाई का इंतज़ार करें।"
        },
        "reversed": {
            "keywords": ["Release of Fear", "Unveiling Secrets", "Clarity", "Truth Revealed"],
            "keywords_hi": ["भ्रम का निवारण", "सच्चाई सामने आना", "डर से मुक्ति"],
            "meaning": "The fog is lifting. Misunderstandings and hidden deceits dissolve into light.",
            "meaning_hi": "भ्रम का पर्दा हट रहा है और सच्चाई साफ दिखने लगी है।",
            "advice": "Embrace the clarity and move forward with enlightened courage.",
            "advice_hi": "स्पष्टता का स्वागत करें और आगे कदम बढ़ाएं।"
        }
    },
    {
        "id": "major_19",
        "name": "The Sun",
        "name_hi": "द सन (सूर्य / परम प्रकाश व विजय)",
        "arcana": "major",
        "number": 19,
        "element": "Fire",
        "astrology": "Sun",
        "upright": {
            "keywords": ["Joy", "Success", "Celebration", "Positivity", "Vitality", "Warmth"],
            "keywords_hi": ["परम आनंद", "सफलता", "उत्साह", "आरोग्य", "विजय", "तेज"],
            "meaning": "Radiant vitality, joyful celebrations, and overwhelming triumph in all endeavors.",
            "meaning_hi": "जीवन में सूर्य के समान प्रकाश, आरोग्य, सम्मान और अपार सफलता।",
            "advice": "Radiate your authentic light boldly and share your joy with the world.",
            "advice_hi": "पूर्ण उत्साह और सकारात्मकता के साथ अपने काम में जुटें।"
        },
        "reversed": {
            "keywords": ["Temporary Sadness", "Over-optimism", "Clouded Joy"],
            "keywords_hi": ["अस्थाई उदासी", "खुशी में हल्की रुकावट"],
            "meaning": "The sun is behind a cloud; joy is still present, only slightly obscured.",
            "meaning_hi": "खुशी आपके पास है, बस कुछ नकारात्मक विचार उसे ढक रहे हैं।",
            "advice": "Count your blessings. The warmth will break through momentarily.",
            "advice_hi": "छोटी-छोटी बातों में खुशी ढूंढें, अंधेरा तुरंत छंट जाएगा।"
        }
    },
    {
        "id": "major_20",
        "name": "Judgement",
        "name_hi": "जजमेंट (पुनर्जागरण / आत्मा की पुकार)",
        "arcana": "major",
        "number": 20,
        "element": "Fire",
        "astrology": "Pluto",
        "upright": {
            "keywords": ["Judgement", "Rebirth", "Inner Calling", "Absolution", "Awakening"],
            "keywords_hi": ["पुनर्जन्म", "आंतरिक पुकार", "आत्म-साक्षात्कार", "सच्चाई का निर्णय"],
            "meaning": "A spiritual wake-up call to rise above the past and step into your destined calling.",
            "meaning_hi": "जीवन में एक बड़ा मोड़ जहां आपकी आत्मा आपको एक उच्च उद्देश्य के लिए पुकार रही है।",
            "advice": "Answer the divine clarion call. Forgive past debts and ascend with confidence.",
            "advice_hi": "पुरानी गलतियों को माफ करें और अपने उच्च उद्देश्य की ओर कदम बढ़ाएं।"
        },
        "reversed": {
            "keywords": ["Self-Doubt", "Harsh Self-Criticism", "Ignoring the Call", "Regret"],
            "keywords_hi": ["आत्म-ग्लानि", "फैसले से डर", "पछतावा"],
            "meaning": "Crippling self-judgment and fear of making the final liberating leap.",
            "meaning_hi": "अनावश्यक पछतावे में उलझकर अपने नए जीवन के अवसर को गंवाना।",
            "advice": "Show yourself compassion. Release guilt and rise into your higher truth.",
            "advice_hi": "खुद को दोष देना बंद करें और नई शुरुआत करें।"
        }
    },
    {
        "id": "major_21",
        "name": "The World",
        "name_hi": "द वर्ल्ड (संसार / पूर्णता व सिद्धि)",
        "arcana": "major",
        "number": 21,
        "element": "Earth",
        "astrology": "Saturn",
        "upright": {
            "keywords": ["Completion", "Integration", "Accomplishment", "Travel", "Fulfillment"],
            "keywords_hi": ["पूर्णता", "सिद्धि", "सफलता", "संतुष्टि", "यात्रा"],
            "meaning": "The grand finale of a life cycle. Complete triumph, cosmic integration, and global celebration.",
            "meaning_hi": "लक्ष्य की पूर्ण प्राप्ति, संपूर्ण सफलता और जीवन चक्र का सुखद समापन।",
            "advice": "Celebrate this extraordinary milestone before stepping onto the next spiral.",
            "advice_hi": "अपनी मेहनत के फल का आनंद लें और सफलता का उत्सव मनाएं।"
        },
        "reversed": {
            "keywords": ["Incompletion", "Lack of Closure", "Shortcuts", "Delay"],
            "keywords_hi": ["अधूरापन", "निष्कर्ष का अभाव", "अंतिम बाधा"],
            "meaning": "Almost at the finish line, but one final loose end needs proper closure.",
            "meaning_hi": "काम लगभग पूरा होने वाला है, बस अंतिम कुछ कदम बाकी हैं।",
            "advice": "Tie up remaining loose ends with patience. Do not abandon the work so close to victory.",
            "advice_hi": "धीरज न खोएं, अंतिम काम को सावधानी से पूरा करें।"
        }
    }
]

# Representative sample of Minor Arcana suits
MINOR_ARCANA_SAMPLES: List[Dict[str, Any]] = [
    # Wands (Fire - Action, Career, Energy)
    {
        "id": "wands_ace",
        "name": "Ace of Wands",
        "name_hi": "एस ऑफ वैंड्स (ऊर्जा व नए उद्यम की शुरुआत)",
        "arcana": "minor",
        "suit": "wands",
        "element": "Fire",
        "upright": {
            "keywords": ["Inspiration", "Creative Spark", "New Passion", "Potential", "Drive"],
            "keywords_hi": ["नई ऊर्जा", "प्रेरणा", "नया काम", "उत्साह"],
            "meaning": "A blazing burst of creative energy and passion to start a brand new project.",
            "meaning_hi": "करियर या व्यापार में नई शुरुआत और अपार उत्साह का संकेत।",
            "advice": "Act decisively on this passionate inspiration.",
            "advice_hi": "अपने नए विचार पर तुरंत काम शुरू करें।"
        },
        "reversed": {
            "keywords": ["Delays", "Lack of Motivation", "Creative Block"],
            "keywords_hi": ["उत्साह की कमी", "देरी", "रुकावट"],
            "meaning": "Hesitation or low energy is delaying a promising start.",
            "meaning_hi": "काम शुरू करने में झिझक या ऊर्जा की कमी।",
            "advice": "Reconnect with what genuinely excites your spirit.",
            "advice_hi": "अपने अंदर की प्रेरणा को दोबारा जगाएं।"
        }
    },
    # Cups (Water - Emotions, Relationships, Love)
    {
        "id": "cups_ace",
        "name": "Ace of Cups",
        "name_hi": "एस ऑफ कप्स (प्रेम व आध्यात्मिक आनंद का प्रवाह)",
        "arcana": "minor",
        "suit": "cups",
        "element": "Water",
        "upright": {
            "keywords": ["Unconditional Love", "New Relationship", "Emotional Awakening", "Intuition"],
            "keywords_hi": ["सच्चा प्रेम", "मधुर संबंध", "भावनात्मक सुख", "शांति"],
            "meaning": "An overflowing chalice of divine love, pure joy, and deep emotional connection.",
            "meaning_hi": "रिश्तों में नया प्रेम, सौहार्द और आत्मिक शांति का आगमन।",
            "advice": "Open your heart to receive and give unconditional love.",
            "advice_hi": "अपने दिल के दरवाज़े प्रेम और क्षमा के लिए खोलें।"
        },
        "reversed": {
            "keywords": ["Emotional Drain", "Blocked Love", "Repressed Feelings"],
            "keywords_hi": ["भावनात्मक तनाव", "प्रेम में रुकावट"],
            "meaning": "Holding back feelings or emotional exhaustion.",
            "meaning_hi": "मन में नकारात्मक भावनाओं का जमाव।",
            "advice": "Practice deep self-love before pouring into others.",
            "advice_hi": "पहले स्वयं से प्रेम करें और मन को शांत करें।"
        }
    },
    # Swords (Air - Intellect, Mind, Truth, Challenges)
    {
        "id": "swords_ace",
        "name": "Ace of Swords",
        "name_hi": "एस ऑफ सोर्ड्स (सत्य की तलवार व मानसिक स्पष्टता)",
        "arcana": "minor",
        "suit": "swords",
        "element": "Air",
        "upright": {
            "keywords": ["Clarity", "Sharp Mind", "Truth", "Breakthrough", "Victory"],
            "keywords_hi": ["मानसिक स्पष्टता", "सत्य", "नया दृष्टिकोण", "विजय"],
            "meaning": "A sword of piercing mental clarity cuts through confusion, bringing absolute truth.",
            "meaning_hi": "भ्रम और संशय को काटकर साफ विचार और सत्य की जीत।",
            "advice": "Speak truth with clarity and stand by your intellectual integrity.",
            "advice_hi": "स्पष्ट विचार रखें और सच का साथ दें।"
        },
        "reversed": {
            "keywords": ["Confusion", "Harsh Words", "Misinformation"],
            "keywords_hi": ["भ्रम", "कटु वाणी", "गलतफहमी"],
            "meaning": "Muddled thoughts or harsh, damaging speech.",
            "meaning_hi": "गुस्से में कड़वे शब्द बोलने से संबंध खराब हो सकते हैं।",
            "advice": "Pause and cool down before speaking impulsively.",
            "advice_hi": "सोच-समझकर बोलें, कड़वी बातें न कहें।"
        }
    },
    # Pentacles (Earth - Wealth, Career, Health, Physical Reality)
    {
        "id": "pentacles_ace",
        "name": "Ace of Pentacles",
        "name_hi": "एस ऑफ पेंटाकल्स (धन, समृद्धि व नया अवसर)",
        "arcana": "minor",
        "suit": "pentacles",
        "element": "Earth",
        "upright": {
            "keywords": ["Financial Opportunity", "Abundance", "Manifestation", "Job Offer", "Security"],
            "keywords_hi": ["धन लाभ", "समृद्धि", "नौकरी का अवसर", "आर्थिक सुरक्षा"],
            "meaning": "A tangible golden seed of wealth, new income source, and material stability.",
            "meaning_hi": "धन, संपत्ति और करियर में नए ठोस लाभ का सुंदर अवसर।",
            "advice": "Invest your time and funds wisely in this grounded opportunity.",
            "advice_hi": "इस आर्थिक अवसर का बुद्धिमानी से सदुपयोग करें।"
        },
        "reversed": {
            "keywords": ["Lost Opportunity", "Financial Insecurity", "Poor Investment"],
            "keywords_hi": ["धन की हानि", "गलत निवेश", "अवसर हाथ से निकलना"],
            "meaning": "Financial carelessness or missing a valuable material opportunity.",
            "meaning_hi": "लापरवाही के कारण धन का नुकसान या अवसर हाथ से जाना।",
            "advice": "Review your budget and avoid risky speculation.",
            "advice_hi": "पैसों के लेन-देन में सतर्कता बरतें।"
        }
    }
]

ALL_TAROT_CARDS = MAJOR_ARCANA + MINOR_ARCANA_SAMPLES
