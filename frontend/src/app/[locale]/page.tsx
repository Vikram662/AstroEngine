import type { Metadata } from "next";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/locale";
import HomeClient from "./HomeClient";

const SEO = {
  hi: {
    title: "AstroEngine — वैदिक ज्योतिष API एवं मुफ्त कैलकुलेटर",
    description:
      "24+ मुफ्त वैदिक ज्योतिष कैलकुलेटर — कुंडली, दशा, दोष, पंचांग और अधिक, तुरंत बिना साइनअप के। डेवलपर्स के लिए एंटरप्राइज-ग्रेड ज्योतिष API।",
  },
  en: {
    title: "AstroEngine — Vedic Astrology API & Free Calculators",
    description:
      "24+ free Vedic astrology calculators — birth charts, dashas, doshas, panchang and more, instantly with no sign-up. Enterprise-grade astrology API for developers.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const seo = SEO[locale];

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: locale === "hi" ? "/" : "/en",
      languages: {
        hi: "/",
        en: "/en",
        "x-default": "/",
      },
    },
  };
}

export default function Page() {
  return <HomeClient />;
}
