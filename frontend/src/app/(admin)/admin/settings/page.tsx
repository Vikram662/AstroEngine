"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Settings, 
  Sliders, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  Coins, 
  Loader2, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Database, 
  KeyRound,
  CreditCard,
  HardDrive,
  Mail,
  ToggleLeft,
  ToggleRight,
  Layers,
  Wrench,
  Search
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

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleToggleBoolean = (key: string) => {
    const current = settingsMap[key] === "true";
    const nextVal = current ? "false" : "true";
    handleUpdateField(key, nextVal);
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

  // Grouping categories
  const categories = [
    { id: "ALL", label: "All Settings", icon: Layers, count: settingsList.length },
    { id: "PAYMENTS", label: "Payments (Razorpay)", icon: CreditCard, count: settingsList.filter(s => s.category === "PAYMENTS").length },
    { id: "STORAGE", label: "Storage (Cloudflare R2)", icon: HardDrive, count: settingsList.filter(s => s.category === "STORAGE").length },
    { id: "EMAIL", label: "Email (SMTP)", icon: Mail, count: settingsList.filter(s => s.category === "EMAIL").length },
    { id: "BILLING", label: "Billing & Credits", icon: Coins, count: settingsList.filter(s => s.category === "BILLING").length },
    { id: "LIMITS", label: "Quotas & Limits", icon: Sliders, count: settingsList.filter(s => s.category === "LIMITS").length },
    { id: "MODULES", label: "Astro Modules", icon: Wrench, count: settingsList.filter(s => s.category === "MODULES").length },
    { id: "MAINTENANCE", label: "Maintenance", icon: ShieldAlert, count: settingsList.filter(s => s.category === "MAINTENANCE").length },
  ];

  const filteredList = settingsList.filter(item => {
    const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch = item.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper to check if setting is boolean
  const isBooleanSetting = (val: string) => val === "true" || val === "false";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs">Connecting to MySQL `SystemSetting` table...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              System Configuration & Service Keys
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-900 text-white rounded">
              MYSQL DATABASE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure Payment Gateway, Cloudflare R2, SMTP Mail, quotas, and feature toggle switches in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Key</span>
          </button>
          <button
            onClick={fetchSettings}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
            title="Reload from MySQL"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>All system configuration changes saved directly to MySQL!</span>
        </div>
      )}

      {/* Add New Key Form Drawer */}
      {isAddingNew && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 animate-in fade-in">
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
                placeholder="e.g. CUSTOM_API_TIMEOUT"
                required
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
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
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="PAYMENTS">PAYMENTS (Razorpay)</option>
                <option value="STORAGE">STORAGE (Cloudflare R2)</option>
                <option value="EMAIL">EMAIL (SMTP)</option>
                <option value="BILLING">BILLING</option>
                <option value="LIMITS">LIMITS</option>
                <option value="MODULES">MODULES</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Key</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{cat.label}</span>
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search configuration keys..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Settings Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {activeCategory === "ALL" ? "All System Settings" : `${activeCategory} Configuration`}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredList.length} settings visible
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-5" style={{ width: "35%" }}>Configuration Key & Purpose</th>
                <th className="py-3.5 px-5" style={{ width: "40%" }}>Value / State Switch</th>
                <th className="py-3.5 px-5" style={{ width: "15%" }}>Category</th>
                <th className="py-3.5 px-5 text-right" style={{ width: "10%" }}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    No settings found matching your filter or search query.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const currentValue = settingsMap[item.key] ?? item.value;
                  const isBool = isBooleanSetting(currentValue);
                  const boolState = currentValue === "true";

                  return (
                    <tr key={item.key} className="hover:bg-slate-50/70 transition">
                      {/* Key & Description */}
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {item.key}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* Value / Toggle Switch */}
                      <td className="py-3.5 px-5">
                        {isBool ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleBoolean(item.key)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                boolState ? "bg-emerald-600" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  boolState ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className={`text-xs font-bold font-mono ${
                              boolState ? "text-emerald-700" : "text-slate-400"
                            }`}>
                              {boolState ? "ACTIVE (TRUE)" : "DISABLED (FALSE)"}
                            </span>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => handleUpdateField(item.key, e.target.value)}
                              placeholder="Enter value..."
                              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
                            />
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.category === "PAYMENTS" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                          item.category === "STORAGE" ? "bg-sky-100 text-sky-800 border border-sky-200" :
                          item.category === "EMAIL" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          item.category === "LIMITS" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                          item.category === "BILLING" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          item.category === "MAINTENANCE" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                          item.category === "MODULES" ? "bg-indigo-100 text-indigo-800 border border-indigo-200" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {item.category}
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDeleteSetting(item.key)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title={`Delete ${item.key}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Global Save Button Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Changes made to toggle switches or text inputs will take effect immediately once saved to database.
          </span>
          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
