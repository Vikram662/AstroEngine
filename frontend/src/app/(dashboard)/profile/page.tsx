"use client";

import React, { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Calendar
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    name: string;
    role: string;
    planTier: string;
    createdAt: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then(res => res.json())
      .then(json => {
        if (json.status === "success" && json.data) {
          setProfile(json.data);
          setName(json.data.name || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setMessage({ text: "Profile updated successfully.", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ text: data.message || "Failed to update profile.", type: "error" });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setMessage({ text: error.message || "Network error.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Developer Profile & Credentials</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account details, developer identity, and update portal passwords.
        </p>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{profile?.name || "Developer"}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{profile?.email}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Tier: {profile?.planTier || "STARTER"}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Role: {profile?.role || "USER"}
          </span>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read-Only)</label>
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Security & Password</h3>
          </div>

          <p className="text-xs text-slate-500">
            Leave blank if you do not wish to change your account password.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
