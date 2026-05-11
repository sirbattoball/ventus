import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "HIGH":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "MEDIUM":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "LOW":
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    default:
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "COMPLETE":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "IN_PROGRESS":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "ASSIGNED":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "PENDING":
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    case "CANCELLED":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    default:
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  }
}
