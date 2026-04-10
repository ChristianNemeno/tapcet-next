"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchQuiz } from "@/lib/api";
import type { SubmitQuizResponse, QuizDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";

function ScoreRing({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color =
    pct >= 80 ? "oklch(0.72 0.17 145)" : pct >= 60 ? "oklch(0.82 0.20 195)" : "oklch(0.65 0.2 25)";

  return (
    <div className="relative size-36 flex items-center justify-center">
      <svg
        className="-rotate-90"
        width={144}
        height={144}
        viewBox="0 0 144 144"
      >
        <circle cx={72} cy={72} r={r} fill="none" stroke="oklch(0.34 0.009 90)" strokeWidth={10} />
        <circle
          cx={72}
          cy={72}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.6s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [result] = useState<SubmitQuizResponse | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(`tapcet_result_${id}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SubmitQuizResponse;
    } catch {
      sessionStorage.removeItem(`tapcet_result_${id}`);
      return null;
    }
  });
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);

  useEffect(() => {
    if (!result) {
      router.replace(`/quiz/${id}`);
      return;
    }
    fetchQuiz(id).then(setQuiz).catch(() => null);
  }, [id, result, router]);

  if (!result) return null;

  const pct = Math.round(result.percentage);
  const grade =
    pct >= 80 ? "Excellent!" : pct >= 60 ? "Good job!" : "Keep practicing!";
  const gradeColor =
    pct >= 80
      ? "text-emerald-400"
      : pct >= 60
      ? "text-primary"
      : "text-destructive";

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Score card */}
      <div className="rounded-2xl border border-border bg-card p-8 mb-8 flex flex-col sm:flex-row items-center gap-8">
        <ScoreRing pct={pct} />
        <div>
          <p className={`text-2xl font-extrabold mb-1 ${gradeColor}`}>{grade}</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-4xl font-bold tabular-nums">{result.score}</span>
            <span className="font-mono text-xl text-muted-foreground">/ {result.total}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted as{" "}
            <span className="font-semibold text-foreground">{result.nickname}</span>
          </p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Correct", value: result.score, color: "text-emerald-400" },
          { label: "Wrong", value: result.total - result.score, color: "text-destructive" },
          { label: "Total", value: result.total, color: "text-foreground" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card px-4 py-3 text-center"
          >
            <p className={`font-mono text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Question breakdown */}
      {quiz && (
        <div className="mb-8">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest mb-4">
            Question Breakdown
          </h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {result.results.map((r, i) => {
              const q = quiz.questions.find((q) => q.id === r.questionId);
              return (
                <div key={r.questionId} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 size-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        r.correct
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {r.correct ? "✓" : "✕"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{q?.text}</p>
                      {!r.correct && q && (
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="text-muted-foreground">
                            Your answer:{" "}
                            <span className="text-destructive font-medium">
                              {q.options[r.selectedAnswer] ?? "—"}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Correct:{" "}
                            <span className="text-emerald-400 font-medium">
                              {q.options[r.correctAnswer]}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/quiz/${id}/leaderboard`}>
          <Button variant="outline" className="font-medium text-sm">
            View Leaderboard
          </Button>
        </Link>
        <Link href={`/quiz/${id}`}>
          <Button variant="outline" className="font-medium text-sm">
            Try Again
          </Button>
        </Link>
        <Link href="/">
          <Button className="font-medium text-sm">
            Browse More Quizzes
          </Button>
        </Link>
      </div>
    </div>
  );
}
