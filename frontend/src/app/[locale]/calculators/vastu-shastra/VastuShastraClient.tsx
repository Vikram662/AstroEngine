"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
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

const STRINGS = {
  hi: {
    error: "वास्तु मूल्यांकन विफल रहा।",
    propertyTypeLabel: "भवन प्रकार (Property)",
    propertyTypes: { residential: "आवासीय (Residential)", commercial: "व्यावसायिक (Commercial)", industrial: "औद्योगिक (Industrial)" },
    facingLabel: "मुख्य द्वार दिशा (Facing)",
    directions: { North: "उत्तर (North)", East: "पूर्व (East)", South: "दक्षिण (South)", West: "पश्चिम (West)", NE: "ईशान (North-East)", SE: "आग्नेय (South-East)", SW: "नैऋत्य (South-West)", NW: "वायव्य (North-West)" },
    roomsLabel: "कमरों की सूची (Room Mapping)",
    addRoom: "कमरा जोड़ें",
    roomTypes: { pooja_mandir: "पूजा घर (Pooja)", kitchen: "रसोई (Kitchen)", master_bedroom: "मास्टर बेडरूम", toilet: "शौचालय (Toilet)", living_room: "ड्राइंग रूम (Living)", locker: "तिजोरी (Locker)" },
    zones: { N: "उत्तर North (N)", NE: "उत्तर-पूर्व North-East (NE)", E: "पूर्व East (E)", SE: "दक्षिण-पूर्व South-East (SE)", S: "दक्षिण South (S)", SSW: "दक्षिण-दक्षिण-पश्चिम", SW: "दक्षिण-पश्चिम South-West (SW)", W: "पश्चिम West (W)", NW: "उत्तर-पश्चिम North-West (NW)" },
    calculating: "16 वास्तु ज़ोन का विश्लेषण जारी...",
    submit: "वास्तु स्कोर जांचें",
    emptyHint: "मुख्य द्वार दिशा व कमरों की ज़ोन मैपिंग दर्ज करें और 100 में से वैदिक वास्तु स्कोर प्राप्त करें।",
    loadingHint: "पंचतत्व संतुलन (अग्नि, जल, वायु, पृथ्वी, आकाश) का विश्लेषण जारी है...",
    scoreTitle: "वास्तु मूल्यांकन स्कोर",
    scoreLabel: "समग्र वास्तु स्कोर (Vastu Score)",
    gradeExcellent: "अत्यंत शुभ एवं ऊर्जावान भवन (Excellent)",
    gradeModerate: "मध्यम / कुछ कमरों में दोष सुधार आवश्यक",
    roomReportTitle: "कमरा-वार वास्तु रिपोर्ट",
    favorable: "अनुकूल",
    faulty: "दोषपूर्ण",
  },
  en: {
    error: "Vastu evaluation failed.",
    propertyTypeLabel: "Property Type",
    propertyTypes: { residential: "Residential", commercial: "Commercial", industrial: "Industrial" },
    facingLabel: "Main Entrance Facing",
    directions: { North: "North", East: "East", South: "South", West: "West", NE: "North-East", SE: "South-East", SW: "South-West", NW: "North-West" },
    roomsLabel: "Room Mapping",
    addRoom: "Add Room",
    roomTypes: { pooja_mandir: "Pooja Room", kitchen: "Kitchen", master_bedroom: "Master Bedroom", toilet: "Toilet", living_room: "Living Room", locker: "Locker / Safe" },
    zones: { N: "North (N)", NE: "North-East (NE)", E: "East (E)", SE: "South-East (SE)", S: "South (S)", SSW: "South-South-West", SW: "South-West (SW)", W: "West (W)", NW: "North-West (NW)" },
    calculating: "Analyzing all 16 Vastu zones...",
    submit: "Check Vastu Score",
    emptyHint: "Enter the main entrance direction and each room's zone mapping to get a Vedic Vastu score out of 100.",
    loadingHint: "Analyzing the balance of the five elements (Fire, Water, Air, Earth, Space)...",
    scoreTitle: "Vastu Evaluation Score",
    scoreLabel: "Overall Vastu Score",
    gradeExcellent: "Highly auspicious and energetically balanced building",
    gradeModerate: "Moderate — some rooms need correction",
    roomReportTitle: "Room-by-Room Vastu Report",
    favorable: "Favorable",
    faulty: "Flawed",
  },
} as const;

