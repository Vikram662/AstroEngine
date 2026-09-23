export interface CalculatorTool {
  id: string;
  title: string;
  hindiTitle: string;
  description: string;
  category: "kundli" | "dosha" | "matching" | "panchang" | "dasha" | "numerology" | "remedies" | "advanced" | "western" | "kp" | "tarot" | "vastu" | "reports";
  categoryLabel: string;
  icon: string;
  badge?: string;
  href: string; // dedicated standalone page, e.g. /calculators/lagna-kundli
  popular?: boolean;
  // Per-locale <title>/<meta description> for calculators migrated under
  // src/app/[locale]/calculators/** (see CALCULATOR_PAGES_PLAN.md Phase 2).
  // Falls back to title/hindiTitle/description when absent.
  seo?: {
    hi: { title: string; description: string };
    en: { title: string; description: string };
  };
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
    href: "/calculators/lagna-kundli",
    popular: true,
    seo: {
      hi: {
        title: "जन्म लग्न पत्रिका (D1 चार्ट) मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "मुफ्त जन्म लग्न कुंडली (D1 चार्ट) बनाएं — लग्न, नवग्रह स्थिति और भाव विश्लेषण तुरंत, बिना साइनअप के।",
      },
      en: {
        title: "Free Lagna Kundli (D1 Birth Chart) Calculator | AstroEngine",
        description:
          "Generate your free Lagna Kundli (D1 birth chart) instantly — ascendant, planetary positions, and house analysis, no sign-up required.",
      },
    },
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
    href: "/calculators/navamsha-d9",
    popular: true,
    seo: {
      hi: {
        title: "नवांश कुंडली (D9) मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "भाग्य, वैवाहिक जीवन, जीवनसाथी का स्वरूप एवं धर्म त्रिकोण विश्लेषण।",
      },
      en: {
        title: "Free Navamsha Chart (D9) Calculator | AstroEngine",
        description:
          "D9 Navamsha analysis of fortune, married life, spouse's nature and the Dharma trikona.",
      },
    },
  },
  {
    id: "moon-sign",
    title: "Moon Sign & Nakshatra",
    hindiTitle: "चंद्र राशि एवं नक्षत्र",
    description: "जन्म कालीन चंद्र राशि, 27 नक्षत्र एवं 4 चरण आधारित नाम अक्षर।",
    category: "kundli",
    categoryLabel: "कुंडली एवं ग्रह",
    icon: "🌙",
    href: "/calculators/moon-sign",
    seo: {
      hi: {
        title: "चंद्र राशि एवं नक्षत्र कैलकुलेटर | AstroEngine",
        description:
          "अपनी जन्म कालीन चंद्र राशि, नक्षत्र और चरण मुफ्त में जानें — तुरंत परिणाम, बिना साइनअप के।",
      },
      en: {
        title: "Free Moon Sign & Nakshatra Calculator | AstroEngine",
        description:
          "Find your Vedic Moon sign, birth nakshatra, and pada instantly — free, no sign-up required.",
      },
    },
  },
  {
    id: "planetary-positions",
    title: "Planetary Degrees & Sphuta",
    hindiTitle: "ग्रह स्पष्ट एवं वक्री स्थिति",
    description: "9 वैदिक ग्रह + राहु-केतु के सटीक अंश, वक्री/मार्गी स्थिति एवं गति।",
    category: "kundli",
    categoryLabel: "कुंडली एवं ग्रह",
    icon: "🔭",
    href: "/calculators/planetary-positions",
    seo: {
      hi: {
        title: "ग्रह स्पष्ट एवं वक्री स्थिति मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "9 वैदिक ग्रह + राहु-केतु के सटीक अंश, वक्री/मार्गी स्थिति एवं गति।",
      },
      en: {
        title: "Free Planetary Degrees & Sphuta Calculator | AstroEngine",
        description:
          "Precise degrees, retrograde/direct status and speed for all 9 Vedic planets plus Rahu-Ketu.",
      },
    },
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
    href: "/calculators/manglik-dosha",
    popular: true,
    seo: {
      hi: {
        title: "मांगलिक दोष विश्लेषण मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "लग्न, चंद्र व शुक्र से 1, 4, 7, 8, 12 भावों में मंगल की स्थिति और 12 शास्त्रीय अपवाद।",
      },
      en: {
        title: "Free Manglik Dosha Analyser Calculator | AstroEngine",
        description:
          "Mars placement in houses 1, 4, 7, 8, 12 from Lagna, Moon and Venus, with all 12 classical cancellation rules.",
      },
    },
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
    href: "/calculators/sade-sati",
    popular: true,
    seo: {
      hi: {
        title: "शनि साढ़े साती चक्र मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "उदय, शिखर एवं अस्त चरण, ढैया एवं जीवनपर्यंत शनि गोचर की समय सारिणी।",
      },
      en: {
        title: "Free Shani Sade Sati Timeline Calculator | AstroEngine",
        description:
          "Rising, peak and setting phase timeline of Sade Sati, Dhaiya and lifetime Saturn transits.",
      },
    },
  },
  {
    id: "kaalsarp-dosha",
    title: "Kaal Sarp Dosha Check",
    hindiTitle: "कालसर्प दोष परीक्षण",
    description: "अनंत, कुलिक, वासुकि सहित 12 प्रकार के कालसर्प योगों का सम्पूर्ण विश्लेषण।",
    category: "dosha",
    categoryLabel: "दोष एवं गोचर",
    icon: "🐍",
    href: "/calculators/kaalsarp-dosha",
    seo: {
      hi: {
        title: "कालसर्प दोष परीक्षण मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "अनंत, कुलिक, वासुकि सहित 12 प्रकार के कालसर्प योगों का सम्पूर्ण विश्लेषण।",
      },
      en: {
        title: "Free Kaal Sarp Dosha Check Calculator | AstroEngine",
        description:
          "Complete analysis of all 12 types of Kaal Sarp yoga, including Anant, Kulik and Vasuki.",
      },
    },
  },
  {
    id: "pitra-dosha",
    title: "Pitra Dosha Calculator",
    hindiTitle: "पितृ दोष एवं शांति",
    description: "नवम भाव, सूर्य एवं राहु युति जनित पूर्वजों के ऋण का शास्त्रोक्त विश्लेषण।",
    category: "dosha",
    categoryLabel: "दोष एवं गोचर",
    icon: "☀️",
    href: "/calculators/pitra-dosha",
    seo: {
      hi: {
        title: "पितृ दोष एवं शांति मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "नवम भाव, सूर्य एवं राहु युति जनित पूर्वजों के ऋण का शास्त्रोक्त विश्लेषण।",
      },
      en: {
        title: "Free Pitra Dosha Calculator | AstroEngine",
        description:
          "Classical analysis of ancestral karmic debt from the 9th house, Sun and Rahu conjunctions.",
      },
    },
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
    href: "/calculators/kundli-matching",
    popular: true,
    seo: {
      hi: {
        title: "अष्टकूट 36 गुण मिलान मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट एवं नाड़ी दोष का 8/8 सटीक मिलान।",
      },
      en: {
        title: "Free 36 Guna Ashtakoot Milan Calculator | AstroEngine",
        description:
          "Precise 8/8 Ashtakoot matching — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi dosha.",
      },
    },
  },
  {
    id: "nadi-exceptions",
    title: "Nadi Dosha Cancellations",
    hindiTitle: "नाड़ी दोष निरस्तीकरण",
    description: "एक ही नक्षत्र भिन्न चरण, राशि स्वामी मैत्री आदि 10 शास्त्रीय अपवाद नियम।",
    category: "matching",
    categoryLabel: "कुंडली मिलान",
    icon: "🧬",
    href: "/calculators/nadi-exceptions",
    seo: {
      hi: {
        title: "नाड़ी दोष निरस्तीकरण मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "एक ही नक्षत्र भिन्न चरण, राशि स्वामी मैत्री आदि 10 शास्त्रीय अपवाद नियम।",
      },
      en: {
        title: "Free Nadi Dosha Cancellations Calculator | AstroEngine",
        description:
          "10 classical Nadi dosha cancellation rules, including same-nakshatra-different-pada and sign-lord friendship.",
      },
    },
  },
  {
    id: "dashakoot-porutham",
    title: "Dashakoota 10-Porutham",
    hindiTitle: "दक्षिण भारतीय 10 पोरुथम",
    description: "दीर्घम, रज्जू, वेधाई आदि दक्षिण भारतीय परंपरा अनुसार विवाह अनुकूलता।",
    category: "matching",
    categoryLabel: "कुंडली मिलान",
    icon: "🪷",
    href: "/calculators/dashakoot-porutham",
    seo: {
      hi: {
        title: "दक्षिण भारतीय 10 पोरुथम मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "दीर्घम, रज्जू, वेधाई आदि दक्षिण भारतीय परंपरा अनुसार विवाह अनुकूलता।",
      },
      en: {
        title: "Free Dashakoota 10-Porutham Calculator | AstroEngine",
        description:
          "South Indian 10-Porutham marriage compatibility — Dheergam, Rajju, Vedhai and more.",
      },
    },
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
    href: "/calculators/vimshottari-dasha",
    popular: true,
    seo: {
      hi: {
        title: "120 वर्षीय विंशोत्तरी महादशा मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "महादशा, अंतर्दशा, प्रत्यंतर, सूक्ष्म एवं प्राण दशा का 5-स्तरीय सूक्ष्म चक्र।",
      },
      en: {
        title: "Free 120-Year Vimshottari Dasha Calculator | AstroEngine",
        description:
          "5-level Vimshottari Dasha cycle — Mahadasha, Antardasha, Pratyantar, Sookshma and Prana dasha.",
      },
    },
  },
  {
    id: "yogini-dasha",
    title: "36-Year Yogini Dasha",
    hindiTitle: "36 वर्षीय योगिनी दशा",
    description: "मंगला, पिंगला, धन्या, भ्रामरी, भद्रिका, उल्का, सिद्धा व संकटा का चक्र।",
    category: "dasha",
    categoryLabel: "दशा एवं काल",
    icon: "☸️",
    href: "/calculators/yogini-dasha",
    seo: {
      hi: {
        title: "36 वर्षीय योगिनी दशा मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "मंगला, पिंगला, धन्या, भ्रामरी, भद्रिका, उल्का, सिद्धा व संकटा का चक्र।",
      },
      en: {
        title: "Free 36-Year Yogini Dasha Calculator | AstroEngine",
        description:
          "36-year Yogini Dasha cycle — Mangala, Pingala, Dhanya, Bhramari, Bhadrika, Ulka, Siddha and Sankata.",
      },
    },
  },
  {
    id: "char-dasha",
    title: "Jaimini Chara Dasha",
    hindiTitle: "जैमिनी चर दशा",
    description: "राशि-आधारित दशा क्रम एवं आत्मकारक, अमात्यकारक ग्रहों के आधार पर फलादेश।",
    category: "dasha",
    categoryLabel: "दशा एवं काल",
    icon: "🧭",
    href: "/calculators/char-dasha",
    seo: {
      hi: {
        title: "जैमिनी चर दशा मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "राशि-आधारित दशा क्रम एवं आत्मकारक, अमात्यकारक ग्रहों के आधार पर फलादेश।",
      },
      en: {
        title: "Free Jaimini Chara Dasha Calculator | AstroEngine",
        description:
          "Sign-based Jaimini Chara Dasha sequence with Atmakaraka and Amatyakaraka planet predictions.",
      },
    },
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
    href: "/calculators/daily-panchang",
    popular: true,
    seo: {
      hi: {
        title: "दैनिक पंचांग मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "तिथि (प्रतिशत समाप्ति), वार, नक्षत्र, योग, करण एवं भद्रा काल की विस्तृत गणना।",
      },
      en: {
        title: "Free Today's Panchang Calculator | AstroEngine",
        description:
          "Detailed calculation of Tithi (with completion %), weekday, Nakshatra, Yoga, Karana and Bhadra period.",
      },
    },
  },
  {
    id: "choghadiya",
    title: "Day & Night Choghadiya",
    hindiTitle: "दिन एवं रात्रि चौघड़िया",
    description: "शुभ, अमृत, लाभ, चर, रोग, काल एवं उद्वेग के 16 दैनिक समय खंड।",
    category: "panchang",
    categoryLabel: "पंचांग व मुहूर्त",
    icon: "⏱️",
    href: "/calculators/choghadiya",
    seo: {
      hi: {
        title: "दिन एवं रात्रि चौघड़िया मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "शुभ, अमृत, लाभ, चर, रोग, काल एवं उद्वेग के 16 दैनिक समय खंड।",
      },
      en: {
        title: "Free Day & Night Choghadiya Calculator | AstroEngine",
        description:
          "16 daily auspicious/inauspicious time segments — Shubh, Amrit, Labh, Chal, Rog, Kaal and Udveg.",
      },
    },
  },
  {
    id: "marriage-muhurat",
    title: "Vivah Muhurat Finder",
    hindiTitle: "विवाह शुभ मुहूर्त",
    description: "गुरु-शुक्र अस्त, त्रिबल शुद्धि एवं शुभ नक्षत्रों के आधार पर विवाह लग्न।",
    category: "panchang",
    categoryLabel: "पंचांग व मुहूर्त",
    icon: "👰",
    href: "/calculators/marriage-muhurat",
    seo: {
      hi: {
        title: "विवाह शुभ मुहूर्त मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "गुरु-शुक्र अस्त, त्रिबल शुद्धि एवं शुभ नक्षत्रों के आधार पर विवाह लग्न।",
      },
      en: {
        title: "Free Vivah Muhurat Finder Calculator | AstroEngine",
        description:
          "Auspicious wedding dates based on Jupiter-Venus combustion, tribal purity and favorable nakshatras.",
      },
    },
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
    href: "/calculators/core-numerology",
    popular: true,
    seo: {
      hi: {
        title: "मूलांक एवं भाग्यांक मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "जन्मतिथि आधारित मूलांक, भाग्यांक एवं नामांक की समग्र शास्त्रीय गणना।",
      },
      en: {
        title: "Free Life Path & Destiny Numbers Calculator | AstroEngine",
        description:
          "Complete classical calculation of your Driver (Mulank), Conductor (Bhagyank) and Name numbers from your birth date.",
      },
    },
  },
  {
    id: "loshu-grid",
    title: "3x3 Lo Shu Magic Grid",
    hindiTitle: "लो शू ग्रिड विश्लेषण",
    description: "मानसिक, भावनात्मक, व्यावहारिक एवं इच्छा शक्ति के 8 योग प्लेन।",
    category: "numerology",
    categoryLabel: "अंकशास्त्र",
    icon: "🧮",
    href: "/calculators/loshu-grid",
    seo: {
      hi: {
        title: "लो शू ग्रिड विश्लेषण मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "मानसिक, भावनात्मक, व्यावहारिक एवं इच्छा शक्ति के 8 योग प्लेन।",
      },
      en: {
        title: "Free 3x3 Lo Shu Magic Grid Calculator | AstroEngine",
        description:
          "8 numerological planes of mental, emotional, practical and willpower strength from your Lo Shu grid.",
      },
    },
  },
  {
    id: "name-correction",
    title: "Chaldean Name Correction",
    hindiTitle: "नाम संशोधन अंक प्रणाली",
    description: "कीरो व पाइथागोरस विधि अनुसार शुभ अक्षर जोड़कर भाग्योदय नामांक बनाएं।",
    category: "numerology",
    categoryLabel: "अंकशास्त्र",
    icon: "✍️",
    href: "/calculators/name-correction",
    seo: {
      hi: {
        title: "नाम संशोधन अंक प्रणाली मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "कीरो व पाइथागोरस विधि अनुसार शुभ अक्षर जोड़कर भाग्योदय नामांक बनाएं।",
      },
      en: {
        title: "Free Chaldean Name Correction Calculator | AstroEngine",
        description:
          "Build a fortune-boosting name number by adding auspicious letters, per the Chaldean and Pythagorean methods.",
      },
    },
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
    href: "/calculators/gemstone-suggestion",
    popular: true,
    seo: {
      hi: {
        title: "रत्न परामर्श मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "मारक व बाधक भावों की वर्जनाओं के साथ शुभ व अनुकूल रत्नों की सटीक पहचान।",
      },
      en: {
        title: "Free Lucky Gemstone Recommender Calculator | AstroEngine",
        description:
          "Accurate identification of auspicious gemstones, with maraka/badhaka house cautions.",
      },
    },
  },
  {
    id: "rudraksha-mapping",
    title: "1 to 14 Mukhi Rudraksha",
    hindiTitle: "रुद्राक्ष सुझाव",
    description: "जन्म कुंडली के कमजोर एवं पीड़ित ग्रहों को बल देने हेतु शास्त्रीय रुद्राक्ष।",
    category: "remedies",
    categoryLabel: "उपाय एवं लाल किताब",
    icon: "📿",
    href: "/calculators/rudraksha-mapping",
    seo: {
      hi: {
        title: "रुद्राक्ष सुझाव मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "जन्म कुंडली के कमजोर एवं पीड़ित ग्रहों को बल देने हेतु शास्त्रीय रुद्राक्ष।",
      },
      en: {
        title: "Free 1 to 14 Mukhi Rudraksha Calculator | AstroEngine",
        description:
          "Classical Rudraksha recommendations to strengthen weak or afflicted planets in your birth chart.",
      },
    },
  },
  {
    id: "lal-kitab-debts",
    title: "Lal Kitab 6 Ancestral Debts",
    hindiTitle: "लाल किताब पितृ ऋण एवं उपाय",
    description: "स्वऋण, मातृ ऋण, पितृ ऋण, स्त्री ऋण, संबंधी ऋण एवं निर्दयी ऋण के अचूक उपाय।",
    category: "remedies",
    categoryLabel: "उपाय एवं लाल किताब",
    icon: "📕",
    href: "/calculators/lal-kitab-debts",
    seo: {
      hi: {
        title: "लाल किताब पितृ ऋण एवं उपाय मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "स्वऋण, मातृ ऋण, पितृ ऋण, स्त्री ऋण, संबंधी ऋण एवं निर्दयी ऋण के अचूक उपाय।",
      },
      en: {
        title: "Free Lal Kitab 6 Ancestral Debts Calculator | AstroEngine",
        description:
          "Infallible Lal Kitab remedies for the 6 ancestral debts — self, mother, father, wife, relative and merciless debt.",
      },
    },
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
    href: "/calculators/dhan-yogas",
    popular: true,
    seo: {
      hi: {
        title: "राजयोग एवं धन योग स्कैनर मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "गजकेसरी, बुधादित्य एवं पंचमहापुरुष सहित 10 प्रमुख शास्त्रीय राज व धन योगों का पता लगाएं।",
      },
      en: {
        title: "Free Raja & Dhan Yoga Finder Calculator | AstroEngine",
        description:
          "Detect 10 major classical Raja and Dhan yogas, including Gajakesari, Budhaditya, and Pancha Mahapurusha combinations.",
      },
    },
  },

  // ── Western, KP, Tarot, Vastu & Reports ──
  {
    id: "western-astrology",
    title: "Western Tropical Big-Three",
    hindiTitle: "पाश्चात्य ज्योतिष (सूर्य-चंद्र-लग्न)",
    description: "उष्णकटिबंधीय (Tropical) राशि पद्धति अनुसार सूर्य, चंद्र एवं लग्न राशि की गणना।",
    category: "western",
    categoryLabel: "पाश्चात्य ज्योतिष",
    icon: "♈",
    href: "/calculators/western-astrology",
    seo: {
      hi: {
        title: "पाश्चात्य ज्योतिष (सूर्य-चंद्र-लग्न) मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "उष्णकटिबंधीय (Tropical) राशि पद्धति अनुसार सूर्य, चंद्र एवं लग्न राशि की गणना।",
      },
      en: {
        title: "Free Western Tropical Big-Three Calculator | AstroEngine",
        description:
          "Sun, Moon and Rising sign calculated using the Western Tropical zodiac system.",
      },
    },
  },
  {
    id: "kp-system",
    title: "KP Sub-Lord Table",
    hindiTitle: "केपी पद्धति (सब-लॉर्ड)",
    description: "कृष्णमूर्ति पद्धति अनुसार ग्रहों एवं भाव कस्प के नक्षत्र, सब व सब-सब स्वामी।",
    category: "kp",
    categoryLabel: "केपी पद्धति",
    icon: "🎯",
    href: "/calculators/kp-system",
    seo: {
      hi: {
        title: "केपी पद्धति (सब-लॉर्ड) मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "कृष्णमूर्ति पद्धति अनुसार ग्रहों एवं भाव कस्प के नक्षत्र, सब व सब-सब स्वामी।",
      },
      en: {
        title: "Free KP Sub-Lord Table Calculator | AstroEngine",
        description:
          "Krishnamurti Paddhati (KP) nakshatra, sub-lord and sub-sub-lord for planets and house cusps.",
      },
    },
  },
  {
    id: "tarot-reading",
    title: "Tarot Card Reading",
    hindiTitle: "टैरो कार्ड परामर्श",
    description: "दैनिक कार्ड, 3-कार्ड स्प्रेड एवं सेल्टिक क्रॉस से अपने प्रश्न का उत्तर पाएं।",
    category: "tarot",
    categoryLabel: "टैरो",
    icon: "🔮",
    href: "/calculators/tarot-reading",
    seo: {
      hi: {
        title: "टैरो कार्ड परामर्श मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "दैनिक कार्ड, 3-कार्ड स्प्रेड एवं सेल्टिक क्रॉस से अपने प्रश्न का उत्तर पाएं।",
      },
      en: {
        title: "Free Tarot Card Reading Calculator | AstroEngine",
        description:
          "Get answers to your questions with a daily card, 3-card spread or Celtic Cross tarot reading.",
      },
    },
  },
  {
    id: "vastu-shastra",
    title: "Vastu Shastra Evaluator",
    hindiTitle: "16-जोन वास्तु विश्लेषण",
    description: "भवन दिशा एवं कमरों की स्थिति अनुसार 16 वास्तु ज़ोन का संपूर्ण मूल्यांकन।",
    category: "vastu",
    categoryLabel: "वास्तु शास्त्र",
    icon: "🏠",
    href: "/calculators/vastu-shastra",
    seo: {
      hi: {
        title: "16-जोन वास्तु विश्लेषण मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "भवन दिशा एवं कमरों की स्थिति अनुसार 16 वास्तु ज़ोन का संपूर्ण मूल्यांकन।",
      },
      en: {
        title: "Free Vastu Shastra Evaluator Calculator | AstroEngine",
        description:
          "Complete 16-zone Vastu evaluation based on your building's direction and room placements.",
      },
    },
  },
  {
    id: "pdf-reports",
    title: "PDF Kundli Reports",
    hindiTitle: "वृहत् कुंडली PDF रिपोर्ट",
    description: "20-80 पृष्ठीय विस्तृत कुंडली, मिलान, वर्षफल एवं लाल किताब PDF रिपोर्ट बनाएं।",
    category: "reports",
    categoryLabel: "PDF रिपोर्ट्स",
    icon: "📄",
    href: "/calculators/pdf-reports",
    seo: {
      hi: {
        title: "वृहत् कुंडली PDF रिपोर्ट मुफ्त ऑनलाइन कैलकुलेटर | AstroEngine",
        description:
          "20-80 पृष्ठीय विस्तृत कुंडली, मिलान, वर्षफल एवं लाल किताब PDF रिपोर्ट बनाएं।",
      },
      en: {
        title: "Free PDF Kundli Reports Calculator | AstroEngine",
        description:
          "Generate 20-80 page detailed Kundli, matching, Varshphal and Lal Kitab PDF reports.",
      },
    },
  }
];
