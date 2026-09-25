import type { Metadata } from "next";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/locale";
import DocumentationClient from "./DocumentationClient";

const SEO = {
  hi: {
    title: "API Documentation — AstroEngine",
    description:
      "135 प्रोडक्शन एंडपॉइंट्स का पूर्ण API संदर्भ — cURL, Node.js, Python और PHP कोड नमूनों के साथ।",
  },
  en: {
    title: "API Documentation — AstroEngine",
    description:
      "Complete API reference for 135 production endpoints — with cURL, Node.js, Python, and PHP code samples.",
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
      canonical: locale === "en" ? "/documentation" : "/hi/documentation",
      languages: {
        hi: "/hi/documentation",
        en: "/documentation",
        "x-default": "/documentation",
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

  return <DocumentationClient locale={locale} />;
}
