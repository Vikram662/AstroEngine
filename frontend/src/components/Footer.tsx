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
  Code2
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

  const companyName = info["COMPANY_NAME"] || "AstroEngine Technologies Pvt. Ltd.";
  const logoUrl = info["COMPANY_LOGO_URL"];
  const tagline = info["COMPANY_TAGLINE"] || "Enterprise Vedic & Western Astrology API Infrastructure";
  const phone = info["COMPANY_PHONE"] || "+91 22 4910 8800";
  const email = info["COMPANY_EMAIL"] || "billing@astroengine.io";
  const supportEmail = info["COMPANY_SUPPORT_EMAIL"] || "support@astroengine.io";
  const address = info["COMPANY_ADDRESS_LINE1"] || "Level 4, Tech Park, Bandra Kurla Complex";
  const city = info["COMPANY_CITY"] || "Mumbai";
  const state = info["COMPANY_STATE"] || "Maharashtra";
  const pincode = info["COMPANY_PINCODE"] || "400051";
  const gstin = info["COMPANY_GSTIN"] || "27AABCA1234F1Z8";

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Col 1 & 2: Brand, Logo & Legal Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={companyName} 
                  className="h-8 max-w-[140px] object-contain" 
                />
              ) : (
                <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                  AE
                </div>
              )}
              <span className="font-bold text-base tracking-tight text-slate-900">
                {companyName.split(" ")[0]}
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                ENTERPRISE
              </span>
            </Link>

            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              {tagline}. High-precision astronomical planetary ephemeris, divisional charts (D1–D60), KP stellar systems, and white-label PDF generation for modern platforms.
            </p>

            <div className="space-y-1.5 text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>GSTIN: <strong className="font-mono text-slate-700">{gstin}</strong> (SAC 998313)</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>{address}, {city}, {state} - {pincode}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Product & APIs */}
          <div className="space-y-3">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Astrology Engine
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/demo" className="text-indigo-600 font-semibold hover:text-indigo-700 transition flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  Live App Demo
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-slate-900 transition">
                  All 117 Endpoints
                </Link>
              </li>
              <li>
                <Link href="/#playground" className="hover:text-slate-900 transition">
                  Live Playground
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-slate-900 transition">
                  Pricing & Quotas
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-slate-900 transition flex items-center gap-1">
                  API Documentation
                </Link>
              </li>
              <li>
                <a
                  href={`${process.env.NEXT_PUBLIC_ASTRO_ENGINE_URL}/documentation`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 transition flex items-center gap-1"
                >
                  <span>ReDoc Reference</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <Link href="/#features" className="hover:text-slate-900 transition">
                  Features &amp; Engines
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Developer Portal */}
          <div className="space-y-3">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Developer Portal
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-slate-900 transition">
                  Console Dashboard
                </Link>
              </li>
              <li>
                <Link href="/usage" className="hover:text-slate-900 transition">
                  API Usage & Logs
                </Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-slate-900 transition">
                  Wallet & Recharge
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-slate-900 transition">
                  Developer Sign in
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Support & Contact */}
          <div className="space-y-3">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Direct Contact
            </div>
            <div className="space-y-2 text-xs">
              <a 
                href={`tel:${phone.replace(/\s+/g, "")}`} 
                className="flex items-center gap-2 hover:text-slate-900 transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{phone}</span>
              </a>
              <a 
                href={`mailto:${email}`} 
                className="flex items-center gap-2 hover:text-slate-900 transition"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{email}</span>
              </a>
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-700 mb-1.5">Social Channels</div>
                <div className="flex items-center gap-2.5 text-slate-500">
                  {info["SOCIAL_TWITTER"] && (
                    <a href={info["SOCIAL_TWITTER"]} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition font-medium">
                      Twitter / X
                    </a>
                  )}
                  {info["SOCIAL_LINKEDIN"] && (
                    <a href={info["SOCIAL_LINKEDIN"]} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition font-medium">
                      LinkedIn
                    </a>
                  )}
                  {info["SOCIAL_YOUTUBE"] && (
                    <a href={info["SOCIAL_YOUTUBE"]} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition font-medium">
                      YouTube
                    </a>
                  )}
                  {info["SOCIAL_GITHUB"] && (
                    <a href={info["SOCIAL_GITHUB"]} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition font-medium">
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-slate-100 bg-slate-50/70 py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational (99.9% SLA)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
