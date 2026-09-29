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

function ArrayOfRecords({ rows, depth }: { rows: Record<string, unknown>[]; depth: number }) {
  const labels = useReportLabels();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? rows : rows.slice(0, MAX_ROWS);

  const columns: string[] = [];
  for (const row of rows.slice(0, 60)) {
    for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key);
  }
  const scalarColumns = columns.filter((key) => rows.some((row) => isPrimitive(row[key]))).slice(0, MAX_TABLE_COLUMNS);
  const nestedColumns = columns.filter((key) => !scalarColumns.includes(key) && rows.some((row) => !isPrimitive(row[key])));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full min-w-max text-left text-xs">
          <thead className="bg-surface-alt text-ink-soft">
            <tr>
              {scalarColumns.map((key) => (
                <th key={key} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                  {humanize(key)}
                </th>
              ))}
              {nestedColumns.length > 0 && (
                <th scope="col" className="px-3 py-2 font-semibold">
                  {labels.details}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-card">
            {visible.map((row, index) => (
              <tr key={index} className="align-top">
                {scalarColumns.map((key) => (
                  <td key={key} className="px-3 py-2 tabular-nums">
                    {isPrimitive(row[key]) ? <PrimitiveText value={row[key] as Primitive} /> : <span className="text-ink-muted">{labels.seeDetails}</span>}
                  </td>
                ))}
                {nestedColumns.length > 0 && (
                  <td className="px-3 py-2 min-w-56">
                    <div className="space-y-1.5">
                      {nestedColumns
                        .filter((key) => !isPrimitive(row[key]))
                        .map((key) => (
                          <Collapsible key={key} label={humanize(key)} count={Array.isArray(row[key]) ? (row[key] as unknown[]).length : Object.keys(row[key] as object).length}>
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
      {rows.length > MAX_ROWS && (
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
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 xl:grid-cols-3">
          {scalars.map(([key, v]) => (
            <div key={key} className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-1.5">
              <dt className="text-ink-soft">{humanize(key)}</dt>
              <dd className="text-right tabular-nums">
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
          <Collapsible key={key} label={humanize(key)} count={size}>
            {body}
          </Collapsible>
        ) : (
          <div key={key}>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">{humanize(key)}</h4>
            {body}
          </div>
        );
      })}
    </div>
  );
}
