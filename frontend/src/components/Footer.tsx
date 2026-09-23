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

export const Footer = () => {
  const [info, setInfo] = useState<Record<string, string>>({});

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
  const tagline = info["COMPANY_TAGLINE"] || "वैदिक ज्योतिष एवं आधुनिक AI कुंडली प्लेटफॉर्म";
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
              <span>वैदिक ज्योतिष (Core)</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/demo?tab=kundli" className="hover:text-accent transition">
                  जन्म लग्न पत्रिका (D1 Chart)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=kundli" className="hover:text-accent transition">
                  नवांश कुंडली (D9 Navamsha)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=planets" className="hover:text-accent transition">
                  चंद्र राशि एवं 27 नक्षत्र
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=kundli" className="hover:text-accent transition">
                  16 षोडशवर्ग कुंडलियां (D2–D60)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=dasha" className="hover:text-accent transition">
                  120-वर्षीय विंशोत्तरी महादशा
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=yogas" className="hover:text-accent transition">
                  सर्वअष्टकवर्ग (337 Bindus)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=yogas" className="hover:text-accent transition">
                  राजयोग एवं धन योग स्कैनर
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Free Calculators & Tools */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-accent" />
              <span>कैलकुलेटर एवं टूल्स</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/demo?tab=dosha" className="hover:text-accent transition">
                  मांगलिक दोष (12 अपवाद)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=dosha" className="hover:text-accent transition">
                  शनि साढ़े साती चक्र व तारीखें
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=dosha" className="hover:text-accent transition">
                  कालसर्प दोष एवं 12 प्रकार
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=dosha" className="hover:text-accent transition">
                  पितृ दोष व शांति उपाय
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=numerology" className="hover:text-accent transition">
                  मूलांक व भाग्यांक अंकशास्त्र
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=numerology" className="hover:text-accent transition">
                  3×3 लो शू ग्रिड (Lo Shu Grid)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=numerology" className="hover:text-accent transition">
                  नाम संशोधन अंक प्रणाली
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Panchang, Horoscope & Matchmaking */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-accent" />
              <span>पंचांग, मिलान व राशिफल</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/demo?tab=panchang" className="hover:text-accent transition">
                  आज का दैनिक पंचांग
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=panchang" className="hover:text-accent transition">
                  दिन व रात का चौघड़िया
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=panchang" className="hover:text-accent transition">
                  राहु काल व अभिजित मुहूर्त
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=panchang" className="hover:text-accent transition">
                  विवाह व गृह प्रवेश मुहूर्त
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=matching" className="hover:text-accent transition">
                  अष्टकूट 36 गुण मिलान
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=horoscope" className="hover:text-accent transition">
                  दैनिक व साप्ताहिक राशिफल
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=tarot" className="hover:text-accent transition">
                  टैरो कार्ड परामर्श (Tarot Reading)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Remedies, PDF & Advanced Systems */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>उपाय, लाल किताब व रिपोर्ट्स</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/demo?tab=remedies" className="hover:text-accent transition">
                  शुभ रत्न परामर्श (Gemstones)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=remedies" className="hover:text-accent transition">
                  1 से 14 मुखी रुद्राक्ष सुझाव
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=lalkitab" className="hover:text-accent transition">
                  लाल किताब 6 ऋण व उपाय
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=kp" className="hover:text-accent transition">
                  केपी पद्धति (KP Sub-Lord)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=tajik" className="hover:text-accent transition">
                  वर्षफल व मुन्था (Varshphal)
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=vastu" className="hover:text-accent transition">
                  16-जोन वास्तु शास्त्र विश्लेषण
                </Link>
              </li>
              <li>
                <Link href="/demo?tab=pdf" className="hover:text-accent transition">
                  20-80 पृष्ठीय वृहत् कुंडली PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Company, API Platform & Contact */}
          <div className="space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>प्लेटफॉर्म एवं संपर्क</span>
            </div>
            
            <p className="text-[11px] text-ink-muted leading-relaxed">
              {tagline}। आधुनिक इंजीनियरिंग एवं प्रामाणिक पराशरी गणना का संगम।
            </p>

            <ul className="space-y-2 text-xs pt-1">
              <li>
                <Link href="/demo" className="text-accent font-semibold hover:text-accent-hover transition flex items-center gap-1">
                  <span>लाइव वैदिक ऐप डेमो</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/#playground" className="hover:text-ink transition">
                  डेवलपर API प्लेग्राउंड
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-ink transition">
                  मूल्य निर्धारण (Pricing)
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-ink transition">
                  135 API डॉक्यूमेंटेशन
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-ink transition">
                  API कंसोल डैशबोर्ड
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
            &copy; {new Date().getFullYear()} {companyName}. सर्वाधिकार सुरक्षित (All rights reserved).
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-ink-soft">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% डेटा गोपनीयता एवं सुरक्षा</span>
            </span>
            <span className="text-line">•</span>
            <span className="flex items-center gap-1 text-ink-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>स्विस एफिमेरिस C-कोर सक्रिय</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
