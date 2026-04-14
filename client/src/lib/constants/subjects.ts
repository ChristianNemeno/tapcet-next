// Keep full Tailwind class strings static so JIT doesn't purge them.

export const SUBJECT_BADGE: Record<string, string> = {
  "English":              "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25",
  "Mathematics":          "bg-violet-500/10 text-violet-400 border border-violet-500/25",
  "Science":              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  "Abstract Reasoning":   "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  "Filipino":             "bg-rose-500/10 text-rose-400 border border-rose-500/25",
  "Mechanical-Technical": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25",
  "General Information":  "bg-sky-500/10 text-sky-400 border border-sky-500/25",
};

export const SUBJECT_ACCENT: Record<string, string> = {
  "English":              "#22D3EE",
  "Mathematics":          "#A78BFA",
  "Science":              "#34D399",
  "Abstract Reasoning":   "#FBBF24",
  "Filipino":             "#FB7185",
  "Mechanical-Technical": "#FACC15",
  "General Information":  "#38BDF8",
};

export const SUBJECT_BAR: Record<string, string> = {
  "English":              "bg-cyan-500",
  "Mathematics":          "bg-violet-500",
  "Science":              "bg-emerald-500",
  "Abstract Reasoning":   "bg-amber-500",
  "Filipino":             "bg-rose-500",
  "Mechanical-Technical": "bg-yellow-500",
  "General Information":  "bg-sky-500",
};

export const SUBJECT_BADGE_FALLBACK =
  "bg-muted text-muted-foreground border border-border";

export function subjectBadge(subject: string | null | undefined): string {
  if (!subject) return SUBJECT_BADGE_FALLBACK;
  return SUBJECT_BADGE[subject] ?? SUBJECT_BADGE_FALLBACK;
}

export function subjectAccent(subject: string | null | undefined): string {
  if (!subject) return "#94A3B8";
  return SUBJECT_ACCENT[subject] ?? "#94A3B8";
}

export function subjectBar(subject: string | null | undefined): string {
  if (!subject) return "bg-primary";
  return SUBJECT_BAR[subject] ?? "bg-primary";
}
