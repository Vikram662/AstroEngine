"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Home, Compass, Plus, Trash2, Loader2 } from "lucide-react";

interface VastuRoom {
  room_type: string;
  zone: string;
  color?: string;
}

const DEFAULT_ROOMS: VastuRoom[] = [
  { room_type: "pooja_mandir", zone: "NE", color: "White" },
  { room_type: "kitchen", zone: "SE", color: "Orange" },
  { room_type: "master_bedroom", zone: "SW", color: "Cream" },
  { room_type: "toilet", zone: "SSW", color: "Yellow" },
  { room_type: "living_room", zone: "E", color: "White" },
];

export default function VastuShastraPage() {
  const [propertyType, setPropertyType] = useState("residential");
  const [facing, setFacing] = useState("East");
  const [rooms, setRooms] = useState<VastuRoom[]>(DEFAULT_ROOMS);
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleAddRoom = () => {
    setRooms([...rooms, { room_type: "bedroom", zone: "N", color: "White" }]);
  };

  const handleRemoveRoom = (idx: number) => {
    setRooms(rooms.filter((_, i) => i !== idx));
  };

  const handleUpdateRoom = (idx: number, field: keyof VastuRoom, val: string) => {
    const next = [...rooms];
    next[idx] = { ...next[idx], [field]: val };
    setRooms(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      property_type: propertyType,
      facing_direction: facing,
      rooms,
      lang,
    };

    try {
      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/vastu/evaluate",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "वास्तु मूल्यांकन विफल रहा।");
    } finally {
      setLoading(false);
    }
  };

  const score = data?.vastu_score ?? data?.score ?? 85;
  const roomEvaluations = data?.room_evaluations || data?.evaluations || [];

  return (
    <CalculatorPageShell
      slug="vastu-shastra"
      category="vastu"
      title="Vastu Shastra Evaluator"
      hindiTitle="16-जोन वास्तु विश्लेषण"
      description="भवन दिशा एवं कमरों की स्थिति अनुसार 16 वास्तु ज़ोन का संपूर्ण मूल्यांकन।"
      icon="🏠"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prop_type" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-accent" />
                  <span>भवन प्रकार (Property)</span>
                </label>
                <select
                  id="prop_type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                >
                  <option value="residential">आवासीय (Residential)</option>
                  <option value="commercial">व्यावसायिक (Commercial)</option>
                  <option value="industrial">औद्योगिक (Industrial)</option>
                </select>
              </div>

              <div>
                <label htmlFor="prop_facing" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-accent" />
                  <span>मुख्य द्वार दिशा (Facing)</span>
                </label>
                <select
                  id="prop_facing"
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                >
                  <option value="North">उत्तर (North)</option>
                  <option value="East">पूर्व (East)</option>
                  <option value="South">दक्षिण (South)</option>
                  <option value="West">पश्चिम (West)</option>
                  <option value="NE">ईशान (North-East)</option>
                  <option value="SE">आग्नेय (South-East)</option>
                  <option value="SW">नैऋत्य (South-West)</option>
                  <option value="NW">वायव्य (North-West)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-soft">कमरों की सूची (Room Mapping)</span>
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> कमरा जोड़ें
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {rooms.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface border border-line text-xs">
                    <select
                      value={r.room_type}
                      onChange={(e) => handleUpdateRoom(idx, "room_type", e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-line bg-card text-ink"
                    >
                      <option value="pooja_mandir">पूजा घर (Pooja)</option>
                      <option value="kitchen">रसोई (Kitchen)</option>
                      <option value="master_bedroom">मास्टर बेडरूम</option>
                      <option value="toilet">शौचालय (Toilet)</option>
                      <option value="living_room">ड्राइंग रूम (Living)</option>
                      <option value="locker">तिजोरी (Locker)</option>
                    </select>

                    <select
                      value={r.zone}
                      onChange={(e) => handleUpdateRoom(idx, "zone", e.target.value)}
                      className="w-24 px-2 py-1.5 rounded-lg border border-line bg-card text-ink font-semibold"
                    >
                      <option value="N">North (N)</option>
                      <option value="NE">North-East (NE)</option>
                      <option value="E">East (E)</option>
                      <option value="SE">South-East (SE)</option>
                      <option value="S">South (S)</option>
                      <option value="SSW">South-South-West</option>
                      <option value="SW">South-West (SW)</option>
                      <option value="W">West (W)</option>
                      <option value="NW">North-West (NW)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(idx)}
                      className="text-ink-muted hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 16 वास्तु ज़ोन का विश्लेषण जारी...
                </>
              ) : (
                "वास्तु स्कोर जांचें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-sm">मुख्य द्वार दिशा व कमरों की ज़ोन मैपिंग दर्ज करें और 100 में से वैदिक वास्तु स्कोर प्राप्त करें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">पंचतत्व संतुलन (अग्नि, जल, वायु, पृथ्वी, आकाश) का विश्लेषण जारी है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="वास्तु मूल्यांकन स्कोर">
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    score >= 70
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : score >= 50
                      ? "bg-amber-50 border-amber-200 text-amber-950"
                      : "bg-rose-50 border-rose-200 text-rose-950"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    समग्र वास्तु स्कोर (Vastu Score)
                  </div>
                  <div className="text-4xl font-extrabold">{score} / 100</div>
                  <div className="text-sm font-semibold mt-2">
                    {data.grade || (score >= 75 ? "अत्यंत शुभ एवं ऊर्जावान भवन (Excellent)" : "मध्यम / कुछ कमरों में दोष सुधार आवश्यक")}
                  </div>
                </div>
              </ResultSection>

              {Array.isArray(roomEvaluations) && roomEvaluations.length > 0 && (
                <ResultSection title="कमरा-वार वास्तु रिपोर्ट">
                  <div className="divide-y divide-line/60">
                    {roomEvaluations.map((re: any, idx: number) => {
                      const isFavorable = re.is_favorable || re.status === "good";
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-ink">{re.room || re.room_type} ({re.zone})</div>
                            {re.remark && <div className="text-[11px] text-ink-muted">{re.remark}</div>}
                          </div>
                          <ResultBadge tone={isFavorable ? "good" : "bad"}>
                            {isFavorable ? "अनुकूल" : "दोषपूर्ण"}
                          </ResultBadge>
                        </div>
                      );
                    })}
                  </div>
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
