export const SUPPORTED_LOCALES = ["hi", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "hi";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// Bare (Hindi, no /en prefix) paths that have a migrated app/[locale] route today.
// proxy.ts, the Navbar language switcher, and sitemap.ts all read this same list so
// they can never drift out of sync — extend this array as more pages move under
// src/app/[locale]/** (see CALCULATOR_PAGES_PLAN.md Phase 2: currently the homepage
// and all 29 calculators; /pricing and /documentation are still deferred).
const MIGRATED_CALCULATOR_SLUGS = [
  "char-dasha", "choghadiya", "core-numerology", "daily-panchang",
  "dashakoot-porutham", "dhan-yogas", "gemstone-suggestion", "kaalsarp-dosha",
  "kp-system", "kundli-matching", "lagna-kundli", "lal-kitab-debts",
  "loshu-grid", "manglik-dosha", "marriage-muhurat", "moon-sign",
  "nadi-exceptions", "name-correction", "navamsha-d9", "pdf-reports",
  "pitra-dosha", "planetary-positions", "rudraksha-mapping", "sade-sati",
  "tarot-reading", "vastu-shastra", "vimshottari-dasha", "western-astrology",
  "yogini-dasha",
];

export const MIGRATED_LOCALE_PATHS: readonly string[] = [
  "/",
  ...MIGRATED_CALCULATOR_SLUGS.map((slug) => `/calculators/${slug}`),
];

export function isMigratedPath(pathname: string): boolean {
  return MIGRATED_LOCALE_PATHS.includes(pathname);
}

// Given the CURRENT bare (Hindi) pathname, returns the corresponding /en/* path.
// Returns null when the path isn't migrated yet (no English version exists).
export function getEnglishPath(barePathname: string): string | null {
  if (!isMigratedPath(barePathname)) return null;
  return barePathname === "/" ? "/en" : `/en${barePathname}`;
}

// Given the CURRENT /en/* pathname (as seen in the browser), returns the bare
// Hindi equivalent. Works even for not-yet-migrated /en/* paths so the switcher can
// still send someone back to the (always valid) bare Hindi page.
export function getHindiPath(enPathname: string): string {
  if (enPathname === "/en") return "/";
  if (enPathname.startsWith("/en/")) return enPathname.slice("/en".length);
  return enPathname;
}
