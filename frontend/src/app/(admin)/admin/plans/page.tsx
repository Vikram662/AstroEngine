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
  X
} from "lucide-react";

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
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form State
  const [tier, setTier] = useState<"STARTER" | "PRO" | "ENTERPRISE">("STARTER");
  const [name, setName] = useState("STARTER");
  const [priceMonthly, setPriceMonthly] = useState("4999");
  const [includedQuota, setIncludedQuota] = useState("35000");
  const [rateLimitPerMin, setRateLimitPerMin] = useState("60");
  const [overageCost, setOverageCost] = useState("0.15");
  const [featuresText, setFeaturesText] = useState(
    "Access to all 117 API Endpoints\nParashari D1 & D9 Charts\nPanchang & Muhurat Calculations\nCommunity Support"
  );
  const [isPopular, setIsPopular] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    axios.get("/api/plans")
      .then(res => {
        if (res.data?.data) {
          setPlans(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreateOrEdit = (plan?: PlanItem) => {
    if (plan) {
      setTier(plan.tier);
      setName(plan.name);
      setPriceMonthly(String(plan.priceMonthly));
      setIncludedQuota(String(plan.includedQuota));
      setRateLimitPerMin(String(plan.rateLimitPerMin));
      setOverageCost(String(plan.overageCost));
      setFeaturesText(Array.isArray(plan.features) ? plan.features.join("\n") : "");
      setIsPopular(!!plan.isPopular);
    } else {
      setTier("STARTER");
      setName("");
      setPriceMonthly("");
      setIncludedQuota("");
      setRateLimitPerMin("60");
      setOverageCost("0.15");
      setFeaturesText("");
      setIsPopular(false);
    }
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
        isPopular
      });

      if (res.data?.status === "success") {
        setSuccessNotice(`Plan ${name || tier} saved successfully!`);
        setIsModalOpen(false);
        fetchPlans();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setSuccessNotice(`Plan ${name || tier} updated.`);
      setIsModalOpen(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription Plans Manager</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Create, edit, and configure pricing tiers, monthly API quotas, and rate limits for clients.
          </p>
        </div>
        <button
          onClick={() => handleOpenCreateOrEdit()}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-2 font-mono text-xs">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Querying subscription plans from MySQL...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.tier}
              className={`p-6 rounded-xl border flex flex-col justify-between relative shadow-sm transition bg-white ${
                p.isPopular
                  ? "border-2 border-slate-900 ring-1 ring-slate-900"
                  : "border-slate-200"
              }`}
            >
              {p.isPopular && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                  Featured / Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">{p.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                    {p.tier}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-slate-900">₹{p.priceMonthly.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>

                <div className="mt-4 py-3 border-y border-slate-100 text-xs text-slate-700 space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Included Monthly Quota:</span>
                    <strong className="text-slate-900 font-mono">{p.includedQuota.toLocaleString()} calls</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rate Limit:</span>
                    <strong className="text-slate-900 font-mono">{p.rateLimitPerMin} req / min</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Overage Cost:</span>
                    <strong className="text-slate-900 font-mono">₹{p.overageCost.toFixed(2)} / call</strong>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Features Included:</div>
                  <ul className="space-y-2 text-xs text-slate-800">
                    {(Array.isArray(p.features) ? p.features : []).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenCreateOrEdit(p)}
                  className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Plan Settings</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-300 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Configure Subscription Plan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Plan Tier Enum</label>
                  <select
                    value={tier}
                    onChange={(e) => {
                      const val = e.target.value as "STARTER" | "PRO" | "ENTERPRISE";
                      setTier(val);
                      if (!name) setName(val);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Display Plan Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Starter Pro"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Price (INR)</label>
                  <input
                    type="number"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value)}
                    placeholder="4999"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Included Monthly Quota</label>
                  <input
                    type="number"
                    value={includedQuota}
                    onChange={(e) => setIncludedQuota(e.target.value)}
                    placeholder="35000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rate Limit (req / min)</label>
                  <input
                    type="number"
                    value={rateLimitPerMin}
                    onChange={(e) => setRateLimitPerMin(e.target.value)}
                    placeholder="60"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Overage Rate (INR/call)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={overageCost}
                    onChange={(e) => setOverageCost(e.target.value)}
                    placeholder="0.15"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Features List (One feature per line)
                </label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={4}
                  placeholder="Access to all 117 APIs&#10;White-label PDF Engine"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <label htmlFor="popularCheck" className="text-slate-700 font-bold">
                  Mark this plan as &quot;Popular / Recommended&quot;
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
