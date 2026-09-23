export interface CalculatorTool {
  id: string;
  title: string;
  hindiTitle: string;
  description: string;
  category: "kundli" | "dosha" | "matching" | "panchang" | "dasha" | "numerology" | "remedies" | "advanced";
  categoryLabel: string;
  icon: string;
  badge?: string;
  tabTarget: string; // deep-links into /demo?tab=...
  popular?: boolean;
}

export const CALCULATOR_TOOLS: CalculatorTool[] = [
  // ── Kundli & Personal Astrology ──
  {
    id: "lagna-kundli",
    title: "Lagna Kundli (D1)",
    hindiTitle: "जन्म लग्न पत्रिका",
    description: "शारीरिक गठन, स्वभाव, जीवन दिशा और लग्न भाव की उच्च-सटीक गणना।",
    category: "kundli",
    categoryLabel: "कुंडली एवं ग्रह",
    icon: "🪐",
    badge: "Free",
    tabTarget: "kundli",
    popular: true
  },
  {
    id: "navamsha-d9",
    title: "Navamsha Chart (D9)",
    hindiTitle: "नवांश कुंडली",
    description: "भाग्य, वैवाहिक जीवन, जीवनसाथी का स्वरूप एवं धर्म त्रिकोण विश्लेषण।",
    category: "kundli",
    categoryLabel: "कुंडली एवं ग्रह",
    icon: "✨",
    badge: "16 Vargas",
    tabTarget: "kundli",
    popular: true
  },
  {
    id: "moon-sign",
    title: "Moon Sign & Nakshatra",
    hindiTitle: "चंद्र राशि एवं नक्षत्र",
    description: "जन्म कालीन चंद्र राशि, 27 नक्षत्र एवं 4 चरण आधारित नाम अक्षर।",
    category: "kundli",
    categoryLabel: "कुंडली एवं ग्रह",
    icon: "🌙",
    tabTarget: "planets"
  },
  {
    id: "planetary-positions",
    title: "Planetary Degrees & Sphuta",
    hindiTitle: "ग्रह स्पष्ट एवं वक्री स्थिति",
    description: "9 वैदिक ग्रह + राहु-केतु के सटीक अंश, वक्री/मार्गी स्थिति एवं गति।",
    category: "kundli",
    categoryLabel: "कुंडली एवं ग्रह",
    icon: "🔭",
    tabTarget: "planets"
  },

  // ── Dosha & Transits ──
  {
    id: "manglik-dosha",
    title: "Manglik Dosha Analyser",
    hindiTitle: "मांगलिक दोष विश्लेषण",
    description: "लग्न, चंद्र व शुक्र से 1, 4, 7, 8, 12 भावों में मंगल की स्थिति और 12 शास्त्रीय अपवाद।",
    category: "dosha",
    categoryLabel: "दोष एवं गोचर",
    icon: "🔥",
    badge: "12 Exceptions",
    tabTarget: "dosha",
    popular: true
  },
  {
    id: "sade-sati",
    title: "Shani Sade Sati Timeline",
    hindiTitle: "शनि साढ़े साती चक्र",
    description: "उदय, शिखर एवं अस्त चरण, ढैया एवं जीवनपर्यंत शनि गोचर की समय सारिणी।",
    category: "dosha",
    categoryLabel: "दोष एवं गोचर",
    icon: "🪐",
    badge: "Lifetime Dates",
    tabTarget: "dosha",
    popular: true
  },
  {
    id: "kaalsarp-dosha",
    title: "Kaal Sarp Dosha Check",
    hindiTitle: "कालसर्प दोष परीक्षण",
    description: "अनंत, कुलिक, वासुकि सहित 12 प्रकार के कालसर्प योगों का सम्पूर्ण विश्लेषण।",
    category: "dosha",
    categoryLabel: "दोष एवं गोचर",
    icon: "🐍",
    tabTarget: "dosha"
  },
  {
    id: "pitra-dosha",
    title: "Pitra Dosha Calculator",
    hindiTitle: "पितृ दोष एवं शांति",
    description: "नवम भाव, सूर्य एवं राहु युति जनित पूर्वजों के ऋण का शास्त्रोक्त विश्लेषण।",
    category: "dosha",
    categoryLabel: "दोष एवं गोचर",
    icon: "☀️",
    tabTarget: "dosha"
  },

  // ── Matchmaking ──
  {
    id: "kundli-matching",
    title: "36 Guna Ashtakoot Milan",
    hindiTitle: "अष्टकूट 36 गुण मिलान",
    description: "वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट एवं नाड़ी दोष का 8/8 सटीक मिलान।",
    category: "matching",
    categoryLabel: "कुंडली मिलान",
    icon: "💍",
    badge: "36 Gunas",
    tabTarget: "matching",
    popular: true
  },
  {
    id: "nadi-exceptions",
    title: "Nadi Dosha Cancellations",
    hindiTitle: "नाड़ी दोष निरस्तीकरण",
    description: "एक ही नक्षत्र भिन्न चरण, राशि स्वामी मैत्री आदि 10 शास्त्रीय अपवाद नियम।",
    category: "matching",
    categoryLabel: "कुंडली मिलान",
    icon: "🧬",
    tabTarget: "matching"
  },
  {
    id: "dashakoot-porutham",
    title: "Dashakoota 10-Porutham",
    hindiTitle: "दक्षिण भारतीय 10 पोरुथम",
    description: "दीर्घम, रज्जू, वेधाई आदि दक्षिण भारतीय परंपरा अनुसार विवाह अनुकूलता।",
    category: "matching",
    categoryLabel: "कुंडली मिलान",
    icon: "🪷",
    tabTarget: "matching"
  },

  // ── Dasha Systems ──
  {
    id: "vimshottari-dasha",
    title: "120-Year Vimshottari Dasha",
    hindiTitle: "120 वर्षीय विंशोत्तरी महादशा",
    description: "महादशा, अंतर्दशा, प्रत्यंतर, सूक्ष्म एवं प्राण दशा का 5-स्तरीय सूक्ष्म चक्र।",
    category: "dasha",
    categoryLabel: "दशा एवं काल",
    icon: "⏳",
    badge: "5 Levels",
    tabTarget: "dasha",
    popular: true
  },
  {
    id: "yogini-dasha",
    title: "36-Year Yogini Dasha",
    hindiTitle: "36 वर्षीय योगिनी दशा",
    description: "मंगला, पिंगला, धन्या, भ्रामरी, भद्रिका, उल्का, सिद्धा व संकटा का चक्र।",
    category: "dasha",
    categoryLabel: "दशा एवं काल",
    icon: "☸️",
    tabTarget: "dasha"
  },
  {
    id: "char-dasha",
    title: "Jaimini Chara Dasha",
    hindiTitle: "जैमिनी चर दशा",
    description: "राशि-आधारित दशा क्रम एवं आत्मकारक, अमात्यकारक ग्रहों के आधार पर फलादेश।",
    category: "dasha",
    categoryLabel: "दशा एवं काल",
    icon: "🧭",
    tabTarget: "tajik"
  },

  // ── Panchang & Muhurat ──
  {
    id: "daily-panchang",
    title: "Today's Panchang",
    hindiTitle: "दैनिक पंचांग",
    description: "तिथि (प्रतिशत समाप्ति), वार, नक्षत्र, योग, करण एवं भद्रा काल की विस्तृत गणना।",
    category: "panchang",
    categoryLabel: "पंचांग व मुहूर्त",
    icon: "📜",
    badge: "Live Daily",
    tabTarget: "panchang",
    popular: true
  },
  {
    id: "choghadiya",
    title: "Day & Night Choghadiya",
    hindiTitle: "दिन एवं रात्रि चौघड़िया",
    description: "शुभ, अमृत, लाभ, चर, रोग, काल एवं उद्वेग के 16 दैनिक समय खंड।",
    category: "panchang",
    categoryLabel: "पंचांग व मुहूर्त",
    icon: "⏱️",
    tabTarget: "panchang"
  },
  {
    id: "marriage-muhurat",
    title: "Vivah Muhurat Finder",
    hindiTitle: "विवाह शुभ मुहूर्त",
    description: "गुरु-शुक्र अस्त, त्रिबल शुद्धि एवं शुभ नक्षत्रों के आधार पर विवाह लग्न।",
    category: "panchang",
    categoryLabel: "पंचांग व मुहूर्त",
    icon: "👰",
    tabTarget: "panchang"
  },

  // ── Numerology ──
  {
    id: "core-numerology",
    title: "Life Path & Destiny Numbers",
    hindiTitle: "मूलांक एवं भाग्यांक",
    description: "जन्मतिथि आधारित मूलांक, भाग्यांक एवं नामांक की समग्र शास्त्रीय गणना।",
    category: "numerology",
    categoryLabel: "अंकशास्त्र",
    icon: "🔢",
    tabTarget: "numerology",
    popular: true
  },
  {
    id: "loshu-grid",
    title: "3x3 Lo Shu Magic Grid",
    hindiTitle: "लो शू ग्रिड विश्लेषण",
    description: "मानसिक, भावनात्मक, व्यावहारिक एवं इच्छा शक्ति के 8 योग प्लेन।",
    category: "numerology",
    categoryLabel: "अंकशास्त्र",
    icon: "🧮",
    tabTarget: "numerology"
  },
  {
    id: "name-correction",
    title: "Chaldean Name Correction",
    hindiTitle: "नाम संशोधन अंक प्रणाली",
    description: "कीरो व पाइथागोरस विधि अनुसार शुभ अक्षर जोड़कर भाग्योदय नामांक बनाएं।",
    category: "numerology",
    categoryLabel: "अंकशास्त्र",
    icon: "✍️",
    tabTarget: "numerology"
  },

  // ── Remedies & Lal Kitab ──
  {
    id: "gemstone-suggestion",
    title: "Lucky Gemstone Recommender",
    hindiTitle: "रत्न परामर्श (Life / Lucky Stone)",
    description: "मारक व बाधक भावों की वर्जनाओं के साथ शुभ व अनुकूल रत्नों की सटीक पहचान।",
    category: "remedies",
    categoryLabel: "उपाय एवं लाल किताब",
    icon: "💎",
    badge: "Precise Rules",
    tabTarget: "remedies",
    popular: true
  },
  {
    id: "rudraksha-mapping",
    title: "1 to 14 Mukhi Rudraksha",
    hindiTitle: "रुद्राक्ष सुझाव",
    description: "जन्म कुंडली के कमजोर एवं पीड़ित ग्रहों को बल देने हेतु शास्त्रीय रुद्राक्ष।",
    category: "remedies",
    categoryLabel: "उपाय एवं लाल किताब",
    icon: "📿",
    tabTarget: "remedies"
  },
  {
    id: "lal-kitab-debts",
    title: "Lal Kitab 6 Ancestral Debts",
    hindiTitle: "लाल किताब पितृ ऋण एवं उपाय",
    description: "स्वऋण, मातृ ऋण, पितृ ऋण, स्त्री ऋण, संबंधी ऋण एवं निर्दयी ऋण के अचूक उपाय।",
    category: "remedies",
    categoryLabel: "उपाय एवं लाल किताब",
    icon: "📕",
    tabTarget: "lalkitab"
  },
  {
    id: "dhan-yogas",
    title: "Raja & Dhan Yoga Finder",
    hindiTitle: "राजयोग एवं धन योग स्कैनर",
    description: "गजकेसरी, बुधादित्य एवं पंचमहापुरुष सहित 10 प्रमुख शास्त्रीय राज व धन योगों का पता लगाएं।",
    category: "advanced",
    categoryLabel: "विशेष योग",
    icon: "👑",
    badge: "10 Yogas",
    tabTarget: "yogas",
    popular: true
  }
];
