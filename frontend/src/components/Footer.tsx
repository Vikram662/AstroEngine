"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Flame,
  ChevronRight,
  Compass,
  HeartHandshake,
  Sun,
  FileText
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { getDictionary } from "@/dictionaries/dictionary";

export const Footer = () => {
  const [info, setInfo] = useState<Record<string, string>>({});
  const locale = useLocale();
  const dict = getDictionary(locale);
  const t = dict.footer;

  const getHref = (path: string) => {
    return locale === "en" ? `/en${path}` : path;
  };

  useEffect(() => {
    axios.get("/api/settings/public")
      .then((res) => {
        if (res.data?.data) {
          setInfo(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const companyName = info["COMPANY_NAME"] || "AstroEngine Technologies";
  const logoUrl = info["COMPANY_LOGO_URL"];
  const tagline = locale === "en" 
    ? (info["COMPANY_TAGLINE_EN"] || "Vedic Astrology & Modern AI Kundli Platform")
    : (info["COMPANY_TAGLINE"] || "वैदिक ज्योतिष एवं आधुनिक AI कुंडली प्लेटफॉर्म");
  const phone = info["COMPANY_PHONE"] || "+91 22 4910 8800";
  const email = info["COMPANY_EMAIL"] || "contact@astroengine.io";
  const address = info["COMPANY_ADDRESS_LINE1"] || "Level 4, Tech Park, Bandra Kurla Complex";
  const city = info["COMPANY_CITY"] || "Mumbai";
  const state = info["COMPANY_STATE"] || "Maharashtra";
  const pincode = info["COMPANY_PINCODE"] || "400051";
  const gstin = info["COMPANY_GSTIN"] || "27AABCA1234F1Z8";

  return (
    <footer className="border-t border-line bg-surface text-ink-soft text-xs mt-auto">
      {/* 5-Column Consumer Link Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          
          {/* Col 1: Core Vedic Astrology */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-accent" />
              <span>{t.col1Title}</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={getHref("/calculators/lagna-kundli")} className="hover:text-accent transition">
                  {t.tools.lagna}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/navamsha-d9")} className="hover:text-accent transition">
                  {t.tools.navamsha}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/moon-sign")} className="hover:text-accent transition">
                  {t.tools.moonSign}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/planetary-positions")} className="hover:text-accent transition">
                  {t.tools.planets}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/vimshottari-dasha")} className="hover:text-accent transition">
                  {t.tools.vimshottari}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/char-dasha")} className="hover:text-accent transition">
                  {t.tools.charDasha}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/dhan-yogas")} className="hover:text-accent transition">
                  {t.tools.dhanYogas}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Free Calculators & Tools */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-accent" />
              <span>{t.col2Title}</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={getHref("/calculators/manglik-dosha")} className="hover:text-accent transition">
                  {t.tools.manglik}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/sade-sati")} className="hover:text-accent transition">
                  {t.tools.sadeSati}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/kaalsarp-dosha")} className="hover:text-accent transition">
                  {t.tools.kaalsarp}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/pitra-dosha")} className="hover:text-accent transition">
                  {t.tools.pitra}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/core-numerology")} className="hover:text-accent transition">
                  {t.tools.numerology}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/loshu-grid")} className="hover:text-accent transition">
                  {t.tools.loshu}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/name-correction")} className="hover:text-accent transition">
                  {t.tools.nameCorrection}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Panchang, Horoscope & Matchmaking */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-accent" />
              <span>{t.col3Title}</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={getHref("/calculators/daily-panchang")} className="hover:text-accent transition">
                  {t.tools.panchang}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/choghadiya")} className="hover:text-accent transition">
                  {t.tools.choghadiya}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/marriage-muhurat")} className="hover:text-accent transition">
                  {t.tools.marriageMuhurat}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/kundli-matching")} className="hover:text-accent transition">
                  {t.tools.matching}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/nadi-exceptions")} className="hover:text-accent transition">
                  {t.tools.nadiExceptions}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/dashakoot-porutham")} className="hover:text-accent transition">
                  {t.tools.dashakoot}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/tarot-reading")} className="hover:text-accent transition">
                  {t.tools.tarot}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Remedies, PDF & Advanced Systems */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{t.col4Title}</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={getHref("/calculators/gemstone-suggestion")} className="hover:text-accent transition">
                  {t.tools.gemstones}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/rudraksha-mapping")} className="hover:text-accent transition">
                  {t.tools.rudraksha}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/lal-kitab-debts")} className="hover:text-accent transition">
                  {t.tools.lalKitab}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/kp-system")} className="hover:text-accent transition">
                  {t.tools.kpSystem}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/western-astrology")} className="hover:text-accent transition">
                  {t.tools.western}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/vastu-shastra")} className="hover:text-accent transition">
                  {t.tools.vastu}
                </Link>
              </li>
              <li>
                <Link href={getHref("/calculators/pdf-reports")} className="hover:text-accent transition">
                  {t.tools.pdfReports}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Company, API Platform & Contact */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>{t.col5Title}</span>
            </div>
            
            <p className="text-[11px] text-ink-muted leading-relaxed">
              {tagline}। {t.taglineDesc}
            </p>

            <ul className="space-y-2 text-xs pt-1">
              <li>
                <Link href={locale === "en" ? "/en/#calculators" : "/#calculators"} className="text-accent font-semibold hover:text-accent-hover transition flex items-center gap-1">
                  <span>{locale === "en" ? "Browse calculators" : "कैलकुलेटर देखें"}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/#playground" className="hover:text-ink transition">
                  {t.apiPlayground}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-ink transition">
                  {t.pricing}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-ink transition">
                  {t.apiDocs}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-ink transition">
                  {t.dashboard}
                </Link>
              </li>
            </ul>

            <div className="pt-2 border-t border-line/60 space-y-1.5 text-[11px] text-ink-soft">
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:text-ink transition">
                <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-ink transition">
                <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>{email}</span>
              </a>
              <div className="flex items-start gap-2 text-[10px] text-ink-muted pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-accent/80 shrink-0 mt-0.5" />
                <span>{address}, {city}, {state}</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Copyright & Trust Strip */}
      <div className="border-t border-line bg-surface-alt/80 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-ink-muted">
          <div>
            &copy; {new Date().getFullYear()} {companyName}. {t.rightsReserved}.
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-ink-soft">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.dataPrivacy}</span>
            </span>
            <span className="text-line">•</span>
            <span className="flex items-center gap-1 text-ink-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{t.swissEph}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
