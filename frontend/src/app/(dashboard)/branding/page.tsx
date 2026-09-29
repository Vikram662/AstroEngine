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
  Loader2,
  AlertCircle
} from "lucide-react";

export default function BrandingPage() {
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
          if (branding.logoUrl) setLogoUrl(branding.logoUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await axios.post("/api/user/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.logoUrl) {
        setLogoUrl(res.data.logoUrl);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setUploadError(error.response?.data?.message || "Logo upload failed.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
      <div className="bg-white p-6 rounded-md border border-line shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-ink">White-Label Branding Suite</h1>
        <p className="text-ink-soft text-xs sm:text-sm mt-1">
          Inject your corporate branding, colors, and helpline directly into 12-60 page Kundli, Matchmaking, and specialist PDF reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Branding Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5 bg-white p-6 rounded-md border border-line shadow-sm">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Company / Brand Name
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg pl-9 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-white focus:border-ink-muted font-medium"
                placeholder="Astro Consultancy Ltd."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Website URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg pl-9 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-white focus:border-ink-muted font-medium"
                placeholder="https://yourbrand.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Contact / Helpline Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg pl-9 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-white focus:border-ink-muted font-medium"
                placeholder="+91 99999 88888"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Primary Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-xs text-ink uppercase bg-surface-alt px-3 py-2 rounded-lg border border-line font-bold">
                {primaryColor}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Agency Logo (PNG / JPG / WebP)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={handleLogoSelected}
              className="hidden"
              id="logo-upload-input"
            />
            <label
              htmlFor="logo-upload-input"
              className="border-2 border-dashed border-line hover:border-ink-muted rounded-md p-6 text-center cursor-pointer transition bg-surface block"
            >
              {uploadingLogo ? (
                <Loader2 className="w-6 h-6 text-ink-soft mx-auto mb-2 animate-spin" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Brand logo" className="h-10 mx-auto mb-2 object-contain" />
              ) : (
                <Upload className="w-6 h-6 text-ink-soft mx-auto mb-2" />
              )}
              <div className="text-xs text-ink font-semibold">
                {uploadingLogo ? "Uploading..." : logoUrl ? "Click to replace logo" : "Click to upload brand logo"}
              </div>
              <div className="text-[11px] text-ink-soft mt-0.5">Recommended: Transparent PNG, 400x120px max</div>
            </label>
            {uploadError && (
              <div className="mt-2 text-[11px] text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-lg bg-console hover:bg-console-line text-white font-semibold text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
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
          <div className="text-xs font-bold text-ink-soft uppercase tracking-wider">
            Live PDF Cover Preview
          </div>
          <div className="bg-white rounded-md border border-line p-6 space-y-6 relative overflow-hidden">
            <div 
              className="h-2.5 rounded-full transition-all"
              style={{ backgroundColor: primaryColor }}
            ></div>

            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="text-[11px] text-ink-muted uppercase font-semibold">Prepared By</div>
                <div className="font-bold text-sm text-ink">{brandName || "Your Company Name"}</div>
              </div>
              <div className="w-9 h-9 rounded bg-surface-alt border border-line flex items-center justify-center text-[10px] font-bold text-ink-soft overflow-hidden">
                {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : "LOGO"}
              </div>
            </div>

            <div className="text-center py-8 bg-surface/70 rounded-lg border border-line">
              <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full border border-accent/30 text-accent-hover bg-accent-soft font-semibold">
                Comprehensive Vedic Horoscope
              </span>
              <h3 className="text-lg font-extrabold text-ink mt-3">Brihat Kundli Grand Report</h3>
              <p className="text-xs text-ink-soft mt-1">Prepared for: Rohit Sharma (DOB: 1995-10-05)</p>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between text-[11px] text-ink-soft font-medium">
              <span>{website}</span>
              <span>{phone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
