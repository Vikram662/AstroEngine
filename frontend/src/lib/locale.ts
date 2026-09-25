export const SUPPORTED_LOCALES = ["hi", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// Bare (English, no /hi prefix) paths that have a migrated app/[locale] route today.
// proxy.ts, the Navbar language switcher, and sitemap.ts all read this same list so
// they can never drift out of sync — extend this array as more pages move under
// src/app/[locale]/** (see CALCULATOR_PAGES_PLAN.md Phase 2: homepage, all 29
// calculators, /pricing and /documentation).
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

const MIGRATED_STATIC_PATHS = ["/pricing", "/documentation"];

export const MIGRATED_LOCALE_PATHS: readonly string[] = [
  "/",
  ...MIGRATED_STATIC_PATHS,
  ...MIGRATED_CALCULATOR_SLUGS.map((slug) => `/calculators/${slug}`),
];

export function isMigratedPath(pathname: string): boolean {
  return MIGRATED_LOCALE_PATHS.includes(pathname);
}

// Given the CURRENT bare (English) pathname, returns the corresponding /hi/* path.
// Returns null when the path isn't migrated yet (no Hindi version exists).
export function getHindiPath(barePathname: string): string | null {
  if (!isMigratedPath(barePathname)) return null;
  return barePathname === "/" ? "/hi" : `/hi${barePathname}`;
}

// Given the CURRENT /hi/* pathname (as seen in the browser), returns the bare
// English equivalent. Works even for not-yet-migrated /hi/* paths so the switcher can
// still send someone back to the (always valid) bare English page.
export function getEnglishPath(hiPathname: string): string {
  if (hiPathname === "/hi") return "/";
  if (hiPathname.startsWith("/hi/")) return hiPathname.slice("/hi".length);
  return hiPathname;
}
