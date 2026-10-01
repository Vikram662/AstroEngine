"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { ResultSection, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

const STRINGS = {
  hi: {
    error: "रत्न परामर्श गणना विफल रही।",
    calculating: "कुंडली अनुसार शुभ रत्न जांचे जा रहे हैं...",
    submit: "अनुकूल रत्न जानें",
    emptyHint: "लग्न, पंचम व नवम भाव के त्रिकोण स्वामियों के आधार पर जीवन, भाग्य व कारक रत्न प्राप्त करें।",
    loadingHint: "त्रिकोण, मारक एवं बाधक भाव नियमों की जांच जारी है...",
    lifeStoneLabel: "जीवन रत्न (Life Stone)",
    lifeStoneSub: "लग्नेश हेतु",
    luckyStoneLabel: "शुभ रत्न (Lucky Stone)",
    luckyStoneSub: "पंचमेश हेतु",
    fortuneStoneLabel: "भाग्य रत्न (Fortune Stone)",
    fortuneStoneSub: "नवमेश हेतु",
    avoidTitle: "वर्जित रत्न (Strictly Avoid)",
    marakaLabel: "मारक ग्रह वर्जना (Maraka Lords):",
    wearingTitle: "धारण विधि व सावधानियां",
    wearingBody: "रत्न हमेशा शुक्ल पक्ष के शुभ वार एवं नक्षत्र में, प्राण-प्रतिष्ठा व संबंधित ग्रह के बीज मंत्रों के 108 जप के उपरांत ही धारण करें। खंडित या दोषयुक्त रत्न धारण न करें।",
  },
  en: {
    error: "Gemstone recommendation calculation failed.",
    calculating: "Checking auspicious gemstones from your chart...",
    submit: "Get Recommended Gemstones",
    emptyHint: "Get your Life, Lucky, and Fortune gemstones based on the Lagna, 5th, and 9th house trikona lords.",
    loadingHint: "Checking Trikona, Maraka, and Badhak house rules...",
    lifeStoneLabel: "Life Stone",
    lifeStoneSub: "For the Lagna Lord",
    luckyStoneLabel: "Lucky Stone",
    luckyStoneSub: "For the 5th Lord",
    fortuneStoneLabel: "Fortune Stone",
    fortuneStoneSub: "For the 9th Lord",
    avoidTitle: "Strictly Avoid",
    marakaLabel: "Maraka Lord Restrictions:",
    wearingTitle: "How to Wear It",
    wearingBody: "Always wear a gemstone during the waxing moon (Shukla Paksha) on an auspicious day and nakshatra, after consecration (Prana Pratishtha) and 108 chants of the relevant planet's Beej Mantra. Never wear a cracked or flawed gemstone.",
  },
} as const;

