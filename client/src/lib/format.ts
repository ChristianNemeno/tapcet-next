export function formatPercentage(pct: number, digits: number = 1): string {
  if (!Number.isFinite(pct)) return "0%";
  return `${pct.toFixed(digits)}%`;
}

export function formatGrade(percentage: number): { label: string; color: string } {
  if (percentage >= 90) return { label: "Excellent", color: "text-emerald-400" };
  if (percentage >= 75) return { label: "Good", color: "text-cyan-400" };
  if (percentage >= 60) return { label: "Fair", color: "text-amber-400" };
  return { label: "Needs work", color: "text-rose-400" };
}

export function formatTimeRemaining(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
