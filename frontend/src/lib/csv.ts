/**
 * Safe CSV cell: quotes values containing separators / quotes / line breaks, and
 * neutralises spreadsheet formula injection (a cell starting with = + - @ tab or CR is
 * executed by Excel / Sheets, and e-mail addresses and names are user controlled).
 */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}
