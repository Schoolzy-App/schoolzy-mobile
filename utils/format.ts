/** Shared display formatters for API values. */

/** "23/10/2026" */
export function formatDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "11:09 PM" */
export function formatTime(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "23/10/2026 | 11:09 PM" */
export function formatDateTime(value?: string | null): string {
  const date = formatDate(value);
  const time = formatTime(value);
  if (!date) return "";
  return time ? `${date} | ${time}` : date;
}

/** "EGP 50,000" */
export function formatCurrency(amount?: number | null, currency = "EGP"): string {
  if (amount == null) return "";
  return `${currency} ${amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

/** Day cell label used by the week calendar, e.g. "11". */
export function dayOfMonth(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : String(d.getDate());
}

/** Short weekday label, e.g. "Wed". */
export function shortWeekday(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { weekday: "short" });
}

/**
 * Local calendar date as `yyyy-mm-dd`, for API query parameters.
 *
 * ⚠️ Never use `toISOString()` for a date the user picked on a calendar: it
 * converts local midnight to UTC, so in any timezone ahead of UTC the date
 * shifts to the previous day (picking 16/06 in Cairo sends 2026-06-15T21:00Z).
 * The API expects a plain calendar date, so the local components are sent
 * verbatim.
 */
export function toApiDate(date?: Date | string | null): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
