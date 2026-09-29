import type { Locale } from "@/lib/locale";
import { REPORT_ENDPOINTS, REPORT_GROUPS } from "@/lib/birthReport";

export interface ReportLabels {
  eyebrow: string;
  progress: (done: number, total: number, failed: number) => string;
  dob: string;
  tob: string;
  place: string;
  coordinates: string;
  loaded: string;
  failed: string;
  waiting: string;
  loading: string;
  retry: (n: number) => string;
  rerun: string;
  rerunning: string;
  sections: string;
  showAll: (n: number) => string;
  showFewer: string;
  details: string;
  seeDetails: string;
  yes: string;
  no: string;
  footnote: string;
  configTitle: string;
  configHelp: string;
  langNote: string;
}

interface ReportText {
  labels: ReportLabels;
  groups: Record<string, { title: string; blurb: string }>;
  endpoints: Record<string, string>;
}

const EN_LABELS: ReportLabels = {
  eyebrow: "Complete birth report",
  progress: (done, total, failed) => `${done} of ${total} calculations finished${failed > 0 ? `, ${failed} failed` : ""}`,
  dob: "Date of birth",
  tob: "Time of birth",
  place: "Place",
  coordinates: "Coordinates",
  loaded: "Loaded",
  failed: "Failed",
  waiting: "Waiting",
  loading: "Loading",
  retry: (n) => `Retry ${n}`,
  rerun: "Run the whole report again",
  rerunning: "Running again",
  sections: "Report sections",
  showAll: (n) => `Show all ${n} rows`,
  showFewer: "Show fewer rows",
  details: "Details",
  seeDetails: "see details",
  yes: "Yes",
  no: "No",
  footnote:
    "This report runs every API that needs only name, date, time and place of birth. Tools that need more input, such as matchmaking, tarot, vastu, the AI astrologer and PDF reports, are in the calculators below.",
  configTitle: "The report cannot run yet",
  configHelp: "The server is missing a setting it needs to call the astrology engine. Ask whoever runs this site to finish the setup, then submit the form again.",
  langNote: "Field names come from the API and stay in English; the values follow the selected language.",
};

const HI_LABELS: ReportLabels = {
  eyebrow: "संपूर्ण जन्म रिपोर्ट",
  progress: (done, total, failed) => `${total} में से ${done} गणनाएँ पूरी${failed > 0 ? `, ${failed} विफल` : ""}`,
  dob: "जन्म तिथि",
  tob: "जन्म समय",
  place: "जन्म स्थान",
  coordinates: "निर्देशांक",
  loaded: "प्राप्त",
  failed: "विफल",
  waiting: "प्रतीक्षा",
  loading: "लोड हो रहा है",
  retry: (n) => `पुनः प्रयास ${n}`,
  rerun: "पूरी रिपोर्ट दोबारा चलाएँ",
  rerunning: "दोबारा चल रही है",
  sections: "रिपोर्ट के भाग",
  showAll: (n) => `सभी ${n} पंक्तियाँ दिखाएँ`,
  showFewer: "कम पंक्तियाँ दिखाएँ",
  details: "विवरण",
  seeDetails: "विवरण देखें",
  yes: "हाँ",
  no: "नहीं",
  footnote:
    "यह रिपोर्ट उन सभी API को चलाती है जिन्हें केवल नाम, जन्म तिथि, समय और स्थान चाहिए। जिन टूल्स को और जानकारी चाहिए, जैसे कुंडली मिलान, टैरो, वास्तु, AI ज्योतिषी और PDF रिपोर्ट, वे नीचे कैलकुलेटर में हैं।",
  configTitle: "रिपोर्ट अभी नहीं चल सकती",
  configHelp: "ज्योतिष इंजन को कॉल करने के लिए सर्वर में एक आवश्यक सेटिंग नहीं है। साइट चलाने वाले से सेटअप पूरा करवाएँ, फिर फ़ॉर्म दोबारा भेजें।",
  langNote: "फ़ील्ड के नाम API से आते हैं और अंग्रेज़ी में रहते हैं; मान चुनी हुई भाषा में आते हैं।",
};

