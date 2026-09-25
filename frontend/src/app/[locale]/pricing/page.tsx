import type { Metadata } from "next";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/locale";
import PricingClient from "./PricingClient";

const SEO = {
  hi: {
    title: "मूल्य निर्धारण — AstroEngine",
    description:
      "डेवलपर एवं एंटरप्राइज सब्सक्रिप्शन प्लान्स। ₹100 फ्री टेस्ट क्रेडिट्स, स्विस एफिमेरिस C-कोर गति एवं मॉड्यूलर इंजन ऐड-ऑन्स के साथ पारदर्शी मूल्य निर्धारण।",
  },
  en: {
    title: "Pricing — AstroEngine",
    description:
      "Developer & Enterprise subscription plans. Transparent pricing with ₹100 free test credits, Swiss Ephemeris C-core speed, and modular engine add-ons.",
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
      canonical: locale === "en" ? "/pricing" : "/hi/pricing",
      languages: {
        hi: "/hi/pricing",
        en: "/pricing",
        "x-default": "/pricing",
      },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return <PricingClient locale={locale} />;
}
