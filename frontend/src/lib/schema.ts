import type { CalculatorTool } from "@/data/calculatorsData";
import type { Locale } from "@/lib/locale";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AstroEngine",
    url: SITE_URL,
    logo: `${SITE_URL}/next.svg`,
    description:
      "Enterprise multi-language Vedic and Western Astrology REST APIs, white-label PDF engine, and developer console.",
  };
}

export function buildSoftwareApplicationSchema(tool: CalculatorTool, locale: Locale) {
  const name = locale === "hi" ? tool.hindiTitle : tool.title;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: tool.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    url: `${SITE_URL}${locale === "en" ? tool.href : `/hi${tool.href}`}`,
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
