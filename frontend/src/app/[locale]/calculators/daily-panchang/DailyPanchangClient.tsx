"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function DailyPanchangClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    dob: new Date().toISOString().split("T")[0],
    tob: "06:00",
  });
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

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
      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/panchang/daily",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "दैनिक पंचांग गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const tithi = data?.tithi;
  const nakshatra = data?.nakshatra;
  const yoga = data?.yoga;
  const karana = data?.karana;
  const vaar = data?.day || data?.vaar;

  return (
    <CalculatorPageShell
      slug="daily-panchang"
      category="panchang"
      title="Today's Panchang"
      hindiTitle="दैनिक पंचांग"
      description="तिथि (प्रतिशत समाप्ति), वार, नक्षत्र, योग, करण एवं भद्रा काल की विस्तृत गणना।"
      icon="📜"
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-card p-6 rounded-2xl border border-line h-fit">
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

            <BirthDataFields
              value={form}
              onChange={setForm}
              requireName={false}
              requireGender={false}
              dateLabel="पंचांग तिथि (Select Date)"
            />

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> पंचांग गणना जारी...
                </>
              ) : (
                "पंचांग निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
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
              <ResultSection title="पंचांग के 5 अंग (Pancha-Anga)">
                <ResultRow
                  label="वार (Day)"
                  value={typeof vaar === "object" ? vaar?.name : vaar || "बुधवार"}
                  accent
                />
                <ResultRow
                  label="तिथि (Tithi)"
                  value={
                    <span className="flex items-center gap-1.5">
                      <span>{typeof tithi === "object" ? tithi?.name : tithi || "शुक्ल पक्ष"}</span>
                      {typeof tithi === "object" && tithi?.end_time && (
                        <ResultBadge tone="neutral">समाप्ति: {tithi.end_time}</ResultBadge>
                      )}
                    </span>
                  }
                />
                <ResultRow
                  label="नक्षत्र (Nakshatra)"
                  value={
                    <span className="flex items-center gap-1.5">
                      <span>{typeof nakshatra === "object" ? nakshatra?.name : nakshatra || "रोहिणी"}</span>
                      {typeof nakshatra === "object" && nakshatra?.end_time && (
                        <ResultBadge tone="neutral">समाप्ति: {nakshatra.end_time}</ResultBadge>
                      )}
                    </span>
                  }
                />
                <ResultRow
                  label="योग (Yoga)"
                  value={typeof yoga === "object" ? yoga?.name : yoga || "सिद्ध"}
                />
                <ResultRow
                  label="करण (Karana)"
                  value={typeof karana === "object" ? karana?.name : karana || "बव"}
                />
              </ResultSection>

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
