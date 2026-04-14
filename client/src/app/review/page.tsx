"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchReviewQueue, answerReviewItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ReviewQueueItem, ReviewAnswerResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { subjectBadge } from "@/lib/constants/subjects";
import { ErrorAlert } from "@/components/ErrorAlert";

type Phase = "loading" | "empty" | "reviewing" | "done";
type AnswerPhase = "waiting" | "feedback";

interface SessionResult {
  item: ReviewQueueItem;
  selectedAnswer: number;
  correct: boolean;
  correctAnswer: number;
  newIntervalDays: number;
}

export default function ReviewPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [answerPhase, setAnswerPhase] = useState<AnswerPhase>("waiting");
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<ReviewAnswerResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchReviewQueue(token)
      .then((data) => {
        setItems(data);
        setPhase(data.length === 0 ? "empty" : "reviewing");
      })
      .catch((e: Error) => {
        setError(e.message);
        setPhase("reviewing");
      });
  }, [token, router]);

  async function handleAnswer() {
    if (selected === null || submitting || !token) return;
    const item = items[cursor];
    setSubmitting(true);
    try {
      const resp = await answerReviewItem(item.questionId, selected, token);
      setFeedback(resp);
      setResults((prev) => [
        ...prev,
        {
          item,
          selectedAnswer: selected,
          correct: resp.correct,
          correctAnswer: resp.correctAnswer,
          newIntervalDays: resp.newIntervalDays,
        },
      ]);
      setAnswerPhase("feedback");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    const next = cursor + 1;
    if (next >= items.length) {
      setPhase("done");
    } else {
      setCursor(next);
      setSelected(null);
      setFeedback(null);
      setAnswerPhase("waiting");
    }
  }

  function optionClass(i: number): string {
    const base = "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left font-mono text-sm transition-colors";
    if (answerPhase === "waiting") {
      return `${base} ${
        selected === i
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/70 hover:border-border hover:bg-muted/30"
      }`;
    }
    if (i === feedback!.correctAnswer) {
      return `${base} border-emerald-500/50 bg-emerald-500/10 text-emerald-400`;
    }
    if (i === selected && !feedback!.correct) {
      return `${base} border-destructive/50 bg-destructive/10 text-destructive`;
    }
    return `${base} border-border/30 opacity-40`;
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-48 mb-10" />
        <Skeleton className="h-1.5 w-full rounded-full mb-8" />
        <Skeleton className="h-6 w-full mb-8" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl mb-3" />
        ))}
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (phase === "empty") {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
          Review Queue
        </p>
        <h1 className="font-mono font-bold text-xl tracking-tight mb-4">
          All caught up<span className="text-primary">.</span>
        </h1>
        <p className="font-mono text-sm text-muted-foreground mb-8">
          No questions are due right now. Keep taking quizzes to build your queue.
        </p>
        <Link href="/dashboard?section=review-queue">
          <Button variant="outline" className="font-mono text-sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // ── Done — summary ────────────────────────────────────────────────────────
  if (phase === "done") {
    const correctCount = results.filter((r) => r.correct).length;
    const pct = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
    const pctColor =
      pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-primary" : "text-destructive";

    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Review complete
        </p>
        <h1 className="font-mono font-bold text-2xl tracking-tight mb-2">
          {correctCount}/{results.length} correct
          <span className="text-primary">.</span>
        </h1>
        <p className={`font-mono text-4xl font-bold tabular-nums mb-10 ${pctColor}`}>
          {pct}%
        </p>

        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden mb-8">
          {results.map(({ item, selectedAnswer, correct, correctAnswer, newIntervalDays }) => (
            <div key={item.questionId} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 mt-0.5 size-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    correct
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {correct ? "✓" : "✗"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm leading-relaxed mb-2">{item.questionText}</p>
                  {!correct && (
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-destructive">
                        Your answer: {item.questionOptions[selectedAnswer] ?? "—"}
                      </p>
                      <p className="font-mono text-xs text-emerald-400">
                        Correct: {item.questionOptions[correctAnswer] ?? "—"}
                      </p>
                    </div>
                  )}
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    Next review in {newIntervalDays} day{newIntervalDays !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard?section=review-queue">
            <Button variant="outline" className="font-mono text-sm">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button className="font-mono text-sm">Browse Quizzes</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Reviewing ─────────────────────────────────────────────────────────────
  const item = items[cursor];
  const progress = ((cursor + 1) / items.length) * 100;
  const isLast = cursor === items.length - 1;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          Review Queue
        </p>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {cursor + 1} / {items.length}
        </p>
      </div>
      <div className="h-1.5 bg-border rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ErrorAlert message={error} className="mb-6" />

      {/* Context */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {item.subject && (
          <span
            className={`font-mono text-xs px-2 py-0.5 rounded-md ${subjectBadge(item.subject)}`}
          >
            {item.subject}
          </span>
        )}
        <span className="font-mono text-xs text-muted-foreground truncate">
          from {item.quizTitle}
        </span>
        <span className="font-mono text-xs text-muted-foreground ml-auto">
          Missed {item.missCount} time{item.missCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Question */}
      <h2 className="font-mono font-semibold text-lg leading-relaxed mb-8">
        {item.questionText}
      </h2>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {item.questionOptions.map((opt, i) => (
          <button
            key={i}
            onClick={() => {
              if (answerPhase === "waiting") setSelected(i);
            }}
            disabled={answerPhase === "feedback"}
            className={optionClass(i)}
          >
            <span
              className={`shrink-0 size-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                answerPhase === "feedback" && i === feedback!.correctAnswer
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                  : answerPhase === "feedback" && i === selected && !feedback!.correct
                  ? "border-destructive/50 bg-destructive/20 text-destructive"
                  : selected === i && answerPhase === "waiting"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 text-muted-foreground"
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="leading-relaxed">{opt}</span>
          </button>
        ))}
      </div>

      {/* Feedback banner */}
      {answerPhase === "feedback" && feedback && (
        <div
          className={`rounded-xl border px-4 py-3 mb-6 font-mono text-sm ${
            feedback.correct
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <p className="font-semibold mb-0.5">
            {feedback.correct ? "Correct!" : "Incorrect."}
          </p>
          <p className="text-xs opacity-80">
            Next review in {feedback.newIntervalDays} day{feedback.newIntervalDays !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Action button */}
      {answerPhase === "waiting" ? (
        <Button
          onClick={handleAnswer}
          disabled={selected === null || submitting}
          className="w-full font-mono text-sm"
        >
          {submitting ? "Checking..." : "Check Answer"}
        </Button>
      ) : (
        <Button onClick={handleNext} className="w-full font-mono text-sm">
          {isLast ? "Finish →" : "Next →"}
        </Button>
      )}
    </div>
  );
}
