"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BadgePercent, CalendarDays, Loader2, Pencil, Plus, Power, Users, X } from "lucide-react";

type OfferScope = "GLOBAL" | "PERSONALIZED";
type TargetType = "PLAN" | "ADDON";
type DiscountType = "PERCENT" | "FIXED";

interface OfferItem {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  scope: OfferScope;
  targetType: TargetType;
  targetId?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number | null;
  minimumAmount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  assignedUser?: { email: string; name?: string | null } | null;
  _count?: { redemptions: number };
}

const toInputDate = (value: Date | string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const freshForm = () => ({
  id: "",
  code: "",
  title: "",
  description: "",
  scope: "GLOBAL" as OfferScope,
  assignedUserEmail: "",
  targetType: "PLAN" as TargetType,
  targetId: "",
  discountType: "PERCENT" as DiscountType,
  discountValue: "10",
  maxDiscount: "",
  minimumAmount: "0",
  startsAt: toInputDate(new Date()),
  endsAt: toInputDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  isActive: true,
});

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(freshForm());

  const load = async () => {
    setLoading(true);
    try {
      const [offerRes, planRes, addonRes] = await Promise.all([
        axios.get("/api/admin/offers"),
        axios.get("/api/plans"),
        axios.get("/api/admin/addons"),
      ]);
      setOffers(offerRes.data?.data || []);
      setPlans(planRes.data?.data || []);
      setAddons(addonRes.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Offers could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const targetOptions = useMemo(() => form.targetType === "PLAN"
    ? plans.map((item) => ({ id: item.tier, label: `${item.name} (${item.tier})` }))
    : addons.map((item) => ({ id: item.id, label: item.name })), [form.targetType, plans, addons]);

  const openCreate = () => {
    setForm(freshForm());
    setError("");
    setModalOpen(true);
  };

  const openEdit = (offer: OfferItem) => {
    setForm({
      id: offer.id,
      code: offer.code,
      title: offer.title,
      description: offer.description || "",
      scope: offer.scope,
      assignedUserEmail: offer.assignedUser?.email || "",
      targetType: offer.targetType,
      targetId: offer.targetId || "",
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      maxDiscount: offer.maxDiscount == null ? "" : String(offer.maxDiscount),
      minimumAmount: String(offer.minimumAmount || 0),
      startsAt: toInputDate(offer.startsAt),
      endsAt: toInputDate(offer.endsAt),
      isActive: offer.isActive,
    });
    setError("");
    setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await axios.post("/api/admin/offers", form);
      setNotice(res.data?.message || "Offer saved.");
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Offer could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (offer: OfferItem) => {
    setError("");
    try {
      await axios.delete(`/api/admin/offers?id=${offer.id}`);
      setNotice(`${offer.code} is now ${offer.isActive ? "inactive" : "active"}.`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Offer status could not be changed.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Offers & one-time coupons</h1>
          <p className="text-sm text-slate-500 mt-1">Create global or user-specific discounts for plans and add-on packages.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Create offer
        </button>
      </div>

      {(notice || error) && (
        <div className={`rounded-xl border px-4 py-3 text-xs ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {error || notice}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Total offers</div><div className="text-2xl font-black text-slate-900 mt-1">{offers.length}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Active now</div><div className="text-2xl font-black text-emerald-700 mt-1">{offers.filter((item) => item.isActive && new Date(item.endsAt) >= new Date()).length}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">One-time redemptions</div><div className="text-2xl font-black text-violet-700 mt-1">{offers.reduce((sum, item) => sum + (item._count?.redemptions || 0), 0)}</div></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-14 flex items-center justify-center text-slate-500 text-sm"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="p-14 text-center"><BadgePercent className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="font-bold text-slate-800">No offers yet</div><p className="text-xs text-slate-500 mt-1">Create the first global or personalized checkout offer.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider"><tr><th className="px-5 py-3">Offer</th><th className="px-5 py-3">Audience</th><th className="px-5 py-3">Package</th><th className="px-5 py-3">Discount</th><th className="px-5 py-3">Validity / Uses</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((offer) => (
                  <tr key={offer.id} className={!offer.isActive ? "opacity-55" : ""}>
                    <td className="px-5 py-4"><div className="font-mono font-black text-violet-700">{offer.code}</div><div className="font-semibold text-slate-900 mt-0.5">{offer.title}</div></td>
                    <td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold"><Users className="w-3 h-3" />{offer.scope === "GLOBAL" ? "All users" : offer.assignedUser?.email}</span></td>
                    <td className="px-5 py-4"><div className="font-semibold text-slate-800">{offer.targetType}</div><div className="text-slate-500">{offer.targetId || `All ${offer.targetType.toLowerCase()} packages`}</div></td>
                    <td className="px-5 py-4 font-bold text-emerald-700">{offer.discountType === "PERCENT" ? `${offer.discountValue}%` : `₹${offer.discountValue}`}{offer.maxDiscount ? <div className="text-[10px] font-normal text-slate-500">max ₹{offer.maxDiscount}</div> : null}</td>
                    <td className="px-5 py-4"><div className="flex items-center gap-1 text-slate-700"><CalendarDays className="w-3 h-3" /> until {new Date(offer.endsAt).toLocaleDateString()}</div><div className="text-slate-500 mt-1">{offer._count?.redemptions || 0} redeemed</div></td>
                    <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => openEdit(offer)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" title="Edit"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => toggle(offer)} className={`p-2 rounded-lg border ${offer.isActive ? "border-rose-200 text-rose-600" : "border-emerald-200 text-emerald-600"}`} title={offer.isActive ? "Deactivate" : "Activate"}><Power className="w-3.5 h-3.5" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><div><h2 className="font-bold text-slate-900">{form.id ? "Edit offer" : "Create offer"}</h2><p className="text-xs text-slate-500">Every offer is automatically limited to one redemption per user.</p></div><button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button></div>
            <form onSubmit={save} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Offer code</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono uppercase" placeholder="FESTIVE25" /></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Offer title</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" placeholder="Festival discount" /></label>
              <label className="sm:col-span-2 space-y-1.5"><span className="font-semibold text-slate-700">User-facing description</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" rows={2} /></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Audience</span><select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as OfferScope })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5"><option value="GLOBAL">Global — all users</option><option value="PERSONALIZED">Personalized — one user</option></select></label>
              {form.scope === "PERSONALIZED" ? <label className="space-y-1.5"><span className="font-semibold text-slate-700">Assigned user email</span><input type="email" required value={form.assignedUserEmail} onChange={(e) => setForm({ ...form, assignedUserEmail: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label> : <div />}
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Package type</span><select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value as TargetType, targetId: "" })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5"><option value="PLAN">Subscription plan</option><option value="ADDON">Add-on package</option></select></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Specific package (optional)</span><select value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5"><option value="">All {form.targetType.toLowerCase()} packages</option>{targetOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Discount type</span><select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5"><option value="PERCENT">Percentage</option><option value="FIXED">Fixed rupees</option></select></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Discount value</span><input type="number" min="0.01" step="0.01" required value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Minimum purchase (₹)</span><input type="number" min="0" step="0.01" value={form.minimumAmount} onChange={(e) => setForm({ ...form, minimumAmount: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Maximum discount (₹, optional)</span><input type="number" min="0" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Starts at</span><input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
              <label className="space-y-1.5"><span className="font-semibold text-slate-700">Ends at</span><input type="datetime-local" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
              {error && <div className="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">{error}</div>}
              <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-2"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active immediately</label><div className="flex gap-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 font-bold text-slate-700">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 font-bold text-white disabled:opacity-50">{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save offer</button></div></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
