"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchLeaderboard } from "@/lib/api/quiz.api";
import type { LeaderboardEntry } from "@/lib/types/quiz";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard(id)
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
            Rankings
          </p>
          <h1 className="font-mono font-bold text-2xl tracking-tight">
            Leaderboard<span className="text-primary">.</span>
          </h1>
        </div>
        <Link href={`/quiz/${id}`}>
          <Button size="sm" className="font-mono text-xs tracking-tight">
            take quiz
          </Button>
        </Link>
      </div>

      <ErrorAlert message={error} className="mb-6" />

      {/* Table header */}
      <div className="flex items-center gap-4 px-1 pb-3 border-b border-border font-mono text-xs text-muted-foreground tracking-tight">
        <span className="w-8">#</span>
        <span className="flex-1">Name</span>
        <span className="w-16 text-right">Score</span>
        <span className="w-12 text-right">%</span>
      </div>

      {/* Table body */}
      <div className="divide-y divide-border">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-1 py-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24 flex-1" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))
          : entries.length === 0
          ? (
              <div className="py-12 text-center">
                <p className="font-mono text-sm text-muted-foreground">
                  No entries yet. Be the first!
                </p>
              </div>
            )
          : entries.map((e, i) => (
              <div key={e.id} className="flex items-center gap-4 px-1 py-4">
                <span className="font-mono text-xs text-muted-foreground w-8 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-sm flex-1 truncate">
                  {e.nickname}
                </span>
                <span className="font-mono text-sm text-right w-16 tabular-nums">
                  {e.score}/{e.total}
                </span>
                <span className="font-mono text-xs text-muted-foreground text-right w-12 tabular-nums">
                  {Math.round(e.percentage)}%
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}