const HI_GROUPS: Record<string, { title: string; blurb: string }> = {
  charts: { title: "जन्म कुंडली और वर्ग कुंडलियाँ", blurb: "लग्न कुंडली, सोलह वर्ग, षड्बल, अष्टकवर्ग, योग और बारह भावों का फल।" },
  astronomy: { title: "ग्रह स्थिति", blurb: "निरयण ग्रह स्थिति, भाव संधि, वक्री ग्रह, सूर्य-चंद्र समय और अयनांश।" },
  dasha: { title: "दशा", blurb: "इस जन्म की विंशोत्तरी, योगिनी और जैमिनी चर दशा।" },
  dosha: { title: "दोष", blurb: "मांगलिक, कालसर्प, साढ़ेसाती, पितृ और गुरु चांडाल का विश्लेषण।" },
  kp: { title: "केपी पद्धति", blurb: "कृष्णमूर्ति ग्रह, भाव संधि, कारक और शासक ग्रह।" },
  lalkitab: { title: "लाल किताब", blurb: "लाल किताब कुंडली, ऋण, अंधे ग्रह और ग्रहवार उपाय।" },
  numerology: { title: "अंक ज्योतिष", blurb: "नाम और जन्म तिथि से मूलांक, लो शू ग्रिड, नाम विश्लेषण और वार्षिक पूर्वानुमान।" },
  panchang: { title: "पंचांग और मुहूर्त", blurb: "पहले जन्म का पंचांग, फिर आज के चौघड़िया, होरा, भद्रा, पंचक और मुहूर्त।" },
  horoscope: { title: "राशिफल", blurb: "चंद्र राशि से दैनिक, साप्ताहिक, मासिक और वार्षिक फल।" },
  remedies: { title: "उपाय", blurb: "रत्न, रुद्राक्ष, मंत्र, यंत्र, दान और व्रत।" },
  western: { title: "पश्चिमी ज्योतिष", blurb: "ट्रॉपिकल ग्रह, बिग थ्री, दृष्टि मैट्रिक्स, चक्र, दैनिक गोचर और सोलर रिटर्न।" },
  advanced: { title: "जैमिनी और ताजिक", blurb: "कारक, आरूढ़, उपग्रह और इस वर्ष का ताजिक वार्षिक चक्र।" },
};

