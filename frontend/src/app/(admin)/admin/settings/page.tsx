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
  Search,
  Upload,
  Image,
  Copy
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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
    void Promise.resolve().then(fetchSettings);
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

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    setUploadingLogo(true);
    setUploadSuccess(null);
    try {
      const res = await axios.post("/api/admin/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.logoUrl) {
        handleUpdateField("COMPANY_LOGO_URL", res.data.logoUrl);
        setUploadSuccess("Logo uploaded directly to Cloudflare R2!");
        setTimeout(() => setUploadSuccess(null), 4000);
        fetchSettings();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to upload logo to Cloudflare R2");
    } finally {
      setUploadingLogo(false);
      // Reset the file input so same file can be selected again if needed
      e.target.value = "";
    }
  };

  // Grouping categories
  const categories = [
    { id: "ALL", label: "All Settings", icon: Layers, count: settingsList.length },
    { id: "COMPANY", label: "Company & Invoicing", icon: Database, count: settingsList.filter(s => s.category === "COMPANY").length },
    { id: "SOCIAL", label: "Social Media", icon: RefreshCw, count: settingsList.filter(s => s.category === "SOCIAL").length },
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
      <div className="flex items-center justify-center p-12 text-ink-soft gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs">Connecting to MySQL `SystemSetting` table...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-md border border-line shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              System Configuration & Service Keys
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-console text-white rounded">
              MYSQL DATABASE
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Configure Payment Gateway, Cloudflare R2, SMTP Mail, quotas, and feature toggle switches in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-2 border border-line rounded-lg hover:bg-surface text-ink text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Key</span>
          </button>
          <button
            onClick={fetchSettings}
            className="p-2 border border-line rounded-lg hover:bg-surface text-ink-soft transition"
            title="Reload from MySQL"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-console hover:bg-console-line text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>All system configuration changes saved directly to MySQL!</span>
        </div>
      )}

      {/* Add New Key Form Drawer */}
      {isAddingNew && (
        <div className="bg-surface border border-line rounded-md p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Add New Dynamic Configuration Key
            </h3>
            <button
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateNewSetting} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink-soft mb-1">Setting Key</label>
              <input
                type="text"
                placeholder="e.g. CUSTOM_API_TIMEOUT"
                required
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-line rounded-lg bg-white text-ink"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-soft mb-1">Value</label>
              <input
                type="text"
                placeholder="Value..."
                required
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-line rounded-lg bg-white text-ink"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-soft mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-line rounded-lg bg-white text-ink font-medium"
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
                className="w-full py-2 bg-console hover:bg-console-line text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
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
                    ? "bg-console text-white shadow-xs"
                    : "bg-white border border-line text-ink-soft hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-ink-muted"}`} />
                <span>{cat.label}</span>
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? "bg-console-line text-slate-200" : "bg-surface-alt text-ink-soft"
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search configuration keys..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-line rounded-lg bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink-muted"
          />
        </div>
      </div>

      {/* Settings Table Card */}
      <div className="bg-white rounded-md border border-line shadow-xs overflow-hidden">
        <div className="p-4 border-b border-line bg-surface/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
              {activeCategory === "ALL" ? "All System Settings" : `${activeCategory} Configuration`}
            </h2>
          </div>
          <span className="text-[11px] text-ink-muted font-mono">
            {filteredList.length} settings visible
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/80 border-b border-line text-ink-soft uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-5" style={{ width: "35%" }}>Configuration Key & Purpose</th>
                <th className="py-3.5 px-5" style={{ width: "40%" }}>Value / State Switch</th>
                <th className="py-3.5 px-5" style={{ width: "15%" }}>Category</th>
                <th className="py-3.5 px-5 text-right" style={{ width: "10%" }}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink-muted text-xs">
                    No settings found matching your filter or search query.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const currentValue = settingsMap[item.key] ?? item.value;
                  const isBool = isBooleanSetting(currentValue);
                  const boolState = currentValue === "true";

                  return (
                    <tr key={item.key} className="hover:bg-surface/70 transition">
                      {/* Key & Description */}
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-ink text-xs">
                          {item.key}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-ink-soft font-normal mt-0.5 leading-snug">
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
                                boolState ? "bg-emerald-600" : "bg-line"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  boolState ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className={`text-xs font-bold font-mono ${
                              boolState ? "text-emerald-700" : "text-ink-muted"
                            }`}>
                              {boolState ? "ACTIVE (TRUE)" : "DISABLED (FALSE)"}
                            </span>
                          </div>
                        ) : item.key === "COMPANY_LOGO_URL" ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => handleUpdateField(item.key, e.target.value)}
                                placeholder="https://pub-...r2.dev/branding/logo.png"
                                className="flex-1 px-3 py-1.5 text-xs font-mono border border-line rounded-lg bg-white text-ink focus:outline-none focus:border-ink-muted focus:ring-1 focus:ring-ink-muted transition"
                              />
                              <label
                                className={`px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-surface text-ink text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition ${
                                  uploadingLogo ? "opacity-50 pointer-events-none" : ""
                                }`}
                              >
                                {uploadingLogo ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 text-accent" />
                                )}
                                <span>{uploadingLogo ? "Uploading R2..." : "Upload File"}</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                  onChange={handleLogoFileUpload}
                                  className="hidden"
                                  disabled={uploadingLogo}
                                />
                              </label>
                            </div>

                            {uploadSuccess && (
                              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {uploadSuccess}
                              </p>
                            )}

                            {/* Live Logo Preview Box */}
                            {currentValue && (
                              <div className="p-2.5 rounded-lg bg-surface border border-line flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-white border border-line flex items-center justify-center overflow-hidden p-1 shadow-xs">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={currentValue}
                                    alt="Company Logo Preview"
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      // Fallback on invalid image
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                </div>
                                <div className="text-[11px] leading-tight flex-1 min-w-0">
                                  <div className="font-semibold text-ink flex items-center gap-1">
                                    <Image className="w-3 h-3 text-ink-muted" />
                                    <span>Active Logo Preview</span>
                                  </div>
                                  <div className="text-ink-muted truncate font-mono text-[10px] mt-0.5" title={currentValue}>
                                    {currentValue}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => handleUpdateField(item.key, e.target.value)}
                              placeholder="Enter value..."
                              className="w-full px-3 py-1.5 text-xs font-mono border border-line rounded-lg bg-white text-ink focus:outline-none focus:border-ink-muted focus:ring-1 focus:ring-ink-muted transition"
                            />
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.category === "PAYMENTS" ? "bg-accent-soft text-accent-hover border border-accent/30" :
                          item.category === "STORAGE" ? "bg-sky-100 text-sky-800 border border-sky-200" :
                          item.category === "EMAIL" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          item.category === "LIMITS" ? "bg-accent-soft text-accent-hover border border-accent/30" :
                          item.category === "BILLING" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          item.category === "MAINTENANCE" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                          item.category === "MODULES" ? "bg-accent-soft text-accent-hover border border-accent/30" :
                          "bg-surface-alt text-ink border border-line"
                        }`}>
                          {item.category}
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDeleteSetting(item.key)}
                          className="p-1.5 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
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
        <div className="p-4 bg-surface border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-ink-soft">
            Changes made to toggle switches or text inputs will take effect immediately once saved to database.
          </span>
          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-console hover:bg-console-line text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
