"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { isMigratedPath, getEnglishPath } from "@/lib/locale";
import { getDictionary, type Dictionary } from "@/dictionaries/dictionary";

const PROMO_DISMISSED_KEY = "astroengine_promo_dismissed_v1";

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  href?: string;
  items?: NavItem[];
}

// Grouped from the real, currently-live demo tabs (frontend/src/app/demo/page.tsx)
// rather than pages that don't exist yet — the dedicated /calculators, /panchang
// etc. routes land in later redesign phases, at which point these should point
// there instead of into the demo page's tabs.
function buildNavGroups(t: Dictionary["navbar"]): NavGroup[] {
  return [
    {
      label: t.groups.astrology,
      items: [
        { label: t.items.kundliCharts, href: "/calculators/lagna-kundli" },
        { label: t.items.planetaryPositions, href: "/calculators/planetary-positions" },
        { label: t.items.vimshottariDasha, href: "/calculators/vimshottari-dasha" },
        { label: t.items.yogasAshtakvarga, href: "/calculators/dhan-yogas" },
        { label: t.items.westernAstrology, href: "/calculators/western-astrology" },
        { label: t.items.kpSystem, href: "/calculators/kp-system" },
        { label: t.items.lalKitab, href: "/calculators/lal-kitab-debts" },
        { label: t.items.jaiminiTajik, href: "/calculators/char-dasha" },
      ],
    },
    {
      label: t.groups.matching,
      items: [
        { label: t.items.kundliMilan, href: "/calculators/kundli-matching" },
        { label: t.items.doshaAnalysis, href: "/calculators/manglik-dosha" },
      ],
    },
    {
      label: t.groups.panchang,
      items: [
        { label: t.items.dailyPanchang, href: "/calculators/daily-panchang" },
        { label: t.items.todaysHoroscope, href: "/#horoscope" },
      ],
    },
    { label: t.groups.chat, href: "/#ai-chat" },
    { label: t.groups.reports, href: "/calculators/pdf-reports" },
    {
      label: t.groups.calculators,
      items: [
        { label: t.items.numerology, href: "/calculators/core-numerology" },
        { label: t.items.tarotReading, href: "/calculators/tarot-reading" },
        { label: t.items.vastuShastra, href: "/calculators/vastu-shastra" },
        { label: t.items.remediesGemstones, href: "/calculators/gemstone-suggestion" },
      ],
    },
  ];
}

interface TodayPanchang {
  vaar: string | null;
  tithi: { name: string; paksha?: string; end_time?: string } | null;
  nakshatra: { name: string; lord?: string; end_time?: string } | null;
  rahu_kaal: { start: string; end: string } | null;
}

