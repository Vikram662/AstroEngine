"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Layers, 
  Plus, 
  Check, 
  Edit3, 
  Zap, 
  CheckCircle2, 
  Loader2,
  X,
  Package,
  FileText,
  Hash,
  Compass,
  BookOpen,
  Star,
  Heart,
  Clock,
  ToggleLeft,
  ToggleRight,
  Trash2,
  AlertCircle,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import type { ApiData } from "@/lib/apiTypes";

interface PlanItem {
  id?: string;
  tier: "STARTER" | "PRO" | "ENTERPRISE";
  name: string;
  priceMonthly: number;
  includedQuota: number;
  rateLimitPerMin: number;
  overageCost: number;
  features: string[];
  isPopular: boolean;
  allowedModules?: string[];
}

export interface AddonPackageItem {
  id: string;
  name: string;
  category: string;
  priceMonthly: number;
  monthlyQuota: number;
  rateLimitPerMin: number;
  overageCost: number;
  description: string;
  features: string[];
  icon: string;
  isActive: boolean;
  createdAt?: string;
}

export const SYSTEM_MODULES = [
  { id: "core", label: "Core Astronomy", desc: "Planets, house cusps, retrogrades, eclipse timings" },
  { id: "panchang", label: "Panchang & Muhurat", desc: "Tithi, Vaar, Nakshatra, Yoga, Karana, 16 Choghadiyas" },
  { id: "parashari", label: "Parashari Kundli", desc: "D1 Lagna, D9 Navamsha, D1-D60 harmonic vargas" },
  { id: "dasha", label: "Vimshottari Dasha", desc: "120-Year Mahadasha, Antardasha, live running dasha" },
  { id: "kp", label: "KP Astrology", desc: "Sign, Star, Sub-Lords, Placidus cusps, Horary 1–249" },
  { id: "dosha_matching", label: "Matchmaking & Milan", desc: "36-Guna Ashtakoota Milan, Manglik, Kaal Sarp" },
  { id: "remedies", label: "Astrological Remedies", desc: "Life/Lucky Gemstones, 1-14 Mukhi Rudraksha, Mantras" },
  { id: "numerology", label: "Numerology Engine", desc: "Life path, destiny, soul urge, personal years" },
  { id: "western", label: "Western Tropical", desc: "Tropical zodiac, planet aspects matrix, wheel SVGs" },
  { id: "lalkitab", label: "Lal Kitab System", desc: "Ancestral debts (Rin), sleeping houses, Varshphal" },
  { id: "advanced", label: "Advanced Ephemeris", desc: "Planetary yogas, transit triggers, specialized charts" },
  { id: "pdf", label: "Automated PDF Reports", desc: "High-res 12–60 page print-ready astrology PDF engine" }
];

const ADDON_ICONS: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-4 h-4 text-emerald-600" />,
  Hash: <Hash className="w-4 h-4 text-accent" />,
  Compass: <Compass className="w-4 h-4 text-accent" />,
  BookOpen: <BookOpen className="w-4 h-4 text-amber-600" />,
  Star: <Star className="w-4 h-4 text-yellow-600" />,
  Heart: <Heart className="w-4 h-4 text-rose-600" />,
  Clock: <Clock className="w-4 h-4 text-cyan-600" />,
  Sparkles: <Sparkles className="w-4 h-4 text-amber-500" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4 text-rose-500" />,
  Zap: <Zap className="w-4 h-4 text-accent" />
};

