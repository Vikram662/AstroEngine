"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

const KOOT_LABELS: Record<Locale, Record<string, string>> = {
  hi: {
    varna: "वर्ण",
    vashya: "वश्य",
    tara: "तारा",
    yoni: "योनि",
    graha_maitri: "ग्रह मैत्री",
    gana: "गण",
    bhakoot: "भकूट",
    nadi: "नाड़ी",
  },
  en: {
    varna: "Varna",
    vashya: "Vashya",
    tara: "Tara",
    yoni: "Yoni",
    graha_maitri: "Graha Maitri",
    gana: "Gana",
    bhakoot: "Bhakoot",
    nadi: "Nadi",
  },
};

const ERROR_TEXT: Record<Locale, string> = {
  hi: "कुंडली मिलान गणना विफल रही।",
  en: "Kundli matching calculation failed.",
};

export default function KundliMatchingClient({ locale }: { locale: Locale }) {
  const [boyForm, setBoyForm] = useState<BirthDataValue>(() => ({
    ...DEFAULT_BIRTH_DATA,
    name: locale === "en" ? "Groom" : "वर",
    gender: "male",
    dob: "1994-08-12",
    tob: "10:15",
    cityName: locale === "en" ? "New Delhi, India" : "नई दिल्ली, भारत",
  }));
  const [girlForm, setGirlForm] = useState<BirthDataValue>(() => ({
    name: locale === "en" ? "Bride" : "कन्या",
    gender: "female",
    dob: "1996-03-24",
    tob: "18:45",
    cityName: locale === "en" ? "Mumbai, India" : "मुंबई, भारत",
    lat: 19.076,
    lon: 72.8777,
    tz: 5.5,
  }));
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiData>(null);
  const [groomManglik, setGroomManglik] = useState<ApiData>(null);
  const [brideManglik, setBrideManglik] = useState<ApiData>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      groom_dob: boyForm.dob,
      groom_tob: boyForm.tob,
      groom_lat: boyForm.lat,
      groom_lon: boyForm.lon,
      groom_tz: boyForm.tz,
      bride_dob: girlForm.dob,
      bride_tob: girlForm.tob,
      bride_lat: girlForm.lat,
      bride_lon: girlForm.lon,
      bride_tz: girlForm.tz,
      lang,
    };

    try {
      const [resMatch, resGroomM, resBrideM] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dosha-matching/matchmaking/ashtakoot",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dosha-matching/manglik",
          payload: { dob: boyForm.dob, tob: boyForm.tob, lat: boyForm.lat, lon: boyForm.lon, tz: boyForm.tz, lang },
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dosha-matching/manglik",
          payload: { dob: girlForm.dob, tob: girlForm.tob, lat: girlForm.lat, lon: girlForm.lon, tz: girlForm.tz, lang },
          method: "POST",
        }),
      ]);

      if (!resMatch) throw new Error(ERROR_TEXT[locale]);

      setData(resMatch);
      if (resGroomM) setGroomManglik(resGroomM);
      if (resBrideM) setBrideManglik(resBrideM);
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || ERROR_TEXT[locale]);
    } finally {
      setLoading(false);
    }
  };

  const totalScore = data?.total_score ?? data?.total_obtained ?? data?.score ?? 0;
  const maxScore = data?.max_score ?? 36;
  const kootas = data?.kootas || {};
  const gunas = Array.isArray(data?.gunas)
    ? data.gunas
    : Object.entries(kootas).map(([key, val]: [string, ApiData]) => ({
        koot: KOOT_LABELS[locale][key] || key,
        obtained: val.points,
        max: val.max,
      }));

  const description =
    locale === "en"
      ? "Precise 8/8 Ashtakoot matching — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi dosha."
      : "वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट एवं नाड़ी दोष का 8/8 सटीक मिलान।";

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-md bg-surface border border-line">
        <BirthDataFields
          value={boyForm}
          onChange={setBoyForm}
          personLabel={lang === "en" ? "Groom Details" : "वर विवरण"}
          idPrefix="boy_"
        />
      </div>

      <div className="p-4 rounded-md bg-surface border border-line">
        <BirthDataFields
          value={girlForm}
          onChange={setGirlForm}
          personLabel={lang === "en" ? "Bride Details" : "कन्या विवरण"}
          idPrefix="girl_"
        />
      </div>

      <SubmitButton loading={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> {lang === "en" ? "Matching 36 Gunas..." : "36 गुणों का मिलान जारी..."}
          </>
        ) : (
          lang === "en" ? "Check Compatibility" : "36 गुण मिलान करें"
        )}
      </SubmitButton>
    </form>
  );

  const resultsContent = (
    <>
      {error && <ErrorNote message={error} />}

      {!data && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
          <div className="text-4xl mb-3">💍</div>
          <p className="text-sm">
            {lang === "en"
              ? "Enter birth details for Groom and Bride and click 'Check Compatibility'."
              : "वर एवं कन्या का जन्म विवरण भरें और 8 कूटों में से प्राप्त अंकों का संपूर्ण विवरण देखें।"}
          </p>
        </div>
      )}

          {loading && (
            <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">
                {lang === "en"
                  ? "Evaluating Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot and Nadi..."
                  : "वर्ण, वश्य, तारा, योनि, मैत्री, गण, भकूट एवं नाड़ी का परीक्षण हो रहा है..."}
              </p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title={lang === "en" ? "Compatibility Summary" : "मिलान परिणाम"}>
                <div
                  className={`p-6 rounded-md border text-center mb-4 ${
                    totalScore >= 18
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-rose-50 border-rose-200 text-rose-950"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    {lang === "en" ? "Total Obtained Score" : "कुल प्राप्त अंक"}
                  </div>
                  <div className="text-4xl font-extrabold">
                    {totalScore} / {maxScore}
                  </div>
                  <div className="text-sm font-semibold mt-2">
                    {totalScore >= 24
                      ? (lang === "en" ? "Excellent Match" : "अति उत्तम मिलान")
                      : totalScore >= 18
                      ? (lang === "en" ? "Acceptable Match" : "संतोषजनक एवं शुभ मिलान")
                      : (lang === "en" ? "Below Average Match" : "कम अंक / विवाह अनुकूल नहीं")}
                  </div>
                </div>

                {kootas?.nadi?.has_dosha !== undefined && (
                  <ResultRow
                    label={lang === "en" ? "Nadi Dosha" : "नाड़ी दोष"}
                    value={
                      kootas.nadi.has_dosha ? (
                        <ResultBadge tone="bad">{lang === "en" ? "Present" : "उपस्थित"}</ResultBadge>
                      ) : (
                        <ResultBadge tone="good">{lang === "en" ? "No Dosha" : "दोष नहीं"}</ResultBadge>
                      )
                    }
                  />
                )}
                {kootas?.bhakoot?.has_dosha !== undefined && (
                  <ResultRow
                    label={lang === "en" ? "Bhakoot Dosha" : "भकूट दोष"}
                    value={
                      kootas.bhakoot.has_dosha ? (
                        <ResultBadge tone="bad">{lang === "en" ? "Present" : "उपस्थित"}</ResultBadge>
                      ) : (
                        <ResultBadge tone="good">{lang === "en" ? "No Dosha" : "दोष नहीं"}</ResultBadge>
                      )
                    }
                  />
                )}
              </ResultSection>

              {/* Groom and Bride Astro Profile & Manglik Comparison */}
              {(groomManglik || brideManglik) && (
                <ResultSection title={lang === "en" ? "Manglik Dosha Analysis" : "मांगलिक दोष तुलना"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-md border border-line bg-surface-alt/40">
                      <span className="text-xs font-bold text-ink block">{lang === "en" ? "Groom (वर)" : "वर"}</span>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-ink-soft">{lang === "en" ? "Manglik Status" : "मांगलिक स्थिति"}</span>
                        {groomManglik && (
                          <ResultBadge tone={groomManglik.is_manglik ? (groomManglik.is_cancelled ? "neutral" : "bad") : "good"}>
                            {groomManglik.is_manglik ? (groomManglik.is_cancelled ? (lang === "en" ? "Cancelled" : "परिहार") : (lang === "en" ? "Manglik" : "मांगलिक")) : (lang === "en" ? "No Dosha" : "अमांगलिक")}
                          </ResultBadge>
                        )}
                      </div>
                      {groomManglik?.mars_house && (
                        <div className="mt-1 text-[11px] text-ink-muted">
                          {lang === "en" ? "Mars in House" : "मंगल भाव"}: {groomManglik.mars_house}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-md border border-line bg-surface-alt/40">
                      <span className="text-xs font-bold text-ink block">{lang === "en" ? "Bride (कन्या)" : "कन्या"}</span>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-ink-soft">{lang === "en" ? "Manglik Status" : "मांगलिक स्थिति"}</span>
                        {brideManglik && (
                          <ResultBadge tone={brideManglik.is_manglik ? (brideManglik.is_cancelled ? "neutral" : "bad") : "good"}>
                            {brideManglik.is_manglik ? (brideManglik.is_cancelled ? (lang === "en" ? "Cancelled" : "परिहार") : (lang === "en" ? "Manglik" : "मांगलिक")) : (lang === "en" ? "No Dosha" : "अमांगलिक")}
                          </ResultBadge>
                        )}
                      </div>
                      {brideManglik?.mars_house && (
                        <div className="mt-1 text-[11px] text-ink-muted">
                          {lang === "en" ? "Mars in House" : "मंगल भाव"}: {brideManglik.mars_house}
                        </div>
                      )}
                    </div>
                  </div>
                </ResultSection>
              )}

              {Array.isArray(gunas) && gunas.length > 0 && (
                <ResultSection title={lang === "en" ? "8 Koot Breakdown" : "8 कूटों का विस्तृत विभाजन"}>
                  <div className="divide-y divide-line/60">
                    {gunas.map((g: ApiData, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-ink">{g.koot || g.name}</div>
                          {g.description && <div className="text-[11px] text-ink-muted">{g.description}</div>}
                        </div>
                        <div className="font-bold font-mono text-sm text-accent">
                          {g.obtained ?? g.score} / {g.max ?? g.total}
                        </div>
                      </div>
                    ))}
                  </div>
                </ResultSection>
              )}
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="kundli-matching"
      category="matching"
      title="36 Guna Ashtakoot Milan"
      hindiTitle="अष्टकूट 36 गुण मिलान"
      description={description}
      icon="💍"
      locale={locale}
      layout="5-7"
      form={formContent}
      results={resultsContent}
    />
  );
}
