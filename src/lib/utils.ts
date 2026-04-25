import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(
  value: number | null | undefined,
  symbol = "৳",
  fractionDigits = 2,
) {
  const v = Number(value ?? 0);
  return `${symbol}${v.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function generateInvoiceNo(prefix: string, count: number) {
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

export function safeNumber(input: FormDataEntryValue | null | undefined, fallback = 0) {
  const v = typeof input === "string" ? Number(input) : NaN;
  return Number.isFinite(v) ? v : fallback;
}

export function safeString(input: FormDataEntryValue | null | undefined, fallback = "") {
  return typeof input === "string" ? input : fallback;
}
