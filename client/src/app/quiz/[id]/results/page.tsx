"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchQuiz } from "@/lib/api";
import type { SubmitQuizResponse, QuizDetail } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

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
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold">{result.score}</span>
            <span className="text-muted-foreground text-lg mb-1">/ {result.total}</span>
          </div>
          <Progress value={pct} />
          <p className="text-muted-foreground text-sm">{pct}% correct · submitted as <strong>{result.nickname}</strong></p>
        </CardContent>
      </Card>

      {quiz && (
        <div className="space-y-3 mb-8">
          {result.results.map((r, i) => {
            const q = quiz.questions.find((q) => q.id === r.questionId);
            return (
              <Card key={r.questionId} className={r.correct ? "border-green-600/30" : "border-destructive/30"}>
                <CardContent className="pt-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{i + 1}. {q?.text}</p>
                    <Badge variant={r.correct ? "default" : "destructive"} className="shrink-0">
                      {r.correct ? "Correct" : "Wrong"}
                    </Badge>
                  </div>
                  {!r.correct && q && (
                    <p className="text-xs text-muted-foreground">
                      Your answer: <span className="text-destructive">{q.options[r.selectedAnswer] ?? "—"}</span>
                      {" · "}Correct: <span className="text-green-600">{q.options[r.correctAnswer]}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Separator className="mb-6" />

      <div className="flex gap-3">
        <Link href={`/quiz/${id}/leaderboard`}>
          <Button variant="outline">Leaderboard</Button>
        </Link>
        <Link href="/">
          <Button>Play again</Button>
        </Link>
      </div>
    </div>
  );
}
