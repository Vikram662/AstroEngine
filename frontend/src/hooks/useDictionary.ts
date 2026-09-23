"use client";

import { useLocale } from "@/hooks/useLocale";
import { getDictionary, type Dictionary } from "@/dictionaries/dictionary";

export function useDictionary(): Dictionary {
  const locale = useLocale();
  return getDictionary(locale);
}
