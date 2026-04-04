"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchQuizzes } from "@/lib/api";
import type { QuizSummary } from "@/lib/types";
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
    <div>
      {/* Hero */}
      <section className="dot-grid border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">
            Quiz Platform
          </p>
          <h1 className="font-mono font-bold text-4xl md:text-5xl tracking-tight leading-[1.1] mb-4">
            Test what you
            <br />
            actually know<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Pick a quiz, answer questions, see where you stand.
            No fluff, just knowledge.
          </p>
        </div>
      </section>

      {/* Quiz listing */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase">
            Available Quizzes
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {!loading && `${quizzes.length} total`}
          </span>
        </div>

        {error && <p className="text-destructive text-sm mb-6">{error}</p>}

        <div className="space-y-0 divide-y divide-border">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-6 first:pt-0">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-72 mb-3" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            : quizzes.map((quiz, i) => (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="group block py-6 first:pt-0 transition-colors"
                >
                  <div className="flex items-start gap-6">
                    <span className="font-mono text-xs text-muted-foreground pt-1 w-6 shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono font-medium text-base tracking-tight group-hover:text-primary transition-colors">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {quiz.questionCount} questions
                        </span>
                        {quiz.timeLimitSeconds && (
                          <>
                            <span className="text-border">|</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {quiz.timeLimitSeconds}s limit
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                      &rarr;
                    </span>
                  </div>
                </Link>
              ))}
        </div>

        {!loading && quizzes.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="font-mono text-sm text-muted-foreground">
              No quizzes yet. Check back soon.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
