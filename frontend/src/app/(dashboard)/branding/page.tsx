"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Upload, 
  Globe, 
  Phone, 
  Building2, 
  Check, 
  Sparkles,
  Loader2
} from "lucide-react";

export default function BrandingPage() {
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Fetch live saved branding from /api/user/me
    axios.get("/api/user/me")
      .then(res => {
        const branding = res.data?.data?.brandingConfig;
        if (branding) {
          if (branding.brandName) setBrandName(branding.brandName);
          if (branding.website) setWebsite(branding.website);
          if (branding.contactPhone) setPhone(branding.contactPhone);
          if (branding.primaryColor) setPrimaryColor(branding.primaryColor);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/api/user/branding", {
        brandName,
        website,
        contactPhone: phone,
        primaryColor
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      //
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">White-Label Branding Suite</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">
          Inject your corporate branding, colors, and helpline directly into 60-100 page Brihat Kundli and Matchmaking PDF reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Branding Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Company / Brand Name
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
                placeholder="Astro Consultancy Ltd."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Website URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
                placeholder="https://yourbrand.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contact / Helpline Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
                placeholder="+91 99999 88888"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Primary Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-xs text-slate-900 uppercase bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 font-bold">
                {primaryColor}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Agency Logo (PNG / JPG / WebP)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50">
              <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <div className="text-xs text-slate-800 font-semibold">Click to upload brand logo</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Recommended: Transparent PNG, 400x120px max</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Branding Configuration Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save PDF Branding Settings</span>
              </>
            )}
          </button>
        </form>

        {/* Live PDF Cover Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Live PDF Cover Preview
          </div>
          <div className="bg-white rounded-xl border border-slate-300 p-6 space-y-6 shadow-md relative overflow-hidden">
            <div 
              className="h-2.5 rounded-full transition-all"
              style={{ backgroundColor: primaryColor }}
            ></div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Prepared By</div>
                <div className="font-bold text-sm text-slate-900">{brandName || "Your Company Name"}</div>
              </div>
              <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                LOGO
              </div>
            </div>

            <div className="text-center py-8 bg-slate-50/70 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full border border-blue-200 text-blue-800 bg-blue-50 font-semibold">
                Comprehensive Vedic Horoscope
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-3">Brihat Kundli Grand Report</h3>
              <p className="text-xs text-slate-600 mt-1">Prepared for: Rohit Sharma (DOB: 1995-10-05)</p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span>{website}</span>
              <span>{phone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
