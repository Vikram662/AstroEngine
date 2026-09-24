"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

type ApiData = Record<string, unknown>;

const unwrap = (response: { data?: { data?: ApiData } | ApiData }): ApiData => {
  const outer = response.data;
  if (outer && "data" in outer && outer.data) return outer.data as ApiData;
  return (outer || {}) as ApiData;
};

const timeRange = (value: unknown) => {
  if (!value || typeof value !== "object") return String(value || "-");
  const range = value as { start?: string; end?: string };
  return `${range.start || "-"} - ${range.end || "-"}`;
};

export default function DailyPanchangClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    dob: new Date().toISOString().split("T")[0],
    tob: "06:00",
  });
  const lang = locale;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [extras, setExtras] = useState<Record<string, ApiData>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      dob: form.dob,
      tob: form.tob,
      lat: form.lat,
      lon: form.lon,
      tz: form.tz,
      lang,
    };

    try {
      const endpoints = {
        daily: "/api/v1/panchang/daily",
        timings: "/api/v1/core/sun-moon/timings",
        advanced: "/api/v1/panchang/advanced",
        choghadiya: "/api/v1/panchang/choghadiya",
        hora: "/api/v1/panchang/hora",
        bhadra: "/api/v1/panchang/bhadra",
        panchak: "/api/v1/panchang/panchak",
      } as const;
      const entries = Object.entries(endpoints);
      const results = await Promise.allSettled(entries.map(([, endpoint]) => axios.post("/api/proxy", { endpoint, payload, method: "POST" })));
      const combined: Record<string, ApiData> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") combined[entries[index][0]] = unwrap(result.value);
      });
      if (!combined.daily) throw new Error(lang === "en" ? "Daily Panchang data is unavailable." : "दैनिक पंचांग डेटा उपलब्ध नहीं है।");
      setData(combined.daily);
      setExtras(combined);
    } catch (err: unknown) {
      const apiMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(apiMessage || (err instanceof Error ? err.message : undefined) || (lang === "en" ? "Daily Panchang calculation failed." : "दैनिक पंचांग गणना विफल रही।"));
    } finally {
      setLoading(false);
    }
  };

  const tithi = data?.tithi;
  const nakshatra = data?.nakshatra;
  const yoga = data?.yoga;
  const karana = data?.karana;
  const vaar = data?.day || data?.vaar;
  const timings = extras.timings || {};
  const advanced = extras.advanced || {};
  const choghadiya = extras.choghadiya || {};
  const horas = Array.isArray(extras.hora?.horas) ? extras.hora.horas as Array<Record<string, unknown>> : [];
  const bhadra = (extras.bhadra?.bhadra || {}) as Record<string, unknown>;
  const panchak = (extras.panchak?.panchak || {}) as Record<string, unknown>;
  const dayChoghadiya = Array.isArray(choghadiya.day_choghadiya) ? choghadiya.day_choghadiya as Array<Record<string, unknown>> : [];
  const nightChoghadiya = Array.isArray(choghadiya.night_choghadiya) ? choghadiya.night_choghadiya as Array<Record<string, unknown>> : [];

  return (
    <CalculatorPageShell
      slug="daily-panchang"
      category="panchang"
      title="Today's Panchang"
      hindiTitle="दैनिक पंचांग"
      description={lang === "en" ? "Complete daily Panchang with the five limbs, Sun-Moon timings, muhurtas, Choghadiya, Hora, Bhadra, and Panchak." : "पंचांग के पाँच अंग, सूर्य-चंद्र समय, मुहूर्त, चौघड़िया, होरा, भद्रा एवं पंचक की संपूर्ण दैनिक गणना।"}
      icon="📜"
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`${data ? "lg:col-span-12" : "lg:col-span-4"} bg-card p-6 rounded-2xl border border-line h-fit`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <BirthDataFields
              value={form}
              onChange={setForm}
              requireName={false}
              requireGender={false}
              dateLabel={lang === "en" ? "Panchang date" : "पंचांग तिथि"}
            />

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {lang === "en" ? "Calculating complete Panchang..." : "संपूर्ण पंचांग गणना जारी..."}
                </>
              ) : (
                lang === "en" ? "Calculate complete Panchang" : "संपूर्ण पंचांग निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className={`${data ? "lg:col-span-12" : "lg:col-span-8"} space-y-6`}>
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">📜</div>
              <p className="text-sm">तारीख एवं स्थान चुनें और 5 शास्त्रीय अंग (वार, तिथि, नक्षत्र, योग, करण) व शुभ-अशुभ मुहूर्त देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">सूर्य सिद्धांत एवं दृक गणित अनुसार पंचांग अवयवों की गणना हो रही है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title={lang === "en" ? "Five Limbs of Panchang" : "पंचांग के 5 अंग"}>
                <ResultRow
                  label={lang === "en" ? "Weekday" : "वार"}
                  value={typeof vaar === "object" ? vaar?.name : vaar || "बुधवार"}
                  accent
                />
                <ResultRow
                  label={lang === "en" ? "Tithi" : "तिथि"}
                  value={
                    <span className="flex items-center gap-1.5">
                      <span>{typeof tithi === "object" ? tithi?.name : tithi || "शुक्ल पक्ष"}</span>
                      {typeof tithi === "object" && tithi?.end_time && (
                        <ResultBadge tone="neutral">{lang === "en" ? "Ends" : "समाप्ति"}: {tithi.end_time}</ResultBadge>
                      )}
                    </span>
                  }
                />
                <ResultRow
                  label={lang === "en" ? "Nakshatra" : "नक्षत्र"}
                  value={
                    <span className="flex items-center gap-1.5">
                      <span>{typeof nakshatra === "object" ? nakshatra?.name : nakshatra || "रोहिणी"}</span>
                      {typeof nakshatra === "object" && nakshatra?.end_time && (
                        <ResultBadge tone="neutral">{lang === "en" ? "Ends" : "समाप्ति"}: {nakshatra.end_time}</ResultBadge>
                      )}
                    </span>
                  }
                />
                <ResultRow
                  label={lang === "en" ? "Yoga" : "योग"}
                  value={typeof yoga === "object" ? yoga?.name : yoga || "सिद्ध"}
                />
                <ResultRow
                  label={lang === "en" ? "Karana" : "करण"}
                  value={typeof karana === "object" ? karana?.name : karana || "बव"}
                />
              </ResultSection>

              <ResultSection title={lang === "en" ? "Sun, Moon & Daylight" : "सूर्य, चंद्र एवं दिनमान"}>
                <ResultRow label={lang === "en" ? "Sunrise" : "सूर्योदय"} value={String(timings.sunrise || "-")} />
                <ResultRow label={lang === "en" ? "Sunset" : "सूर्यास्त"} value={String(timings.sunset || "-")} />
                <ResultRow label={lang === "en" ? "Moonrise" : "चंद्रोदय"} value={String(timings.moonrise || "-")} />
                <ResultRow label={lang === "en" ? "Moonset" : "चंद्रास्त"} value={String(timings.moonset || "-")} />
                <ResultRow label={lang === "en" ? "Day duration" : "दिन की अवधि"} value={`${String(timings.day_duration_hours || "-")} ${lang === "en" ? "hours" : "घंटे"}`} />
              </ResultSection>

              <ResultSection title={lang === "en" ? "Auspicious & Restricted Periods" : "शुभ एवं वर्जित काल"}>
                <ResultRow label={lang === "en" ? "Abhijit Muhurat" : "अभिजित मुहूर्त"} value={<ResultBadge tone="good">{timeRange(advanced.abhijit_muhurat)}</ResultBadge>} />
                <ResultRow label={lang === "en" ? "Brahma Muhurat" : "ब्रह्म मुहूर्त"} value={<ResultBadge tone="good">{timeRange(advanced.brahma_muhurat)}</ResultBadge>} />
                <ResultRow label={lang === "en" ? "Rahu Kaal" : "राहु काल"} value={<ResultBadge tone="bad">{timeRange(advanced.rahu_kaal)}</ResultBadge>} />
                <ResultRow label={lang === "en" ? "Yamaganda" : "यमगण्ड काल"} value={<ResultBadge tone="bad">{timeRange(advanced.yamaghanda_kaal)}</ResultBadge>} />
                <ResultRow label={lang === "en" ? "Gulika Kaal" : "गुलिक काल"} value={<ResultBadge tone="bad">{timeRange(advanced.gulika_kaal)}</ResultBadge>} />
              </ResultSection>

              <ResultSection title={lang === "en" ? "Bhadra & Panchak" : "भद्रा एवं पंचक"}>
                <ResultRow label={lang === "en" ? "Bhadra status" : "भद्रा स्थिति"} value={<ResultBadge tone={bhadra.is_present ? "bad" : "good"}>{bhadra.is_present ? (lang === "en" ? "Present" : "उपस्थित") : (lang === "en" ? "Not present" : "नहीं है")}</ResultBadge>} />
                {Boolean(bhadra.is_present) && <ResultRow label={lang === "en" ? "Residence" : "भद्रा लोक"} value={String(bhadra.residence_loka || "-")} />}
                <ResultRow label={lang === "en" ? "Panchak status" : "पंचक स्थिति"} value={<ResultBadge tone={panchak.is_active ? "bad" : "good"}>{panchak.is_active ? String(panchak.type || (lang === "en" ? "Active" : "सक्रिय")) : (lang === "en" ? "Not active" : "नहीं है")}</ResultBadge>} />
                <ResultRow label={lang === "en" ? "Active Nakshatra" : "सक्रिय नक्षत्र"} value={String(panchak.active_nakshatra || nakshatra?.name || "-")} />
              </ResultSection>

              {(dayChoghadiya.length > 0 || nightChoghadiya.length > 0) && (
                <ResultSection title={lang === "en" ? "Complete Choghadiya" : "संपूर्ण चौघड़िया"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[{ title: lang === "en" ? "Day" : "दिन", rows: dayChoghadiya }, { title: lang === "en" ? "Night" : "रात्रि", rows: nightChoghadiya }].map((group) => (
                      <div key={group.title} className="rounded-xl border border-line overflow-hidden">
                        <div className="px-3 py-2 bg-surface-alt text-xs font-bold text-ink">{group.title}</div>
                        <div className="divide-y divide-line/60">
                          {group.rows.map((slot, index) => <div key={index} className="px-3 py-2 text-xs flex justify-between gap-3"><span className="font-semibold text-ink">{String(slot.name || slot.choghadiya || "-")}</span><span className="text-ink-muted whitespace-nowrap">{String(slot.start_time || "-")} - {String(slot.end_time || "-")}</span></div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ResultSection>
              )}

              {horas.length > 0 && (
                <ResultSection title={lang === "en" ? "24 Planetary Horas" : "24 ग्रह होरा"}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {horas.map((hora, index) => <div key={index} className="rounded-lg border border-line bg-surface-alt/50 p-2.5 text-xs"><div className="font-bold text-ink">{String(hora.lord || "-")}</div><div className="mt-1 text-ink-muted">{String(hora.start_time || "-")} - {String(hora.end_time || "-")}</div></div>)}
                  </div>
                </ResultSection>
              )}

              {(data.sunrise || data.sunset || data.rahukaal) && (
                <ResultSection title="सूर्योदय एवं शुभ-अशुभ काल">
                  {data.sunrise && <ResultRow label="सूर्योदय" value={data.sunrise} />}
                  {data.sunset && <ResultRow label="सूर्यास्त" value={data.sunset} />}
                  {data.rahukaal && (
                    <ResultRow
                      label="राहुकाल (अशुभ)"
                      value={<ResultBadge tone="bad">{typeof data.rahukaal === "object" ? `${data.rahukaal.start} - ${data.rahukaal.end}` : data.rahukaal}</ResultBadge>}
                    />
                  )}
                  {data.abhijit && (
                    <ResultRow
                      label="अभिजित मुहूर्त (अति शुभ)"
                      value={<ResultBadge tone="good">{typeof data.abhijit === "object" ? `${data.abhijit.start} - ${data.abhijit.end}` : data.abhijit}</ResultBadge>}
                    />
                  )}
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