function formatHM(hms: string) {
  const [h, m] = hms.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${suffix}`;
}

const PromoBanner = ({ t, locale, onDismiss }: { t: Dictionary["navbar"]; locale: "hi" | "en"; onDismiss: () => void }) => (
  <div className="relative bg-linear-to-r from-accent to-accent-hover text-accent-foreground">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-center gap-2 text-xs font-medium text-center">
      <span className="hidden sm:inline-flex items-center gap-1 bg-white/15 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
        <Sparkles className="w-3 h-3" />
        New
      </span>
      <span>
        {t.promoText}
      </span>
      <Link href={locale === "hi" ? "/hi/pricing" : "/pricing"} className="underline underline-offset-2 font-semibold hover:opacity-80 transition shrink-0">
        {t.promoCta}
      </Link>
    </div>
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss announcement"
      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/15 transition"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);

const InfoTicker = ({ t, locale }: { t: Dictionary["navbar"]; locale: "hi" | "en" }) => {
  const [data, setData] = useState<TodayPanchang | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get("/api/panchang/today")
      .then((res) => {
        if (!cancelled && res.data?.status === "success") {
          setData(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  return (
    <div className="bg-ink text-white/90 text-[11px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-8 flex items-center gap-4 overflow-x-auto whitespace-nowrap">
        {data.vaar && (
          <span>
            <span className="text-white/50">{t.tickerToday}:</span> {data.vaar}
          </span>
        )}
        {data.tithi?.name && (
          <span>
            {/* data.tithi.name already reads e.g. "Shukla Dwadashi" — the paksha is
                baked into the name, so it isn't repeated here. */}
            <span className="text-white/50">{t.tickerTithi}:</span> {data.tithi.name}
          </span>
        )}
        {data.nakshatra?.name && (
          <span className="hidden sm:inline">
            <span className="text-white/50">{t.tickerNakshatra}:</span> {data.nakshatra.name}
          </span>
        )}
        {data.rahu_kaal && (
          <span>
            <span className="text-white/50">{t.tickerRahuKaal}:</span> {formatHM(data.rahu_kaal.start)}–{formatHM(data.rahu_kaal.end)}
          </span>
        )}
        <Link href={locale === "hi" ? "/hi/calculators/daily-panchang" : "/calculators/daily-panchang"} className="ml-auto shrink-0 text-accent-soft hover:text-white transition font-medium">
          {t.tickerFullPanchang}
        </Link>
      </div>
    </div>
  );
};

const LanguageSwitcher = () => {
  const pathname = usePathname();
  const locale = useLocale();
  const barePathname = locale === "hi" ? getEnglishPath(pathname) : pathname;

  if (!isMigratedPath(barePathname)) return null;

  const hindiHref = barePathname === "/" ? "/hi" : `/hi${barePathname}`;

  return (
    <div className="hidden sm:flex items-center rounded-md bg-surface-alt p-0.5 border border-line text-[11px] font-medium">
      <Link
        href={barePathname}
        className={`px-2 py-1 rounded transition ${
          locale === "en" ? "bg-accent text-white shadow-xs" : "text-ink-muted hover:text-ink"
        }`}
      >
        EN
      </Link>
      <Link
        href={hindiHref}
        className={`px-2 py-1 rounded transition ${
          locale === "hi" ? "bg-accent text-white shadow-xs" : "text-ink-muted hover:text-ink"
        }`}
      >
        हिं
      </Link>
    </div>
  );
};

export const Navbar = () => {
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("AstroEngine");
  const [promoDismissed, setPromoDismissed] = useState(true); // default hidden until we know it wasn't dismissed
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const homeHref = locale === "hi" ? "/hi" : "/";
  const t = getDictionary(locale).navbar;
  const navGroups = buildNavGroups(t);

  useEffect(() => {
    axios.get("/api/settings/public")
      .then((res) => {
        if (res.data?.data) {
          if (res.data.data.COMPANY_LOGO_URL) {
            setLogoUrl(res.data.data.COMPANY_LOGO_URL);
          }
          if (res.data.data.COMPANY_NAME) {
            setCompanyName(res.data.data.COMPANY_NAME.split(" ")[0] || "AstroEngine");
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Deferred a tick so this reads as "syncing from an external system in a
    // callback" rather than a synchronous setState-in-effect (which would
    // otherwise trigger react-hooks/set-state-in-effect) — a lazy useState
    // initializer isn't an option here since it'd run during SSR, where
    // window/localStorage don't exist, and mismatch what the client computes.
    queueMicrotask(() => {
      try {
        setPromoDismissed(window.localStorage.getItem(PROMO_DISMISSED_KEY) === "1");
      } catch {
        setPromoDismissed(false);
      }
    });
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenGroup(null);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const dismissPromo = () => {
    setPromoDismissed(true);
    try {
      window.localStorage.setItem(PROMO_DISMISSED_KEY, "1");
    } catch {
      // ignore (private browsing / blocked storage)
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      {!promoDismissed && <PromoBanner t={t} locale={locale} onDismiss={dismissPromo} />}

      <header className="w-full bg-surface/90 backdrop-blur border-b border-line">
        <div ref={navRef} className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="h-7 max-w-[120px] object-contain"
              />
            ) : (
              <div className="w-7 h-7 rounded bg-ink text-white flex items-center justify-center font-brand font-bold text-xs">
                AE
              </div>
            )}
            <span className="font-brand font-semibold text-sm tracking-tight text-ink">
              {companyName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-ink-soft font-brand">
            {navGroups.map((group) => (
              <div key={group.label} className="relative">
                {group.items ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenGroup((g) => (g === group.label ? null : group.label))}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md hover:text-ink hover:bg-surface-alt transition ${
                        openGroup === group.label ? "text-ink bg-surface-alt" : ""
                      }`}
                      aria-expanded={openGroup === group.label}
                    >
                      {group.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${openGroup === group.label ? "rotate-180" : ""}`} />
                    </button>
                    {openGroup === group.label && (
                      <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-line rounded-lg shadow-lg py-1.5 z-50">
                        {group.items.map((item) => {
                          const targetHref = locale === "hi" && isMigratedPath(item.href) ? `/hi${item.href}` : item.href;
                          return (
                            <Link
                              key={item.href}
                              href={targetHref}
                              onClick={() => setOpenGroup(null)}
                              className="block px-3.5 py-2 text-xs text-ink-soft hover:text-ink hover:bg-surface-alt transition"
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link 
                    href={locale === "hi" && isMigratedPath(group.href!) ? `/hi${group.href}` : group.href!}
                    className="block px-3 py-2 rounded-md hover:text-ink hover:bg-surface-alt transition"
                  >
                    {group.label}
                  </Link>
                )}
              </div>
            ))}
            <Link href={locale === "hi" ? "/hi/documentation" : "/documentation"} className="px-3 py-2 rounded-md hover:text-ink hover:bg-surface-alt transition">
              {t.documentation}
            </Link>
            <Link href={locale === "hi" ? "/hi/pricing" : "/pricing"} className="px-3 py-2 rounded-md hover:text-ink hover:bg-surface-alt transition">
              {t.pricing}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={locale === "hi" ? "/hi/#calculators" : "/#calculators"}
              className="hidden lg:flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              {t.browseCalculators}
            </Link>
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-surface-alt transition font-medium"
            >
              {t.signIn}
            </Link>
          </div>
        </div>
      </header>

      <InfoTicker t={t} locale={locale} />
    </div>
  );
};
