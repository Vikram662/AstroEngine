"use client";

import React from "react";
import { Sparkles, ShieldAlert, Loader2 } from "lucide-react";
import type { ApiData } from "@/lib/apiTypes";

interface VastuTabProps {
  vastuPropertyType: string;
  setVastuPropertyType: (t: string) => void;
  vastuPropertyFacing: string;
  setVastuPropertyFacing: (f: string) => void;
  vastuRooms: ApiData[];
  setVastuRooms: (rooms: ApiData[]) => void;
  vastuLoading: boolean;
  vastuEvaluationResult: ApiData;
  onEvaluateVastu: () => void;
  onApplyPreset: (preset: "ideal" | "doshas") => void;
}

export const VastuTab: React.FC<VastuTabProps> = ({
  vastuPropertyType,
  setVastuPropertyType,
  vastuPropertyFacing,
  setVastuPropertyFacing,
  vastuRooms,
  setVastuRooms,
  vastuLoading,
  vastuEvaluationResult,
  onEvaluateVastu,
  onApplyPreset
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden rounded-lg bg-console text-white p-6 sm:p-8 border border-emerald-500/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                16 MahaVastu Zones
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                Pancha Tattva Balance
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                Zero Demolition Cures
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-3 flex items-center gap-2">
              <span>🏛️ वास्तु शास्त्र ऊर्जा विश्लेषक (Vastu Shastra Energy Engine)</span>
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              16 दिशाओं और पंचतत्वों (जल, वायु, अग्नि, पृथ्वी, आकाश) के आधार पर घर/दुकान का वास्तु विश्लेषण करें और बिना तोड़-फोड़ के धातु पट्टी (Metal Strips), रंग व पिरामिड उपचार प्राप्त करें।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <button
              onClick={() => onApplyPreset("ideal")}
              className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-emerald-600/30"
            >
              <span>🏡 आदर्श वैदिक घर (Ideal)</span>
            </button>
            <button
              onClick={() => onApplyPreset("doshas")}
              className="px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-ink font-semibold text-xs transition flex items-center justify-center gap-2 shadow-amber-500/30"
            >
              <span>⚠️ दोष युक्त फ्लैट (Doshas Demo)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white p-5 rounded-lg border border-line shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-line">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block mb-1">
              संपत्ति का प्रकार (Property Type)
            </label>
            <select
              value={vastuPropertyType}
              onChange={(e) => setVastuPropertyType(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-md border border-line bg-surface text-ink outline-hidden"
            >
              <option value="residential">आवासीय घर / फ्लैट (Residential)</option>
              <option value="commercial">दुकान / कार्यालय (Commercial)</option>
              <option value="industrial">कारखाना / फैक्ट्री (Industrial)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block mb-1">
              मुख्य प्रवेश द्वार का मुख (Main Facing Direction)
            </label>
            <select
              value={vastuPropertyFacing}
              onChange={(e) => setVastuPropertyFacing(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-md border border-line bg-surface text-ink outline-hidden"
            >
              <option value="North">North (उत्तर)</option>
              <option value="East">East (पूर्व)</option>
              <option value="South">South (दक्षिण)</option>
              <option value="West">West (पश्चिम)</option>
              <option value="North-East">North-East (ईशान)</option>
              <option value="South-East">South-East (आग्नेय)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onEvaluateVastu}
              disabled={vastuLoading}
              className="w-full py-2.5 px-4 rounded-md bg-console hover:bg-console-line text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {vastuLoading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
              <span>वास्तु ऊर्जा मूल्यांकन करें</span>
            </button>
          </div>
        </div>

        {/* Room List Configuration */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              कमरों और स्थानों की स्थिति (Room Placements in 16 Zones)
            </h4>
            <span className="text-xs text-ink-soft font-medium">कुल {vastuRooms.length} स्थान कॉन्फ़िगर किए गए</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vastuRooms.map((room, idx) => (
              <div key={idx} className="p-3 rounded-md bg-surface border border-line flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                    {room.room_type.replace("_", " ")}
                  </span>
                  <div className="text-xs font-bold text-ink">
                    {room.room_type === "pooja_mandir" && "पूजा घर (Mandir)"}
                    {room.room_type === "kitchen" && "रसोई घर (Kitchen)"}
                    {room.room_type === "master_bedroom" && "मास्टर बेडरूम"}
                    {room.room_type === "toilet" && "शौचालय (Toilet)"}
                    {room.room_type === "locker" && "तिजोरी / कैश लॉकर"}
                    {room.room_type === "living_room" && "ड्राइंग रूम / बैठक"}
                  </div>
                </div>

                <select
                  value={room.zone}
                  onChange={(e) => {
                    const updated = [...vastuRooms];
                    updated[idx].zone = e.target.value;
                    setVastuRooms(updated);
                  }}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-line bg-white text-emerald-800 outline-hidden"
                >
                  {["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"].map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluation Dashboard */}
      {vastuEvaluationResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-line p-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="text-center md:border-r md:border-line pr-4">
                <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">समग्र वास्तु स्कोर</span>
                <div className="text-4xl font-semibold text-ink mt-1 flex items-center justify-center gap-1">
                  <span>{vastuEvaluationResult.overall_score_percent}%</span>
                  <span className={`text-base font-semibold px-2 py-0.5 rounded-lg ${
                    vastuEvaluationResult.grade === "A+" ? "bg-emerald-100 text-emerald-800" :
                    vastuEvaluationResult.grade === "B+" ? "bg-accent-soft text-accent-hover" :
                    vastuEvaluationResult.grade === "C" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {vastuEvaluationResult.grade}
                  </span>
                </div>
                <div className="text-xs font-bold text-ink mt-1">
                  {vastuEvaluationResult.overall_status_hi}
                </div>
              </div>

              <div className="md:col-span-3 space-y-3">
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="p-3 rounded-md bg-surface border border-line flex-1 min-w-[140px]">
                    <span className="text-ink-soft block text-[10px] uppercase font-bold">जांचे गए कमरे</span>
                    <span className="text-sm font-semibold text-ink">{vastuEvaluationResult.total_rooms_evaluated} स्थान</span>
                  </div>
                  <div className="p-3 rounded-md bg-surface border border-line flex-1 min-w-[140px]">
                    <span className="text-ink-soft block text-[10px] uppercase font-bold">पहचाने गए दोष</span>
                    <span className={`text-sm font-semibold ${vastuEvaluationResult.total_doshas_identified > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {vastuEvaluationResult.total_doshas_identified} दोष
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-surface border border-line flex-1 min-w-[140px]">
                    <span className="text-ink-soft block text-[10px] uppercase font-bold">उपचार उपाय</span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {vastuEvaluationResult.non_demolition_remedies?.length || 0} बिना तोड़-फोड़ उपाय
                    </span>
                  </div>
                </div>

                {vastuEvaluationResult.critical_doshas?.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-md p-3.5 space-y-1.5">
                    <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>गंभीर वास्तु दोष चेतावनी:</span>
                    </span>
                    {vastuEvaluationResult.critical_doshas.map((d: ApiData, i: number) => (
                      <p key={i} className="text-xs text-rose-900 font-medium">
                        • <strong>{d.room.toUpperCase()}</strong> ({d.zone}): {d.desc}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Room by Room Score Breakdown */}
          <div>
            <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-2">
              <span>📐 कमरा-वार वास्तु ऊर्जा विश्लेषण (Room Placements Breakdown)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vastuEvaluationResult.evaluated_rooms?.map((rm: ApiData, idx: number) => (
                <div key={idx} className="bg-white rounded-lg border border-line p-4 shadow-2xs hover:shadow-xs transition space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink capitalize">
                      {rm.room_type.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rm.score >= 80 ? "bg-emerald-100 text-emerald-800" :
                      rm.score >= 60 ? "bg-accent-soft text-accent-hover" :
                      rm.score >= 40 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {rm.score}/100
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-soft font-medium bg-surface p-2 rounded-lg">
                    <span>दिशा: <strong>{rm.zone}</strong></span>
                    <span>तत्व: <strong>{rm.element_hi}</strong></span>
                  </div>

                  <div className="text-xs font-semibold text-ink">
                    स्थिति: <span className="font-bold text-accent-hover">{rm.verdict_hi}</span>
                  </div>

                  {rm.suggested_cures?.length > 0 && (
                    <div className="bg-emerald-50/80 rounded-md p-2.5 border border-emerald-200/80 space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-emerald-800 block">
                        🛠️ प्रस्तावित वैदिक / वैज्ञानिक उपाय:
                      </span>
                      {rm.suggested_cures.map((cure: ApiData, ci: number) => (
                        <p key={ci} className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                          {cure.action_hi || cure.action}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
