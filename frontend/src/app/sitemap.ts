import type { MetadataRoute } from "next";
import { CALCULATOR_TOOLS } from "@/data/calculatorsData";
import { MIGRATED_LOCALE_PATHS } from "@/lib/locale";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/pricing", "/documentation"];
  const calculatorPaths = CALCULATOR_TOOLS.map((t) => t.href);
  const allPaths = [...new Set([...staticPaths, ...calculatorPaths])];

  return allPaths.map((path) => {
    const migrated = MIGRATED_LOCALE_PATHS.includes(path);
    const hiPath = path === "/" ? "/hi" : `/hi${path}`;

    return {
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
      ...(migrated
        ? {
            alternates: {
              languages: {
                hi: `${SITE_URL}${hiPath}`,
                en: `${SITE_URL}${path}`,
              },
            },
          }
        : {}),
    };
  });
}
