"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchQuiz, submitQuiz } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { QuizDetail, AnswersMap } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
      <div className="mx-auto max-w-xl px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-xl px-4 py-10 text-destructive">{error}</div>;
  }

  if (!quiz) return null;

  if (step === "nickname") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {quiz.questions.length} questions
              {quiz.timeLimitSeconds ? ` · ${quiz.timeLimitSeconds}s time limit` : ""}
            </p>
            <div className="space-y-1">
              <Label htmlFor="nickname">Your name</Label>
              <Input
                id="nickname"
                placeholder="Anonymous"
                value={nickname}
                maxLength={20}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setStep("quiz")}>
              Start
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {current + 1} / {quiz.questions.length}
        </span>
        {timeLeft !== null && (
          <Badge variant={timeLeft < 10 ? "destructive" : "secondary"}>
            {timeLeft}s
          </Badge>
        )}
      </div>
      <Progress value={progress} className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`w-full text-left rounded-md border px-4 py-3 text-sm transition-colors ${
                selected === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              {opt}
            </button>
          ))}
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={next} disabled={selected === undefined || submitting}>
            {isLast ? (submitting ? "Submitting…" : "Submit") : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
