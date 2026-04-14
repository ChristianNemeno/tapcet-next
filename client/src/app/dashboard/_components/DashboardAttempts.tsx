import Link from "next/link";
import type { DashboardEntry } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  entries: DashboardEntry[];
  loading: boolean;
}

export function DashboardAttempts({ entries, loading }: Props) {
  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">
          History
        </p>
        <h2 className="font-mono font-bold text-xl tracking-tight">
          Quizzes taken<span className="text-primary">.</span>
        </h2>
      </div>

      <div className="flex items-center gap-4 px-1 pb-3 border-b border-border font-mono text-xs text-muted-foreground tracking-tight">
        <span className="flex-1">Quiz</span>
        <span className="w-16 text-right">Score</span>
        <span className="w-12 text-right">%</span>
        <span className="w-20 text-right">Date</span>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-1 py-4">
              <Skeleton className="h-4 w-32 flex-1" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              No attempts yet.{" "}
              <Link href="/" className="text-primary hover:underline underline-offset-4">
                Take a quiz
              </Link>
            </p>
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex items-center gap-4 px-1 py-4">
              <Link
                href={`/quiz/${e.quizId}/leaderboard`}
                className="font-mono text-sm flex-1 truncate hover:text-primary transition-colors"
              >
                {e.quizTitle}
              </Link>
              <span className="font-mono text-sm text-right w-16 tabular-nums">
                {e.score}/{e.total}
              </span>
              <span
                className={`font-mono text-xs text-right w-12 tabular-nums ${
                  e.percentage >= 60 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {Math.round(e.percentage)}%
              </span>
              <span className="font-mono text-xs text-muted-foreground text-right w-20 tabular-nums">
                {new Date(e.completedAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
