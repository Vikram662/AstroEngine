"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

const STRINGS = {
  hi: {
    error: "पितृ दोष गणना विफल रही।",
    calculating: "नवम भाव व सूर्य स्थिति जांची जा रही है...",
    submit: "पितृ दोष विश्लेषण करें",
    emptyHint: "नवम भाव (धर्म/पितृ भाव), सूर्य एवं राहु-केतु युति जनित दोष का परीक्षण करें।",
    loadingHint: "सूर्य, नवमेश एवं पूर्वज ऋण योगों की गणना हो रही है...",
    resultTitle: "पितृ दोष निष्कर्ष",
    verdictLabel: "विश्लेषण परिणाम",
    present: "पितृ दोष के संकेत उपस्थित हैं",
    absent: "पितृ दोष नहीं है (शुभ)",
    severityLabel: "तीव्रता:",
    statusLabel: "दोष स्थिति",
    active: "सक्रिय",
    doshaFree: "दोष मुक्त",
    affectedHousesLabel: "संबंधित भाव",
    factorsTitle: "दोष कारक ग्रह योग",
    remediesTitle: "पितृ शांति एवं तर्पण उपाय",
  },
  en: {
    error: "Pitra Dosha calculation failed.",
    calculating: "Checking the 9th house and Sun's placement...",
    submit: "Analyze Pitra Dosha",
    emptyHint: "Check for dosha arising from the 9th house (Dharma/ancestor house), Sun, and Rahu-Ketu conjunctions.",
    loadingHint: "Calculating Sun, 9th lord, and ancestral debt yogas...",
    resultTitle: "Pitra Dosha Result",
    verdictLabel: "Analysis Result",
    present: "Indicators of Pitra Dosha are present",
    absent: "No Pitra Dosha (Auspicious)",
    severityLabel: "Severity:",
    statusLabel: "Dosha Status",
    active: "Active",
    doshaFree: "Dosha-free",
    affectedHousesLabel: "Affected Houses",
    factorsTitle: "Contributing Planetary Yogas",
    remediesTitle: "Pitra Shanti & Tarpan Remedies",
  },
} as const;

