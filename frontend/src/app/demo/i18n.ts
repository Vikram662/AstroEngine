export type SupportedLang = "en" | "hi" | "mr" | "gu" | "ta" | "te" | "bn";

export interface DemoTranslations {
  enginesLiveBadge: string;
  securityBadge: string;
  appTitle: string;
  appSubtitle: string;
  recalculateBtn: string;
  recalculatingBtn: string;
  apiSpecsBtn: string;

  universalModeTitle: string;
  universalModeDescPrefix: string;
  universalModeDescSuffix: string;
  personalModeTitle: string;
  personalModeDescPrefix: string;

  nameLabel: string;
  dobLabel: string;
  tobLabel: string;
  cityLabel: string;
  cityPlaceholder: string;
  langLabel: string;
  applyBtn: string;

  cat1Title: string;
  cat1Count: string;
  cat2Title: string;
  cat2Count: string;

  tabs: {
    overview: string;
    ai_astrologer: string;
    kundli: string;
    planets: string;
    dasha: string;
    yogas: string;
    dosha: string;
    matching: string;
    numerology: string;
    western: string;
    remedies: string;
    kp: string;
    lalkitab: string;
    tajik: string;
    pdf: string;
    panchang: string;
    horoscope: string;
    tarot: string;
    vastu: string;
  };

  metaScopeLabel: string;
  birthProfileBadge: string;
  universalModeBadge: string;
  fallbackTitle: string;
  fallbackPurpose: string;

  tabMeta: Record<string, {
    title: string;
    purpose: string;
  }>;
}

