"use client";

import React from "react";

export const ResultSection: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className = "",
}) => (
  <div className={`bg-card rounded-2xl border border-line p-5 sm:p-6 ${className}`}>
    {title && <h3 className="text-sm font-bold text-ink mb-3">{title}</h3>}
    {children}
  </div>
);

export const ResultRow: React.FC<{ label: string; value: React.ReactNode; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-line/60 last:border-b-0 text-sm">
    <span className="text-ink-soft">{label}</span>
    <span className={`font-semibold text-right ${accent ? "text-accent" : "text-ink"}`}>{value}</span>
  </div>
);

export const ResultBadge: React.FC<{ children: React.ReactNode; tone?: "accent" | "good" | "bad" | "neutral" }> = ({
  children,
  tone = "neutral",
}) => {
  const cls =
    tone === "accent"
      ? "bg-accent-soft text-accent border-accent/30"
      : tone === "good"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "bad"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : "bg-surface-alt text-ink-soft border-line";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {children}
    </span>
  );
};

export const SubmitButton: React.FC<
  { loading?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ loading, children, className, ...rest }) => (
  <button
    type="submit"
    disabled={loading || rest.disabled}
    className={
      className ||
      "w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition shadow-md shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
    }
    {...rest}
  >
    {children}
  </button>
);

export const ErrorNote: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">{message}</div>
);
