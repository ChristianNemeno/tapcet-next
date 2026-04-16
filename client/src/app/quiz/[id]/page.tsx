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
import { subjectBadge } from "@/lib/constants/subjects";
import { ErrorAlert } from "@/components/ErrorAlert";
import { CopyLinkButton } from "@/components/CopyLinkButton";

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
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz(id)
      .then((q) => {
        setQuiz(q);
        // Set timer: section mode uses first section's timer; flat mode uses quiz timer
        if (q.sections.length > 0) {
          setTimeLeft(q.sections[0].timeLimitSeconds ?? null);
        } else if (q.timeLimitSeconds) {
          setTimeLeft(q.timeLimitSeconds);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const isSectionMode = (quiz?.sections.length ?? 0) > 0;

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

  // Advance to next section or submit if last
  const advanceSection = useCallback(
    (finalAnswers: AnswersMap) => {
      if (!quiz) return;
      const nextIdx = sectionIdx + 1;
      if (nextIdx < quiz.sections.length) {
        setSectionIdx(nextIdx);
        setCurrent(0);
        setTimeLeft(quiz.sections[nextIdx].timeLimitSeconds ?? null);
      } else {
        handleSubmit(finalAnswers);
      }
    },
    [quiz, sectionIdx, handleSubmit]
  );

  // Timer countdown
  useEffect(() => {
    if (step !== "quiz" || timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => {
      if (timeLeft <= 1) {
        if (isSectionMode) {
          advanceSection(answers);
        } else {
          handleSubmit(answers);
        }
      } else {
        setTimeLeft((prev) => (prev ?? 1) - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft, step, answers, handleSubmit, advanceSection, isSectionMode]);

  // — Loading —
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // — Error —
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (!quiz) return null;

  // — Nickname / pre-quiz screen —
  if (step === "nickname") {
    const subjectCls = quiz.subject ? subjectBadge(quiz.subject) : null;

    return (
      <div className="mx-auto max-w-md px-6 py-16">
        {/* Quiz info card */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-6 space-y-4">
          {/* Subject */}
          {subjectCls && (
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-md ${subjectCls}`}>
              {quiz.subject}
            </span>
          )}

          {/* Title */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">
              Ready to start?
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight leading-snug">
              {quiz.title}
            </h1>
          </div>

          {/* Penalized scoring badge */}
          {quiz.scoringMode === "penalized" && (
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 rounded-md">
              <span>−{quiz.penaltyFraction}</span>
              <span className="text-amber-500/60">/</span>
              <span>penalized</span>
            </div>
          )}

          {/* Stats — sections mode */}
          {isSectionMode ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Sections</p>
              {quiz.sections.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.title || `Section ${s.orderIndex + 1}`}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.questions.length} qs
                    {s.timeLimitSeconds ? ` · ${Math.round(s.timeLimitSeconds / 60)}m` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Stats — flat mode */
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <span className="text-xl font-bold tabular-nums">{quiz.questions.length}</span>
                <span className="text-xs text-muted-foreground">questions</span>
              </div>
              {quiz.timeLimitSeconds && (
                <div className="flex flex-col">
                  <span className="text-xl font-bold tabular-nums">
                    {Math.round(quiz.timeLimitSeconds / 60)}m
                  </span>
                  <span className="text-xs text-muted-foreground">time limit</span>
                </div>
              )}
            </div>
          )}

          {/* Exam tags */}
          {quiz.examTags && quiz.examTags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {quiz.examTags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs border border-border/60 text-muted-foreground px-2 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Name entry */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname" className="text-sm font-medium">
              Your display name
            </Label>
            <Input
              id="nickname"
              placeholder="Anonymous"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              className="text-sm"
              onKeyDown={(e) => e.key === "Enter" && setStep("quiz")}
            />
            <p className="text-xs text-muted-foreground">
              Shown on the leaderboard after you finish.
            </p>
          </div>
          <Button
            className="w-full font-semibold text-sm py-5"
            onClick={() => setStep("quiz")}
          >
            Start Quiz →
          </Button>
          <div className="flex justify-center">
            <CopyLinkButton label="Share Quiz" variant="ghost" />
          </div>
        </div>
      </div>
    );
  }

  // — Quiz view (section mode) —
  if (isSectionMode) {
    const section = quiz.sections[sectionIdx];
    const question = section.questions[current];
    const progress = ((current + 1) / section.questions.length) * 100;
    const selected = answers[question.id];
    const isLastQuestion = current === section.questions.length - 1;
    const isLastSection = sectionIdx === quiz.sections.length - 1;
    const answeredCount = Object.keys(answers).length;

    function choose(idx: number) {
      setAnswers((prev) => ({ ...prev, [question.id]: idx }));
    }

    function next() {
      if (current < section.questions.length - 1) {
        setCurrent((c) => c + 1);
      } else {
        advanceSection(answers);
      }
    }

    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Section + progress header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold tabular-nums">
              {current + 1}
              <span className="text-muted-foreground font-normal"> / {section.questions.length}</span>
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {section.title || `Section ${sectionIdx + 1}`} · {sectionIdx + 1}/{quiz.sections.length}
            </span>
            <span className="text-xs text-muted-foreground sm:hidden">
              §{sectionIdx + 1}/{quiz.sections.length}
            </span>
            <span className="text-xs text-muted-foreground">{answeredCount} answered</span>
          </div>
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums px-3 py-1 rounded-full border ${
                timeLeft < 30
                  ? "text-destructive border-destructive/30 bg-destructive/10"
                  : timeLeft < 60
                  ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                  : "text-muted-foreground border-border"
              }`}
            >
              <span className={`size-1.5 rounded-full ${timeLeft < 30 ? "bg-destructive animate-pulse" : "bg-current opacity-60"}`} />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-border rounded-full mb-10 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div className="mb-8">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-3">
            Question {current + 1}
          </p>
          <h2 className="text-xl font-bold leading-relaxed tracking-tight">
            {question.text}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-10">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`quiz-option ${selected === i ? "selected" : ""}`}
            >
              <span className="flex items-start gap-3">
                <span
                  className={`shrink-0 size-6 rounded-full border flex items-center justify-center font-mono text-xs font-semibold mt-0.5 transition-all ${
                    selected === i
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/70 text-muted-foreground"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="leading-relaxed">{opt}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => current > 0 && setCurrent((c) => c - 1)}
            disabled={current === 0}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <Button
            onClick={next}
            disabled={selected === undefined || submitting}
            className="font-semibold text-sm px-6"
          >
            {isLastQuestion
              ? isLastSection
                ? submitting ? "Submitting..." : "Submit Quiz"
                : "Next Section →"
              : "Next →"}
          </Button>
        </div>
      </div>
    );
  }

  // — Quiz view (flat mode) —
  const question = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;
  const selected = answers[question.id];
  const isLast = current === quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;

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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold tabular-nums">
            {current + 1}
            <span className="text-muted-foreground font-normal"> / {quiz.questions.length}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {answeredCount} answered
          </span>
        </div>
        {timeLeft !== null && (
          <div
            className={`flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums px-3 py-1 rounded-full border ${
              timeLeft < 30
                ? "text-destructive border-destructive/30 bg-destructive/10"
                : timeLeft < 60
                ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                : "text-muted-foreground border-border"
            }`}
          >
            <span className={`size-1.5 rounded-full ${timeLeft < 30 ? "bg-destructive animate-pulse" : "bg-current opacity-60"}`} />
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-border rounded-full mb-10 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-8">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-3">
          Question {current + 1}
        </p>
        <h2 className="text-xl font-bold leading-relaxed tracking-tight">
          {question.text}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-2.5 mb-10">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            className={`quiz-option ${selected === i ? "selected" : ""}`}
          >
            <span className="flex items-start gap-3">
              <span
                className={`shrink-0 size-6 rounded-full border flex items-center justify-center font-mono text-xs font-semibold mt-0.5 transition-all ${
                  selected === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 text-muted-foreground"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="leading-relaxed">{opt}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => current > 0 && setCurrent((c) => c - 1)}
          disabled={current === 0}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <Button
          onClick={next}
          disabled={selected === undefined || submitting}
          className="font-semibold text-sm px-6"
        >
          {isLast ? (submitting ? "Submitting..." : "Submit Quiz") : "Next →"}
        </Button>
      </div>
    </div>
  );
}
