"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CALCULATOR_TOOLS } from "@/data/calculatorsData";
import { isMigratedPath, type Locale } from "@/lib/locale";

interface Props {
  title: string;
  hindiTitle: string;
  description: string;
  slug: string;
  category: string;
  icon?: string;
  locale?: Locale;
  children: React.ReactNode;
}

const STRINGS = {
  hi: { home: "होम", calculators: "कैलकुलेटर", related: "संबंधित कैलकुलेटर", guide: "परिणाम को कैसे समझें", guideBody: "ऊपर दिए परिणाम आपके जन्म-समय और स्थान के आधार पर गणितीय ज्योतिषीय गणना हैं। मुख्य स्थिति, समय-अवधि और संकेतों को साथ पढ़ें; किसी एक पंक्ति को अलग से अंतिम भविष्यवाणी न मानें। दूसरे कैलकुलेटर पर जाने पर आपका भरा हुआ जन्म-विवरण अपने-आप उपलब्ध रहेगा।" },
  en: { home: "Home", calculators: "Calculators", related: "Related Calculators", guide: "How to read your result", guideBody: "The result above combines astronomical calculations from your birth date, time, and location. Read the main status, timing, and supporting indicators together rather than treating one row as a final prediction. Your primary birth profile is saved on this device and will auto-fill when you open another calculator." },
};

export const CalculatorPageShell: React.FC<Props> = ({
  title,
  hindiTitle,
  description,
  slug,
  category,
  icon,
  locale = "hi",
  children,
}) => {
  const related = CALCULATOR_TOOLS.filter((t) => t.category === category && t.id !== slug).slice(0, 3);
  const t = STRINGS[locale];
  const homeHref = locale === "en" ? "/en" : "/";
  const calculatorsHref = locale === "en" ? "/en/#calculators" : "/#calculators";
  const relatedHref = (r: (typeof related)[number]) =>
    locale === "en" && isMigratedPath(r.href) ? `/en${r.href}` : r.href;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <nav className="flex items-center flex-wrap gap-1.5 text-xs text-ink-muted mb-6">
            <Link href={homeHref} className="hover:text-accent transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> {t.home}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={calculatorsHref} className="hover:text-accent transition">
              {t.calculators}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink font-medium">{locale === "en" ? title : hindiTitle}</span>
          </nav>

          <div className="mb-8">
            {icon && <div className="text-3xl mb-2">{icon}</div>}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {locale === "en" ? title : hindiTitle}
            </h1>
            <p className="mt-2 text-sm text-ink-soft max-w-2xl leading-relaxed">{description}</p>
          </div>

          {children}

          <aside className="mt-8 rounded-2xl border border-line bg-card p-5 sm:p-6">
            <h2 className="text-sm font-bold text-ink">{t.guide}</h2>
            <p className="mt-2 text-xs sm:text-sm leading-6 text-ink-soft">{t.guideBody}</p>
          </aside>

          {related.length > 0 && (
            <div className="mt-14 pt-8 border-t border-line">
              <h2 className="text-sm font-bold text-ink mb-4">{t.related}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={relatedHref(r)}
                    className="p-4 rounded-xl border border-line bg-card hover:border-accent/50 hover:shadow-sm transition block"
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="text-sm font-bold text-ink">
                      {locale === "en" ? r.title : r.hindiTitle}
                    </div>
                    {locale !== "en" && (
                      <div className="text-[11px] text-ink-muted mt-0.5">{r.title}</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
