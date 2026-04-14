"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchDashboard,
  fetchMyQuizzes,
  fetchWeakness,
  fetchReviewStats,
  fetchMyCollections,
  deleteQuiz,
  deleteCollection,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  DashboardEntry,
  MyQuizSummary,
  WeaknessEntry,
  ReviewStats,
  MyCollectionSummary,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ErrorAlert } from "@/components/ErrorAlert";
import { DashboardOverview } from "./_components/DashboardOverview";
import { DashboardAttempts } from "./_components/DashboardAttempts";
import { DashboardMyQuizzes } from "./_components/DashboardMyQuizzes";
import { DashboardWeakness } from "./_components/DashboardWeakness";
import { DashboardMyCollections } from "./_components/DashboardMyCollections";
import { DashboardReviewQueue } from "./_components/DashboardReviewQueue";

type Section =
  | "overview"
  | "attempts"
  | "my-quizzes"
  | "weakness"
  | "review-queue"
  | "my-collections";

const NAV_ITEMS: { id: Section; label: string; symbol: string }[] = [
  { id: "overview",       label: "Overview",       symbol: "~" },
  { id: "attempts",       label: "Attempts",       symbol: "→" },
  { id: "weakness",       label: "Weaknesses",     symbol: "!" },
  { id: "review-queue",   label: "Review Queue",   symbol: "↺" },
  { id: "my-quizzes",     label: "My Quizzes",     symbol: "+" },
  { id: "my-collections", label: "My Collections", symbol: "#" },
];

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DashboardContent() {
  const { token, name, role } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = (searchParams.get("section") ?? "overview") as Section;

  const [entries, setEntries] = useState<DashboardEntry[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<MyQuizSummary[]>([]);
  const [weakness, setWeakness] = useState<WeaknessEntry[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [myCollections, setMyCollections] = useState<MyCollectionSummary[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingWeakness, setLoadingWeakness] = useState(true);
  const [loadingReview, setLoadingReview] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchDashboard(token)
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingAttempts(false));

    fetchMyQuizzes(token)
      .then(setMyQuizzes)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingQuizzes(false));

    fetchWeakness(token)
      .then(setWeakness)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingWeakness(false));

    fetchReviewStats(token)
      .then(setReviewStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingReview(false));

    fetchMyCollections(token)
      .then(setMyCollections)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingCollections(false));
  }, [token, router]);

  if (!token) return null;

  async function handleDeleteQuiz(id: string) {
    try {
      await deleteQuiz(id, token!);
      setMyQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDeleteCollection(id: string) {
    try {
      await deleteCollection(id, token!);
      setMyCollections((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function navigate(s: Section) {
    router.push(`/dashboard?section=${s}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-52 shrink-0 border-r border-border flex flex-col px-4 py-8 gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar size="lg" className="size-12">
            <AvatarFallback className="font-mono text-sm font-semibold bg-primary/10 text-primary">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-mono text-sm font-semibold tracking-tight leading-tight">
              {name}
            </p>
            <Badge
              variant={role === "admin" ? "default" : "secondary"}
              className="font-mono text-xs mt-1"
            >
              {role ?? "user"}
            </Badge>
          </div>
        </div>

        <Separator />

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = section === item.id;
            const showDueBadge =
              item.id === "review-queue" &&
              !loadingReview &&
              (reviewStats?.dueToday ?? 0) > 0;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-left font-mono text-xs tracking-tight transition-colors w-full ${
                  active
                    ? "text-primary bg-primary/8 border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent"
                }`}
              >
                <span className="text-base leading-none w-3 text-center">{item.symbol}</span>
                {item.label}
                {showDueBadge && (
                  <Badge variant="default" className="ml-auto font-mono text-xs px-1.5 py-0 h-4">
                    {reviewStats!.dueToday}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 px-8 py-8 min-w-0">
        <ErrorAlert message={error} className="mb-6" />

        {section === "overview" && (
          <DashboardOverview
            entries={entries}
            myQuizzes={myQuizzes}
            loadingAttempts={loadingAttempts}
            loadingQuizzes={loadingQuizzes}
          />
        )}
        {section === "attempts" && (
          <DashboardAttempts entries={entries} loading={loadingAttempts} />
        )}
        {section === "weakness" && (
          <DashboardWeakness entries={weakness} loading={loadingWeakness} />
        )}
        {section === "review-queue" && (
          <DashboardReviewQueue stats={reviewStats} loading={loadingReview} />
        )}
        {section === "my-collections" && (
          <DashboardMyCollections
            myCollections={myCollections}
            loading={loadingCollections}
            onDelete={handleDeleteCollection}
          />
        )}
        {section === "my-quizzes" && (
          <DashboardMyQuizzes
            myQuizzes={myQuizzes}
            loading={loadingQuizzes}
            onDelete={handleDeleteQuiz}
          />
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
