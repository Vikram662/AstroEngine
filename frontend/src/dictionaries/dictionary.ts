import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

// Shared-chrome translation dictionary (Navbar, Footer, Hero, Panchang,
// Horoscope, Live Playground, BirthDataFields). Each calculator page's own
// result content is translated separately via its existing hi/en API-language
// toggle — this file only covers the site chrome that surrounds it.
export const dictionaries = {
  hi: {
    birthDataFields: {
      fullName: "पूरा नाम (Full Name)",
      namePlaceholder: "उदा. राहुल शर्मा",
      gender: "लिंग (Gender)",
      male: "पुरुष (Male)",
      female: "महिला (Female)",
      dob: "जन्म तिथि (Date of Birth)",
      tob: "जन्म समय (Time of Birth - 24hr)",
      city: "स्थान (City / Location)",
      searching: "खोज जारी...",
      cityPlaceholder: "शहर का नाम लिखें (उदा. नई दिल्ली, मुंबई, जयपुर)...",
    },
  },
  en: {
    birthDataFields: {
      fullName: "Full Name",
      namePlaceholder: "e.g. Rahul Sharma",
      gender: "Gender",
      male: "Male",
      female: "Female",
      dob: "Date of Birth",
      tob: "Time of Birth (24hr)",
      city: "City / Location",
      searching: "Searching...",
      cityPlaceholder: "Type a city name (e.g. New Delhi, Mumbai, Jaipur)...",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
