"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchCollection, toggleFollowCollection } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CollectionDetail, QuizSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const SUBJECT_BADGE: Record<string, string> = {
  "English":              "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25",
  "Mathematics":          "bg-violet-500/10 text-violet-400 border border-violet-500/25",
  "Science":              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  "Abstract Reasoning":   "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  "Filipino":             "bg-rose-500/10 text-rose-400 border border-rose-500/25",
  "Mechanical-Technical": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25",
  "General Information":  "bg-sky-500/10 text-sky-400 border border-sky-500/25",
};

function QuizRow({ quiz, index }: { quiz: QuizSummary & { orderIndex: number }; index: number }) {
  return (
    <Link
      href={`/quiz/${quiz.id}`}
      className="group flex items-start gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
    >
      <span className="font-mono text-xs text-muted-foreground/50 tabular-nums w-6 shrink-0 pt-0.5">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {quiz.subject && (
            <span className={`font-mono text-xs px-1.5 py-0.5 rounded-md ${SUBJECT_BADGE[quiz.subject] ?? "bg-muted text-muted-foreground border border-border"}`}>
              {quiz.subject}
            </span>
          )}
          {quiz.isOfficial && (
            <span className="font-mono text-xs px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ★
            </span>
          )}
          {quiz.examTags.map((tag) => (
            <span key={tag} className="font-mono text-xs text-muted-foreground/60">
              {tag}
            </span>
          ))}
        </div>
        <p className="font-mono text-sm font-semibold tracking-tight group-hover:text-primary transition-colors truncate">
          {quiz.title}
        </p>
        {quiz.description && (
          <p className="font-mono text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {quiz.description}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {quiz.questionCount} q{quiz.questionCount !== 1 ? "s" : ""}
        </p>
        {quiz.creatorName && (
          <p className="font-mono text-xs text-muted-foreground/60 mt-0.5">{quiz.creatorName}</p>
        )}
      </div>
    </Link>
  );
}

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, role } = useAuth();

  const [col, setCol] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchCollection(id, token)
      .then(setCol)
      .catch((e: Error) => {
        if (e.message.includes("404")) router.replace("/collections");
        else setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [id, token, router]);

  async function handleFollow() {
    if (!token || !col) return;
    setFollowLoading(true);
    try {
      const res = await toggleFollowCollection(col.id, token);
      setCol((prev) => prev ? { ...prev, isFollowing: res.following, followerCount: res.followerCount } : prev);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFollowLoading(false);
    }
  }

  const isOwner = col && token && (role === "admin" || col.createdBy === /* decoded from token? */ col.createdBy);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <div className="rounded-xl border border-border overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !col) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="font-mono text-sm text-destructive">{error ?? "Collection not found."}</p>
        <Link href="/collections" className="font-mono text-xs text-primary hover:underline mt-2 inline-block">
          Browse collections →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Breadcrumb */}
      <Link href="/collections" className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Collections
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {col.examTag && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {col.examTag}
                </span>
              )}
              {col.isOfficial && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ★ Official
                </span>
              )}
              {col.visibility === "draft" && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                  draft
                </span>
              )}
            </div>
            <h1 className="font-mono font-bold text-2xl tracking-tight leading-tight mb-2">
              {col.title}
            </h1>
            {col.description && (
              <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                {col.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {token && (
              <Button
                variant={col.isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
                disabled={followLoading}
                className="font-mono text-xs"
              >
                {col.isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
            {token && (
              <Link href={`/collection/${col.id}/edit`}>
                <Button variant="ghost" size="sm" className="font-mono text-xs w-full">
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 font-mono text-xs text-muted-foreground">
          <span>{col.quizCount} quiz{col.quizCount !== 1 ? "zes" : ""}</span>
          <span>{col.followerCount} follower{col.followerCount !== 1 ? "s" : ""}</span>
          <span>by {col.creatorName ?? "Community"}</span>
        </div>
      </div>

      {/* Quiz list */}
      {col.quizzes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            No quizzes in this collection yet.
          </p>
          {token && (
            <Link href={`/collection/${col.id}/edit`}>
              <Button variant="outline" size="sm" className="font-mono text-xs mt-4">
                Add quizzes
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {col.quizzes.map((quiz, i) => (
            <QuizRow key={quiz.id} quiz={quiz} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
