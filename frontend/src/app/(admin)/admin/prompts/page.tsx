"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Loader2,
  X,
  Trash2
} from "lucide-react";

interface PredictionRule {
  id: number;
  ruleKey: string;
  lang: string;
  category: string;
  title: string;
  description: string;
  remedy?: string | null;
}

const EMPTY_FORM = { id: null as number | null, ruleKey: "", lang: "en", category: "", title: "", description: "", remedy: "" };

export default function AdminPromptsPage() {
  const [rules, setRules] = useState<PredictionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLang, setSelectedLang] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRules = () => {
    setLoading(true);
    axios.get("/api/admin/data?type=prompts")
      .then(res => {
        if (res.data?.data) {
          setRules(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchRules);
  }, []);

  const filtered = rules.filter(r => {
    const matchesSearch = r.ruleKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLang === "all" || r.lang === selectedLang;
    return matchesSearch && matchesLang;
  });

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (rule: PredictionRule) => {
    setForm({
      id: rule.id,
      ruleKey: rule.ruleKey,
      lang: rule.lang,
      category: rule.category,
      title: rule.title,
      description: rule.description,
      remedy: rule.remedy || ""
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        await axios.patch("/api/admin/prompts", form);
      } else {
        await axios.post("/api/admin/prompts", form);
      }
      setFormOpen(false);
      fetchRules();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || "Failed to save rule.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this interpretation rule? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/admin/prompts?id=${id}`);
      fetchRules();
    } catch {
      alert("Failed to delete rule.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-md border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Astrological Interpretation Rules</h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            Manage multi-lingual interpretation paragraphs stored in MySQL (<code className="font-mono text-ink bg-surface-alt px-1 py-0.5 rounded border">AstrologicalPrediction</code> table §6) injected into PDF reports.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-lg bg-console hover:bg-console-line text-white font-semibold text-xs shadow flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Rule</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-md border border-line shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ruleKey (e.g. SUN_HOUSE_10) or title..."
            className="w-full bg-surface border border-line rounded-lg pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-white focus:border-ink-muted font-medium"
          />
        </div>
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink font-semibold focus:outline-none focus:bg-white focus:border-ink-muted"
        >
          <option value="all">All Languages</option>
          <option value="en">English (en)</option>
          <option value="hi">Hindi (hi)</option>
          <option value="gu">Gujarati (gu)</option>
          <option value="mr">Marathi (mr)</option>
          <option value="ta">Tamil (ta)</option>
          <option value="te">Telugu (te)</option>
        </select>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-md border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-ink-soft border-b border-line font-sans font-bold">
              <tr>
                <th className="px-6 py-3.5">Rule Key</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Language</th>
                <th className="px-6 py-3.5">Title & Interpretation Content</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center font-sans text-xs text-ink-soft">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Querying astrological rules from MySQL...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center font-sans text-xs text-ink-muted">
                    No rules found.
                  </td>
                </tr>
              ) : filtered.map((rule) => (
                <tr key={rule.id} className="hover:bg-surface/60 transition">
                  <td className="px-6 py-4 font-mono font-bold text-ink text-xs">
                    {rule.ruleKey}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-surface-alt text-ink font-mono text-[10px] font-semibold border border-line">
                      {rule.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono uppercase font-bold text-ink-soft">
                    {rule.lang}
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="font-bold text-ink">{rule.title}</div>
                    <div className="text-ink-soft text-xs mt-1 leading-relaxed">{rule.description}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="px-2.5 py-1 rounded bg-surface-alt hover:bg-line text-ink border border-line text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-line flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-sm text-ink">{form.id ? "Edit Rule" : "Add New Rule"}</h3>
              <button onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-alt text-ink-soft">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Rule Key</label>
                  <input
                    type="text"
                    value={form.ruleKey}
                    onChange={(e) => setForm({ ...form, ruleKey: e.target.value })}
                    placeholder="SUN_HOUSE_10"
                    className="w-full px-3 py-2 rounded-lg border border-line text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Language</label>
                  <select
                    value={form.lang}
                    onChange={(e) => setForm({ ...form, lang: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-line text-xs"
                  >
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="gu">Gujarati (gu)</option>
                    <option value="mr">Marathi (mr)</option>
                    <option value="ta">Tamil (ta)</option>
                    <option value="te">Telugu (te)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="PLANET_IN_HOUSE"
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Remedy (optional)</label>
                <textarea
                  value={form.remedy}
                  onChange={(e) => setForm({ ...form, remedy: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !form.ruleKey || !form.category || !form.title || !form.description}
                className="w-full py-2.5 rounded-lg bg-console hover:bg-console-line text-white font-semibold text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{form.id ? "Save Changes" : "Create Rule"}</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