const HI_ENDPOINTS: Record<string, string> = {
  "svg-north": "लग्न कुंडली, उत्तर भारतीय",
  "svg-south": "लग्न कुंडली, दक्षिण भारतीय",
  "parashari-d1": "D1 राशि (लग्न)",
  "parashari-d9": "D9 नवांश",
  "parashari-d2": "D2 होरा",
  "parashari-d3": "D3 द्रेष्काण",
  "parashari-d4": "D4 चतुर्थांश",
  "parashari-d7": "D7 सप्तांश",
  "parashari-d10": "D10 दशमांश",
  "parashari-d12": "D12 द्वादशांश",
  "parashari-d16": "D16 षोडशांश",
  "parashari-d20": "D20 विंशांश",
  "parashari-d24": "D24 सिद्धांश",
  "parashari-d27": "D27 भांश",
  "parashari-d30": "D30 त्रिंशांश",
  "parashari-d40": "D40 खवेदांश",
  "parashari-d45": "D45 अक्षवेदांश",
  "parashari-d60": "D60 षष्ट्यंश",
  "bhav-chalit": "भाव चलित",
  "moon-lagna": "चंद्र लग्न",
  shadbala: "षड्बल",
  bhavabala: "भाव बल",
  avasthas: "अवस्थाएँ",
  bhinnashtak: "भिन्नाष्टकवर्ग",
  sarvashtak: "सर्वाष्टकवर्ग",
  "special-points": "विशेष बिंदु",
  yogas: "योग",
  "houses-12": "बारह भावों का फल",
  planets: "ग्रह स्थिति",
  cusps: "भाव संधि",
  retrograde: "वक्री ग्रह",
  "sun-moon": "सूर्य और चंद्र के समय",
  ayanamsa: "अयनांश मान",
  "dasha-maha": "विंशोत्तरी महादशा",
  "dasha-current": "वर्तमान दशा",
  "dasha-yogini": "योगिनी दशा",
  "dasha-char": "जैमिनी चर दशा",
  manglik: "मांगलिक दोष",
  kalsarpa: "कालसर्प दोष",
  "sade-sati": "साढ़ेसाती की स्थिति",
  "sade-sati-line": "साढ़ेसाती की समय-रेखा",
  pitra: "पितृ दोष",
  "guru-chandal": "गुरु चांडाल योग",
  "kp-planets": "केपी ग्रह",
  "kp-cusps": "केपी भाव संधि",
  "kp-svg": "केपी कुंडली",
  "kp-sig4": "स्तर 4 कारक",
  "kp-house-sig": "भाव कारक",
  "kp-ruling": "शासक ग्रह",
  "lk-kundli": "लाल किताब कुंडली",
  "lk-svg": "लाल किताब चार्ट",
  "lk-varshphal": "वर्तमान आयु का वर्षफल",
  "lk-rin": "ऋण",
  "lk-blind": "अंधे और अर्ध-अंधे ग्रह",
  "lk-remedies": "ग्रहवार उपाय",
  "num-core": "मूल अंक",
  "num-loshu": "लो शू ग्रिड",
  "num-missing": "अनुपस्थित अंक",
  "num-name": "नाम विश्लेषण",
  "num-correction": "नाम सुधार",
  "num-forecast": "इस वर्ष का पूर्वानुमान",
  "num-pinnacles": "शिखर और चुनौतियाँ",
  "num-favorable": "शुभ अंक",
  "pan-daily": "जन्म का पंचांग",
  "pan-advanced": "जन्म का विस्तृत पंचांग",
  "pan-namakshar": "नामाक्षर",
  "pan-choghadiya": "आज का चौघड़िया",
  "pan-hora": "आज की होरा",
  "pan-bhadra": "भद्रा",
  "pan-panchak": "पंचक",
  "pan-month": "मासिक कैलेंडर",
  "muh-marriage": "विवाह मुहूर्त",
  "muh-griha": "गृह प्रवेश मुहूर्त",
  "muh-property": "संपत्ति और वाहन मुहूर्त",
  "hor-daily": "दैनिक राशिफल",
  "hor-weekly": "साप्ताहिक राशिफल",
  "hor-monthly": "मासिक राशिफल",
  "hor-yearly": "वार्षिक राशिफल",
  "rem-gems": "रत्न",
  "rem-gem-limits": "रत्न संबंधी प्रतिबंध",
  "rem-rudraksha": "रुद्राक्ष",
  "rem-mantras": "मंत्र",
  "rem-yantras": "यंत्र",
  "rem-donations": "दान",
  "rem-fasting": "व्रत",
  "west-planets": "ट्रॉपिकल ग्रह",
  "west-big3": "बिग थ्री",
  "west-aspects": "दृष्टि मैट्रिक्स",
  "west-wheel": "चार्ट व्हील",
  "west-transits": "आज का गोचर",
  "west-solar": "सोलर रिटर्न",
  "adv-karakas": "जैमिनी कारक",
  "adv-karakamsha": "कारकांश",
  "adv-arudhas": "आरूढ़ पद",
  "adv-upagrahas": "उपग्रह",
  "adv-varshphal": "ताजिक वर्षफल चार्ट",
  "adv-muntha": "मुन्था",
  "adv-varshesh": "वर्षेश",
  "adv-tajik-yogas": "ताजिक योग",
  "adv-sahams": "सहम",
};

const EN_GROUPS = Object.fromEntries(REPORT_GROUPS.map((g) => [g.id, { title: g.title, blurb: g.blurb }]));

const TEXT: Record<Locale, ReportText> = {
  en: { labels: EN_LABELS, groups: EN_GROUPS, endpoints: {} },
  hi: { labels: HI_LABELS, groups: HI_GROUPS, endpoints: HI_ENDPOINTS },
};

export function getReportText(locale: Locale) {
  const text = TEXT[locale] ?? TEXT.en;
  return {
    labels: text.labels,
    groupText: (id: string) => text.groups[id] ?? EN_GROUPS[id],
    endpointTitle: (id: string) => text.endpoints[id] ?? REPORT_ENDPOINTS.find((e) => e.id === id)?.title ?? id,
  };
}
