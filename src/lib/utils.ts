import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});
const pkrExact = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPKR(value: number | string | null | undefined, exact = false) {
  const n = Number(value ?? 0);
  return (exact ? pkrExact : pkr).format(n).replace("PKR", "Rs").replace(/\s+/, " ");
}

/** Short axis labels: Rs 2.5k, Rs 1.2 L, Rs 3 Cr (no misleading rounding, no trailing ".0"). */
export function compactPKR(value: number) {
  const abs = Math.abs(value);
  const fmt = (n: number) => String(Number(n.toFixed(1)));
  if (abs >= 10_000_000) return `Rs ${fmt(value / 10_000_000)} Cr`;
  if (abs >= 100_000) return `Rs ${fmt(value / 100_000)} L`;
  if (abs >= 1_000) return `Rs ${fmt(value / 1_000)}k`;
  return `Rs ${Math.round(value)}`;
}

/** All times are shown in Pakistan time, no matter where the server runs (Vercel runs on UTC). */
export const APP_TIME_ZONE = "Asia/Karachi";

/**
 * Formats a date. Date-only values ("2026-11-22") are calendar dates and are shown
 * exactly as stored; timestamps are converted to Pakistan time.
 */
export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const options = opts ?? { day: "2-digit", month: "short", year: "numeric" };
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + "T00:00:00Z").toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
  }
  return new Date(value).toLocaleDateString("en-GB", { ...options, timeZone: APP_TIME_ZONE });
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: APP_TIME_ZONE,
  });
}

/** "1 expense", "3 expenses" */
export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n.toLocaleString("en-PK")} ${n === 1 ? word : pluralWord}`;
}

/** Adds days to a YYYY-MM-DD date (calendar math, no time-zone drift). */
export function addDays(date: string, days: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function relativeTime(value: string) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(value);
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today in Asia/Karachi as YYYY-MM-DD. */
export function todayPK() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}

export function initials(name: string) {
  return name
    .replace(/^(sir|mr|ms|mrs|dr)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function pctChange(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
