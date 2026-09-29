"use client";

import React, { useState } from "react";
import { useReportLabels } from "./ReportLabelsContext";

const MAX_ROWS = 24;
const MAX_TABLE_COLUMNS = 8;

type Primitive = string | number | boolean | null | undefined;

function isPrimitive(value: unknown): value is Primitive {
  return value === null || value === undefined || typeof value !== "object";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function formatPrimitive(value: Primitive, yes = "Yes", no = "No"): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? yes : no;
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Math.round(value * 10000) / 10000);
  return value;
}

function PrimitiveText({ value }: { value: Primitive }) {
  const labels = useReportLabels();
  const text = formatPrimitive(value, labels.yes, labels.no);
  const tone = typeof value === "boolean" ? (value ? "text-ink font-semibold" : "text-ink-soft") : "text-ink";
  return <span className={`${tone} break-words`}>{text}</span>;
}

function Collapsible({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="group rounded-md border border-line bg-surface" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-ink-soft marker:hidden [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <span className="font-mono text-[11px] text-ink-muted">
          {count} <span className="inline-block transition-transform group-open:rotate-90">›</span>
        </span>
      </summary>
      {open && <div className="border-t border-line p-3">{children}</div>}
    </details>
  );
}

const COMMON_LABELS: Record<string, string> = {
  planet: "ग्रह (Planet)",
  rashi: "राशि (Sign)",
  sign: "राशि (Sign)",
  sign_name: "राशि का नाम",
  degree: "अंश (Degree)",
  degrees: "अंश (Degree)",
  speed: "दैनिक गति",
  retrograde: "वक्री स्थिति",
  is_retrograde: "वक्री",
  house: "भाव (House)",
  house_num: "भाव संख्या",
  nakshatra: "नक्षत्र (Star)",
  pada: "चरण (Pada)",
  lord: "स्वामी (Lord)",
  rashi_lord: "राशि स्वामी",
  nakshatra_lord: "नक्षत्र स्वामी",
  sub_lord: "उप स्वामी (Sub-Lord)",
  status: "स्थिति",
  present: "उपस्थित",
  active: "सक्रिय",
  result: "परिणाम",
  score: "अंक / स्कोर",
  strength: "बल / प्रभाव",
  nature: "प्रकृति",
  start_date: "आरंभ तिथि",
  end_date: "समाप्ति तिथि",
  dasha: "दशा",
  antardasha: "अंतर्दशा",
  pratyantardasha: "प्रत्यंतर्दशा",
  tithi: "तिथि",
  yoga: "योग",
  karana: "करण",
  vaara: "वार (दिन)",
  muhurat: "मुहूर्त",
  auspicious: "शुभ",
  inauspicious: "अशुभ",
};

export function getFriendlyKey(key: string): string {
  const normalized = key.toLowerCase().trim();
  if (COMMON_LABELS[normalized]) return COMMON_LABELS[normalized];
  return humanize(key);
}

function ArrayOfRecords({ rows, depth }: { rows: Record<string, unknown>[]; depth: number }) {
  const labels = useReportLabels();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? rows : rows.slice(0, 10);

  const columns: string[] = [];
  for (const row of rows.slice(0, 60)) {
    for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key);
  }
  const scalarColumns = columns.filter((key) => rows.some((row) => isPrimitive(row[key]))).slice(0, 6);
  const nestedColumns = columns.filter((key) => !scalarColumns.includes(key) && rows.some((row) => !isPrimitive(row[key])));

  // If this list looks like planetary positions, houses, or dasha, render a friendly readable grid!
  const isKeyBasedList = scalarColumns.some(c => ["planet", "name", "house", "dasha", "rashi"].includes(c.toLowerCase()));

  if (isKeyBasedList) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visible.map((row, idx) => {
            const primaryTitle = String(row.planet || row.name || row.title || row.dasha || `Item #${idx + 1}`);
            const otherFields = scalarColumns.filter(c => !["planet", "name", "title", "dasha"].includes(c.toLowerCase()));
            const isRetro = row.retrograde === true || row.is_retrograde === true || String(row.retrograde).toLowerCase() === "true";

            return (
              <div key={idx} className="p-3 rounded-lg border border-line bg-surface flex flex-col justify-between hover:border-accent/40 transition">
                <div className="flex items-center justify-between pb-2 border-b border-line/60">
                  <span className="font-bold text-xs text-ink">{primaryTitle}</span>
                  {isRetro && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      वक्री (R)
                    </span>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                  {otherFields.map(f => (
                    <div key={f} className="flex justify-between items-center text-ink-soft pr-1">
                      <span className="text-[10px] text-ink-muted">{getFriendlyKey(f)}:</span>
                      <span className="font-semibold font-mono text-ink text-right truncate ml-1">
                        {formatPrimitive(row[f] as Primitive)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {rows.length > 10 && (
          <div className="text-center pt-1">
            <button 
              type="button" 
              onClick={() => setShowAll(v => !v)} 
              className="text-xs font-bold text-accent hover:text-accent-hover px-3 py-1 rounded-md border border-line bg-surface hover:bg-surface-alt cursor-pointer"
            >
              {showAll ? "कम पंक्तियाँ दिखाएँ" : `सभी ${rows.length} विवरण देखें →`}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-max text-left text-xs">
          <thead className="bg-surface-alt text-ink font-semibold border-b border-line">
            <tr>
              {scalarColumns.map((key) => (
                <th key={key} scope="col" className="px-3.5 py-2.5 whitespace-nowrap text-[11px] font-bold">
                  {getFriendlyKey(key)}
                </th>
              ))}
              {nestedColumns.length > 0 && (
                <th scope="col" className="px-3.5 py-2.5 font-bold text-[11px]">
                  {labels.details}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-card">
            {visible.map((row, index) => (
              <tr key={index} className="hover:bg-surface-alt/40 transition">
                {scalarColumns.map((key) => (
                  <td key={key} className="px-3.5 py-2 tabular-nums">
                    {isPrimitive(row[key]) ? <PrimitiveText value={row[key] as Primitive} /> : <span className="text-ink-muted">{labels.seeDetails}</span>}
                  </td>
                ))}
                {nestedColumns.length > 0 && (
                  <td className="px-3.5 py-2 min-w-56">
                    <div className="space-y-1.5">
                      {nestedColumns
                        .filter((key) => !isPrimitive(row[key]))
                        .map((key) => (
                          <Collapsible key={key} label={getFriendlyKey(key)} count={Array.isArray(row[key]) ? (row[key] as unknown[]).length : Object.keys(row[key] as object).length}>
                            <DataView value={row[key]} depth={depth + 2} />
                          </Collapsible>
                        ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-semibold text-accent hover:text-accent-hover cursor-pointer">
          {showAll ? labels.showFewer : labels.showAll(rows.length)}
        </button>
      )}
    </div>
  );
}

export function DataView({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (isPrimitive(value)) return <PrimitiveText value={value} />;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-ink-muted">-</span>;

    if (value.every(isPrimitive)) {
      return (
        <ul className="flex flex-wrap gap-1.5">
          {(value as Primitive[]).slice(0, 200).map((item, index) => (
            <li key={index} className="rounded-md border border-line bg-surface px-2 py-0.5 text-xs tabular-nums text-ink">
              {formatPrimitive(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (value.every(isRecord)) return <ArrayOfRecords rows={value as Record<string, unknown>[]} depth={depth} />;

    return (
      <ol className="space-y-2">
        {value.map((item, index) => (
          <li key={index}>
            <DataView value={item} depth={depth + 1} />
          </li>
        ))}
      </ol>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return <span className="text-ink-muted">-</span>;

  const scalars = entries.filter(([, v]) => isPrimitive(v));
  const nested = entries.filter(([, v]) => !isPrimitive(v));

  return (
    <div className="space-y-3">
      {scalars.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2 xl:grid-cols-3">
          {scalars.map(([key, v]) => (
            <div key={key} className="flex items-baseline justify-between gap-3 p-2.5 rounded-md bg-surface border border-line/60">
              <dt className="text-ink-soft text-[11px] font-medium">{getFriendlyKey(key)}</dt>
              <dd className="text-right tabular-nums font-bold text-ink">
                <PrimitiveText value={v as Primitive} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {nested.map(([key, v]) => {
        const size = Array.isArray(v) ? v.length : Object.keys(v as object).length;
        const body = <DataView value={v} depth={depth + 1} />;
        return depth >= 1 ? (
          <Collapsible key={key} label={getFriendlyKey(key)} count={size}>
            {body}
          </Collapsible>
        ) : (
          <div key={key} className="pt-2">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink">{getFriendlyKey(key)}</h4>
            {body}
          </div>
        );
      })}
    </div>
  );
}
