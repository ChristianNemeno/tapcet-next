"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchQuizzes } from "@/lib/api";
import type { QuizSummary } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes()
      .then(setQuizzes)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Quizzes</h1>
      <p className="text-muted-foreground mb-8">Pick a quiz and test your knowledge.</p>

      {error && <p className="text-destructive mb-6">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))
          : quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col">
                <CardHeader className="flex-1">
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Badge variant="secondary">{quiz.questionCount} questions</Badge>
                  {quiz.timeLimitSeconds && (
                    <Badge variant="outline">{quiz.timeLimitSeconds}s</Badge>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href={`/quiz/${quiz.id}`}>
                    <Button size="sm">Start quiz</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  );
}
