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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
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
    void Promise.resolve().then(fetchData);
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
      <div className="bg-white p-6 rounded-md border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Tenant & User Accounts</h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            Manage developer accounts, inspect live wallet balances, assign subscription tiers, or grant modular add-ons.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Search user, email or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface border border-line pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-ink-muted w-64 text-ink font-medium"
            />
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-md border border-line shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-ink border-b border-line font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Plan & Add-ons</th>
                <th className="px-6 py-3.5">Balance</th>
                <th className="px-6 py-3.5">Usage / Quota</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-muted">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-accent" />
                    Fetching live tenants from MySQL...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-muted text-xs">
                    No users found matching your search query.
                  </td>
                </tr>
              ) : (
                filteredUsers
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((u) => {
                    const userAddonList = Array.isArray(u.activeAddons) ? u.activeAddons : [];
                    return (
                      <tr key={u.id} className="hover:bg-surface/70 transition">
                        {/* User */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-ink text-xs">{u.name || "—"}</div>
                          <div className="text-ink-soft text-[11px] font-mono">{u.email}</div>
                          <div className="text-ink-muted text-[10px] mt-0.5 font-mono">
                            Key: {u.apiKeyPrefix || "—"}
                          </div>
                        </td>

                        {/* Plan & Add-ons */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-surface-alt text-ink border border-line">
                              {u.planTier}
                            </span>
                            <button
                              onClick={() => { setSelectedUserForPlan(u); setNewPlanTier(u.planTier); }}
                              className="text-accent hover:text-accent-hover p-1"
                              title="Change Plan Tier"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-mono text-[10px] text-ink-soft font-semibold">
                              {u.planTier === "ENTERPRISE" ? (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">All Included</span>
                              ) : userAddonList.length > 0 ? (
                                <span className="bg-accent-soft text-accent-hover border border-accent/30 px-1.5 py-0.5 rounded font-bold">
                                  {userAddonList.length} Active
                                </span>
                              ) : (
                                <span className="text-ink-muted">None</span>
                              )}
                            </span>
                            <button
                              onClick={() => handleOpenAddonsModal(u)}
                              className="text-accent hover:text-accent-hover p-1"
                              title="Manage User Modular Add-ons"
                            >
                              <Package className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Balance */}
                        <td className="px-6 py-4 font-mono font-extrabold text-ink">
                          ₹{(u.walletBalance || 0).toFixed(2)}
                        </td>

                        {/* Usage / Quota */}
                        <td className="px-6 py-4 font-mono text-[11px] text-ink-soft">
                          {(u.monthlyUsage || 0).toLocaleString()} / {(u.monthlyQuota || 0).toLocaleString()}
                        </td>

                        {/* Status */}
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

                        {/* Actions */}
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedUserForCredit(u)}
                            className="px-2.5 py-1 rounded bg-surface-alt hover:bg-line text-ink border border-line text-xs font-semibold transition"
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
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="bg-surface px-6 py-3.5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-soft">
            <div>
              Showing <span className="font-semibold text-ink">
                {(currentPage - 1) * pageSize + 1}
              </span> to{" "}
              <span className="font-semibold text-ink">
                {Math.min(currentPage * pageSize, filteredUsers.length)}
              </span> of{" "}
              <span className="font-semibold text-ink">{filteredUsers.length}</span> total users
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                  className="px-2 py-1 rounded border border-line bg-white hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
                >
                  &laquo;
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-2.5 py-1 rounded border border-line bg-white hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
                >
                  Prev
                </button>
                <span className="px-3 py-1 font-semibold text-ink bg-white border border-line rounded">
                  Page {currentPage} of {Math.ceil(filteredUsers.length / pageSize) || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / pageSize) || 1, p + 1))}
                  disabled={currentPage >= Math.ceil(filteredUsers.length / pageSize)}
                  className="px-2.5 py-1 rounded border border-line bg-white hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.ceil(filteredUsers.length / pageSize) || 1)}
                  disabled={currentPage >= Math.ceil(filteredUsers.length / pageSize)}
                  className="px-2 py-1 rounded border border-line bg-white hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
                >
                  &raquo;
                </button>
              </div>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-line rounded px-2 py-1 text-xs text-ink font-medium focus:outline-none"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Credit Recharge Modal */}
      {selectedUserForCredit && (
        <div className="fixed inset-0 z-50 bg-console/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-line p-6 max-w-md w-full space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-ink">Add Wallet Credits</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Manually credit wallet balance for developer <strong className="text-ink">{selectedUserForCredit.email}</strong>. 
              This will be recorded directly in the audit trail.
            </p>

            <form onSubmit={handleAddCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">
                  Credit Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-ink-soft font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={creditInput}
                    onChange={(e) => setCreditInput(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg pl-7 pr-3 py-2 text-xs text-ink font-mono font-bold focus:outline-none focus:border-console-line"
                    placeholder="500.00"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForCredit(null)}
                  className="px-3 py-1.5 rounded-lg text-ink-soft hover:bg-surface-alt text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-1.5 rounded-lg bg-console hover:bg-console-line text-white text-xs font-semibold shadow flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-console/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-line p-6 max-w-md w-full space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-ink">Change User Plan Tier</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Select dynamic plan for <strong className="text-ink">{selectedUserForPlan.email}</strong>. Quota and rate limits will be automatically updated from MySQL `SubscriptionPlan` table.
            </p>

            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">
                  Subscription Tier
                </label>
                <select
                  value={newPlanTier}
                  onChange={(e) => setNewPlanTier(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink font-bold focus:outline-none focus:border-console-line"
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
                  className="px-3 py-1.5 rounded-lg text-ink-soft hover:bg-surface-alt text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-1.5 rounded-lg bg-console hover:bg-console-line text-white text-xs font-semibold shadow flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-console/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-line p-6 max-w-lg w-full space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Manage Modular Add-ons</h3>
                <p className="text-xs text-ink-soft font-mono">
                  User: {selectedUserForAddons.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAddons(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-soft">
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
                          ? "bg-accent-soft/70 border-accent/40"
                          : "bg-surface border-line opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUserAddonSelection(addon.id)}
                          className="rounded text-accent"
                        />
                        <div>
                          <div className="font-bold text-xs text-ink">{addon.name}</div>
                          <div className="text-[10px] text-ink-soft font-mono">ID: {addon.id} • ₹{addon.priceMonthly}/mo</div>
                        </div>
                      </div>
                      {isChecked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-soft text-accent-hover">
                          Active
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setSelectedUserForAddons(null)}
                  className="px-3 py-1.5 rounded-lg text-ink-soft hover:bg-surface-alt text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow flex items-center gap-1.5"
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
