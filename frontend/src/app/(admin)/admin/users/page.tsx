"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, 
  Search, 
  CheckCircle, 
  Loader2,
  Edit,
  ShieldAlert,
  Coins,
  Package,
  Check,
  X
} from "lucide-react";

interface TenantUser {
  id: string;
  name: string;
  email: string;
  planTier: string;
  walletBalance: number;
  monthlyUsage: number;
  monthlyQuota: number;
  isBlocked: boolean;
  apiKeyPrefix: string;
  activeAddons?: string[];
  createdAt: string;
}

interface PlanOption {
  id: string;
  tier: string;
  name: string;
  includedQuota: number;
}

interface AddonOption {
  id: string;
  name: string;
  category: string;
  priceMonthly: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);
  const [availableAddons, setAvailableAddons] = useState<AddonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<TenantUser | null>(null);
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<TenantUser | null>(null);
  const [selectedUserForAddons, setSelectedUserForAddons] = useState<TenantUser | null>(null);
  const [creditInput, setCreditInput] = useState("500");
  const [newPlanTier, setNewPlanTier] = useState("STARTER");
  const [userAddonsSelection, setUserAddonsSelection] = useState<string[]>([]);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get("/api/admin/data?type=users"),
      axios.get("/api/plans"),
      axios.get("/api/admin/addons")
    ])
      .then(([usersRes, plansRes, addonsRes]) => {
        if (usersRes.data?.data) {
          setUsers(usersRes.data.data);
        }
        if (plansRes.data?.data) {
          setAvailablePlans(plansRes.data.data);
        }
        if (addonsRes.data?.data) {
          setAvailableAddons(addonsRes.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.planTier || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleBlock = async (userId: string, currentBlocked: boolean) => {
    const nextState = !currentBlocked;
    try {
      await axios.patch("/api/admin/data", {
        userId,
        isBlocked: nextState
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: nextState } : u));
      setActionSuccess(`User status changed to ${nextState ? "BLOCKED" : "ACTIVE"}.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch {
      alert("Failed to update user status");
    }
  };

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCredit) return;
    const addedAmount = parseFloat(creditInput);
    if (isNaN(addedAmount)) return;

    setSubmittingAction(true);
    try {
      await axios.patch("/api/admin/data", {
        userId: selectedUserForCredit.id,
        addCredit: addedAmount
      });
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUserForCredit.id) {
          return { ...u, walletBalance: u.walletBalance + addedAmount };
        }
        return u;
      }));
      setActionSuccess(`Added ₹${addedAmount.toFixed(2)} credits to ${selectedUserForCredit.email}. Audit logged.`);
      setSelectedUserForCredit(null);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch {
      alert("Failed to add credits");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPlan) return;

    setSubmittingAction(true);
    try {
      await axios.patch("/api/admin/data", {
        userId: selectedUserForPlan.id,
        planTier: newPlanTier
      });
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUserForPlan.id) {
          return { ...u, planTier: newPlanTier };
        }
        return u;
      }));
      setActionSuccess(`User plan tier updated to ${newPlanTier}.`);
      setSelectedUserForPlan(null);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch {
      alert("Failed to update user plan");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenAddonsModal = (user: TenantUser) => {
    setSelectedUserForAddons(user);
    setUserAddonsSelection(Array.isArray(user.activeAddons) ? user.activeAddons : []);
  };

  const toggleUserAddonSelection = (addonId: string) => {
    setUserAddonsSelection(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const handleUpdateUserAddons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAddons) return;

    setSubmittingAction(true);
    try {
      await axios.patch("/api/admin/data", {
        userId: selectedUserForAddons.id,
        activeAddons: userAddonsSelection
      });
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUserForAddons.id) {
          return { ...u, activeAddons: userAddonsSelection };
        }
        return u;
      }));
      setActionSuccess(`Add-ons updated for ${selectedUserForAddons.email}.`);
      setSelectedUserForAddons(null);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch {
      alert("Failed to update user add-ons");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenant & User Accounts</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Manage developer accounts, inspect live wallet balances, assign subscription tiers, or grant modular add-ons.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, email or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-slate-400 w-64 text-slate-900 font-medium"
            />
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3">Tenant / Email</th>
                <th className="px-6 py-3">Plan Tier</th>
                <th className="px-6 py-3">Modular Add-ons</th>
                <th className="px-6 py-3">Wallet Balance</th>
                <th className="px-6 py-3">Usage / Quota</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center font-sans text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Fetching tenants from MySQL database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No users matching &quot;{searchTerm}&quot; found in database.
                  </td>
                </tr>
              ) : filteredUsers.map((u) => {
                const userAddonList = Array.isArray(u.activeAddons) ? u.activeAddons : [];
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{u.name || "Developer"}</div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {u.planTier}
                        </span>
                        <button
                          onClick={() => { setSelectedUserForPlan(u); setNewPlanTier(u.planTier); }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Change Plan Tier"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-600 font-semibold">
                          {u.planTier === "ENTERPRISE" ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">All Included</span>
                          ) : userAddonList.length > 0 ? (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                              {userAddonList.length} Active
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </span>
                        <button
                          onClick={() => handleOpenAddonsModal(u)}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="Manage User Modular Add-ons"
                        >
                          <Package className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-extrabold text-slate-900">
                      ₹{(u.walletBalance || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                      {(u.monthlyUsage || 0).toLocaleString()} / {(u.monthlyQuota || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200 text-[10px]">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-[10px]">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedUserForCredit(u)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition"
                      >
                        + Credit
                      </button>
                      <button
                        onClick={() => toggleBlock(u.id, u.isBlocked)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          u.isBlocked
                            ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {u.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Recharge Modal */}
      {selectedUserForCredit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-300 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900">Add Wallet Credits</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Manually credit wallet balance for developer <strong className="text-slate-900">{selectedUserForCredit.email}</strong>. 
              This will be recorded directly in the audit trail.
            </p>

            <form onSubmit={handleAddCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Credit Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={creditInput}
                    onChange={(e) => setCreditInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                    placeholder="500.00"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForCredit(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow flex items-center gap-1.5"
                >
                  {submittingAction && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Confirm & Add</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Tier Update Modal */}
      {selectedUserForPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-300 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900">Change User Plan Tier</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select dynamic plan for <strong className="text-slate-900">{selectedUserForPlan.email}</strong>. Quota and rate limits will be automatically updated from MySQL `SubscriptionPlan` table.
            </p>

            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Subscription Tier
                </label>
                <select
                  value={newPlanTier}
                  onChange={(e) => setNewPlanTier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                >
                  {availablePlans.length > 0 ? (
                    availablePlans.map((p) => (
                      <option key={p.id} value={p.tier}>
                        {p.name} ({p.includedQuota.toLocaleString()} calls/mo)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="STARTER">STARTER (Free / 35,000 calls)</option>
                      <option value="PRO">PRO (300,000 calls)</option>
                      <option value="ENTERPRISE">ENTERPRISE (1,500,000 calls)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPlan(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow flex items-center gap-1.5"
                >
                  {submittingAction && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Save Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modular Add-ons Modal */}
      {selectedUserForAddons && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-300 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Modular Add-ons</h3>
                <p className="text-xs text-slate-500 font-mono">
                  User: {selectedUserForAddons.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAddons(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Grant or revoke standalone engine add-ons directly for this tenant without altering their core subscription plan:
            </p>

            <form onSubmit={handleUpdateUserAddons} className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {availableAddons.map((addon) => {
                  const isChecked = userAddonsSelection.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                        isChecked
                          ? "bg-purple-50/70 border-purple-300"
                          : "bg-slate-50 border-slate-200 opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUserAddonSelection(addon.id)}
                          className="rounded text-purple-600"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{addon.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {addon.id} • ₹{addon.priceMonthly}/mo</div>
                        </div>
                      </div>
                      {isChecked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          Active
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedUserForAddons(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow flex items-center gap-1.5"
                >
                  {submittingAction && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Update User Add-ons</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
