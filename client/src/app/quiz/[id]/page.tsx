"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchQuiz, submitQuiz } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { QuizDetail, AnswersMap } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, name } = useAuth();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"nickname" | "quiz">("nickname");
  const [nickname, setNickname] = useState(name ?? "");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz(id)
      .then((q) => {
        setQuiz(q);
        if (q.timeLimitSeconds) setTimeLeft(q.timeLimitSeconds);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = useCallback(
    async (finalAnswers: AnswersMap) => {
      if (!quiz || submitting) return;
      setSubmitting(true);
      try {
        const result = await submitQuiz(id, finalAnswers, nickname || undefined, token);
        sessionStorage.setItem(`tapcet_result_${id}`, JSON.stringify(result));
        router.push(`/quiz/${id}/results`);
      } catch (e) {
        setError((e as Error).message);
        setSubmitting(false);
      }
    },
    [quiz, submitting, id, nickname, token, router]
  );

  // Timer
  useEffect(() => {
    if (step !== "quiz" || timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => {
      if (timeLeft <= 1) {
        handleSubmit(answers);
      } else {
        setTimeLeft((prev) => (prev ?? 1) - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft, step, answers, handleSubmit]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="font-mono text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2">
          {error}
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  // Nickname entry
  if (step === "nickname") {
    return (
      <div className="mx-auto max-w-sm px-6 py-20">
        <div className="mb-10">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-3">
            Ready?
          </p>
          <h1 className="font-mono font-bold text-2xl tracking-tight mb-2">
            {quiz.title}<span className="text-primary">.</span>
          </h1>
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground mt-3">
            <span>{quiz.questions.length} questions</span>
            {quiz.timeLimitSeconds && (
              <>
                <span className="text-border">|</span>
                <span>{quiz.timeLimitSeconds}s limit</span>
              </>
            )}
          </div>
          {(quiz.subject || (quiz.examTags && quiz.examTags.length > 0)) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {quiz.subject && (
                <span className="font-mono text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm">
                  {quiz.subject}
                </span>
              )}
              {quiz.examTags?.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs border border-border text-muted-foreground px-2 py-0.5 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="nickname" className="font-mono text-xs tracking-tight">
              Your name
            </Label>
            <Input
              id="nickname"
              placeholder="Anonymous"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Button
            className="w-full font-mono text-xs tracking-tight"
            onClick={() => setStep("quiz")}
          >
            start quiz
          </Button>
        </div>
      </div>
    );
  }

  // Quiz view
  const question = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;
  const selected = answers[question.id];

  function choose(idx: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: idx }));
  }

  function next() {
    if (current < quiz!.questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      handleSubmit(answers);
    }
  }

  const isLast = current === quiz.questions.length - 1;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {String(current + 1).padStart(2, "0")} / {String(quiz.questions.length).padStart(2, "0")}
        </span>
        {timeLeft !== null && (
          <span className={`font-mono text-xs tabular-nums ${timeLeft < 10 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
            {timeLeft}s
          </span>
        )}
      </div>
      <div className="h-px bg-border mb-10 relative">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="font-mono font-medium text-lg tracking-tight leading-relaxed">
          {question.text}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-10">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            className={`gutter-accent w-full text-left px-4 py-3.5 text-sm transition-colors rounded-sm cursor-pointer ${
              selected === i
                ? "active"
                : "hover:bg-accent"
            }`}
          >
            <span className="flex items-start gap-3">
              <span className="font-mono text-xs text-muted-foreground pt-0.5 shrink-0 tabular-nums">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={next}
          disabled={selected === undefined || submitting}
          className="font-mono text-xs tracking-tight"
        >
          {isLast ? (submitting ? "submitting..." : "submit") : "next"}
        </Button>
      </div>
    </div>
  );
}
