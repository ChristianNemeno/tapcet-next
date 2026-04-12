"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchQuiz, fetchQuizRating, rateQuiz } from "@/lib/api";
import type { SubmitQuizResponse, QuizDetail, QuizRating } from "@/lib/types";
import { MOCK_EXAM_CUTOFFS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { ReportModal } from "@/components/ReportModal";
import { useAuth } from "@/lib/auth-context";

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
  const { token } = useAuth();

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
  const [quizRating, setQuizRating] = useState<QuizRating | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!result) {
      router.replace(`/quiz/${id}`);
      return;
    }
    fetchQuiz(id).then(setQuiz).catch(() => null);
    fetchQuizRating(id, token).then(setQuizRating).catch(() => null);
  }, [id, result, router, token]);

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

  async function handleRate(rating: number) {
    if (!token) return;
    try {
      const updated = await rateQuiz(id, rating, token);
      setQuizRating(updated);
    } catch {
      // silent fail
    }
  }

  // Mock exam: group results by section
  const isMockExam = quiz?.quizType === "mock_exam";
  const sectionBreakdown = isMockExam && quiz && quiz.sections.length > 0
    ? quiz.sections.map((sec) => {
        const sectionQIds = new Set(sec.questions.map((q) => q.id));
        const sectionResults = result.results.filter((r) => sectionQIds.has(r.questionId));
        const correct = sectionResults.filter((r) => r.correct).length;
        const total = sectionResults.length;
        const pctSec = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { title: sec.title, correct, total, pct: pctSec };
      })
    : null;

  // Score estimate for mock exam
  const examTag = quiz?.examTags?.[0];
  const cutoffs = examTag ? MOCK_EXAM_CUTOFFS[examTag] : null;
  const scoreEstimate = cutoffs
    ? cutoffs.find((c) => pct >= c.min)?.label ?? null
    : null;

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
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Correct", value: result.score, color: "text-emerald-400" },
          { label: "Wrong", value: result.results.filter((r) => !r.correct && r.selectedAnswer !== -1).length, color: "text-destructive" },
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

      {/* Penalty banner — penalized scoring only */}
      {result.scoringMode === "penalized" && result.penaltyPoints > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-8">
          <p className="font-mono text-xs text-amber-400 mb-1">
            Penalized scoring (−{result.penaltyFraction} per wrong answer)
          </p>
          <p className="font-mono text-sm text-foreground">
            {result.score} correct − {result.penaltyPoints.toFixed(2)} penalty ={" "}
            <span className="font-bold">{(result.score - result.penaltyPoints).toFixed(2)} net score</span>
          </p>
        </div>
      )}
      {result.scoringMode === "penalized" && result.penaltyPoints === 0 && (
        <div className="mb-8" />
      )}

      {/* Mock exam: per-section breakdown + score estimate */}
      {isMockExam && sectionBreakdown && sectionBreakdown.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest">
            Section Breakdown
          </h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {sectionBreakdown.map((sec) => {
              const barColor =
                sec.pct >= 80
                  ? "bg-emerald-500"
                  : sec.pct >= 60
                  ? "bg-primary"
                  : "bg-destructive";
              return (
                <div key={sec.title} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium">{sec.title}</span>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {sec.correct}/{sec.total}
                      <span className="text-xs ml-1">({sec.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${sec.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {scoreEstimate && (
            <div
              className={`rounded-xl border px-5 py-4 ${
                pct >= 80
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : pct >= 65
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-destructive/20 bg-destructive/5"
              }`}
            >
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">
                Score estimate · {examTag}
              </p>
              <p
                className={`font-mono text-sm font-semibold ${
                  pct >= 80
                    ? "text-emerald-400"
                    : pct >= 65
                    ? "text-amber-400"
                    : "text-destructive"
                }`}
              >
                {scoreEstimate}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                This is an estimate based on historical cutoff ranges, not an official prediction.
              </p>
            </div>
          )}
        </div>
      )}

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
                    {token && (
                      <button
                        type="button"
                        onClick={() => setReportTarget(r.questionId)}
                        className="shrink-0 mt-0.5 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        title="Report an issue with this question"
                        aria-label="Flag question"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
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
        <Link href={isMockExam ? "/mock-exams" : "/"}>
          <Button className="font-medium text-sm">
            {isMockExam ? "More Simulators" : "Browse More Quizzes"}
          </Button>
        </Link>
      </div>

      {/* Star rating */}
      {token && (
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Rate this quiz
          </p>
          <div className="flex items-center gap-4">
            <StarRating value={quizRating?.userRating ?? null} onChange={handleRate} />
            {quizRating && quizRating.totalRatings > 0 && (
              <p className="font-mono text-xs text-muted-foreground">
                {quizRating.averageRating?.toFixed(1)} / 5
                <span className="ml-1">({quizRating.totalRatings} {quizRating.totalRatings === 1 ? "rating" : "ratings"})</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Report modal */}
      {token && reportTarget && (
        <ReportModal
          questionId={reportTarget}
          quizId={id}
          token={token}
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
