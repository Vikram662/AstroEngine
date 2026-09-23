"use client";

import { useParams } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/locale";

// Reads the active locale from the URL's [locale] segment. Components that also
// render on non-locale-aware routes (e.g. Navbar on /login) get DEFAULT_LOCALE
// there, since those pages are Hindi-only today.
export function useLocale(): Locale {
  const params = useParams<{ locale?: string }>();
  const raw = params?.locale;
  return typeof raw === "string" && isLocale(raw) ? raw : DEFAULT_LOCALE;
}
