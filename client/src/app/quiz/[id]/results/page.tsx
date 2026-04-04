"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchQuiz } from "@/lib/api";
import type { SubmitQuizResponse, QuizDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result] = useState<SubmitQuizResponse | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = sessionStorage.getItem(`tapcet_result_${id}`);
    if (!raw) {
      return null;
    }

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

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      {/* Score header */}
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">
          Results
        </p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-mono font-bold text-5xl tracking-tighter tabular-nums">
            {result.score}
          </span>
          <span className="font-mono text-lg text-muted-foreground">
            / {result.total}
          </span>
        </div>
        {/* Minimal progress line */}
        <div className="h-px bg-border mb-4 relative">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {pct}% correct &middot; submitted as <span className="text-foreground font-medium">{result.nickname}</span>
        </p>
      </div>

      {/* Question breakdown */}
      {quiz && (
        <div className="mb-12">
          <h2 className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase mb-6">
            Breakdown
          </h2>
          <div className="space-y-0 divide-y divide-border">
            {result.results.map((r, i) => {
              const q = quiz.questions.find((q) => q.id === r.questionId);
              return (
                <div key={r.questionId} className="py-4 first:pt-0">
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs text-muted-foreground pt-0.5 w-6 shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium">{q?.text}</p>
                        <span className={`font-mono text-xs shrink-0 ${
                          r.correct ? "text-primary" : "text-destructive"
                        }`}>
                          {r.correct ? "correct" : "wrong"}
                        </span>
                      </div>
                      {!r.correct && q && (
                        <div className="font-mono text-xs text-muted-foreground mt-2 space-y-0.5">
                          <p>
                            yours: <span className="text-destructive">{q.options[r.selectedAnswer] ?? "\u2014"}</span>
                          </p>
                          <p>
                            answer: <span className="text-primary">{q.options[r.correctAnswer]}</span>
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

      {/* Actions */}
      <div className="border-t border-border pt-6 flex gap-3">
        <Link href={`/quiz/${id}/leaderboard`}>
          <Button variant="outline" className="font-mono text-xs tracking-tight">
            leaderboard
          </Button>
        </Link>
        <Link href="/">
          <Button className="font-mono text-xs tracking-tight">
            play again
          </Button>
        </Link>
      </div>
    </div>
  );
}