export default function PitraDoshaClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiData>(null);
  const [mantraData, setMantraData] = useState<ApiData>(null);

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
      const [pitra, mantras] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dosha-matching/pitra-dosha",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/remedies/mantras",
          payload,
          method: "POST",
        }),
      ]);

      if (!pitra) throw new Error(s.error);
      setData(pitra);
      if (mantras) setMantraData(mantras);
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const isPresent = data?.is_present || data?.has_pitra_dosha || false;
  const sunMantra = mantraData?.mantras?.SUN;

  const formContent = (
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

      <BirthDataFields value={form} onChange={setForm} />

      <SubmitButton loading={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> {s.calculating}
          </>
        ) : (
          s.submit
        )}
      </SubmitButton>
    </form>
  );

  const resultsContent = (
    <>
      {error && <ErrorNote message={error} />}

      {!data && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
          <div className="text-4xl mb-3">☀️</div>
          <p className="text-sm">{s.emptyHint}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-sm">{s.loadingHint}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
              <ResultSection title={s.resultTitle}>
                <div
                  className={`p-6 rounded-md border text-center mb-4 ${
                    isPresent
                      ? "bg-rose-50 border-rose-200 text-rose-950"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    {s.verdictLabel}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {isPresent ? s.present : s.absent}
                  </div>
                  {data.severity && (
                    <div className="text-xs mt-2 text-ink-muted font-medium">{s.severityLabel} {data.severity}</div>
                  )}
                </div>

                <ResultRow
                  label={s.statusLabel}
                  value={
                    isPresent ? (
                      <ResultBadge tone="bad">{s.active}</ResultBadge>
                    ) : (
                      <ResultBadge tone="good">{s.doshaFree}</ResultBadge>
                    )
                  }
                  accent
                />
              </ResultSection>

              {(data.reasons || data.factors) && (data.reasons || data.factors).length > 0 && (
                <ResultSection title={s.factorsTitle}>
                  <ul className="space-y-2 text-xs">
                    {(data.reasons || data.factors).map((f: ApiData, idx: number) => (
                      <li key={idx} className="p-3 bg-surface-alt rounded-lg border border-line text-ink">
                        {typeof f === "string" ? f : f.description || f.rule}
                      </li>
                    ))}
                  </ul>
                </ResultSection>
              )}

              {/* Surya Beej Mantra */}
              {sunMantra && (
                <ResultSection title={lang === "hi" ? "सूर्य एवं पूर्वज तृप्ति बीज मंत्र" : "Surya Beej Mantra & Ancestral Peace"}>
                  <div className="p-4 bg-surface-alt/70 border border-line rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">Surya Vedic Mantra</span>
                      <span className="text-[10px] font-mono-brand bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">
                        {sunMantra.recitations?.toLocaleString()} जप
                      </span>
                    </div>
                    <div className="text-sm font-bold text-accent font-mono">{sunMantra.beej_mantra}</div>
                    <div className="text-xs text-ink-soft">{sunMantra.mantra}</div>
                  </div>
                </ResultSection>
              )}

              {/* Dynamic backend description if returned */}
              {data.description && (
                <ResultSection title={lang === "hi" ? "दोष प्रभाव एवं विश्लेषण" : "Dosha Effects & Analysis"}>
                  <p className="text-xs text-ink-soft leading-relaxed">{data.description}</p>
                </ResultSection>
              )}

              {/* Remedies: Dynamic backend remedies prioritized, with bilingual classical remedial guidance */}
              <ResultSection title={s.remediesTitle}>
                {data.remedies && Array.isArray(data.remedies) && data.remedies.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-ink-soft list-disc list-inside">
                    {data.remedies.map((r: ApiData, idx: number) => (
                      <li key={idx}>{typeof r === "string" ? r : r.remedy || r.name || r.description}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-2.5 text-xs text-ink-soft">
                    <div className="p-3 bg-card border border-line rounded-md">
                      <span className="font-bold text-ink block mb-0.5">
                        {lang === "hi" ? "त्रिपिंडी श्राद्ध व नारायण बलि" : "Tripindi Shradh & Narayan Bali"}
                      </span>
                      {lang === "hi"
                        ? "गया (बिहार) अथवा हरिद्वार में पितरों की आत्मिक शांति हेतु नारायण बलि अथवा त्रिपिंडी श्राद्ध कर्म संपन्न कराएं।"
                        : "Perform Narayan Bali or Tripindi Shradh rituals at holy pilgrimage centers like Gaya (Bihar), Haridwar, or Pehowa for ancestral peace."}
                    </div>
                    <div className="p-3 bg-card border border-line rounded-md">
                      <span className="font-bold text-ink block mb-0.5">
                        {lang === "hi" ? "अमावस्या तर्पण एवं पंचबलि भोग" : "Amavasya Tarpan & Panchabali Bhog"}
                      </span>
                      {lang === "hi"
                        ? "प्रत्येक अमावस्या को पीपल के वृक्ष पर जल, कच्चा दूध, काले तिल अर्पित करें तथा कौवे, गाय एवं श्वान को अन्न दें।"
                        : "On every Amavasya (new moon), offer water, unboiled milk, and black sesame seeds to a sacred Peepal tree, and provide food offerings to cows, crows, and dogs."}
                    </div>
                    <div className="p-3 bg-card border border-line rounded-md">
                      <span className="font-bold text-ink block mb-0.5">
                        {lang === "hi" ? "गायत्री मंत्र सूर्योदय अनुष्ठान" : "Gayatri Mantra & Sunrise Arghya"}
                      </span>
                      {lang === "hi"
                        ? "नित्य प्रातःकाल तांबे के लोटे में जल, लाल चंदन, कुमकुम व अक्षत डालकर उगते सूर्य को अर्घ्य दें एवं 108 बार गायत्री मंत्र का जप करें।"
                        : "Offer morning Arghya to the rising Sun with water, red sandalwood, and akshat in a copper vessel, accompanied by 108 recitations of the Gayatri Mantra."}
                    </div>
                  </div>
                )}
              </ResultSection>
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="pitra-dosha"
      category="dosha"
      title="Pitra Dosha Calculator"
      hindiTitle="पितृ दोष एवं तर्पण शांति (Pitra Dosha & Remedies)"
      description={locale === "en" ? "Scripture-based analysis of ancestral debt from the 9th house, Surya-Rahu Grahan yoga, and Gayatri/Amavasya rituals." : "नवम भाव, सूर्य एवं राहु युति जनित पूर्वजों के ऋण का शास्त्रोक्त विश्लेषण, गायत्री मंत्र एवं अमावस्या तर्पण विधि।"}
      icon="☀️"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
