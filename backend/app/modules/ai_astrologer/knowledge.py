"""
Classical Vedic Astrological Knowledge Base for AI Astrologer Engine.
Encodes Parashari, Jaimini, and Gochar principles for topic-specific life queries.
"""

from typing import Dict, Any, List

QUERY_CATEGORIES = {
    "career": {
        "primary_houses": [10, 6, 2, 11, 1],
        "karakas": ["SUN", "MERCURY", "SATURN", "JUPITER"],
        "hindi_title": "करियर, नौकरी एवं व्यवसाय",
        "keywords": ["job", "career", "promotion", "business", "work", "office", "naukri", "vyapar", "kam", "paisa", "transfer", "rozgar", "interview", "startup"]
    },
    "marriage": {
        "primary_houses": [7, 2, 11, 5, 8],
        "karakas": ["VENUS", "JUPITER", "MARS"],
        "hindi_title": "विवाह, प्रेम संबंध एवं दांपत्य जीवन",
        "keywords": ["marriage", "wedding", "shaadi", "vivah", "love", "partner", "spouse", "patni", "pati", "relationship", "divorce", "kundli milan", "breakup"]
    },
    "wealth": {
        "primary_houses": [2, 11, 9, 5, 1],
        "karakas": ["JUPITER", "MERCURY", "VENUS"],
        "hindi_title": "धन, संपत्ति एवं आर्थिक समृद्धि",
        "keywords": ["wealth", "money", "finance", "dhan", "paisa", "property", "investment", "stock", "loan", "karz", "land", "house", "makaan", "gaddi"]
    },
    "health": {
        "primary_houses": [1, 6, 8, 12],
        "karakas": ["SUN", "MOON", "MARS", "SATURN"],
        "hindi_title": "स्वास्थ्य, दीर्घायु एवं शारीरिक ऊर्जा",
        "keywords": ["health", "swasthya", "disease", "bimari", "hospital", "illness", "mental", "stress", "longevity", "ayush", "surgery", "diet"]
    },
    "foreign": {
        "primary_houses": [9, 12, 7, 3],
        "karakas": ["RAHU", "MOON", "VENUS"],
        "hindi_title": "विदेश यात्रा, उच्च शिक्षा एवं विदेश वास",
        "keywords": ["foreign", "videsh", "travel", "visa", "pr", "abroad", "greencard", "study abroad", "passport", "relocation"]
    },
    "children": {
        "primary_houses": [5, 2, 11],
        "karakas": ["JUPITER"],
        "hindi_title": "संतान प्राप्ति एवं शिक्षा",
        "keywords": ["child", "children", "baby", "santan", "pregnancy", "garbh", "education", "padhai", "exam", "vidya"]
    },
    "general": {
        "primary_houses": [1, 5, 9],
        "karakas": ["JUPITER", "SUN"],
        "hindi_title": "सामान्य जीवन एवं आध्यात्मिक मार्गदर्शन",
        "keywords": []
    }
}

PLANET_NAMES_HI = {
    "SUN": "सूर्य देव (Sun)",
    "MOON": "चंद्रमा (Moon)",
    "MARS": "मंगल देव (Mars)",
    "MERCURY": "बुध देव (Mercury)",
    "JUPITER": "देवगुरु बृहस्पति (Jupiter)",
    "VENUS": "शुक्राचार्य (Venus)",
    "SATURN": "शनि देव (Saturn)",
    "RAHU": "राहु (North Node)",
    "KETU": "केतु (South Node)"
}

REMEDY_SUGGESTIONS = {
    "SUN": {
        "hi": "प्रतिदिन प्रातः तांबे के लोटे से सूर्य देव को अर्घ्य दें और 'ॐ घृणि सूर्याय नमः' का 108 बार जप करें।",
        "en": "Offer water to the rising Sun daily from a copper vessel and recite 'Om Ghrini Suryaya Namaha' 108 times."
    },
    "MOON": {
        "hi": "सोमवार को शिवलिंग पर कच्चा दूध व जल अर्पित करें और माता का आशीर्वाद लें।",
        "en": "Offer raw milk and water on Shiva Lingam on Mondays and seek blessings from maternal figures."
    },
    "MARS": {
        "hi": "मंगलवार को हनुमान चालीसा का पाठ करें और सिंदूर का तिलक लगाएं।",
        "en": "Recite Hanuman Chalisa on Tuesdays and donate red lentils or sweets to the needy."
    },
    "MERCURY": {
        "hi": "बुधवार को गाय को हरा चारा खिलाएं और 'ॐ बुं बुधाय नमः' का जप करें।",
        "en": "Feed green fodder or spinach to cows on Wednesdays and recite 'Om Bum Budhaya Namaha'."
    },
    "JUPITER": {
        "hi": "गुरुवार को भगवान विष्णु की पूजा करें, केले के वृक्ष को जल दें और माथे पर केसर/हल्दी का तिलक लगाएं।",
        "en": "Worship Lord Vishnu on Thursdays, water the banana tree, and apply a saffron or turmeric tilak."
    },
    "VENUS": {
        "hi": "शुक्रवार को सफेद मिठाई या खीर कन्याओं को खिलाएं और 'ॐ शुं शुक्राय नमः' का जप करें।",
        "en": "Distribute white sweets or kheer to young girls on Fridays and chant 'Om Shum Shukraya Namaha'."
    },
    "SATURN": {
        "hi": "शनिवार को पीपल के वृक्ष के नीचे सरसों के तेल का दीपक जलाएं और दशरथ कृत शनि स्तोत्र का पाठ करें।",
        "en": "Light a mustard oil lamp under a Peepal tree on Saturday evenings and chant the Shani Gayatri Mantra."
    },
    "RAHU": {
        "hi": "पक्षियों को 7 प्रकार का अनाज (सप्तधान्य) डालें और शनिवार शाम भैरव मंदिर में नारियल अर्पित करें।",
        "en": "Feed multi-grain seeds to birds and maintain clean surroundings in the Southwest corner."
    },
    "KETU": {
        "hi": "आवारा कुत्तों को मीठी रोटी या बिस्कुट खिलाएं और गणेश जी को दूर्वा अर्पित करें।",
        "en": "Feed sweet roti or biscuits to street dogs and offer Durva grass to Lord Ganesha."
    }
}
