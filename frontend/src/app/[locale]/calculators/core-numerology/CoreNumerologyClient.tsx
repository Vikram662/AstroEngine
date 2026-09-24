"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Calendar, User, Loader2 } from "lucide-react";

export default function CoreNumerologyClient({ locale }: { locale: Locale }) {
  const [name, setName] = useState("Aditya Sharma");
  const [dob, setDob] = useState("1995-10-05");
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      dob,
      tob: "12:00",
      lat: 28.6139,
      lon: 77.209,
      tz: 5.5,
      lang,
    };

    try {
      const res = await axios.post("/api/proxy", {
        endpoint: "/api/v1/numerology/core-numbers",
        payload,
        queryParams: name ? { name } : null,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "अंकशास्त्र गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const mulank = data?.mulank || data?.birth_number || data?.driver_number;
  const bhagyank = data?.bhagyank || data?.destiny_number || data?.conductor_number;
  const namank = data?.namank || data?.name_number;

  return (
    <CalculatorPageShell
      slug="core-numerology"
      category="numerology"
      title="Life Path & Destiny Numbers"
      hindiTitle="मूलांक एवं भाग्यांक"
      description="जन्मतिथि आधारित मूलांक, भाग्यांक एवं नामांक की समग्र शास्त्रीय गणना।"
      icon="🔢"
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

            <div>
              <label htmlFor="user_name" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                <span>{lang === "en" ? "Full Name" : "पूरा नाम"}</span>
              </label>
              <input
                id="user_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === "en" ? "e.g. Aditya Sharma" : "उदा. आदित्य शर्मा"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
            </div>

            <div>
              <label htmlFor="user_dob" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>{lang === "en" ? "Date of Birth" : "जन्म तिथि"}</span>
              </label>
              <input
                id="user_dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
            </div>

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> अंकशास्त्र गणना जारी...
                </>
              ) : (
                "मूलांक एवं भाग्यांक निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🔢</div>
              <p className="text-sm">नाम और जन्मतिथि दर्ज करें और अपने मूलांक, भाग्यांक व नामांक का फल जानें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">पाइथागोरस एवं कीरो अंक सिद्धांतों की गणना जारी है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-center">
                  <div className="text-[11px] uppercase font-bold text-amber-800 mb-1">मूलांक (Driver)</div>
                  <div className="text-3xl font-extrabold text-amber-950">
                    {mulank?.number ?? mulank ?? 5}
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    स्वामी: {mulank?.ruler || mulank?.lord || "बुध"}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl text-center">
                  <div className="text-[11px] uppercase font-bold text-indigo-800 mb-1">भाग्यांक (Conductor)</div>
                  <div className="text-3xl font-extrabold text-indigo-950">
                    {bhagyank?.number ?? bhagyank ?? 3}
                  </div>
                  <div className="text-xs text-indigo-700 mt-1">
                    स्वामी: {bhagyank?.ruler || bhagyank?.lord || "गुरु"}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl text-center">
                  <div className="text-[11px] uppercase font-bold text-purple-800 mb-1">नामांक (Name Number)</div>
                  <div className="text-3xl font-extrabold text-purple-950">
                    {namank?.number ?? namank ?? 1}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    स्वामी: {namank?.ruler || namank?.lord || "सूर्य"}
                  </div>
                </div>
              </div>

              <ResultSection title="अंक अनुकूलता विवरण">
                {data.favorable_numbers && (
                  <ResultRow
                    label="शुभ अंक (Lucky Numbers)"
                    value={Array.isArray(data.favorable_numbers) ? data.favorable_numbers.join(", ") : String(data.favorable_numbers)}
                    accent
                  />
                )}
                {data.favorable_days && (
                  <ResultRow
                    label="शुभ वार (Lucky Days)"
                    value={Array.isArray(data.favorable_days) ? data.favorable_days.join(", ") : String(data.favorable_days)}
                  />
                )}
                {data.favorable_colors && (
                  <ResultRow
                    label="शुभ रंग (Lucky Colors)"
                    value={Array.isArray(data.favorable_colors) ? data.favorable_colors.join(", ") : String(data.favorable_colors)}
                  />
                )}
              </ResultSection>

              {data.prediction && (
                <ResultSection title="अंकशास्त्र फलादेश">
                  <p className="text-xs text-ink-soft leading-relaxed">{data.prediction}</p>
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
