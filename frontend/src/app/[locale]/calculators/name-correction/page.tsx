import type { Metadata } from "next";
import { CALCULATOR_TOOLS } from "@/data/calculatorsData";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/locale";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildSoftwareApplicationSchema, buildBreadcrumbSchema } from "@/lib/schema";
import NameCorrectionClient from "./NameCorrectionClient";

const TOOL = CALCULATOR_TOOLS.find((t) => t.id === "name-correction")!;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const seo = TOOL.seo?.[locale] ?? {
    title: locale === "hi" ? TOOL.hindiTitle : TOOL.title,
    description: locale === "hi" ? TOOL.description : TOOL.title,
  };

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: locale === "en" ? TOOL.href : `/hi${TOOL.href}`,
      languages: {
        hi: `/hi${TOOL.href}`,
        en: TOOL.href,
        "x-default": TOOL.href,
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

  return (
    <>
      <JsonLd data={buildSoftwareApplicationSchema(TOOL, locale)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: locale === "hi" ? "होम" : "Home", path: locale === "en" ? "/" : "/hi" },
          {
            name: locale === "hi" ? TOOL.hindiTitle : TOOL.title,
            path: locale === "en" ? TOOL.href : `/hi${TOOL.href}`,
          },
        ])}
      />
      <NameCorrectionClient locale={locale} />
    </>
  );
}
