"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, 
  Search, 
  Loader2
} from "lucide-react";

interface PredictionRule {
  id: number;
  ruleKey: string;
  lang: string;
  category: string;
  title: string;
  description: string;
}

export default function AdminPromptsPage() {
  const [rules, setRules] = useState<PredictionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLang, setSelectedLang] = useState("all");

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
    fetchRules();
  }, []);

  const filtered = rules.filter(r => {
    const matchesSearch = r.ruleKey.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLang === "all" || r.lang === selectedLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Astrological Interpretation Rules</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Manage multi-lingual interpretation paragraphs stored in MySQL (<code className="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded border">AstrologicalPrediction</code> table §6) injected into PDF reports.
          </p>
        </div>
        <button
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Rule</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ruleKey (e.g. SUN_HOUSE_10) or title..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
          />
        </div>
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-sans font-bold">
              <tr>
                <th className="px-6 py-3.5">Rule Key</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Language</th>
                <th className="px-6 py-3.5">Title & Interpretation Content</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center font-sans text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Querying astrological rules from MySQL...
                  </td>
                </tr>
              ) : filtered.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">
                    {rule.ruleKey}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
                      {rule.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono uppercase font-bold text-slate-600">
                    {rule.lang}
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="font-bold text-slate-900">{rule.title}</div>
                    <div className="text-slate-600 text-xs mt-1 leading-relaxed">{rule.description}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
