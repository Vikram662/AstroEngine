"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Settings, 
  Sliders, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Coins,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Database
} from "lucide-react";

interface SettingItem {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [settingsList, setSettingsList] = useState<SettingItem[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New Custom Setting Row
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState("GENERAL");
  const [newDesc, setNewDesc] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    axios.get("/api/admin/settings")
      .then((res) => {
        if (res.data?.raw) {
          setSettingsList(res.data.raw);
          setSettingsMap(res.data.data || {});
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateField = (key: string, value: string) => {
    setSettingsMap(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const updates = Object.entries(settingsMap).map(([key, value]) => ({
        key,
        value
      }));

      await axios.post("/api/admin/settings", {
        settings: updates
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchSettings();
    } catch (err) {
      alert("Failed to save settings to database");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    try {
      await axios.post("/api/admin/settings", {
        settings: [
          {
            key: newKey.trim().toUpperCase().replace(/\s+/g, "_"),
            value: newValue,
            category: newCategory,
            description: newDesc
          }
        ]
      });
      setNewKey("");
      setNewValue("");
      setNewDesc("");
      setIsAddingNew(false);
      fetchSettings();
    } catch (err) {
      alert("Failed to add new setting");
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm(`Are you sure you want to delete setting "${key}"?`)) return;
    try {
      await axios.delete("/api/admin/settings", {
        data: { key }
      });
      fetchSettings();
    } catch (err) {
      alert("Failed to delete setting");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs">Connecting to MySQL `SystemSetting` table...</span>
      </div>
    );
  }

  // Pre-configured core fields (if present in DB)
  const freeCredits = settingsMap["DEFAULT_FREE_CREDITS"] ?? "100.00";
  const starterQuota = settingsMap["DEFAULT_MONTHLY_QUOTA"] ?? "35000";
  const overageFee = settingsMap["OVERAGE_COST_PER_CALL"] ?? "0.02";
  const maintenance = settingsMap["MAINTENANCE_MODE"] === "true";
  const maintenanceNotice = settingsMap["MAINTENANCE_NOTICE"] ?? "";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              System Configuration & Database Settings (§8.3.8)
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-900 text-white rounded">
              SUPER_ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            All system parameters are loaded dynamically from MySQL. Admin can update, add new keys, or delete settings in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Key</span>
          </button>
          <button
            onClick={fetchSettings}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
            title="Reload from MySQL"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All settings saved successfully!</span>
        </div>
      )}

      {/* Add New Key Form */}
      {isAddingNew && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Add New Dynamic Configuration Key
            </h3>
            <button
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateNewSetting} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Setting Key</label>
              <input
                type="text"
                placeholder="e.g. WHATSAPP_API_TOKEN"
                required
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Value</label>
              <input
                type="text"
                placeholder="Value..."
                required
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="BILLING">BILLING</option>
                <option value="LIMITS">LIMITS</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="MODULES">MODULES</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Access Platform Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">User Signup & Free Credit Defaults (MySQL)</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New User Free Credits (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="text"
                value={freeCredits}
                onChange={(e) => handleUpdateField("DEFAULT_FREE_CREDITS", e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Key: DEFAULT_FREE_CREDITS</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Starter Tier Free Quota (Calls/Mo)
            </label>
            <input
              type="text"
              value={starterQuota}
              onChange={(e) => handleUpdateField("DEFAULT_MONTHLY_QUOTA", e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Key: DEFAULT_MONTHLY_QUOTA</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Per-Call Overage Fee (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="text"
                value={overageFee}
                onChange={(e) => handleUpdateField("OVERAGE_COST_PER_CALL", e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Key: OVERAGE_COST_PER_CALL</span>
          </div>
        </div>
      </div>

      {/* Maintenance Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Platform Maintenance Switch</h2>
          </div>
          <button
            type="button"
            onClick={() => handleUpdateField("MAINTENANCE_MODE", maintenance ? "false" : "true")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              maintenance
                ? "bg-rose-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {maintenance ? "MAINTENANCE ON (503 ACTIVE)" : "MAINTENANCE OFF (LIVE)"}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Public Maintenance Notice Message
          </label>
          <input
            type="text"
            value={maintenanceNotice}
            onChange={(e) => handleUpdateField("MAINTENANCE_NOTICE", e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Dynamic MySQL Settings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Database Records (`SystemSetting`)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {settingsList.length} rows loaded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Database Key</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {settingsList.map((item) => (
                <tr key={item.key} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.key}
                    {item.description && (
                      <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={settingsMap[item.key] ?? item.value}
                      onChange={(e) => handleUpdateField(item.key, e.target.value)}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-900 w-full max-w-sm focus:outline-hidden"
                    />
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-500">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-[11px] text-slate-400">
                    {new Date(item.updatedAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteSetting(item.key)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Delete key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Save Button Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Clicking save updates all modified rows directly in the MySQL database.
          </span>
          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
