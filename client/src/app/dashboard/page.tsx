"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchDashboard, fetchMyQuizzes, fetchWeakness, fetchReviewStats, fetchMyCollections, deleteQuiz, deleteCollection } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DashboardEntry, MyQuizSummary, WeaknessEntry, ReviewStats, MyCollectionSummary } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Section = "overview" | "attempts" | "my-quizzes" | "weakness" | "review-queue" | "my-collections";

const NAV_ITEMS: { id: Section; label: string; symbol: string }[] = [
  { id: "overview",        label: "Overview",        symbol: "~" },
  { id: "attempts",        label: "Attempts",         symbol: "→" },
  { id: "weakness",        label: "Weaknesses",       symbol: "!" },
  { id: "review-queue",    label: "Review Queue",     symbol: "↺" },
  { id: "my-quizzes",      label: "My Quizzes",       symbol: "+" },
  { id: "my-collections",  label: "My Collections",   symbol: "#" },
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

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <Card size="sm">
      <CardContent className="pt-3">
        {loading ? (
          <>
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className="font-mono font-semibold text-2xl tracking-tight text-foreground">
              {value}
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-0.5 tracking-wide">
              {label}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewSection({
  entries,
  myQuizzes,
  loadingAttempts,
  loadingQuizzes,
}: {
  entries: DashboardEntry[];
  myQuizzes: MyQuizSummary[];
  loadingAttempts: boolean;
  loadingQuizzes: boolean;
}) {
  const totalAttempts = entries.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(entries.reduce((s, e) => s + e.percentage, 0) / totalAttempts)
      : 0;
  const bestScore =
    totalAttempts > 0 ? Math.round(Math.max(...entries.map((e) => e.percentage))) : 0;
  const totalCreated = myQuizzes.length;
  const publicCount = myQuizzes.filter((q) => q.visibility === "public").length;
  const totalQuestions = myQuizzes.reduce((s, q) => s + q.questionCount, 0);

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">
          Overview
        </p>
        <h2 className="font-mono font-bold text-xl tracking-tight">
          Your stats<span className="text-primary">.</span>
        </h2>
      </div>

      <div className="mb-6">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
          Quiz Taking
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="total attempts" value={totalAttempts} loading={loadingAttempts} />
          <StatCard label="average score" value={`${avgScore}%`} loading={loadingAttempts} />
          <StatCard label="best score" value={`${bestScore}%`} loading={loadingAttempts} />
        </div>
      </div>

      <div>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
          Quiz Creation
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="quizzes created" value={totalCreated} loading={loadingQuizzes} />
          <StatCard label="public quizzes" value={publicCount} loading={loadingQuizzes} />
          <StatCard label="questions authored" value={totalQuestions} loading={loadingQuizzes} />
        </div>
      </div>
    </div>
  );
}

function AttemptsSection({
  entries,
  loading,
}: {
  entries: DashboardEntry[];
  loading: boolean;
}) {
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
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-1 py-4">
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          : entries.length === 0
          ? (
              <div className="py-12 text-center">
                <p className="font-mono text-sm text-muted-foreground">
                  No attempts yet.{" "}
                  <Link href="/" className="text-primary hover:underline underline-offset-4">
                    Take a quiz
                  </Link>
                </p>
              </div>
            )
          : entries.map((e) => (
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
            ))}
      </div>
    </div>
  );
}

