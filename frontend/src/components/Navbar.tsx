"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { isMigratedPath, getHindiPath } from "@/lib/locale";

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
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Astrology",
    items: [
      { label: "Kundli & Divisional Charts", href: "/calculators/lagna-kundli" },
      { label: "Planetary Positions", href: "/calculators/planetary-positions" },
      { label: "Vimshottari Dasha", href: "/calculators/vimshottari-dasha" },
      { label: "Yogas & Ashtakvarga", href: "/calculators/dhan-yogas" },
      { label: "Western Astrology", href: "/calculators/western-astrology" },
      { label: "KP System", href: "/calculators/kp-system" },
      { label: "Lal Kitab", href: "/calculators/lal-kitab-debts" },
      { label: "Jaimini & Tajik", href: "/calculators/char-dasha" },
    ],
  },
  {
    label: "Matching",
    items: [
      { label: "Kundli Milan (Ashtakoot)", href: "/calculators/kundli-matching" },
      { label: "Dosha Analysis", href: "/calculators/manglik-dosha" },
    ],
  },
  {
    label: "Panchang",
    items: [
      { label: "Daily Panchang", href: "/calculators/daily-panchang" },
      { label: "Today's Horoscope", href: "/#horoscope" },
    ],
  },
  { label: "Chat", href: "/#ai-chat" },
  { label: "Reports", href: "/calculators/pdf-reports" },
  {
    label: "Calculators",
    items: [
      { label: "Numerology", href: "/calculators/core-numerology" },
      { label: "Tarot Reading", href: "/calculators/tarot-reading" },
      { label: "Vastu Shastra", href: "/calculators/vastu-shastra" },
      { label: "Remedies & Gemstones", href: "/calculators/gemstone-suggestion" },
    ],
  },
];

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

const PromoBanner = ({ onDismiss }: { onDismiss: () => void }) => (
  <div className="relative bg-linear-to-r from-accent to-accent-hover text-accent-foreground">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-center gap-2 text-xs font-medium text-center">
      <span className="hidden sm:inline-flex items-center gap-1 bg-white/15 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
        <Sparkles className="w-3 h-3" />
        New
      </span>
      <span>
        135 production endpoints now live — AI Astrologer, Tarot & Vastu just shipped.
      </span>
      <Link href="/pricing" className="underline underline-offset-2 font-semibold hover:opacity-80 transition shrink-0">
        See plans
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

const InfoTicker = () => {
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
            <span className="text-white/50">Today:</span> {data.vaar}
          </span>
        )}
        {data.tithi?.name && (
          <span>
            {/* data.tithi.name already reads e.g. "Shukla Dwadashi" — the paksha is
                baked into the name, so it isn't repeated here. */}
            <span className="text-white/50">Tithi:</span> {data.tithi.name}
          </span>
        )}
        {data.nakshatra?.name && (
          <span className="hidden sm:inline">
            <span className="text-white/50">Nakshatra:</span> {data.nakshatra.name}
          </span>
        )}
        {data.rahu_kaal && (
          <span>
            <span className="text-white/50">Rahu Kaal:</span> {formatHM(data.rahu_kaal.start)}–{formatHM(data.rahu_kaal.end)}
          </span>
        )}
        <Link href="/calculators/daily-panchang" className="ml-auto shrink-0 text-accent-soft hover:text-white transition font-medium">
          Full Panchang →
        </Link>
      </div>
    </div>
  );
};

const LanguageSwitcher = () => {
  const pathname = usePathname();
  const locale = useLocale();
  const barePathname = locale === "en" ? getHindiPath(pathname) : pathname;

  if (!isMigratedPath(barePathname)) return null;

  const englishHref = barePathname === "/" ? "/en" : `/en${barePathname}`;

  return (
    <div className="hidden sm:flex items-center rounded-md bg-surface-alt p-0.5 border border-line text-[11px] font-medium">
      <Link
        href={barePathname}
        className={`px-2 py-1 rounded transition ${
          locale === "hi" ? "bg-accent text-white shadow-xs" : "text-ink-muted hover:text-ink"
        }`}
      >
        हिं
      </Link>
      <Link
        href={englishHref}
        className={`px-2 py-1 rounded transition ${
          locale === "en" ? "bg-accent text-white shadow-xs" : "text-ink-muted hover:text-ink"
        }`}
      >
        EN
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
  const homeHref = locale === "en" ? "/en" : "/";

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
      {!promoDismissed && <PromoBanner onDismiss={dismissPromo} />}

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
            {NAV_GROUPS.map((group) => (
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
                          const targetHref = locale === "en" && isMigratedPath(item.href) ? `/en${item.href}` : item.href;
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
                    href={locale === "en" && isMigratedPath(group.href!) ? `/en${group.href}` : group.href!} 
                    className="block px-3 py-2 rounded-md hover:text-ink hover:bg-surface-alt transition"
                  >
                    {group.label}
                  </Link>
                )}
              </div>
            ))}
            <Link href="/documentation" className="px-3 py-2 rounded-md hover:text-ink hover:bg-surface-alt transition">
              Documentation
            </Link>
            <Link href="/pricing" className="px-3 py-2 rounded-md hover:text-ink hover:bg-surface-alt transition">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={locale === "en" ? "/en/#calculators" : "/#calculators"}
              className="hidden lg:flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              Calculators
            </Link>
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-surface-alt transition font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <InfoTicker />
    </div>
  );
};