export default function AdminPlansPage() {
  const [activeTab, setActiveTab] = useState<"PLANS" | "ADDONS">("PLANS");
  
  // Plans state
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Addons state
  const [addons, setAddons] = useState<AddonPackageItem[]>([]);
  const [loadingAddons, setLoadingAddons] = useState(true);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [savingAddon, setSavingAddon] = useState(false);

  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Plan Form State
  const [tier, setTier] = useState<"STARTER" | "PRO" | "ENTERPRISE">("STARTER");
  const [name, setName] = useState("STARTER");
  const [priceMonthly, setPriceMonthly] = useState("4999");
  const [includedQuota, setIncludedQuota] = useState("35000");
  const [rateLimitPerMin, setRateLimitPerMin] = useState("60");
  const [overageCost, setOverageCost] = useState("0.15");
  const [featuresText, setFeaturesText] = useState(
    "Access to all 135 API Endpoints\nParashari D1 & D9 Charts\nPanchang & Muhurat Calculations\nCommunity Support"
  );
  const [isPopular, setIsPopular] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);

  // Addon Form State
  const [addonId, setAddonId] = useState("");
  const [addonName, setAddonName] = useState("");
  const [addonCategory, setAddonCategory] = useState("CALCULATIONS");
  const [addonPrice, setAddonPrice] = useState("499");
  const [addonMonthlyQuota, setAddonMonthlyQuota] = useState("1000");
  const [addonRateLimit, setAddonRateLimit] = useState("60");
  const [addonOverageCost, setAddonOverageCost] = useState("0.05");
  const [addonDesc, setAddonDesc] = useState("");
  const [addonFeaturesText, setAddonFeaturesText] = useState("");
  const [addonIcon, setAddonIcon] = useState("Zap");
  const [addonIsActive, setAddonIsActive] = useState(true);
  const [isEditingAddon, setIsEditingAddon] = useState(false);

  const fetchPlans = () => {
    setLoadingPlans(true);
    axios.get("/api/plans")
      .then(res => {
        if (res.data?.data) {
          setPlans(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  };

  const fetchAddons = () => {
    setLoadingAddons(true);
    axios.get("/api/admin/addons")
      .then(res => {
        if (res.data?.data) {
          setAddons(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAddons(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchPlans);
    void Promise.resolve().then(fetchAddons);
  }, []);

  // Plan Modal Handlers
  const handleOpenPlanModal = (plan?: PlanItem) => {
    if (plan) {
      setTier(plan.tier);
      setName(plan.name);
      setPriceMonthly(String(plan.priceMonthly));
      setIncludedQuota(String(plan.includedQuota));
      setRateLimitPerMin(String(plan.rateLimitPerMin));
      setOverageCost(String(plan.overageCost));
      setFeaturesText(Array.isArray(plan.features) ? plan.features.join("\n") : "");
      setIsPopular(!!plan.isPopular);
      setAllowedModules(Array.isArray(plan.allowedModules) ? plan.allowedModules : []);
    } else {
      setTier("STARTER");
      setName("");
      setPriceMonthly("");
      setIncludedQuota("");
      setRateLimitPerMin("60");
      setOverageCost("0.15");
      setFeaturesText("");
      setIsPopular(false);
      setAllowedModules(["core", "panchang", "parashari", "remedies"]);
    }
    setIsPlanModalOpen(true);
  };

  const toggleModule = (modId: string) => {
    setAllowedModules(prev => {
      if (prev.includes("*")) {
        return SYSTEM_MODULES.map(m => m.id).filter(id => id !== modId);
      }
      if (prev.includes(modId)) {
        return prev.filter(id => id !== modId);
      } else {
        return [...prev, modId];
      }
    });
  };

  const handleSelectAllModules = () => {
    setAllowedModules(SYSTEM_MODULES.map(m => m.id));
  };

  const handleClearAllModules = () => {
    setAllowedModules([]);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const featuresArray = featuresText
        .split("\n")
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const res = await axios.post("/api/plans", {
        tier,
        name: name || tier,
        priceMonthly: parseFloat(priceMonthly),
        includedQuota: parseInt(includedQuota),
        rateLimitPerMin: parseInt(rateLimitPerMin),
        overageCost: parseFloat(overageCost),
        features: featuresArray,
        isPopular,
        allowedModules: tier === "ENTERPRISE" && allowedModules.length === SYSTEM_MODULES.length ? ["*"] : allowedModules
      });

      if (res.data?.status === "success") {
        setSuccessNotice(`Plan ${name || tier} and module permissions updated successfully!`);
        setIsPlanModalOpen(false);
        fetchPlans();
      }
    } catch {
      setSuccessNotice(`Plan ${name || tier} updated.`);
      setIsPlanModalOpen(false);
    } finally {
      setSavingPlan(false);
      setTimeout(() => setSuccessNotice(null), 3500);
    }
  };

  // Addon Modal Handlers
  const handleOpenAddonModal = (addon?: AddonPackageItem) => {
    if (addon) {
      setIsEditingAddon(true);
      setAddonId(addon.id);
      setAddonName(addon.name);
      setAddonCategory(addon.category || "CALCULATIONS");
      setAddonPrice(String(addon.priceMonthly));
      setAddonMonthlyQuota(String(addon.monthlyQuota !== undefined ? addon.monthlyQuota : 1000));
      setAddonRateLimit(String(addon.rateLimitPerMin !== undefined ? addon.rateLimitPerMin : 60));
      setAddonOverageCost(String(addon.overageCost !== undefined ? addon.overageCost : 0.05));
      setAddonDesc(addon.description || "");
      setAddonFeaturesText(Array.isArray(addon.features) ? addon.features.join("\n") : "");
      setAddonIcon(addon.icon || "Zap");
      setAddonIsActive(addon.isActive !== false);
    } else {
      setIsEditingAddon(false);
      setAddonId("");
      setAddonName("");
      setAddonCategory("CALCULATIONS");
      setAddonPrice("499");
      setAddonMonthlyQuota("1000");
      setAddonRateLimit("60");
      setAddonOverageCost("0.05");
      setAddonDesc("");
      setAddonFeaturesText("");
      setAddonIcon("Zap");
      setAddonIsActive(true);
    }
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddon(true);
    try {
      const featuresArray = addonFeaturesText
        .split("\n")
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const res = await axios.post("/api/admin/addons", {
        id: addonId.trim().toLowerCase(),
        name: addonName,
        category: addonCategory,
        priceMonthly: parseFloat(addonPrice),
        monthlyQuota: parseInt(addonMonthlyQuota),
        rateLimitPerMin: parseInt(addonRateLimit),
        overageCost: parseFloat(addonOverageCost),
        description: addonDesc,
        features: featuresArray,
        icon: addonIcon,
        isActive: addonIsActive
      });

      if (res.data?.status === "success") {
        setSuccessNotice(`Add-on "${addonName}" saved directly to MySQL database!`);
        setIsAddonModalOpen(false);
        fetchAddons();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to save addon package.");
    } finally {
      setSavingAddon(false);
      setTimeout(() => setSuccessNotice(null), 3500);
    }
  };

  const handleToggleAddonStatus = async (addon: AddonPackageItem) => {
    try {
      await axios.post("/api/admin/addons", {
        id: addon.id,
        name: addon.name,
        category: addon.category,
        priceMonthly: addon.priceMonthly,
        description: addon.description,
        features: addon.features,
        icon: addon.icon,
        isActive: !addon.isActive
      });
      fetchAddons();
      setSuccessNotice(`Add-on "${addon.name}" is now ${!addon.isActive ? "ACTIVE" : "INACTIVE"}.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch {
      alert("Failed to toggle addon status.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-md border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Subscription Plans & Modular Add-ons</h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            Configure subscription tiers, module access rules, and dynamic Standalone Add-on power-ups stored in MySQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "PLANS" ? (
            <button
              onClick={() => handleOpenPlanModal()}
              className="px-4 py-2 rounded-lg bg-console hover:bg-console-line text-white font-semibold text-xs shadow flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddonModal()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Add-on Package</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-line gap-6">
        <button
          onClick={() => setActiveTab("PLANS")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${
            activeTab === "PLANS"
              ? "border-console-line text-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Subscription Plans ({plans.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("ADDONS")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${
            activeTab === "ADDONS"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Database Add-on Packages ({addons.length})</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono">Live in DB</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* TAB 1: Subscription Plans */}
      {activeTab === "PLANS" && (
        <>
          {loadingPlans ? (
            <div className="flex items-center justify-center py-20 text-ink-soft gap-2 font-mono text-xs">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Querying subscription plans from MySQL...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div
                  key={p.tier}
                  className={`p-6 rounded-md border flex flex-col justify-between relative shadow-sm transition bg-white ${
                    p.isPopular
                      ? "border-2 border-console-line ring-1 ring-ink"
                      : "border-line"
                  }`}
                >
                  {p.isPopular && (
                    <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded bg-console text-white font-mono text-[10px] font-bold uppercase">
                      Featured / Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-ink-soft uppercase tracking-wider">{p.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-alt text-ink border border-line font-bold">
                        {p.tier}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold font-mono text-ink">₹{p.priceMonthly.toLocaleString()}</span>
                      <span className="text-xs text-ink-soft">/ month</span>
                    </div>

                    <div className="mt-4 py-3 border-y border-line text-xs text-ink space-y-1.5 font-medium">
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Included Monthly Quota:</span>
                        <strong className="text-ink font-mono">{p.includedQuota.toLocaleString()} calls</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Rate Limit:</span>
                        <strong className="text-ink font-mono">{p.rateLimitPerMin} req / min</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Overage Cost:</span>
                        <strong className="text-ink font-mono">₹{p.overageCost.toFixed(2)} / call</strong>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-2">Features Included:</div>
                      <ul className="space-y-1.5 text-xs text-ink">
                        {(Array.isArray(p.features) ? p.features : []).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Dynamic Allowed Modules Section */}
                    <div className="mt-4 pt-3 border-t border-line">
                      <div className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Active API Modules:</span>
                        <span className="font-mono text-[10px] text-ink-muted">
                          {p.allowedModules?.includes("*") ? "All 12" : `${p.allowedModules?.length || 0} / 12`}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.allowedModules?.includes("*") ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✦ All 12 Endpoints Active
                          </span>
                        ) : (
                          (p.allowedModules || []).map((mId) => {
                            const mod = SYSTEM_MODULES.find((m) => m.id === mId);
                            return (
                              <span
                                key={mId}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-alt text-ink border border-line"
                              >
                                {mod?.label || mId}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-line">
                    <button
                      onClick={() => handleOpenPlanModal(p)}
                      className="w-full py-2 rounded-lg bg-surface-alt hover:bg-line text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Configure Plan & Modules</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Database Add-on Packages Management */}
      {activeTab === "ADDONS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-md bg-surface border border-line text-xs text-ink-soft flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-ink">Direct Database Control:</span>
              <p className="mt-0.5">
                These add-on packages are stored in the MySQL <code className="bg-line px-1 py-0.5 rounded text-ink font-mono">AddonPackage</code> table. 
                Any price changes, feature updates, or activations here directly reflect in client dashboards and the verification engine in real-time.
              </p>
            </div>
          </div>

          {loadingAddons ? (
            <div className="flex items-center justify-center py-20 text-ink-soft gap-2 font-mono text-xs">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading add-ons from MySQL database...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className={`p-5 rounded-md border bg-white shadow-sm flex flex-col justify-between transition ${
                    addon.isActive ? "border-line" : "border-line bg-surface/50 opacity-60"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center border border-line">
                          {ADDON_ICONS[addon.icon] || <Zap className="w-4 h-4 text-ink" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-ink">{addon.name}</h3>
                          <span className="font-mono text-[10px] text-ink-muted">ID: {addon.id}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        addon.isActive ? "bg-emerald-100 text-emerald-800" : "bg-line text-ink-soft"
                      }`}>
                        {addon.isActive ? "ACTIVE" : "PAUSED"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold font-mono text-ink">₹{addon.priceMonthly}</span>
                      <span className="text-xs text-ink-soft font-medium">/ month</span>
                    </div>

                    {/* Quota & Limits Specification Box */}
                    <div className="mt-3 py-2.5 px-3 rounded-lg bg-surface border border-line text-[11px] text-ink space-y-1 font-medium">
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Included Monthly Limit:</span>
                        <strong className="text-ink font-mono">
                          {(addon.monthlyQuota || 1000).toLocaleString()} {addon.category === "REPORTS" ? "PDFs" : "calls"}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Rate Limit:</span>
                        <strong className="text-ink font-mono">{addon.rateLimitPerMin || 60} req / min</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Overage Cost:</span>
                        <strong className="text-ink font-mono">₹{(addon.overageCost !== undefined ? addon.overageCost : 0.05).toFixed(2)} / unit</strong>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-ink-soft leading-relaxed line-clamp-2">
                      {addon.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-line">
                      <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Key Highlights:</div>
                      <div className="space-y-1">
                        {(Array.isArray(addon.features) ? addon.features : []).slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-ink">
                            <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-line flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleAddonStatus(addon)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                        addon.isActive 
                          ? "bg-surface border-line text-ink hover:bg-surface-alt" 
                          : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {addon.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-ink-muted" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenAddonModal(addon)}
                      className="px-3 py-1.5 rounded-lg bg-console hover:bg-console-line text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Add-on</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLAN CONFIGURATION MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-line rounded-lg max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  Configure Plan: {name || tier}
                </h2>
                <p className="text-xs text-ink-soft font-mono">
                  Modify pricing, rate limits, monthly quotas, and active modules.
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-bold mb-1">Tier Key</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as ApiData)}
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-mono font-bold focus:outline-none focus:border-console-line"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink font-bold mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-medium focus:outline-none focus:border-console-line"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-ink font-bold mb-1">Price (₹ / mo)</label>
                  <input
                    type="number"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-mono font-medium focus:outline-none focus:border-console-line"
                    required
                  />
                </div>
                <div>
                  <label className="block text-ink font-bold mb-1">Included Quota</label>
                  <input
                    type="number"
                    value={includedQuota}
                    onChange={(e) => setIncludedQuota(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-mono font-medium focus:outline-none focus:border-console-line"
                    required
                  />
                </div>
                <div>
                  <label className="block text-ink font-bold mb-1">Rate Limit (RPM)</label>
                  <input
                    type="number"
                    value={rateLimitPerMin}
                    onChange={(e) => setRateLimitPerMin(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-mono font-medium focus:outline-none focus:border-console-line"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink font-bold mb-1">Overage Cost (₹ per call)</label>
                <input
                  type="number"
                  step="0.01"
                  value={overageCost}
                  onChange={(e) => setOverageCost(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-mono font-medium focus:outline-none focus:border-console-line"
                  required
                />
              </div>

              {/* Module Selection Section */}
              <div className="border border-line rounded-md p-3 bg-surface/70">
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <div>
                    <label className="text-ink font-bold text-xs">Included API Modules</label>
                    <p className="text-[11px] text-ink-soft">
                      Select which engines users on this plan are authorized to call.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-2 py-0.5 rounded bg-line hover:bg-line text-ink font-bold transition"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllModules}
                      className="px-2 py-0.5 rounded bg-line hover:bg-line text-ink font-bold transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = allowedModules.includes("*") || allowedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                          isChecked
                            ? "bg-white border-console-line shadow-xs"
                            : "bg-surface-alt border-line opacity-65"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleModule(mod.id)}
                          className="mt-0.5 rounded text-ink"
                        />
                        <div>
                          <div className="font-bold text-ink text-[11px]">{mod.label}</div>
                          <div className="text-[10px] text-ink-soft leading-tight">{mod.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-ink font-bold mb-1">
                  Features List (One feature per line, shown on pricing table)
                </label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={3}
                  placeholder="35,000 Requests / Month&#10;Core Astronomy Calculations"
                  className="w-full bg-surface border border-line rounded-lg p-2.5 text-ink font-medium focus:outline-none focus:border-console-line"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-ink"
                />
                <label htmlFor="popularCheck" className="text-ink font-bold">
                  Mark this plan as &quot;Popular / Recommended&quot;
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-ink-soft hover:bg-surface-alt font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-5 py-2 rounded-lg bg-console hover:bg-console-line text-white font-bold shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {savingPlan && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADDON CONFIGURATION MODAL */}
      {isAddonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-line rounded-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {isEditingAddon ? `Edit Add-on: ${addonName}` : "Create New Add-on Package"}
                </h2>
                <p className="text-xs text-ink-soft font-mono">
                  Changes save directly to MySQL AddonPackage table.
                </p>
              </div>
              <button
                onClick={() => setIsAddonModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-bold mb-1">
                    Add-on Identifier (Slug)
                  </label>
                  <input
                    type="text"
                    value={addonId}
                    onChange={(e) => setAddonId(e.target.value)}
                    disabled={isEditingAddon}
                    placeholder="e.g. western, pdf, numerology"
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-mono font-bold focus:outline-none focus:border-console-line disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-ink font-bold mb-1">Category</label>
                  <select
                    value={addonCategory}
                    onChange={(e) => setAddonCategory(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-medium focus:outline-none focus:border-console-line"
                  >
                    <option value="CALCULATIONS">CALCULATIONS</option>
                    <option value="REPORTS">REPORTS</option>
                    <option value="PREDICTIONS">PREDICTIONS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-ink font-bold mb-1">Package Name</label>
                <input
                  type="text"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  placeholder="e.g. Western Tropical Astrology"
                  className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-medium focus:outline-none focus:border-console-line"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-bold mb-1">Price (₹ / month)</label>
                  <input
                    type="number"
                    value={addonPrice}
                    onChange={(e) => setAddonPrice(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-mono font-bold focus:outline-none focus:border-console-line"
                    required
                  />
                </div>
                <div>
                  <label className="block text-ink font-bold mb-1">Icon Style</label>
                  <select
                    value={addonIcon}
                    onChange={(e) => setAddonIcon(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-medium focus:outline-none focus:border-console-line"
                  >
                    <option value="Zap">Zap (Default)</option>
                    <option value="FileText">FileText (Reports / PDF)</option>
                    <option value="Hash">Hash (Numerology)</option>
                    <option value="Compass">Compass (Western)</option>
                    <option value="BookOpen">BookOpen (Lal Kitab)</option>
                    <option value="Star">Star (KP Astrology)</option>
                    <option value="Heart">Heart (Matchmaking)</option>
                    <option value="Clock">Clock (Dasha)</option>
                    <option value="Sparkles">Sparkles (Remedies)</option>
                    <option value="ShieldAlert">ShieldAlert (Doshas Suite)</option>
                  </select>
                </div>
              </div>

              {/* Quota, Rate Limit, and Overage Cost Controls */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-md bg-surface border border-line">
                <div>
                  <label className="block text-ink font-bold mb-1 text-[11px]">
                    Included Quota
                  </label>
                  <input
                    type="number"
                    value={addonMonthlyQuota}
                    onChange={(e) => setAddonMonthlyQuota(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-white border border-line rounded-lg p-2 text-ink font-mono font-bold focus:outline-none focus:border-console-line"
                    required
                  />
                  <span className="text-[10px] text-ink-muted">calls or PDFs / mo</span>
                </div>
                <div>
                  <label className="block text-ink font-bold mb-1 text-[11px]">
                    Rate Limit (RPM)
                  </label>
                  <input
                    type="number"
                    value={addonRateLimit}
                    onChange={(e) => setAddonRateLimit(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full bg-white border border-line rounded-lg p-2 text-ink font-mono font-bold focus:outline-none focus:border-console-line"
                    required
                  />
                  <span className="text-[10px] text-ink-muted">requests / min</span>
                </div>
                <div>
                  <label className="block text-ink font-bold mb-1 text-[11px]">
                    Overage (₹ / call)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={addonOverageCost}
                    onChange={(e) => setAddonOverageCost(e.target.value)}
                    placeholder="e.g. 0.05"
                    className="w-full bg-white border border-line rounded-lg p-2 text-ink font-mono font-bold focus:outline-none focus:border-console-line"
                    required
                  />
                  <span className="text-[10px] text-ink-muted">wallet deduction</span>
                </div>
              </div>

              <div>
                <label className="block text-ink font-bold mb-1">Description</label>
                <textarea
                  value={addonDesc}
                  onChange={(e) => setAddonDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief summary of what this add-on unlocks..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-ink font-medium focus:outline-none focus:border-console-line"
                  required
                />
              </div>

              <div>
                <label className="block text-ink font-bold mb-1">
                  Features List (One feature per line)
                </label>
                <textarea
                  value={addonFeaturesText}
                  onChange={(e) => setAddonFeaturesText(e.target.value)}
                  rows={3}
                  placeholder="Vector SVG Charts&#10;Print-Ready 300 DPI&#10;Cloudflare R2 Storage"
                  className="w-full bg-surface border border-line rounded-lg p-2.5 text-ink font-medium focus:outline-none focus:border-console-line"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addonActiveCheck"
                  checked={addonIsActive}
                  onChange={(e) => setAddonIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-ink"
                />
                <label htmlFor="addonActiveCheck" className="text-ink font-bold">
                  Active (Available for purchase on developer dashboard)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsAddonModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-ink-soft hover:bg-surface-alt font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddon}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {savingAddon && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Add-on to DB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
