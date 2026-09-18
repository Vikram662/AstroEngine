"use client";

import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  KeyRound,
  Lock
} from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  role: "VIEWER" | "OPERATOR";
  apiKeyPrefix: string;
  invitedAt: string;
  status: "ACTIVE" | "PENDING";
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEWER" | "OPERATOR">("OPERATOR");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = () => {
    fetch("/api/user/team")
      .then(res => res.json())
      .then(json => {
        if (json.status === "success" && json.members) {
          setMembers(json.members.map((m: { id: string; email: string; role: "VIEWER" | "OPERATOR"; apiKeyPrefix: string; invitedAt: string; acceptedAt?: string }) => ({
            id: m.id,
            email: m.email,
            role: m.role,
            apiKeyPrefix: m.apiKeyPrefix || "ak_live_sub_demo",
            invitedAt: new Date(m.invitedAt).toLocaleDateString(),
            status: m.acceptedAt ? "ACTIVE" : "PENDING"
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchMembers();
        setInviteEmail("");
        setShowModal(false);
      } else {
        alert(data.message || "Failed to invite teammate.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Revoke access for this teammate?")) return;
    try {
      await fetch(`/api/user/team?id=${id}`, { method: "DELETE" });
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Enterprise Team Seats (§8.2.8)</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-900 rounded border border-amber-300">
              ENTERPRISE TIER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Delegate API access and dashboard views to team members without sharing master wallet or root credentials.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Teammate</span>
        </button>
      </div>

      {/* Shared Wallet Notice */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600">
          <strong className="text-slate-900 font-semibold block">Unified Master Wallet Architecture:</strong>
          All invited team members draw from the primary account&apos;s wallet balance. Each operator receives an independent scoped API key so logs and cost attribution remain distinct in your Usage Telemetry screen.
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member Email</th>
                <th className="py-3 px-4">Role Access</th>
                <th className="py-3 px-4">Scoped API Key</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Invited On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      member.role === "OPERATOR" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3 h-3 text-slate-400" />
                      {member.apiKeyPrefix}***
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      member.status === "ACTIVE" 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {member.status === "ACTIVE" ? <CheckCircle2 className="w-2.5 h-2.5" /> : null}
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {member.invitedAt}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Revoke Seat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <h2 className="text-base font-bold text-slate-900">Invite Team Member</h2>
            <p className="text-xs text-slate-500 mt-1">
              They will receive an invitation link to access this workspace under your enterprise subscription.
            </p>

            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@yourcompany.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Privileges
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "VIEWER" | "OPERATOR")}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden"
                >
                  <option value="OPERATOR">OPERATOR — Can generate PDFs and create scoped API keys</option>
                  <option value="VIEWER">VIEWER — Read-only access to metrics and billing receipts</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Neither role can cancel your plan or modify payment methods.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
