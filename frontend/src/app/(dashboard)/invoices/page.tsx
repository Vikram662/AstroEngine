"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { Receipt, FileText, Download, Building2, CreditCard, Save, CheckCircle2, AlertCircle, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import type { ApiData } from "@/lib/apiTypes";

interface TaxProfile {
  businessName: string;
  gstin: string;
  pan: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
}

interface TransactionItem {
  id: string;
  orderId: string;
  amount: number;
  creditsAdded: number;
  date: string;
  status: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry", "Other"
];

export default function InvoicesPage() {
  const [taxProfile, setTaxProfile] = useState<TaxProfile>({
    businessName: "",
    gstin: "",
    pan: "",
    address: "",
    state: "Maharashtra",
    city: "",
    pincode: ""
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTax, setSavingTax] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchInvoicesAndTax = async () => {
    try {
      setLoading(true);
      const [userRes, txRes] = await Promise.all([
        axios.get("/api/user/me"),
        axios.get("/api/billing/recharge")
      ]);

      if (userRes.data?.data) {
        const u = userRes.data.data;
        const tp = u.taxProfile || {};
        setTaxProfile({
          businessName: tp.businessName || u.name || "",
          gstin: tp.gstin || "",
          pan: tp.pan || "",
          address: tp.address || "",
          state: tp.state || "Maharashtra",
          city: tp.city || "",
          pincode: tp.pincode || ""
        });
      }

      if (txRes.data?.transactions) {
        setTransactions(txRes.data.transactions.map((t: ApiData) => ({
          id: t.id,
          orderId: t.gatewayOrderId || t.id.substring(0, 10),
          amount: t.amount,
          creditsAdded: t.creditsAdded,
          date: new Date(t.createdAt).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
          status: t.status
        })));
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchInvoicesAndTax);
  }, []);

  const handleSaveTaxProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Basic Indian GSTIN format check if provided (15 alphanum characters)
    const cleanGst = taxProfile.gstin.trim().toUpperCase();
    if (cleanGst && cleanGst.length !== 15) {
      setMessage({
        text: "Please enter a valid 15-character Indian GSTIN (e.g. 27ABCDE1234F1Z5).",
        type: "error"
      });
      return;
    }

    setSavingTax(true);
    try {
      const res = await axios.patch("/api/user/me", {
        taxProfile: {
          ...taxProfile,
          gstin: cleanGst,
          pan: taxProfile.pan.trim().toUpperCase() || (cleanGst.length >= 12 ? cleanGst.substring(2, 12) : "")
        }
      });

      if (res.data?.status === "success") {
        setMessage({
          text: "GST & Tax Profile saved successfully! Future invoices will reflect these details.",
          type: "success"
        });
      } else {
        setMessage({
          text: res.data?.message || "Failed to update tax profile.",
          type: "error"
        });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setMessage({
        text: error.response?.data?.message || error.message || "Failed to save profile.",
        type: "error"
      });
    } finally {
      setSavingTax(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-md bg-console text-white shadow-xs">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-ink">Invoices & GST Tax Details</h1>
          </div>
          <p className="text-ink-soft text-xs sm:text-sm mt-1.5 leading-relaxed">
            Manage your legal entity tax information (GSTIN, Address, State) and download Section 31 compliant Tax Invoices for input tax credits (ITC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/billing"
            className="px-3.5 py-2 rounded-lg border border-line bg-surface hover:bg-surface-alt text-ink font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <CreditCard className="w-3.5 h-3.5 text-ink-soft" />
            <span>Go to Billing & Wallet</span>
          </Link>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-md border text-xs font-semibold flex items-center gap-2.5 shadow-sm ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* GST & Tax Profile Setup Form */}
      <div className="bg-white rounded-lg border border-line shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-surface/70 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-ink" />
            <h2 className="text-sm font-bold text-ink">Company & GST Registration Profile</h2>
          </div>
          <span className="text-[11px] font-semibold text-ink-soft bg-white px-2.5 py-1 rounded-md border border-line shadow-2xs">
            Used on Official Invoices
          </span>
        </div>

        <form onSubmit={handleSaveTaxProfile} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Legal Business Name */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Legal Entity / Company Name
              </label>
              <input
                type="text"
                value={taxProfile.businessName}
                onChange={(e) => setTaxProfile({ ...taxProfile, businessName: e.target.value })}
                placeholder="e.g. Acme Astrotech Solutions Pvt. Ltd."
                className="w-full px-3 py-2.5 rounded-lg border border-line bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-console-line transition"
              />
              <span className="text-[11px] text-ink-muted mt-1 block">
                The registered business name to appear on the invoice.
              </span>
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                GSTIN (Goods and Services Tax ID)
              </label>
              <input
                type="text"
                maxLength={15}
                value={taxProfile.gstin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setTaxProfile({
                    ...taxProfile,
                    gstin: val,
                    pan: val.length >= 12 && !taxProfile.pan ? val.substring(2, 12) : taxProfile.pan
                  });
                }}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full px-3 py-2.5 rounded-lg border border-line bg-white text-xs font-mono font-medium text-ink uppercase focus:outline-none focus:ring-2 focus:ring-ink focus:border-console-line transition"
              />
              <span className="text-[11px] text-ink-muted mt-1 block">
                Required to claim 18% Input Tax Credit (ITC) in your monthly GSTR-2B.
              </span>
            </div>

            {/* PAN Number */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                maxLength={10}
                value={taxProfile.pan}
                onChange={(e) => setTaxProfile({ ...taxProfile, pan: e.target.value.toUpperCase() })}
                placeholder="e.g. AAAAA0000A"
                className="w-full px-3 py-2.5 rounded-lg border border-line bg-white text-xs font-mono font-medium text-ink uppercase focus:outline-none focus:ring-2 focus:ring-ink focus:border-console-line transition"
              />
              <span className="text-[11px] text-ink-muted mt-1 block">
                10-digit PAN (auto-derived from GSTIN if left blank).
              </span>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                State / Place of Supply
              </label>
              <select
                value={taxProfile.state}
                onChange={(e) => setTaxProfile({ ...taxProfile, state: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-line bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-console-line transition"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st} {st === "Maharashtra" ? "(Intra-State CGST+SGST)" : "(Inter-State IGST)"}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Supplier is based in Maharashtra (State 27). Out-of-state attracts 18% IGST.
              </span>
            </div>
          </div>

          {/* Full Registered Address */}
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Registered Billing Street Address
            </label>
            <textarea
              rows={2}
              value={taxProfile.address}
              onChange={(e) => setTaxProfile({ ...taxProfile, address: e.target.value })}
              placeholder="Suite #, Building Name, Street, Landmark..."
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-console-line transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                City / Town
              </label>
              <input
                type="text"
                value={taxProfile.city}
                onChange={(e) => setTaxProfile({ ...taxProfile, city: e.target.value })}
                placeholder="e.g. Mumbai, Bengaluru"
                className="w-full px-3 py-2.5 rounded-lg border border-line bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-console-line transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                PIN Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={taxProfile.pincode}
                onChange={(e) => setTaxProfile({ ...taxProfile, pincode: e.target.value })}
                placeholder="e.g. 400001"
                className="w-full px-3 py-2.5 rounded-lg border border-line bg-white text-xs font-mono text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-console-line transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Details are stored securely and encrypted in your workspace database.</span>
            </div>

            <button
              type="submit"
              disabled={savingTax}
              className="px-5 py-2.5 rounded-lg bg-console hover:bg-console-line text-white font-bold text-xs shadow flex items-center gap-2 transition disabled:opacity-50"
            >
              {savingTax ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save GST & Tax Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Settled Transactions & GST Invoices Table */}
      <div className="bg-white rounded-lg border border-line shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-surface/70 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-ink">Settled Transactions & Downloadable Tax Invoices</h3>
            <p className="text-[11px] text-ink-soft mt-0.5">
              Click &quot;GST Invoice (PDF)&quot; to view or print the official tax invoice.
            </p>
          </div>

          {transactions.length > 0 && (
            <button
              onClick={() => {
                const header = "Invoice ID,Date,Order ID,Amount,Status\n";
                const rows = transactions
                  .map((tx) => `"${tx.id}","${tx.date}","${tx.orderId}",${tx.amount},"${tx.status}"`)
                  .join("\n");
                const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `All_Invoices_${new Date().toISOString().slice(0, 10)}.csv`);
                link.click();
              }}
              className="px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-surface text-ink font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-ink-soft" />
              <span>Export Invoices (CSV)</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-line text-xs text-ink">
          {loading ? (
            <div className="p-12 text-center text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-ink-soft" />
              <span>Loading settled invoices...</span>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface/60 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">Tax Invoice #{tx.id.substring(0, 8).toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-ink-soft text-[11px] mt-1 font-mono">
                    Order Ref: {tx.orderId} • {tx.date}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-ink font-bold text-sm">
                      ₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      {tx.creditsAdded > 0 ? `+${tx.creditsAdded.toLocaleString()} credits` : "Subscription Activated"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/billing/invoice/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-surface text-ink font-semibold text-xs shadow-2xs transition"
                      title={tx.creditsAdded > 0 ? "View payment receipt (wallet top-ups carry no GST)" : "View & Download Official GST Tax Invoice (PDF)"}
                    >
                      <FileText className="w-3.5 h-3.5 text-accent" />
                      <span>{tx.creditsAdded > 0 ? "Receipt" : "GST Invoice (PDF)"}</span>
                      <ExternalLink className="w-3 h-3 text-ink-muted" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-ink-muted">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-ink-soft">No settled transactions found.</p>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                Once you recharge your wallet or upgrade a subscription plan, GST-compliant invoices will be automatically generated here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