export const DEMO_TRANSLATIONS: Record<SupportedLang, DemoTranslations> = {
  en: {
    enginesLiveBadge: "125+ API Engines Live",
    securityBadge: "Ephemeris Verified",
    appTitle: "AstroEngine Live Interactive App",
    appSubtitle: "Explore enterprise Vedic astrology endpoints, charts, dasha hierarchies, and forecasts with instant calculations.",
    recalculateBtn: "Recalculate All",
    recalculatingBtn: "Recalculating...",
    apiSpecsBtn: "API Docs",

    universalModeTitle: "Universal Time & Location Mode",
    universalModeDescPrefix: "Independent of birth profile. Computed strictly for coordinates: ",
    universalModeDescSuffix: " & current real-time timestamp.",
    personalModeTitle: "Personal Vedic Profile Mode",
    personalModeDescPrefix: "Active birth chart: ",

    nameLabel: "Name",
    dobLabel: "Date of Birth",
    tobLabel: "Time of Birth",
    cityLabel: "City / Location",
    cityPlaceholder: "Search city...",
    langLabel: "Language",
    applyBtn: "Apply & Recalculate",

    cat1Title: "Personal Birth Profile Engine",
    cat1Count: "15 Engines Active",
    cat2Title: "Universal & Daily Services",
    cat2Count: "4 Engines Active",

    tabs: {
      overview: "Overview",
      ai_astrologer: "AI Astrologer",
      kundli: "Kundli Charts",
      planets: "Planetary Sphuta",
      dasha: "Dasha Hierarchy",
      yogas: "Yogas & Bindus",
      dosha: "Doshas & Transit",
      matching: "Kundli Milan",
      numerology: "Numerology & Lo Shu",
      western: "Western Tropical",
      remedies: "Vedic Remedies",
      kp: "KP System",
      lalkitab: "Lal Kitab",
      tajik: "Tajik & Jaimini",
      pdf: "PDF Reports",
      panchang: "Vedic Panchang",
      horoscope: "12 Rashi Forecast",
      tarot: "Tarot Suite",
      vastu: "MahaVastu 16-Zones",
    },

    metaScopeLabel: "Engine Scope: ",
    birthProfileBadge: "Birth Profile Required",
    universalModeBadge: "Universal Real-time",
    fallbackTitle: "API Module",
    fallbackPurpose: "Calculates precise astrological coordinates and interpretations.",

    tabMeta: {
      overview: {
        title: "Overview & Lagna Core",
        purpose: "Real-time Parashari D1 chart synthesis with planetary degrees, Nakshatras, and active Dasha."
      },
      ai_astrologer: {
        title: "AI Vedic Astrologer",
        purpose: "Classical Parashari consultation analyzing yogas, dasha periods, and life milestones."
      },
      kundli: {
        title: "Harmonic Divisional Charts",
        purpose: "Calculates D1 through D60 divisional SVG charts with planetary dignities and Bhavaphala."
      },
      planets: {
        title: "Swiss Ephemeris Planetary Engine",
        purpose: "Calculates exact celestial longitudes, retrograde motions, combustion, and house cusps."
      },
      dasha: {
        title: "Vimshottari 5-Tier Dasha Hierarchy",
        purpose: "Calculates 120-year complete Mahadasha, Antardasha, Pratyantar, and Sookshma dasha spans."
      },
      yogas: {
        title: "Classical Yogas & Ashtakavarga",
        purpose: "Evaluates hundreds of classical combinations with Sarvashtakavarga 337 bindu strengths."
      },
      dosha: {
        title: "Comprehensive Dosha Analysis",
        purpose: "Classical Manglik with cancellations, Shani Sade Sati phases, Kaal Sarp, and Pitra doshas."
      },
      matching: {
        title: "Ashtakoota Matchmaking Engine",
        purpose: "Evaluates 36 Guna Milan, Dashakoota, Papasamya balance, and Manglik compatibility."
      },
      numerology: {
        title: "Numerology & Lo-Shu Grid",
        purpose: "Calculates Mulank, Bhagyank, Namank, 8 Planes, and annual personal forecasts."
      },
      western: {
        title: "Tropical Sayana Zodiac System",
        purpose: "Computes Sun-Moon-Rising Big Three, major planetary aspects, and tropical natal wheel."
      },
      remedies: {
        title: "Vedic Remedies Engine",
        purpose: "Recommends life gemstones, rudrakshas, authentic Vedic mantras, and yantras."
      },
      kp: {
        title: "Krishnamurti Paddhati (KP System)",
        purpose: "Calculates KP Sign/Star/Sub-Lords, Placidus cusps, and 1-249 horary seed charts."
      },
      lalkitab: {
        title: "Lal Kitab Astrological System",
        purpose: "Identifies sleeping houses, blind planets, parental ancestral debts, and classical Upays."
      },
      tajik: {
        title: "Tajik Varshphal & Jaimini Karakas",
        purpose: "Annual solar return chart, Muntha calculations, 7 Chara Karakas, and Chara Dasha."
      },
      pdf: {
        title: "Async PDF Generation Queue",
        purpose: "Generates high-resolution multi-page astrological PDF reports with branding."
      },
      panchang: {
        title: "Vedic Panchang & Muhurat Engine",
        purpose: "Calculates Tithi, Nakshatra, Yoga, Karana, Choghadiya, and auspicious muhurat windows."
      },
      horoscope: {
        title: "12 Rashi Planetary Predictions",
        purpose: "Daily, weekly, monthly, and annual horoscopes based on live transit placements."
      },
      tarot: {
        title: "78-Card Rider-Waite Tarot Engine",
        purpose: "Daily card, three-card time spread, and Celtic cross readings with upright and reversed states."
      },
      vastu: {
        title: "16-Zone Vedic MahaVastu Engine",
        purpose: "Spatial energy assessment with five elemental balances and non-demolition remedies."
      }
    }
  },

  hi: {
    enginesLiveBadge: "125+ एपीआई इंजन सक्रिय",
    securityBadge: "एफ़ेमेरिस सत्यापित",
    appTitle: "एस्ट्रोइंजन लाइव इंटरैक्टिव ऐप",
    appSubtitle: "वैदिक ज्योतिष के सभी गणना इंजन, कुंडलियां, दशाएं और भविष्यवाणियों की त्वरित गणना करें।",
    recalculateBtn: "पुनः गणना करें",
    recalculatingBtn: "गणना जारी...",
    apiSpecsBtn: "एपीआई विवरण",

    universalModeTitle: "सार्वभौमिक समय व स्थान मोड",
    universalModeDescPrefix: "यह जन्म विवरण से स्वतंत्र है। वर्तमान समय और स्थान: ",
    universalModeDescSuffix: " पर आधारित है।",
    personalModeTitle: "व्यक्तिगत जन्म विवरण मोड",
    personalModeDescPrefix: "सक्रिय जन्म कुंडली: ",

    nameLabel: "नाम",
    dobLabel: "जन्म तिथि",
    tobLabel: "जन्म समय",
    cityLabel: "शहर / स्थान",
    cityPlaceholder: "शहर खोजें...",
    langLabel: "भाषा",
    applyBtn: "लागू करें और गणना करें",

    cat1Title: "व्यक्तिगत जन्म विवरण इंजन",
    cat1Count: "15 इंजन सक्रिय",
    cat2Title: "सार्वभौमिक एवं दैनिक सेवाएं",
    cat2Count: "4 इंजन सक्रिय",

    tabs: {
      overview: "सिंहावलोकन",
      ai_astrologer: "एआई ज्योतिषी",
      kundli: "कुंडली चक्र",
      planets: "ग्रह स्थिति (स्फुट)",
      dasha: "दशा पदानुक्रम",
      yogas: "योग एवं अष्टकवर्ग",
      dosha: "दोष एवं गोचर",
      matching: "कुंडली मिलान",
      numerology: "अंकज्योतिष व लो-शू",
      western: "पाश्चात्य ज्योतिष",
      remedies: "वैदिक उपाय",
      kp: "केपी पद्धति",
      lalkitab: "लाल किताब",
      tajik: "ताजिक व जैमिनी",
      pdf: "पीडीएफ रिपोर्ट",
      panchang: "दैनिक पंचांग",
      horoscope: "राशिफल",
      tarot: "टैरो कार्ड",
      vastu: "महावास्तु 16-क्षेत्र",
    },

    metaScopeLabel: "इंजन कार्यक्षेत्र: ",
    birthProfileBadge: "जन्म विवरण आवश्यक",
    universalModeBadge: "सार्वभौमिक तात्कालिक",
    fallbackTitle: "एपीआई मॉड्यूल",
    fallbackPurpose: "सटीक ज्योतिषीय गणना और परिणाम प्रदान करता है।",

    tabMeta: {
      overview: {
        title: "सिंहावलोकन व लग्न विश्लेषण",
        purpose: "पाराशरी डी1 लग्न चक्र, ग्रह स्थिति, नक्षत्र, और चालू दशा का त्वरित संपूर्ण सारांश।"
      },
      ai_astrologer: {
        title: "एआई वैदिक ज्योतिषी",
        purpose: "पाराशरी सिद्धांतों के अनुसार जीवन के विभिन्न क्षेत्रों पर गहन ज्योतिषीय परामर्श।"
      },
      kundli: {
        title: "षोडशवर्ग कुंडली चक्र (D1 से D60)",
        purpose: "अति-सटीक वर्ग कुंडलियां, भाव-चलित और ग्रह बलाबल का विस्तृत दृश्य।"
      },
      planets: {
        title: "स्विस एफ़ेमेरिस ग्रह स्थिति",
        purpose: "सभी ग्रहों के सटीक भोगांश, वक्री स्थिति, अस्त व भाव संधि गणना।"
      },
      dasha: {
        title: "विंशोत्तरी दशा पदानुक्रम",
        purpose: "120 वर्ष की महादशा, अंतर्दशा, प्रत्यंतर और सूक्ष्म दशा का सटीक विवरण।"
      },
      yogas: {
        title: "शास्त्रीय राजयोग व सर्वाष्टकवर्ग",
        purpose: "सैकड़ों शास्त्रीय योग और 337 बिंदुओं पर आधारित सर्वाष्टकवर्ग शक्ति।"
      },
      dosha: {
        title: "दोष विश्लेषण व साढ़े साती",
        purpose: "मांगलिक दोष (20+ अपवादों सहित), साढ़े साती, कालसर्प एवं पितृ दोष विश्लेषण।"
      },
      matching: {
        title: "अष्टकूट कुंडली मिलान",
        purpose: "36 गुण मिलान, नाड़ी दोष, भकूट दोष व पापसाम्य संतुलन का विस्तृत निर्णय।"
      },
      numerology: {
        title: "अंकज्योतिष एवं लो-शू ग्रिड",
        purpose: "मूलांक, भाग्यांक, नामांक, 8 तत्वीय तल और वार्षिक फलादेश।"
      },
      western: {
        title: "पाश्चात्य ट्रॉपिकल चक्र",
        purpose: "सूर्य-चंद्र-उदय लग्न, प्रमुख कोणीय दृष्टि और गोल नेटल चार्ट।"
      },
      remedies: {
        title: "वैदिक एवं शास्त्रीय उपाय",
        purpose: "जीवन रत्न, रुद्राक्ष, तांत्रिक बीज मंत्र, यंत्र एवं व्रत विधान।"
      },
      kp: {
        title: "केपी नक्षत्र नाड़ी पद्धति",
        purpose: "राशि/नक्षत्र/उप-स्वामी (Sub-Lord), प्लेसिडस भाव और 1-249 प्रश्न कुंडली।"
      },
      lalkitab: {
        title: "लाल किताब ज्योतिष",
        purpose: "सोए हुए घर, अंधे ग्रह, 6 प्रकार के पितृ ऋण और सटीक अचूक उपाय।"
      },
      tajik: {
        title: "ताजिक वर्षफल व जैमिनी चर कारक",
        purpose: "वर्षफल, मुन्था, सहम, 7 चर कारक और चर दशा की गणना।"
      },
      pdf: {
        title: "पीडीएफ रिपोर्ट जनरेटर",
        purpose: "20 से 80 पृष्ठों की विस्तृत व आकर्षक कुंडली रिपोर्ट तैयार करें।"
      },
      panchang: {
        title: "वैदिक पंचांग एवं शुभ मुहूर्त",
        purpose: "तिथि, नक्षत्र, योग, करण, 16 चौघड़िया, होरा और राहुकाल की सटीक गणना।"
      },
      horoscope: {
        title: "12 राशियों का राशिफल",
        purpose: "दैनिक, साप्ताहिक, मासिक व वार्षिक गोचर आधारित भविष्यफल।"
      },
      tarot: {
        title: "78 कार्ड राइडर-वेट टैरो",
        purpose: "दैनिक कार्ड, तीन कार्ड (भूत-वर्तमान-भविष्य) और सेल्टिक क्रॉस रीडिंग।"
      },
      vastu: {
        title: "16-क्षेत्र महावास्तु विश्लेषण",
        purpose: "पंचतत्व संतुलन और बिना तोड़-फोड़ के धातु पट्टी, रंग व पिरामिड उपाय।"
      }
    }
  },

  mr: {
    enginesLiveBadge: "125+ एपीआय इंजिन सक्रिय",
    securityBadge: "इफेमेरिस प्रमाणित",
    appTitle: "अ‍ॅस्ट्रोइंजिन लाइव्ह अ‍ॅप",
    appSubtitle: "वैदिक ज्योतिष गणिते, कुंडल्या, दशा आणि भविष्यकथनाचे त्वरित परिणाम मिळवा.",
    recalculateBtn: "पुन्हा गणना करा",
    recalculatingBtn: "गणना सुरू आहे...",
    apiSpecsBtn: "एपीआय तपशील",

    universalModeTitle: "सार्वत्रिक वेळ व स्थान पद्धती",
    universalModeDescPrefix: "हे जन्म नोंदींवर अवलंबून नाही. चालू वेळ आणि स्थान: ",
    universalModeDescSuffix: " यावर आधारित.",
    personalModeTitle: "वैयक्तिक जन्म पत्रिका पद्धती",
    personalModeDescPrefix: "सक्रिय जन्म कुंडली: ",

    nameLabel: "नाव",
    dobLabel: "जन्म तारीख",
    tobLabel: "जन्म वेळ",
    cityLabel: "शहर / ठिकाण",
    cityPlaceholder: "शहर शोधा...",
    langLabel: "भाषा",
    applyBtn: "लागू करा व गणना करा",

    cat1Title: "वैयक्तिक जन्म पत्रिका इंजिन",
    cat1Count: "15 इंजिन सक्रिय",
    cat2Title: "सार्वत्रिक व दैनंदिन सेवा",
    cat2Count: "4 इंजिन सक्रिय",

    tabs: {
      overview: "सर्वसाधारण आढावा",
      ai_astrologer: "एआय ज्योतिषी",
      kundli: "कुंडली चक्रे",
      planets: "ग्रह स्थिती (स्फुट)",
      dasha: "दशा क्रम",
      yogas: "योग व अष्टकवर्ग",
      dosha: "दोष व गोचर",
      matching: "गुणमेलन / पत्रिका जुळवणी",
      numerology: "अंकशास्त्र व लो-शू",
      western: "पाश्चात्त्य ज्योतिष",
      remedies: "वैदिक उपाय",
      kp: "केपी पद्धती",
      lalkitab: "लाल किताब",
      tajik: "ताजिक व जैमिनी",
      pdf: "पीडीएफ अहवाल",
      panchang: "दैनिक पंचांग",
      horoscope: "राशीभविष्य",
      tarot: "टॅरो कार्ड",
      vastu: "महावास्तू 16-दिशा",
    },

    metaScopeLabel: "इंजिन कार्यक्षेत्र: ",
    birthProfileBadge: "जन्म माहिती आवश्यक",
    universalModeBadge: "सार्वत्रिक तात्कालिक",
    fallbackTitle: "एपीआय विभाग",
    fallbackPurpose: "अचूक ज्योतिषीय गणना व विश्लेषण प्रदान करते.",

    tabMeta: {
      overview: {
        title: "सर्वसाधारण आढावा व लग्न",
        purpose: "पाराशरी डी1 लग्न चक्र, ग्रह अंश, नक्षत्र आणि चालू दशेचा संपूर्ण सारांश."
      },
      ai_astrologer: {
        title: "एआय वैदिक ज्योतिषी",
        purpose: "पाराशरी सिद्धांतांवर आधारित वैयक्तिक जीवन आणि करिअर मार्गदर्शन."
      },
      kundli: {
        title: "षोडशवर्ग कुंडली चक्रे (D1 ते D60)",
        purpose: "सूक्ष्म वर्ग कुंडल्या, भाव-चलित चक्र आणि ग्रह बलाबल."
      },
      planets: {
        title: "स्विस इफेमेरिस ग्रह स्थिती",
        purpose: "सर्व ग्रहांचे अचूक अंशात्मक स्थान, वक्री हालचाली आणि भाव मध्य."
      },
      dasha: {
        title: "विंशोत्तरी दशा क्रम",
        purpose: "120 वर्षांची महादशा, अंतर्दशा, प्रत्यंतर दशा व सूक्ष्म दशांची अचूक कालमर्यादा."
      },
      yogas: {
        title: "शास्त्रीय राजयोग व अष्टकवर्ग",
        purpose: "विविध शुभ योग आणि सर्वाष्टकवर्गातील 337 बिंदूंचे सामर्थ्य."
      },
      dosha: {
        title: "दोष विश्लेषण व शनी साडेसाती",
        purpose: "मांगलिक दोष (अपवादांसह), साडेसाती टप्पे, कालसर्प आणि पितृदोष तपासणी."
      },
      matching: {
        title: "अष्टकूट विवाह पत्रिका जुळवणी",
        purpose: "36 गुण मिलन, नाडी दोष, भकूट दोष आणि पापसाम्य तुलनात्मक अभ्यास."
      },
      numerology: {
        title: "अंकशास्त्र व लो-शू ग्रिड",
        purpose: "मूलांक, भाग्यांक, नामांक, 8 ऊर्जा तल आणि वार्षिक मार्गदर्शन."
      },
      western: {
        title: "पाश्चात्त्य ट्रॉपिकल कुंडली",
        purpose: "सूर्य-चंद्र-लग्न त्रिमूर्ती, ग्रहांचे परस्पर कोणीय पैलू आणि ट्रॉपिकल चक्र."
      },
      remedies: {
        title: "वैदिक व शास्त्रीय उपाय",
        purpose: "जीवन रत्न, रुद्राक्ष, बीज मंत्र, यंत्र आणि व्रत विधी मार्गदर्शन."
      },
      kp: {
        title: "केपी नक्षत्र पद्धती",
        purpose: "राशी/नक्षत्र/उप-स्वामी (Sub-Lord), प्लेसिडस भाव आणि 1-249 प्रश्न कुंडली."
      },
      lalkitab: {
        title: "लाल किताब प्रणाली",
        purpose: "सुप्त घरे, अंध ग्रह, 6 पितृ ऋण आणि अचूक पारंपरिक तोडगे."
      },
      tajik: {
        title: "ताजिक वर्षफळ व जैमिनी कारक",
        purpose: "वार्षिक सौर वर्षफळ, मुन्था, 7 चर कारक आणि चर दशा."
      },
      pdf: {
        title: "पीडीएफ अहवाल सेवा",
        purpose: "ग्राहकांसाठी सुंदर आणि सविस्तर कुंडली अहवाल तयार करा."
      },
      panchang: {
        title: "वैदिक पंचांग व शुभ मुहूर्त",
        purpose: "तिथी, वार, नक्षत्र, योग, करण, चोघडिया, होरा आणि राहूकाळ."
      },
      horoscope: {
        title: "12 राशींचे राशीभविष्य",
        purpose: "दैनिक, साप्ताहिक, मासिक आणि वार्षिक गोचर फलादेश."
      },
      tarot: {
        title: "78 कार्ड टॅरो प्रणाली",
        purpose: "दैनिक कार्ड, तीन कार्ड स्प्रेड आणि सेल्टिक क्रॉस वाचन."
      },
      vastu: {
        title: "16-दिशा महावास्तू ऊर्जा",
        purpose: "पंचतत्व संतुलन आणि विना-तोडफोड पट्ट्या, रंग आणि पिरॅमिड उपाय."
      }
    }
  },

  gu: {
    enginesLiveBadge: "125+ એપીઆઈ એન્જિન સક્રિય",
    securityBadge: "એફેમેરિસ પ્રમાણિત",
    appTitle: "એસ્ટ્રોએન્જિન લાઈવ એપ",
    appSubtitle: "વૈદિક જ્યોતિષ ગણતરીઓ, કુંડળી, દશા અને ફળાદેશના ત્વરિત પરિણામો મેળવો.",
    recalculateBtn: "ફરી ગણતરી કરો",
    recalculatingBtn: "ગણતરી ચાલુ છે...",
    apiSpecsBtn: "એપીઆઈ વિગતો",

    universalModeTitle: "સાર્વત્રિક સમય અને સ્થાન પદ્ધતિ",
    universalModeDescPrefix: "આ જન્મ વિગતોથી મુક્ત છે. હાલનો સમય અને સ્થળ: ",
    universalModeDescSuffix: " પર આધારિત છે.",
    personalModeTitle: "વ્યક્તિગત જન્મ કુંડળી પદ્ધતિ",
    personalModeDescPrefix: "સક્રિય જન્મ કુંડળી: ",

    nameLabel: "નામ",
    dobLabel: "જન્મ તારીખ",
    tobLabel: "જન્મ સમય",
    cityLabel: "શહેર / સ્થળ",
    cityPlaceholder: "શહેર શોધો...",
    langLabel: "ભાષા",
    applyBtn: "લાગુ કરો અને ગણો",

    cat1Title: "વ્યક્તિગત જન્મ કુંડળી એન્જિન",
    cat1Count: "15 એન્જિન સક્રિય",
    cat2Title: "સાર્વત્રિક અને દૈનિક સેવાઓ",
    cat2Count: "4 એન્જિન સક્રિય",

    tabs: {
      overview: "સામાન્ય પરિચય",
      ai_astrologer: "એઆઈ જ્યોતિષી",
      kundli: "કુંડળી ચક્રો",
      planets: "ગ્રહ સ્થિતિ (સ્ફુટ)",
      dasha: "દશા ક્રમ",
      yogas: "યોગ અને અષ્ટકવર્ગ",
      dosha: "દોષ અને ગોચર",
      matching: "કુંડળી મેળવણ",
      numerology: "અંકશાસ્ત્ર અને લો-શૂ",
      western: "પાશ્ચાત્ય જ્યોતિષ",
      remedies: "વૈદિક ઉપાય",
      kp: "કેપી પદ્ધતિ",
      lalkitab: "લાલ કિતાબ",
      tajik: "તાજિક અને જૈમિની",
      pdf: "પીડીએફ અહેવાલ",
      panchang: "દૈનિક પંચાંગ",
      horoscope: "રાશિફળ",
      tarot: "ટેરોટ કાર્ડ",
      vastu: "મહાવાસ્તુ 16-ક્ષેત્ર",
    },

    metaScopeLabel: "એન્જિન કાર્યક્ષેત્ર: ",
    birthProfileBadge: "જન્મ માહિતી જરૂરી",
    universalModeBadge: "સાર્વત્રિક તત્કાલ",
    fallbackTitle: "એપીઆઈ મોડ્યુલ",
    fallbackPurpose: "ચોક્કસ જ્યોતિષીય ગણતરી અને અર્થઘટન આપે છે.",

    tabMeta: {
      overview: {
        title: "સામાન્ય પરિચય અને લગ્ન",
        purpose: "પારાશરી ડી1 લગ્ન ચક્ર, ગ્રહ ડિગ્રી, નક્ષત્ર અને ચાલુ દશાનો ત્વરિત સારાંશ."
      },
      ai_astrologer: {
        title: "એઆઈ વૈદિક જ્યોતિષી",
        purpose: "પારાશરી સિદ્ધાંતો મુજબ જીવન અને કારકિર્દી સંબંધી માર્ગદર્શન."
      },
      kundli: {
        title: "ષોડશવર્ગ કુંડળી ચક્ર (D1 થી D60)",
        purpose: "સૂક્ષ્મ વર્ગ કુંડળીઓ, ભાવ-ચલિત અને ગ્રહ બળાબળ."
      },
      planets: {
        title: "સ્વિસ એફેમેરિસ ગ્રહ સ્થિતિ",
        purpose: "તમામ ગ્રહોના ચોક્કસ અંશાત્મક સ્થાન, વક્રી ગતિ અને ભાવ સંધિ."
      },
      dasha: {
        title: "વિંશોત્તરી દશા ક્રમ",
        purpose: "120 વર્ષની મહાદશા, અંતર્દશા, પ્રત્યંતર દશા અને સૂક્ષ્મ દશાની ચોક્કસ સમયસીમા."
      },
      yogas: {
        title: "શાસ્ત્રીય રાજયોગ અને અષ્ટકવર્ગ",
        purpose: "શુભ યોગો અને 337 બિંદુઓ આધારિત સર્વાષ્ટકવર્ગ બળ."
      },
      dosha: {
        title: "દોષ વિશ્લેષણ અને સાડાસાતી",
        purpose: "માંગલિક દોષ (અપવાદો સાથે), સાડાસાતી તબક્કા, કાલસર્પ અને પિતૃદોષ."
      },
      matching: {
        title: "અષ્ટકૂટ કુંડળી મેળવણ",
        purpose: "36 ગુણ મિલન, નાડી દોષ, ભકૂટ દોષ અને પાપસામ્ય તુલના."
      },
      numerology: {
        title: "અંકશાસ્ત્ર અને લો-શૂ ગ્રીડ",
        purpose: "મૂળાંક, ભાગ્યાંક, નામાંક, 8 તત્ત્વીય પ્લેન અને વાર્ષિક આગાહી."
      },
      western: {
        title: "પાશ્ચાત્ય ટ્રોપિકલ ચક્ર",
        purpose: "સૂર્ય-ચંદ્ર-ઉદય લગ્ન ત્રિપુટી, ગ્રહ પાસાઓ અને ટ્રોપિકલ નેટલ ચાર્ટ."
      },
      remedies: {
        title: "વૈદિક અને શાસ્ત્રીય ઉપાય",
        purpose: "જીવન રત્ન, રુદ્રાક્ષ, બીજ મંત્ર, યંત્ર અને વ્રત વિધાન."
      },
      kp: {
        title: "કેપી નક્ષત્ર પદ્ધતિ",
        purpose: "રાશિ/નક્ષત્ર/સબ-લોર્ડ, પ્લેસિડસ કસ્પ્સ અને 1-249 પ્રશ્ન કુંડળી."
      },
      lalkitab: {
        title: "લાલ કિતાબ જ્યોતિષ",
        purpose: "સુષુપ્ત ઘરો, અંધ ગ્રહો, 6 પિતૃ ઋણ અને પરંપરાગત સચોટ ઉપાય."
      },
      tajik: {
        title: "તાજિક વર્ષફળ અને જૈમિની કારક",
        purpose: "વાર્ષિક સૂર્ય વર્ષફળ, મુન્થા, 7 ચર કારક અને ચર દશા."
      },
      pdf: {
        title: "પીડીએફ અહેવાલ સેવા",
        purpose: "ગ્રાહકો માટે વિસ્તૃત અને સુંદર કુંડળી રિપોર્ટ તૈયાર કરો."
      },
      panchang: {
        title: "વૈદિક પંચાંગ અને શુભ મુહૂર્ત",
        purpose: "તિથિ, વાર, નક્ષત્ર, યોગ, કરણ, ચોઘડિયા, હોરા અને રાહુકાળ."
      },
      horoscope: {
        title: "12 રાશિઓનું રાશિફળ",
        purpose: "દૈનિક, સાપ્તાહિક, માસિક અને વાર્ષિક ગોચર રાશિફળ."
      },
      tarot: {
        title: "78 કાર્ડ ટેરોટ રીડિંગ",
        purpose: "દૈનિક કાર્ડ, ત્રણ કાર્ડ સ્પ્રેડ અને સેલ્ટિક ક્રોસ માર્ગદર્શન."
      },
      vastu: {
        title: "16-ક્ષેત્ર મહાવાસ્તુ ઊર્જા",
        purpose: "પંચતત્ત્વ સંતુલન અને તોડફોડ વગર ધાતુ પટ્ટી, રંગ અને પિરામિડ ઉપાય."
      }
    }
  },

  ta: {
    enginesLiveBadge: "125+ API என்ஜின்கள் நேரலையில்",
    securityBadge: "எபிமெரிஸ் சரிபார்க்கப்பட்டது",
    appTitle: "ஆஸ்ட்ரோ என்ஜின் நேரலை ஊடாடும் செயலி",
    appSubtitle: "நிகழ்நேர ஜோதிட கணக்கீடுகள், ஜாதகம், தசா புத்திகள் மற்றும் கணிப்புகளை விரைவாகப் பெறுங்கள்.",
    recalculateBtn: "மீண்டும் கணக்கிடு",
    recalculatingBtn: "கணக்கிடுகிறது...",
    apiSpecsBtn: "API விவரக்குறிப்பு",

    universalModeTitle: "பொதுவான நேரம் மற்றும் இருப்பிட முறை",
    universalModeDescPrefix: "இது பிறப்பு விவரங்களை சார்ந்தது அல்ல. தற்போதைய ஆயத்தொலைவுகள்: ",
    universalModeDescSuffix: " மற்றும் நேரத்தின் அடிப்படையில் கணக்கிடப்படுகிறது.",
    personalModeTitle: "தனிப்பட்ட பிறப்பு விவர முறை",
    personalModeDescPrefix: "செயலில் உள்ள ஜாதகம்: ",

    nameLabel: "பெயர்",
    dobLabel: "பிறந்த தேதி",
    tobLabel: "பிறந்த நேரம்",
    cityLabel: "நகரம் / இருப்பிடம்",
    cityPlaceholder: "நகரத்தைத் தேடு...",
    langLabel: "மொழி",
    applyBtn: "பயன்படுத்தி கணக்கிடு",

    cat1Title: "தனிப்பட்ட பிறப்பு விவர என்ஜின்",
    cat1Count: "15 என்ஜின்கள் செயலில்",
    cat2Title: "பொதுவான மற்றும் தினசரி சேவைகள்",
    cat2Count: "4 என்ஜின்கள் செயலில்",

    tabs: {
      overview: "பொது பார்வை",
      ai_astrologer: "AI ஜோதிடர்",
      kundli: "ஜாதக கட்டங்கள்",
      planets: "கிரக நிலைகள் (ஸ்புடம்)",
      dasha: "தசா புக்தி படிநிலை",
      yogas: "யோகங்கள் & அஷ்டகவர்க்கம்",
      dosha: "தோஷங்கள் & பெயர்ச்சி",
      matching: "திருமண பொருத்தம்",
      numerology: "எண் கணிதம் & லோ-ஷூ",
      western: "மேற்கத்திய ஜோதிடம்",
      remedies: "வேத பரிகாரங்கள்",
      kp: "கேபி முறை",
      lalkitab: "லால் கிதாப்",
      tajik: "தாஜிக் & ஜைமினி",
      pdf: "PDF அறிக்கைகள்",
      panchang: "தினசரி பஞ்சாங்கம்",
      horoscope: "ராசி பலன்",
      tarot: "டாரோட் கார்டுகள்",
      vastu: "மகா வாஸ்து 16-மண்டலங்கள்",
    },

    metaScopeLabel: "என்ஜின் நோக்கம்: ",
    birthProfileBadge: "பிறப்பு விவரம் தேவை",
    universalModeBadge: "நிகழ்நேர உலகளாவியது",
    fallbackTitle: "API தொகுதி",
    fallbackPurpose: "துல்லியமான ஜோதிட நிலைகளையும் கணிப்புகளையும் வழங்குகிறது.",

    tabMeta: {
      overview: {
        title: "பொது பார்வை & லக்னம்",
        purpose: "பராசர D1 ஜாதகம், கிரக நிலைகள், நட்சத்திரம் மற்றும் தற்போதைய தசா தொகுப்பு."
      },
      ai_astrologer: {
        title: "AI வேத ஜோதிடர்",
        purpose: "பராசர நெறிமுறைகளின்படி வாழ்க்கை மற்றும் தொழில் வழிகாட்டுதல்."
      },
      kundli: {
        title: "வர்க்க கட்டங்கள் (D1 முதல் D60)",
        purpose: "துல்லியமான வர்க்க சக்கரங்கள், பாவ சலிதம் மற்றும் கிரக பலன்கள்."
      },
      planets: {
        title: "சுவிஸ் எபிமெரிஸ் கிரக நிலைகள்",
        purpose: "கிரகங்களின் துல்லிய பாகைகள், வக்ர கதி மற்றும் பாவ சந்திகள்."
      },
      dasha: {
        title: "விம்சோத்தரி தசா புக்தி",
        purpose: "120 வருட மகா தசை, புக்தி, பிரத்யந்தர தசா கால அட்டவணை."
      },
      yogas: {
        title: "யோகங்கள் & அஷ்டகவர்க்கம்",
        purpose: "நூற்றுக்கணக்கான யோகங்கள் மற்றும் 337 பிந்து சர்வாஷ்டகவர்க்க பலம்."
      },
      dosha: {
        title: "தோஷ ஆய்வு & ஏழரை சனி",
        purpose: "செவ்வாய் தோஷம் (விலக்குகளுடன்), ஏழரை சனி, கால சர்ப்பம் மற்றும் பித்ரு தோஷம்."
      },
      matching: {
        title: "திருமணப் பொருத்த ஆய்வு",
        purpose: "36 குணப் பொருத்தம், நாடி தோஷம், ரஜ்ஜு பொருத்தம் மற்றும் பாபசாம்யம்."
      },
      numerology: {
        title: "எண் கணிதம் & லோ-ஷூ கட்டம்",
        purpose: "மூல எண், விதி எண், பெயர் எண் மற்றும் வருடாந்திர பலன்கள்."
      },
      western: {
        title: "மேற்கத்திய சயன முறை",
        purpose: "சூரியன்-சந்திரன்-லக்ன முக்கூட்டு மற்றும் வட்ட வடிவ ஜாதக சக்கரம்."
      },
      remedies: {
        title: "வேத பரிகாரங்கள்",
        purpose: "ராசி கற்கள், ருத்ராட்சம், மூல மந்திரங்கள் மற்றும் எந்திர வழிபாடுகள்."
      },
      kp: {
        title: "கே.பி. நட்சத்திர நாடி முறை",
        purpose: "ராசி/நட்சத்திர/உப-அதிபதி (Sub-Lord) மற்றும் 1-249 பிரசன்ன ஜாதகம்."
      },
      lalkitab: {
        title: "லால் கிதாப் முறை",
        purpose: "உறங்கும் வீடுகள், குருட்டு கிரகங்கள் மற்றும் பாரம்பரிய எளிய பரிகாரங்கள்."
      },
      tajik: {
        title: "தாஜிக் ஆண்டு பலன் & ஜைமினி",
        purpose: "ஆண்டு பலன் (வர்ஷபலம்), முந்தா, 7 காரகங்கள் மற்றும் சர தசை."
      },
      pdf: {
        title: "PDF ஜாதக அறிக்கை",
        purpose: "வாடிக்கையாளர்களுக்கான உயர்தர விரிவான அச்சு அறிக்கைகள்."
      },
      panchang: {
        title: "தினசரி பஞ்சாங்கம் & முகூர்த்தம்",
        purpose: "திதி, வாரம், நட்சத்திரம், யோகம், கரணம், சோகடியா மற்றும் ராகு காலம்."
      },
      horoscope: {
        title: "12 ராசிகளின் ராசிபலன்",
        purpose: "தினசரி, வாராந்திர, மாதாந்திர மற்றும் வருடாந்திர கோச்சார பலன்கள்."
      },
      tarot: {
        title: "78 டாரோட் கார்டு வாசிப்பு",
        purpose: "தினசரி அட்டை, மூன்று கார்டு மற்றும் செல்டிக் கிராஸ் வழிகாட்டுதல்."
      },
      vastu: {
        title: "16-மண்டல மகா வாஸ்து",
        purpose: "பஞ்ச பூத சமநிலை மற்றும் இடிக்காமல் அமைக்கும் உலோகப் பட்டை, வண்ண பரிகாரங்கள்."
      }
    }
  },

  te: {
    enginesLiveBadge: "125+ API ఇంజిన్లు లైవ్",
    securityBadge: "ఎఫెమెరిస్ ధృవీకరించబడింది",
    appTitle: "ఆస్ట్రోఇంజన్ లైవ్ ఇంటరాక్టివ్ యాప్",
    appSubtitle: "వేద జ్యోతిష్య ముగింపులు, చక్రాలు, దశా విభాగాలు మరియు సూచనలను వేగంగా పొందండి.",
    recalculateBtn: "మళ్లీ లెక్కించు",
    recalculatingBtn: "లెక్కిస్తోంది...",
    apiSpecsBtn: "API వివరాలు",

    universalModeTitle: "సార్వత్రిక సమయం & స్థాన మోడ్",
    universalModeDescPrefix: "ఇది జన్మ వివరాలపై ఆధారపడదు. ప్రస్తుత అక్షాంశాలు: ",
    universalModeDescSuffix: " మరియు సమయం ఆధారంగా లెక్కించబడుతుంది.",
    personalModeTitle: "వ్యక్తిగత జన్మ వివరాల మోడ్",
    personalModeDescPrefix: "సక్రియ జన్మ చక్రం: ",

    nameLabel: "పేరు",
    dobLabel: "పుట్టిన తేదీ",
    tobLabel: "పుట్టిన సమయం",
    cityLabel: "నగరం / ప్రదేశం",
    cityPlaceholder: "నగరాన్ని శోధించండి...",
    langLabel: "భాష",
    applyBtn: "వర్తింపజేసి లెక్కించు",

    cat1Title: "వ్యక్తిగత జన్మ వివరాల ఇంజిన్",
    cat1Count: "15 ఇంజిన్లు సక్రియంగా ఉన్నాయి",
    cat2Title: "సార్వత్రిక & రోజువారీ సేవలు",
    cat2Count: "4 ఇంజిన్లు సక్రియంగా ఉన్నాయి",

    tabs: {
      overview: "స్థూల పరిశీలన",
      ai_astrologer: "AI జ్యోతిష్యుడు",
      kundli: "కుండలి చక్రాలు",
      planets: "గ్రహ స్థితులు (స్ఫుట)",
      dasha: "దశా శ్రేణి",
      yogas: "యోగాలు & అష్టకవర్గ",
      dosha: "దోషాలు & గోచారం",
      matching: "కుండలి మిలన్ / పొంతన",
      numerology: "సంఖ్యాశాస్త్రం & లో-షూ",
      western: "పాశ్చాత్య జ్యోతిష్యం",
      remedies: "వేద పరిహారాలు",
      kp: "KP పద్ధతి",
      lalkitab: "లాల్ కితాబ్",
      tajik: "తాజిక్ & జైమిని",
      pdf: "PDF నివేదికలు",
      panchang: "రోజువారీ పంచాంగం",
      horoscope: "రాశి ఫలాలు",
      tarot: "టారో కార్డులు",
      vastu: "మహావాస్తు 16-విభాగాలు",
    },

    metaScopeLabel: "ఇంజిన్ పరిధి: ",
    birthProfileBadge: "జన్మ వివరాలు అవసరం",
    universalModeBadge: "సార్వత్రిక తాజా వివరాలు",
    fallbackTitle: "API మాడ్యూల్",
    fallbackPurpose: "ఖచ్చితమైన జ్యోతిష్య లెక్కలు మరియు వివరణలను అందిస్తుంది.",

    tabMeta: {
      overview: {
        title: "స్థూల పరిశీలన & లగ్నం",
        purpose: "పారాశరి D1 చక్రం, గ్రహ డిగ్రీలు, నక్షత్రాలు మరియు ప్రస్తుత దశా సారాంశం."
      },
      ai_astrologer: {
        title: "AI వేద జ్యోతిష్యుడు",
        purpose: "పారాశరి సిద్ధాంతాల ప్రకారం జీవిత మరియు వృత్తి మార్గదర్శకత్వం."
      },
      kundli: {
        title: "షోడశవర్గ చక్రాలు (D1 నుండి D60)",
        purpose: "అధిక ఖచ్చితత్వంతో వర్గ చక్రాలు, భావ-చలిత మరియు గ్రహ బలాలు."
      },
      planets: {
        title: "స్విస్ ఎఫెమెరిస్ గ్రహ స్థితులు",
        purpose: "సమస్త గ్రహాల కచ్చితమైన డిగ్రీలు, వక్ర గమనం మరియు భావ సంధులు."
      },
      dasha: {
        title: "వింశోత్తరి దశా విభాగం",
        purpose: "120 సంవత్సరాల మహర్దశ, అంతర్దశ, ప్రత్యంతర దశల కచ్చితమైన గడువులు."
      },
      yogas: {
        title: "శాస్త్రీయ యోగాలు & అష్టకవర్గ",
        purpose: "వందలాది యోగాలు మరియు 337 బిందువుల సర్వాష్టకవర్గ శక్తి."
      },
      dosha: {
        title: "దోష విశ్లేషణ & ఏలినాటి శని",
        purpose: "కుజ దోషం (మినహాయింపులతో), ఏలినాటి శని, కాలసర్ప మరియు పితృ దోషాలు."
      },
      matching: {
        title: "అష్టకూట వివాహ పొంతన",
        purpose: "36 గుణ మేళనం, నాడీ దోషం మరియు పాపసామ్య తులనాత్మక పరిశీలన."
      },
      numerology: {
        title: "సంఖ్యాశాస్త్రం & లో-షూ గ్రిడ్",
        purpose: "మూలాంకం, భాగ్యాంకం, నామాంకం మరియు వార్షిక ఫలితాలు."
      },
      western: {
        title: "పాశ్చాత్య సాయన పద్ధతి",
        purpose: "సూర్య-చంద్ర-లగ్న త్రయం మరియు వర్తుల నేటల్ చార్ట్."
      },
      remedies: {
        title: "వేద పరిహారాలు",
        purpose: "జీవన రత్నాలు, రుద్రాక్షలు, బీజ మంత్రాలు మరియు యంత్ర సాధన."
      },
      kp: {
        title: "కె.పి. నక్షత్ర నాడీ పద్ధతి",
        purpose: "రాశి/నక్షత్ర/ఉప-అధిపతి (Sub-Lord) మరియు 1-249 ప్రశ్న కుండలి."
      },
      lalkitab: {
        title: "లాల్ కితాబ్ జ్యోతిష్యం",
        purpose: "నిద్రించే ఇళ్ళు, గ్రుడ్డి గ్రహాలు మరియు సత్వర ఉపశమన పరిహారాలు."
      },
      tajik: {
        title: "తాజిక్ వర్షఫలం & జైమిని",
        purpose: "వార్షిక వర్షఫలం, ముంతా, 7 చర కారకాలు మరియు చర దశ."
      },
      pdf: {
        title: "PDF నివేదికల వ్యవస్థ",
        purpose: "సమగ్ర జాతక పత్రాల ముద్రణ రూపకల్పన."
      },
      panchang: {
        title: "రోజువారీ పంచాంగం & ముహూర్తాలు",
        purpose: "తిథి, వారం, నక్షత్రం, యోగం, కరణం, చోఘడియా మరియు రాహుకాలం."
      },
      horoscope: {
        title: "12 రాశుల రాశిఫలాలు",
        purpose: "రోజువారీ, వార, మాస మరియు వార్షిక గోచార ఫలితాలు."
      },
      tarot: {
        title: "78 కార్డుల టారో రీడింగ్",
        purpose: "రోజువారీ కార్డు, మూడు కార్డుల స్ప్రెడ్ మరియు సెల్టిక్ క్రాస్ రీడింగ్."
      },
      vastu: {
        title: "16-విభాగాల మహావాస్తు",
        purpose: "పంచభూత సమతుల్యత మరియు గోడలు కూల్చకుండా లోహ పట్టీల పరిహారాలు."
      }
    }
  },

  bn: {
    enginesLiveBadge: "১২৫+ এপিআই ইঞ্জিন লাইভ",
    securityBadge: "এফিমেরিস যাচাইকৃত",
    appTitle: "অ্যাস্ট্রোইঞ্জিন লাইভ ইন্টারঅ্যাক্টিভ অ্যাপ",
    appSubtitle: "বৈদিক জ্যোতিষশাস্ত্রের রিয়েল-টাইম হিসাব, জন্মছক, দশা এবং ভবিষ্যৎবাণী পর্যবেক্ষণ করুন।",
    recalculateBtn: "পুনরায় গণনা করুন",
    recalculatingBtn: "গণনা করা হচ্ছে...",
    apiSpecsBtn: "এপিআই বিবরণ",

    universalModeTitle: "সার্বজনীন সময় ও স্থান মোড",
    universalModeDescPrefix: "এটি জন্ম বিবরণের উপর নির্ভরশীল নয়। বর্তমান সময় এবং স্থানাঙ্ক: ",
    universalModeDescSuffix: " এর উপর ভিত্তি করে নির্ধারিত।",
    personalModeTitle: "ব্যক্তিগত জন্ম বিবরণ মোড",
    personalModeDescPrefix: "সক্রিয় জন্মছক: ",

    nameLabel: "নাম",
    dobLabel: "জন্ম তারিখ",
    tobLabel: "জন্ম সময়",
    cityLabel: "শহর / অবস্থান",
    cityPlaceholder: "শহর খুঁজুন...",
    langLabel: "ভাষা",
    applyBtn: "প্রয়োগ ও গণনা করুন",

    cat1Title: "ব্যক্তিগত জন্ম বিবরণ ইঞ্জিন",
    cat1Count: "১৫টি ইঞ্জিন সক্রিয়",
    cat2Title: "সার্বজনীন ও দৈনিক সেবাসমূহ",
    cat2Count: "৪টি ইঞ্জিন সক্রিয়",

    tabs: {
      overview: "সারসংক্ষেপ",
      ai_astrologer: "এআই জ্যোতিষী",
      kundli: "কোষ্ঠী চক্রসমূহ",
      planets: "গ্রহের অবস্থান (স্ফুট)",
      dasha: "দশা পর্যায়ক্রম",
      yogas: "যোগ ও অষ্টকবর্গ",
      dosha: "দোষ ও গোচর",
      matching: "যোটক বিচার / মিলান",
      numerology: "সংখ্যাতত্ত্ব ও লো-শু",
      western: "পাশ্চাত্য জ্যোতিষ",
      remedies: "বৈদিক প্রতিকার",
      kp: "কেপি পদ্ধতি",
      lalkitab: "লাল কিতাব",
      tajik: "তাজিক ও জৈমিনী",
      pdf: "পিডিএফ প্রতিবেদন",
      panchang: "দৈনিক পঞ্জিকা",
      horoscope: "রাশিফল",
      tarot: "ট্যারো কার্ড",
      vastu: "মহাবাস্তু ১৬-অঞ্চল",
    },

    metaScopeLabel: "ইঞ্জিনের পরিধি: ",
    birthProfileBadge: "জন্ম বিবরণ প্রয়োজন",
    universalModeBadge: "রিয়েল-টাইম সার্বজনীন",
    fallbackTitle: "এপিআই মডিউল",
    fallbackPurpose: "সঠিক জ্যোতিষীয় গণনা এবং ফলাফল প্রদান করে।",

    tabMeta: {
      overview: {
        title: "সারসংক্ষেপ ও লগ্ন বিশ্লেষণ",
        purpose: "পরাশরী ডি১ লগ্ন চক্র, গ্রহের ডিগ্রি, নক্ষত্র এবং বর্তমান দশার সংক্ষিপ্ত বিবরণ।"
      },
      ai_astrologer: {
        title: "এআই বৈদিক জ্যোতিষী",
        purpose: "পরাশরী নিয়ম অনুযায়ী জীবন ও কর্মজীবনের গভীর জ্যোতিষীয় মূল্যায়ন।"
      },
      kundli: {
        title: "ষোড়শবর্গ কোষ্ঠী চক্র (D1 থেকে D60)",
        purpose: "অত্যন্ত সূক্ষ্ম বর্গ চক্র, ভাব-চলিত এবং গ্রহের বলাবল।"
      },
      planets: {
        title: "সুইস এফিমেরিস গ্রহের অবস্থান",
        purpose: "সকল গ্রহের সঠিক দ্রাঘিমাংশ, বক্রী গতি এবং ভাব সন্ধি গণনা।"
      },
      dasha: {
        title: "বিংশোত্তরী দশা পর্যায়ক্রম",
        purpose: "১২০ বছরের মহাদশা, অন্তর্দশা, প্রত্যন্তর ও সূক্ষ্ম দশার সময়সীমা।"
      },
      yogas: {
        title: "শাস্ত্রীয় যোগ ও অষ্টকবর্গ",
        purpose: "শত শত শাস্ত্রীয় শুভ যোগ এবং ৩৩৭ বিন্দু সর্বাষ্টকবর্গ শক্তি।"
      },
      dosha: {
        title: "দোষ বিচার ও সাড়ে সাতি",
        purpose: "মাঙ্গলিক দোষ (ব্যতিক্রমসহ), সাড়ে সাতি, কালসর্প ও পিতৃ দোষ।"
      },
      matching: {
        title: "অষ্টকূট যোটক বিচার",
        purpose: "৩৬ গুণ মিলন, নাড়ী দোষ এবং পাপসাম্য ভারসাম্য পরীক্ষা।"
      },
      numerology: {
        title: "সংখ্যাতত্ত্ব ও লো-শু গ্রিড",
        purpose: "মূলাঙ্ক, ভাগ্যাঙ্ক, নামাঙ্ক এবং বার্ষিক ব্যক্তিগত পূর্বাভাস।"
      },
      western: {
        title: "পাশ্চাত্য সায়না চক্র",
        purpose: "সূর্য-চন্দ্র-লগ্ন ত্রয়ী এবং বৃত্তাকার পাশ্চাত্য জন্মছক।"
      },
      remedies: {
        title: "বৈদিক প্রতিকার ব্যবস্থা",
        purpose: "জীবন রত্ন, রুদ্রাক্ষ, বৈদিক বীজ মন্ত্র এবং যন্ত্র উপাসনা।"
      },
      kp: {
        title: "কে.পি. নক্ষত্র নাড়ী পদ্ধতি",
        purpose: "রাশি/নক্ষত্র/উপ-অধিপতি (Sub-Lord) এবং ১-২৪৯ প্রশ্ন কোষ্ঠী।"
      },
      lalkitab: {
        title: "লাল কিতাব পদ্ধতি",
        purpose: "ঘুমন্ত ঘর, অন্ধ গ্রহ, ৬টি পিতৃ ঋণ এবং ঐতিহ্যবাহী প্রতিকার।"
      },
      tajik: {
        title: "তাজিক বর্ষফল ও জৈমিনী কারক",
        purpose: "বার্ষিক বর্ষফল, মুন্থা, ৭টি চর কারক এবং চর দশা গণনা।"
      },
      pdf: {
        title: "পিডিএফ প্রতিবেদন সেবা",
        purpose: "গ্রাহকদের জন্য পূর্ণাঙ্গ ও দৃষ্টিনন্দন কোষ্ঠী রিপোর্ট।"
      },
      panchang: {
        title: "দৈনিক পঞ্জিকা ও শুভ মুহূর্ত",
        purpose: "তিথি, বার, নক্ষত্র, যোগ, করণ, চোঘড়িয়া এবং রাহুকাল।"
      },
      horoscope: {
        title: "১২টি রাশির রাশিফল",
        purpose: "দৈনিক, সাপ্তাহিক, মাসিক এবং বার্ষিক গোচর রাশিফল।"
      },
      tarot: {
        title: "৭৮ কার্ড ট্যারো নির্দেশিকা",
        purpose: "দৈনিক কার্ড, তিন কার্ড স্প্রেড এবং সেল্টিক ক্রস রিডিং।"
      },
      vastu: {
        title: "১৬-অঞ্চল মহাবাস্তু বিশ্লেষণ",
        purpose: "পঞ্চতত্ত্ব ভারসাম্য এবং ভাঙচুরহীন ধাতব স্ট্রিপ ও রঙের প্রতিকার।"
      }
    }
  }
};