export default function VastuShastraClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [propertyType, setPropertyType] = useState("residential");
  const [facing, setFacing] = useState("East");
  const [rooms, setRooms] = useState<VastuRoom[]>(DEFAULT_ROOMS);
  const [lang, setLang] = useState<"hi" | "en">(locale);
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
      const res = await axios.post("/api/proxy", {
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
      setError(err?.response?.data?.message || err?.message || s.error);
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
      description={locale === "en" ? "A full evaluation of all 16 Vastu zones based on your building's direction and room placement." : "भवन दिशा एवं कमरों की स्थिति अनुसार 16 वास्तु ज़ोन का संपूर्ण मूल्यांकन।"}
      icon="🏠"
      locale={locale}
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
                  <span>{s.propertyTypeLabel}</span>
                </label>
                <select
                  id="prop_type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                >
                  <option value="residential">{s.propertyTypes.residential}</option>
                  <option value="commercial">{s.propertyTypes.commercial}</option>
                  <option value="industrial">{s.propertyTypes.industrial}</option>
                </select>
              </div>

              <div>
                <label htmlFor="prop_facing" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-accent" />
                  <span>{s.facingLabel}</span>
                </label>
                <select
                  id="prop_facing"
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                >
                  <option value="North">{s.directions.North}</option>
                  <option value="East">{s.directions.East}</option>
                  <option value="South">{s.directions.South}</option>
                  <option value="West">{s.directions.West}</option>
                  <option value="NE">{s.directions.NE}</option>
                  <option value="SE">{s.directions.SE}</option>
                  <option value="SW">{s.directions.SW}</option>
                  <option value="NW">{s.directions.NW}</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-soft">{s.roomsLabel}</span>
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> {s.addRoom}
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
                      <option value="pooja_mandir">{s.roomTypes.pooja_mandir}</option>
                      <option value="kitchen">{s.roomTypes.kitchen}</option>
                      <option value="master_bedroom">{s.roomTypes.master_bedroom}</option>
                      <option value="toilet">{s.roomTypes.toilet}</option>
                      <option value="living_room">{s.roomTypes.living_room}</option>
                      <option value="locker">{s.roomTypes.locker}</option>
                    </select>

                    <select
                      value={r.zone}
                      onChange={(e) => handleUpdateRoom(idx, "zone", e.target.value)}
                      className="w-24 px-2 py-1.5 rounded-lg border border-line bg-card text-ink font-semibold"
                    >
                      <option value="N">{s.zones.N}</option>
                      <option value="NE">{s.zones.NE}</option>
                      <option value="E">{s.zones.E}</option>
                      <option value="SE">{s.zones.SE}</option>
                      <option value="S">{s.zones.S}</option>
                      <option value="SSW">{s.zones.SSW}</option>
                      <option value="SW">{s.zones.SW}</option>
                      <option value="W">{s.zones.W}</option>
                      <option value="NW">{s.zones.NW}</option>
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
                  <Loader2 className="w-4 h-4 animate-spin" /> {s.calculating}
                </>
              ) : (
                s.submit
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-sm">{s.emptyHint}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">{s.loadingHint}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title={s.scoreTitle}>
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
                    {s.scoreLabel}
                  </div>
                  <div className="text-4xl font-extrabold">{score} / 100</div>
                  <div className="text-sm font-semibold mt-2">
                    {data.grade || (score >= 75 ? s.gradeExcellent : s.gradeModerate)}
                  </div>
                </div>
              </ResultSection>

              {Array.isArray(roomEvaluations) && roomEvaluations.length > 0 && (
                <ResultSection title={s.roomReportTitle}>
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
                            {isFavorable ? s.favorable : s.faulty}
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
