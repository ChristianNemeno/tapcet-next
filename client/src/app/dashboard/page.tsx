"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchDashboard, fetchMyQuizzes, deleteQuiz } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DashboardEntry, MyQuizSummary } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

function DashboardContent() {
  const { token, name } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "attempts";

  const [entries, setEntries] = useState<DashboardEntry[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<MyQuizSummary[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
          Dashboard
        </p>
        <h1 className="font-mono font-bold text-2xl tracking-tight">
          Welcome back, {name}<span className="text-primary">.</span>
        </h1>
      </div>

      {error && (
        <div className="font-mono text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2 mb-6">
          {error}
        </div>
      )}

      <Tabs defaultValue={defaultTab}>
        <TabsList className="font-mono text-xs mb-8">
          <TabsTrigger value="attempts">My Attempts</TabsTrigger>
          <TabsTrigger value="my-quizzes">My Quizzes</TabsTrigger>
        </TabsList>

        {/* Attempts tab */}
        <TabsContent value="attempts">
          <div className="flex items-center gap-4 px-1 pb-3 border-b border-border font-mono text-xs text-muted-foreground tracking-tight">
            <span className="flex-1">Quiz</span>
            <span className="w-16 text-right">Score</span>
            <span className="w-12 text-right">%</span>
            <span className="w-20 text-right">Date</span>
          </div>
          <div className="divide-y divide-border">
            {loadingAttempts
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
                    <span className={`font-mono text-xs text-right w-12 tabular-nums ${
                      e.percentage >= 60 ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {Math.round(e.percentage)}%
                    </span>
                    <span className="font-mono text-xs text-muted-foreground text-right w-20 tabular-nums">
                      {new Date(e.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
          </div>
        </TabsContent>

        {/* My Quizzes tab */}
        <TabsContent value="my-quizzes">
          <div className="flex items-center justify-between mb-6">
            <p className="font-mono text-xs text-muted-foreground">
              {!loadingQuizzes && `${myQuizzes.length} quiz${myQuizzes.length !== 1 ? "zes" : ""}`}
            </p>
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
            {loadingQuizzes
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
                              onClick={() => handleDeleteQuiz(q.id)}
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
        </TabsContent>
      </Tabs>
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
