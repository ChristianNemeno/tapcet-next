"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMockExams } from "@/lib/api/quiz.api";
import type { QuizSummary } from "@/lib/types/quiz";
import { EXAM_TAGS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MockExamsPage() {
  const [exams, setExams] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<string | null>(null);

  useEffect(() => {
    fetchMockExams(activeExam ?? undefined)
      .then(setExams)
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [activeExam]);

  function handleFilter(exam: string | null) {
    setLoading(true);
    setActiveExam(exam);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
          Simulators
        </p>
        <h1 className="font-mono font-bold text-2xl tracking-tight mb-3">
          Mock Exam Simulator<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Full-length, admin-curated practice exams that mirror the real thing — correct section counts, time limits, and scoring rules.
        </p>
      </div>

      {/* Exam filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => handleFilter(null)}
          className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
            activeExam === null
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          All
        </button>
        {EXAM_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleFilter(tag)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeExam === tag
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-6" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            No mock exams available yet.
          </p>
          <p className="font-mono text-xs text-muted-foreground/60 mt-1">
            Official simulators are added by the tapcet team.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exams.map((exam) => (
            <MockExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}

function MockExamCard({ exam }: { exam: QuizSummary }) {
  const isPenalized = exam.scoringMode === "penalized";

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors">
      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5">
        {exam.examTags.map((tag) => (
          <Badge key={tag} variant="outline" className="font-mono text-xs">
            {tag}
          </Badge>
        ))}
        {isPenalized && (
          <Badge className="font-mono text-xs bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
            Penalized scoring
          </Badge>
        )}
      </div>

      {/* Title + description */}
      <div>
        <h2 className="font-mono font-semibold text-sm tracking-tight mb-1">{exam.title}</h2>
        {exam.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{exam.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
        <span>{exam.questionCount} questions</span>
        {exam.subject && <span>· {exam.subject}</span>}
        {exam.creatorName && <span>· by {exam.creatorName}</span>}
      </div>

      {/* CTA */}
      <Link href={`/quiz/${exam.id}`} className="mt-auto">
        <Button className="w-full font-mono text-xs tracking-tight">
          Start simulator
        </Button>
      </Link>
    </div>
  );
}
