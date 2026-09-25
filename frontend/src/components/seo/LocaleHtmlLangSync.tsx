"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/locale";

// The root <html lang="en"> (see src/app/layout.tsx) is correct for the real site
// default (English). For /hi/* pages we patch document.documentElement.lang
// post-hydration so assistive tech / browser-translate prompts see "hi" there.
// This doesn't affect indexing — Google's language targeting reads the hreflang
// <link> tags in metadata (SSR-correct), not this attribute.
export function LocaleHtmlLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [locale]);

  return null;
}
