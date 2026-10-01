"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { FileText, ExternalLink } from "lucide-react";

interface IssuedInvoice {
  id: string;
  number: string;
  type: "SALE" | "USAGE";
  issuedAt: string;
  periodStart: string | null;
  description: string;
  quantity: number;
  gross: number;
}

export function IssuedInvoicesCard() {
  const [invoices, setInvoices] = useState<IssuedInvoice[] | null>(null);

  useEffect(() => {
    axios
      .get("/api/billing/invoices")
      .then((res) => setInvoices(res.data?.invoices || []))
      .catch(() => setInvoices([]));
  }, []);

  if (invoices === null) return null;

  return (
    <div className="bg-white rounded-md border border-line shadow-xs">
      <div className="px-6 py-4 border-b border-line">
        <h2 className="text-sm font-bold text-ink">GST tax invoices</h2>
        <p className="text-xs text-ink-soft mt-1">
          Wallet recharges are prepaid deposits and carry no GST (you get a receipt). GST is invoiced when the
          wallet is used: one invoice per purchase, and <strong>one consolidated invoice at the end of each month</strong>{" "}
          for per-call overage and report charges.
        </p>
      </div>
      {invoices.length === 0 ? (
        <div className="p-6 text-xs text-ink-muted">No tax invoices issued yet.</div>
      ) : (
        <div className="divide-y divide-line">
          {invoices.map((inv) => (
            <div key={inv.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-mono font-bold text-ink">{inv.number}</div>
                <div className="text-ink-soft mt-0.5">
                  {inv.type === "USAGE"
                    ? `Usage ${inv.periodStart ? new Date(inv.periodStart).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : ""} · ${inv.quantity.toLocaleString("en-IN")} billed calls / reports`
                    : inv.description}
                  {" · "}
                  {new Date(inv.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-ink">₹{inv.gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <a
                  href={`/api/billing/invoice/${inv.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-surface text-ink font-semibold shadow-2xs transition"
                >
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>View</span>
                  <ExternalLink className="w-3 h-3 text-ink-muted" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
