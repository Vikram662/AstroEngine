"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { FileText, Download, Loader2, CheckCircle2 } from "lucide-react";

const REPORT_TYPES = [
  { id: "kundli/basic", en: "Basic Kundli (12 pages)", hi: "मूल कुंडली (12 पृष्ठ)" },
  { id: "kundli/brihat", en: "Brihat Horoscope (65+ pages)", hi: "वृहत् कुंडली (65+ पृष्ठ)" },
  { id: "matching/report", en: "Matchmaking Dossier (25 pages)", hi: "कुंडली मिलान रिपोर्ट (25 पृष्ठ)" },
  { id: "varshphal/annual", en: "Tajik Varshphal (30 pages)", hi: "ताजिक वर्षफल (30 पृष्ठ)" },
  { id: "lalkitab/full", en: "Lal Kitab Full Report (40 pages)", hi: "लाल किताब संपूर्ण रिपोर्ट (40 पृष्ठ)" },
  { id: "dosha/sade-sati", en: "Shani Sade Sati Dossier (18 pages)", hi: "शनि साढ़े साती रिपोर्ट (18 पृष्ठ)" },
  { id: "numerology/report", en: "Numerology & Lo Shu (20 pages)", hi: "अंकशास्त्र एवं लो शू (20 पृष्ठ)" },
];

export default function PdfReportsClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [girlForm, setGirlForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    name: "कन्या",
    gender: "female",
  });
  const [targetYear, setTargetYear] = useState(String(new Date().getFullYear()));
  const [reportType, setReportType] = useState("kundli/basic");
  const isEnglish = locale === "en";
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
        const res = await axios.get(`/api/proxy?endpoint=/api/v1/pdf/status/${jId}`);
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
    setError(isEnglish ? "The report is taking longer than expected." : "रिपोर्ट तैयार होने में सामान्य से अधिक समय लग रहा है।");
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
      // The long-form renderer currently has one complete editorial language pack.
      // Keep the document consistently English instead of mixing English prose with
      // localized planet/sign labels. The surrounding page remains route-localized.
      lang: "en",
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
      const res = await axios.post("/api/proxy", {
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
        throw new Error(isEnglish ? "The PDF engine did not return a job ID." : "PDF इंजन से job_id प्राप्त नहीं हुआ।");
      }
    } catch (err: unknown) {
      const apiMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      const errorMessage = err instanceof Error ? err.message : undefined;
      setError(apiMessage || errorMessage || (isEnglish ? "PDF generation could not be started." : "PDF रिपोर्ट जनरेशन प्रारंभ नहीं हो सका।"));
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (jobId) {
      window.open(`/api/proxy?dl=pdf&job_id=${jobId}`, "_blank");
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
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-card p-6 rounded-2xl border border-line h-fit">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
              {isEnglish ? "PDF reports are generated in consistent English to prevent mixed-language tables and overlapping Indic text." : "PDF रिपोर्ट एकसमान English में बनती है, ताकि Hindi-English मिश्रण और अक्षरों का overlap न हो।"}
            </div>
            <div>
              <label htmlFor="report_sel" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>{isEnglish ? "Report type" : "रिपोर्ट प्रकार"}</span>
              </label>
              <select
                id="report_sel"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              >
                {REPORT_TYPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isEnglish ? r.en : r.hi}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-line">
              <BirthDataFields value={form} onChange={setForm} personLabel={isMatching ? (isEnglish ? "Groom details" : "वर विवरण") : undefined} idPrefix="p1_" />
            </div>

            {isMatching && (
              <div className="p-4 rounded-xl bg-surface border border-line">
                <BirthDataFields
                  value={girlForm}
                  onChange={setGirlForm}
                  personLabel={isEnglish ? "Bride details" : "कन्या विवरण"}
                  idPrefix="p2_"
                />
              </div>
            )}

            {isVarshphal && (
              <div>
                <label htmlFor="target_year" className="block text-xs font-semibold text-ink-soft mb-1.5">
                  {isEnglish ? "Target year for Varshphal" : "वर्षफल का लक्षित वर्ष"}
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
                  <Loader2 className="w-4 h-4 animate-spin" /> {isEnglish ? "Compiling PDF..." : "PDF संकलित हो रही है..."}
                </>
              ) : (
                isEnglish ? "Generate PDF report" : "PDF रिपोर्ट बनाएं"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {error && <ErrorNote message={error} />}

          {!jobStatus && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm">{isEnglish ? "Choose a detailed Vedic report and create a print-ready, high-resolution PDF." : "अपनी पसंद की विस्तृत वैदिक रिपोर्ट चुनें और प्रिंट-क्वालिटी PDF तैयार करें।"}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
              <div className="text-base font-bold text-ink">{isEnglish ? "Rendering and compiling your PDF..." : "PDF रेंडरिंग एवं संकलन जारी..."}</div>
              <p className="text-xs text-ink-muted mt-2 max-w-sm">
                {isEnglish ? "Status: " : "स्थिति: "}{jobStatus === "PENDING" ? (isEnglish ? "Queued..." : "प्रतीक्षा सूची में...") : (isEnglish ? "Preparing charts, dashas, and interpretation pages..." : "चार्ट, दशा चक्र एवं फलादेश पृष्ठ तैयार हो रहे हैं...")}
              </p>
            </div>
          )}

          {jobStatus === "COMPLETED" && (
            <div className="bg-card rounded-2xl border border-emerald-200 p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">{isEnglish ? "Your PDF report is ready" : "आपकी PDF रिपोर्ट तैयार है!"}</h3>
                <p className="text-xs text-ink-muted mt-1">
                  {isEnglish ? "The document was generated successfully. Download it below." : "दस्तावेज़ सफलतापूर्वक बन गया है। नीचे दिए गए बटन से डाउनलोड करें।"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> {isEnglish ? "Download PDF report" : "PDF रिपोर्ट डाउनलोड करें"}
              </button>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
