import Link from "next/link";
import type { WeaknessEntry } from "@/lib/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { subjectBar } from "@/lib/constants/subjects";

function WeaknessBar({
  entry,
  loading,
  rank,
}: {
  entry?: WeaknessEntry;
  loading: boolean;
  rank?: number;
}) {
  if (loading) {
    return (
      <div className="py-4 border-b border-border last:border-0">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    );
  }
  if (!entry) return null;

  const pct = Math.round(entry.percentage);
  const barColor = subjectBar(entry.subject);
  const textColor =
    pct < 40 ? "text-destructive" : pct < 65 ? "text-yellow-600 dark:text-yellow-400" : "text-primary";

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <span className="font-mono text-xs text-muted-foreground w-4 tabular-nums">
              {rank}.
            </span>
          )}
          <span className="font-mono text-sm tracking-tight">{entry.subject}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {entry.totalCorrect}/{entry.totalQuestions} · {entry.attempts} attempt{entry.attempts !== 1 ? "s" : ""}
          </span>
          <span className={`font-mono text-sm font-semibold tabular-nums ${textColor}`}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  entries: WeaknessEntry[];
  loading: boolean;
}

export function DashboardWeakness({ entries, loading }: Props) {
  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">
          Analysis
        </p>
        <h2 className="font-mono font-bold text-xl tracking-tight">
          Weak subjects<span className="text-primary">.</span>
        </h2>
      </div>

      {!loading && entries.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            No subject data yet.{" "}
            <Link href="/" className="text-primary hover:underline underline-offset-4">
              Take a tagged quiz
            </Link>{" "}
            to see your weak areas.
          </p>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-muted-foreground mb-6">
            Sorted by accuracy — weakest subjects first.
          </p>
          <div>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <WeaknessBar key={i} loading={true} />
                ))
              : entries.map((entry, i) => (
                  <WeaknessBar key={entry.subject} entry={entry} loading={false} rank={i + 1} />
                ))}
          </div>
        </>
      )}
    </div>
  );
}
