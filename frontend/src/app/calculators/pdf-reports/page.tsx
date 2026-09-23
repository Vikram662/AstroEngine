"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { FileText, Download, Loader2, CheckCircle2 } from "lucide-react";

const REPORT_TYPES = [
  { id: "kundli/basic", label: "Basic Kundli (12 Pages)", desc: "लग्न, नवांश, ग्रह स्पष्ट एवं विंशोत्तरी महादशा" },
  { id: "kundli/brihat", label: "Brihat Horoscope (65+ Pages)", desc: "षोडशवर्ग, अष्टकवर्ग, संपूर्ण दशाएं एवं विस्तृत योग विश्लेषण" },
  { id: "matching/report", label: "Matchmaking Dossier (25 Pages)", desc: "36 गुण मिलान, नाड़ी दोष, मांगलिक एवं ग्रह अनुकूलता" },
  { id: "varshphal/annual", label: "Tajik Varshphal (30 Pages)", desc: "वार्षिक मुन्था, वर्षेश, पात्यायिनी दशा एवं 12 मासिक भविष्यफल" },
  { id: "lalkitab/full", label: "Lal Kitab Full Report (40 Pages)", desc: "कुदरती ऋण, ग्रह फल, 28-साला चक्र एवं वार्षिक लाल किताब टोटके" },
  { id: "dosha/sade-sati", label: "Shani Sade Sati Dossier (18 Pages)", desc: "शनि की साढ़े साती, ढैया एवं जीवनपर्यंत गोचर शांति उपाय" },
  { id: "numerology/report", label: "Numerology & Lo Shu (20 Pages)", desc: "मूलांक, भाग्यांक, नामांक एवं लो शू ग्रिड अनुकूलता" },
];

export default function PdfReportsPage() {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [girlForm, setGirlForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    name: "कन्या",
    gender: "female",
  });
  const [targetYear, setTargetYear] = useState(String(new Date().getFullYear()));
  const [reportType, setReportType] = useState("kundli/basic");
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");

  const isMatching = reportType === "matching/report";
  const isVarshphal = reportType === "varshphal/annual";

  const pollStatus = async (jId: string) => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await axios.get(`/api/demo/proxy?endpoint=/api/v1/pdf/status/${jId}`);
        const status = res.data?.data?.status || res.data?.status;
        setJobStatus(status);
        if (status === "COMPLETED" || status === "FAILED") {
          setLoading(false);
          return;
        }
      } catch {
        // continue
      }
    }
    setJobStatus("FAILED");
    setError("रिपोर्ट तैयार होने में सामान्य से अधिक समय लग रहा है।");
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setJobStatus("PENDING");
    setJobId("");

    const payload: Record<string, unknown> = {
      dob: form.dob,
      tob: form.tob,
      lat: form.lat,
      lon: form.lon,
      tz: form.tz,
      lang,
      branding: {
        company_name: "AstroEngine Astrological Platform",
      },
    };

    if (isMatching) {
      payload.girl_dob = girlForm.dob;
      payload.girl_tob = girlForm.tob;
      payload.girl_lat = girlForm.lat;
      payload.girl_lon = girlForm.lon;
      payload.girl_tz = girlForm.tz;
    }

    if (isVarshphal) {
      payload.target_year = Number(targetYear) || new Date().getFullYear();
    }

    try {
      const res = await axios.post("/api/demo/proxy", {
        endpoint: `/api/v1/pdf/${reportType}`,
        payload,
        method: "POST",
      });

      const returnedId = res.data?.job_id || res.data?.data?.job_id;
      if (returnedId) {
        setJobId(returnedId);
        setJobStatus("PROCESSING");
        pollStatus(returnedId);
      } else {
        throw new Error("PDF इंजन से job_id प्राप्त नहीं हुआ।");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "PDF रिपोर्ट जनरेशन प्रारंभ नहीं हो सका।");
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (jobId) {
      window.open(`/api/demo/proxy?dl=pdf&job_id=${jobId}`, "_blank");
    }
  };

  return (
    <CalculatorPageShell
      slug="pdf-reports"
      category="reports"
      title="PDF Kundli Reports"
      hindiTitle="वृहत् कुंडली PDF रिपोर्ट"
      description="20-80 पृष्ठीय विस्तृत कुंडली, मिलान, वर्षफल एवं लाल किताब PDF रिपोर्ट बनाएं।"
      icon="📄"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-card p-6 rounded-2xl border border-line h-fit">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-xs font-bold text-ink">भाषा / Language</span>
              <div className="flex rounded-lg bg-surface-alt p-1 border border-line text-xs">
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={`px-3 py-1 rounded font-medium transition ${
                    lang === "hi" ? "bg-accent text-white shadow" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-3 py-1 rounded font-medium transition ${
                    lang === "en" ? "bg-accent text-white shadow" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="report_sel" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>रिपोर्ट प्रकार (Report Type)</span>
              </label>
              <select
                id="report_sel"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              >
                {REPORT_TYPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-line">
              <BirthDataFields value={form} onChange={setForm} personLabel={isMatching ? "वर विवरण (Groom Details)" : undefined} idPrefix="p1_" />
            </div>

            {isMatching && (
              <div className="p-4 rounded-xl bg-surface border border-line">
                <BirthDataFields
                  value={girlForm}
                  onChange={setGirlForm}
                  personLabel="कन्या विवरण (Bride Details)"
                  idPrefix="p2_"
                />
              </div>
            )}

            {isVarshphal && (
              <div>
                <label htmlFor="target_year" className="block text-xs font-semibold text-ink-soft mb-1.5">
                  लक्षित वर्ष (Target Year for Varshphal)
                </label>
                <input
                  id="target_year"
                  type="number"
                  required
                  min={1900}
                  max={2100}
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                />
              </div>
            )}

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> PDF संकलित हो रही है...
                </>
              ) : (
                "PDF रिपोर्ट बनाएं"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {error && <ErrorNote message={error} />}

          {!jobStatus && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm">अपनी पसंद की विस्तृत वैदिक रिपोर्ट चुनें और प्रिंट-क्वालिटी हाई-रेज़ोल्यूशन PDF तैयार करें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
              <div className="text-base font-bold text-ink">PDF रेंडरिंग एवं संकलन जारी...</div>
              <p className="text-xs text-ink-muted mt-2 max-w-sm">
                स्थिति: {jobStatus === "PENDING" ? "प्रतीक्षा सूची में..." : "चार्ट, दशा चक्र एवं फलादेश पृष्ठ तैयार हो रहे हैं..."}
              </p>
            </div>
          )}

          {jobStatus === "COMPLETED" && (
            <div className="bg-card rounded-2xl border border-emerald-200 p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">आपकी PDF रिपोर्ट तैयार है!</h3>
                <p className="text-xs text-ink-muted mt-1">
                  दस्तावेज़ सफलतापूर्वक उत्पन्न हो गया है। नीचे दिए गए बटन से सीधे डाउनलोड करें।
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> PDF रिपोर्ट डाउनलोड करें
              </button>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