export default function GemstoneSuggestionClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiData>(null);
  const [restrictionsData, setRestrictionsData] = useState<ApiData>(null);
  const [yantraData, setYantraData] = useState<ApiData>(null);
  const [mantrasData, setMantrasData] = useState<ApiData>(null);
  const [fastingData, setFastingData] = useState<ApiData>(null);

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
      const [gems, restr, yantra, mantras, fasting] = await fetchParallelSettled([
        axios.post("/api/proxy", { endpoint: "/api/v1/remedies/gemstones", payload, method: "POST" }),
        axios.post("/api/proxy", { endpoint: "/api/v1/remedies/gemstones/restrictions", payload, method: "POST" }),
        axios.post("/api/proxy", { endpoint: "/api/v1/remedies/yantras", payload, method: "POST" }),
        axios.post("/api/proxy", { endpoint: "/api/v1/remedies/mantras", payload, method: "POST" }),
        axios.post("/api/proxy", { endpoint: "/api/v1/remedies/fasting", payload, method: "POST" }),
      ]);

      if (!gems) throw new Error(s.error);
      setData(gems);
      if (restr) setRestrictionsData(restr);
      if (yantra) setYantraData(yantra);
      if (mantras) setMantrasData(mantras);
      if (fasting) setFastingData(fasting);
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const lifeStone = data?.life_stone || data?.lifeStone;
  const luckyStone = data?.lucky_stone || data?.luckyStone;
  const bhagyaStone = data?.benefic_stone || data?.bhagya_stone || data?.fortune_stone;
  const prohibitions = restrictionsData?.prohibitions || [];
  const primaryYantra = yantraData?.primary_planetary_yantra;
  const abundanceYantra = yantraData?.cosmic_abundance_yantra;
  const weeklyVrat = fastingData?.recommended_weekly_vrat;
  const universalVrat = fastingData?.universal_vrat;
  const mantrasMap = mantrasData?.mantras || {};

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
          <div className="text-4xl mb-3">💎</div>
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
              {/* Primary 3 Gemstones Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lifeStone && (
                  <div className="p-5 bg-card rounded-lg border-2 border-accent/30 shadow-sm relative overflow-hidden">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-accent mb-1">{lifeStone.type || s.lifeStoneLabel}</div>
                    <div className="text-xl font-extrabold text-ink mb-1">{lifeStone.gemstone || lifeStone.name}</div>
                    <div className="text-xs font-semibold text-accent/80 mb-3">{lifeStone.planet || s.lifeStoneSub}</div>
                    
                    <div className="space-y-1.5 text-[11px] pt-3 border-t border-line text-ink-soft">
                      <div className="flex justify-between">
                        <span className="text-ink-muted">धातु / Metal:</span>
                        <span className="font-semibold text-ink">{lifeStone.metal || "Gold"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">अंगुली / Finger:</span>
                        <span className="font-semibold text-ink">{lifeStone.wearing_finger || "Ring Finger"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">दिन / Day:</span>
                        <span className="font-semibold text-ink">{lifeStone.auspicious_day || "Sunday"}</span>
                      </div>
                    </div>
                  </div>
                )}
                {luckyStone && (
                  <div className="p-5 bg-card rounded-lg border-2 border-emerald-500/30 shadow-sm relative overflow-hidden">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 mb-1">{luckyStone.type || s.luckyStoneLabel}</div>
                    <div className="text-xl font-extrabold text-ink mb-1">{luckyStone.gemstone || luckyStone.name}</div>
                    <div className="text-xs font-semibold text-emerald-600/80 mb-3">{luckyStone.planet || s.luckyStoneSub}</div>
                    
                    <div className="space-y-1.5 text-[11px] pt-3 border-t border-line text-ink-soft">
                      <div className="flex justify-between">
                        <span className="text-ink-muted">धातु / Metal:</span>
                        <span className="font-semibold text-ink">{luckyStone.metal || "Gold"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">अंगुली / Finger:</span>
                        <span className="font-semibold text-ink">{luckyStone.wearing_finger || "Little Finger"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">दिन / Day:</span>
                        <span className="font-semibold text-ink">{luckyStone.auspicious_day || "Wednesday"}</span>
                      </div>
                    </div>
                  </div>
                )}
                {bhagyaStone && (
                  <div className="p-5 bg-card rounded-lg border-2 border-amber-500/30 shadow-sm relative overflow-hidden">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600 mb-1">{bhagyaStone.type || s.fortuneStoneLabel}</div>
                    <div className="text-xl font-extrabold text-ink mb-1">{bhagyaStone.gemstone || bhagyaStone.name}</div>
                    <div className="text-xs font-semibold text-amber-600/80 mb-3">{bhagyaStone.planet || s.fortuneStoneSub}</div>
                    
                    <div className="space-y-1.5 text-[11px] pt-3 border-t border-line text-ink-soft">
                      <div className="flex justify-between">
                        <span className="text-ink-muted">धातु / Metal:</span>
                        <span className="font-semibold text-ink">{bhagyaStone.metal || "Gold"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">अंगुली / Finger:</span>
                        <span className="font-semibold text-ink">{bhagyaStone.wearing_finger || "Index Finger"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">दिन / Day:</span>
                        <span className="font-semibold text-ink">{bhagyaStone.auspicious_day || "Thursday"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Prohibited Gemstones & Maraka/Badhaka Conflict Table */}
              {prohibitions.length > 0 && (
                <ResultSection title={lang === "hi" ? "वर्जित रत्न एवं त्रिक/मारक दोष (Prohibited Stones)" : "Strictly Prohibited Gemstones & Dusthana Conflicts"}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt text-ink-soft">
                        <tr>
                          <th className="py-2.5 px-3">ग्रह / Planet</th>
                          <th className="py-2.5 px-3">वर्जित रत्न / Stone</th>
                          <th className="py-2.5 px-3">तीव्रता / Severity</th>
                          <th className="py-2.5 px-3">शास्त्रीय कारण / Vedic Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {prohibitions.map((p: ApiData, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2 px-3 font-semibold text-ink">{p.planet}</td>
                            <td className="py-2 px-3 font-medium text-rose-700">{p.gemstone}</td>
                            <td className="py-2 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.severity === "STRICTLY_PROHIBITED" ? "bg-rose-100 text-rose-900 border border-rose-300" : "bg-amber-100 text-amber-900 border border-amber-300"
                              }`}>
                                {p.severity}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-ink-soft text-[11px]">
                              {(p.conflict_reasons || []).join("; ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ResultSection>
              )}

              {/* Consecration & Beej Mantras */}
              {mantrasMap && lifeStone?.planet_id && (
                <ResultSection title={lang === "hi" ? "रत्न प्राण प्रतिष्ठा एवं बीज मंत्र (Consecration Mantras)" : "Gemstone Consecration & Vedic Beej Mantras"}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(mantrasMap).filter(([k]) => [lifeStone?.planet_id, luckyStone?.planet_id, bhagyaStone?.planet_id].includes(k)).map(([planet, mObj]: [string, ApiData]) => (
                      <div key={planet} className="p-3.5 bg-surface-alt/70 border border-line rounded-md">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-ink">{planet} Mantra</span>
                          <span className="text-[10px] font-mono-brand bg-accent/10 text-accent px-2 py-0.5 rounded">{mObj.recitations?.toLocaleString()} Chants</span>
                        </div>
                        <div className="font-mono text-xs font-bold text-accent mb-1">{mObj.beej_mantra}</div>
                        <div className="text-[11px] text-ink-soft">{mObj.mantra}</div>
                      </div>
                    ))}
                  </div>
                </ResultSection>
              )}

              {/* Deity Yantra Guidance */}
              {(primaryYantra || abundanceYantra) && (
                <ResultSection title={lang === "hi" ? "अनुशंसित सिद्ध यंत्र (Sacred Vedic Yantras)" : "Recommended Sacred Geometric Yantras"}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {primaryYantra && (
                      <div className="p-4 bg-card border border-line rounded-md shadow-xs">
                        <div className="text-xs font-bold text-accent uppercase mb-1">लग्न सुरक्षा यंत्र / Primary Yantra</div>
                        <div className="text-base font-extrabold text-ink mb-1">{primaryYantra.name}</div>
                        <p className="text-xs text-ink-soft mb-2">{primaryYantra.purpose}</p>
                        <div className="text-[11px] text-ink-muted">
                          <span className="font-semibold text-ink">धातु:</span> {primaryYantra.metal} • <span className="font-semibold text-ink">मंत्र:</span> {primaryYantra.mantra}
                        </div>
                      </div>
                    )}
                    {abundanceYantra && (
                      <div className="p-4 bg-card border border-line rounded-md shadow-xs">
                        <div className="text-xs font-bold text-amber-600 uppercase mb-1">वैभव व समृद्धि यंत्र / Abundance Yantra</div>
                        <div className="text-base font-extrabold text-ink mb-1">{abundanceYantra.name}</div>
                        <p className="text-xs text-ink-soft mb-2">{abundanceYantra.purpose}</p>
                        <div className="text-[11px] text-ink-muted">
                          <span className="font-semibold text-ink">धातु:</span> {abundanceYantra.metal} • <span className="font-semibold text-ink">मंत्र:</span> {abundanceYantra.mantra}
                        </div>
                      </div>
                    )}
                  </div>
                  {yantraData?.installation_guide && (
                    <div className="mt-3 p-3 bg-surface-alt/60 rounded-md text-xs text-ink-soft leading-relaxed border border-line/60">
                      <span className="font-bold text-ink">स्थापना विधि:</span> {yantraData.installation_guide}
                    </div>
                  )}
                </ResultSection>
              )}

              {/* Fasting & Planetary Vrat */}
              {(weeklyVrat || universalVrat) && (
                <ResultSection title={lang === "hi" ? "साप्ताहिक व्रत एवं उपवास नियम (Vrat & Fasting Discipline)" : "Astrological Fasting & Vrat Rules"}>
                  <div className="space-y-3">
                    {weeklyVrat && (
                      <div className="p-4 bg-card border border-line rounded-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-ink">जन्मानुसार साप्ताहिक व्रत ({fastingData?.janma_vaar})</span>
                          <span className="text-[11px] font-semibold text-accent">{weeklyVrat.deity}</span>
                        </div>
                        <p className="text-xs text-ink-soft mb-2">{weeklyVrat.benefits}</p>
                        <div className="text-[11px] p-2 bg-surface-alt rounded-lg text-ink-soft">
                          <span className="font-bold text-ink">नियम:</span> {weeklyVrat.rules}
                        </div>
                      </div>
                    )}
                    {universalVrat && (
                      <div className="p-4 bg-card border border-line rounded-md">
                        <div className="text-xs font-bold text-ink mb-1">{universalVrat.vrat_type}</div>
                        <p className="text-xs text-ink-soft mb-2">{universalVrat.significance}</p>
                        <div className="text-[11px] p-2 bg-surface-alt rounded-lg text-ink-soft">
                          <span className="font-bold text-ink">नियम:</span> {universalVrat.rules}
                        </div>
                      </div>
                    )}
                  </div>
                </ResultSection>
              )}

              <ResultSection title={s.wearingTitle}>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {s.wearingBody}
                </p>
              </ResultSection>
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="gemstone-suggestion"
      category="remedies"
      title="Lucky Gemstone Recommender"
      hindiTitle="रत्न एवं वैदिक उपाय (Gemstones & Remedial Systems)"
      description={locale === "en" ? "Precise gemstone matches, with Maraka/Badhaka conflict rules, Yantra consecration, Beej Mantras, and weekly Vrat." : "मारक व बाधक भावों की वर्जनाओं के साथ शुभ रत्न, यंत्र प्रतिष्ठा, बीज मंत्र एवं व्रत विधि की विस्तृत जानकारी।"}
      icon="💎"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