function MyQuizzesSection({
  myQuizzes,
  loading,
  onDelete,
}: {
  myQuizzes: MyQuizSummary[];
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">
            Created
          </p>
          <h2 className="font-mono font-bold text-xl tracking-tight">
            My quizzes<span className="text-primary">.</span>
          </h2>
        </div>
        <Link href="/quiz/create">
          <Button size="sm" className="font-mono text-xs tracking-tight">
            + create quiz
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 px-1 pb-3 border-b border-border font-mono text-xs text-muted-foreground tracking-tight">
        <span className="flex-1">Title</span>
        <span className="w-10 text-right">Qs</span>
        <span className="w-14 text-right">Status</span>
        <span className="w-24 text-right">Actions</span>
      </div>

      <div className="divide-y divide-border">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-1 py-4">
                <Skeleton className="h-4 w-40 flex-1" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          : myQuizzes.length === 0
          ? (
              <div className="py-12 text-center">
                <p className="font-mono text-sm text-muted-foreground">
                  No quizzes yet.{" "}
                  <Link href="/quiz/create" className="text-primary hover:underline underline-offset-4">
                    Create one
                  </Link>
                </p>
              </div>
            )
          : myQuizzes.map((q) => (
              <div key={q.id} className="flex items-center gap-4 px-1 py-4">
                <Link
                  href={`/quiz/${q.id}`}
                  className="font-mono text-sm flex-1 truncate hover:text-primary transition-colors"
                >
                  {q.title}
                </Link>
                <span className="font-mono text-xs text-muted-foreground text-right w-10 tabular-nums">
                  {q.questionCount}
                </span>
                <div className="w-14 flex justify-end">
                  <Badge
                    variant={q.visibility === "public" ? "default" : "secondary"}
                    className="font-mono text-xs"
                  >
                    {q.visibility}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 justify-end w-24">
                  <Link href={`/quiz/${q.id}/edit`}>
                    <button className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                      edit
                    </button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <button className="font-mono text-xs text-muted-foreground hover:text-destructive transition-colors" />
                      }
                    >
                      delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-mono tracking-tight">
                          Delete &ldquo;{q.title}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the quiz and all leaderboard entries.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(q.id)}
                          className="font-mono text-xs bg-destructive text-white hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

const SUBJECT_COLORS: Record<string, string> = {
  "Mathematics": "bg-blue-500",
  "Science": "bg-green-500",
  "English": "bg-purple-500",
  "Filipino": "bg-yellow-500",
  "Abstract Reasoning": "bg-orange-500",
  "Mechanical-Technical": "bg-red-500",
  "General Information": "bg-teal-500",
};

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
  const barColor = SUBJECT_COLORS[entry.subject] ?? "bg-primary";
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

function WeaknessSection({
  entries,
  loading,
}: {
  entries: WeaknessEntry[];
  loading: boolean;
}) {
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

function MyCollectionsSection({
  myCollections,
  loading,
  onDelete,
}: {
  myCollections: MyCollectionSummary[];
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">Created</p>
          <h2 className="font-mono font-bold text-xl tracking-tight">
            My collections<span className="text-primary">.</span>
          </h2>
        </div>
        <Link href="/collection/create">
          <Button size="sm" className="font-mono text-xs tracking-tight">+ new collection</Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 px-1 pb-3 border-b border-border font-mono text-xs text-muted-foreground tracking-tight">
        <span className="flex-1">Title</span>
        <span className="w-10 text-right">Qs</span>
        <span className="w-14 text-right">Exam</span>
        <span className="w-14 text-right">Status</span>
        <span className="w-20 text-right">Actions</span>
      </div>

      <div className="divide-y divide-border">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-1 py-4">
                <Skeleton className="h-4 w-40 flex-1" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          : myCollections.length === 0
          ? (
              <div className="py-12 text-center">
                <p className="font-mono text-sm text-muted-foreground">
                  No collections yet.{" "}
                  <Link href="/collection/create" className="text-primary hover:underline underline-offset-4">
                    Create one
                  </Link>
                </p>
              </div>
            )
          : myCollections.map((col) => (
              <div key={col.id} className="flex items-center gap-4 px-1 py-4">
                <Link
                  href={`/collection/${col.id}`}
                  className="font-mono text-sm flex-1 truncate hover:text-primary transition-colors"
                >
                  {col.title}
                </Link>
                <span className="font-mono text-xs text-muted-foreground text-right w-10 tabular-nums">
                  {col.quizCount}
                </span>
                <span className="font-mono text-xs text-muted-foreground text-right w-14 truncate">
                  {col.examTag ?? "—"}
                </span>
                <div className="w-14 flex justify-end">
                  <Badge
                    variant={col.visibility === "public" ? "default" : "secondary"}
                    className="font-mono text-xs"
                  >
                    {col.visibility}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 justify-end w-20">
                  <Link href={`/collection/${col.id}/edit`}>
                    <button className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                      edit
                    </button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <button className="font-mono text-xs text-muted-foreground hover:text-destructive transition-colors" />
                      }
                    >
                      delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-mono tracking-tight">
                          Delete &ldquo;{col.title}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the collection. The quizzes themselves are not deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(col.id)}
                          className="font-mono text-xs bg-destructive text-white hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

function ReviewQueueSection({
  stats,
  loading,
}: {
  stats: ReviewStats | null;
  loading: boolean;
}) {
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
                <span className="font-semibold text-foreground">
                  {stats!.dueToday}
                </span>{" "}
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
      .catch(() => null)
      .finally(() => setLoadingQuizzes(false));

    fetchWeakness(token)
      .then(setWeakness)
      .catch(() => null)
      .finally(() => setLoadingWeakness(false));

    fetchReviewStats(token)
      .then(setReviewStats)
      .catch(() => null)
      .finally(() => setLoadingReview(false));

    fetchMyCollections(token)
      .then(setMyCollections)
      .catch(() => null)
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
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-border flex flex-col px-4 py-8 gap-6">
        {/* Profile */}
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

        {/* Nav */}
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

      {/* Main content */}
      <main className="flex-1 px-8 py-8 min-w-0">
        {error && (
          <div className="font-mono text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2 mb-6">
            {error}
          </div>
        )}

        {section === "overview" && (
          <OverviewSection
            entries={entries}
            myQuizzes={myQuizzes}
            loadingAttempts={loadingAttempts}
            loadingQuizzes={loadingQuizzes}
          />
        )}
        {section === "attempts" && (
          <AttemptsSection entries={entries} loading={loadingAttempts} />
        )}
        {section === "weakness" && (
          <WeaknessSection entries={weakness} loading={loadingWeakness} />
        )}
        {section === "review-queue" && (
          <ReviewQueueSection stats={reviewStats} loading={loadingReview} />
        )}
        {section === "my-collections" && (
          <MyCollectionsSection
            myCollections={myCollections}
            loading={loadingCollections}
            onDelete={handleDeleteCollection}
          />
        )}
        {section === "my-quizzes" && (
          <MyQuizzesSection
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
