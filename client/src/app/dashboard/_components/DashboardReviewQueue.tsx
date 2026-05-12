import Link from "next/link";
import type { ReviewStats } from "@/lib/types/review";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatCard } from "./StatCard";

interface Props {
  stats: ReviewStats | null;
  loading: boolean;
}

export function DashboardReviewQueue({ stats, loading }: Props) {
  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">
          Spaced Repetition
        </p>
        <h2 className="font-mono font-bold text-xl tracking-tight">
          Review Queue<span className="text-primary">.</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard label="due today"     value={stats?.dueToday ?? 0} loading={loading} />
        <StatCard label="total in queue" value={stats?.total ?? 0}   loading={loading} />
      </div>

      {!loading && (stats?.dueToday ?? 0) === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
          <p className="font-mono text-sm text-muted-foreground mb-4">
            No questions due right now. Check back tomorrow.
          </p>
          <Link href="/">
            <Button variant="outline" size="sm" className="font-mono text-xs">
              Browse Quizzes
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
          {loading ? (
            <Skeleton className="h-9 w-40 mx-auto" />
          ) : (
            <>
              <p className="font-mono text-sm text-muted-foreground mb-4">
                You have{" "}
                <span className="font-semibold text-foreground">{stats!.dueToday}</span>{" "}
                question{stats!.dueToday !== 1 ? "s" : ""} due for review.
              </p>
              <Link href="/review">
                <Button className="font-mono text-sm font-semibold">
                  Start Review →
                </Button>
              </Link>
            </>
          )}
        </div>
      )}

      <p className="font-mono text-xs text-muted-foreground mt-6">
        Questions you get wrong in any quiz are added here. Correct answers extend the review
        interval: 1 → 3 → 7 → 14 → 30 days.
      </p>
    </div>
  );
}
