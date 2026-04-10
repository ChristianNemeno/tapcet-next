"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchQuizzes } from "@/lib/api";
import type { QuizSummary } from "@/lib/types";
import { EXAM_TAGS, SUBJECTS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Subject accent colors ───────────────────────────────────────────────────
const SUBJECT_ACCENT: Record<string, string> = {
  "English":              "#22D3EE",
  "Mathematics":          "#A78BFA",
  "Science":              "#34D399",
  "Abstract Reasoning":   "#FBBF24",
  "Filipino":             "#FB7185",
  "Mechanical-Technical": "#FACC15",
  "General Information":  "#38BDF8",
};

// Keep full Tailwind class strings static so JIT doesn't purge them
const SUBJECT_BADGE: Record<string, string> = {
  "English":              "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25",
  "Mathematics":          "bg-violet-500/10 text-violet-400 border border-violet-500/25",
  "Science":              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  "Abstract Reasoning":   "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  "Filipino":             "bg-rose-500/10 text-rose-400 border border-rose-500/25",
  "Mechanical-Technical": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25",
  "General Information":  "bg-sky-500/10 text-sky-400 border border-sky-500/25",
};

// ─── Subject SVG Illustrations ────────────────────────────────────────────────
// All 64×64 viewBox, stroke="currentColor", geometric line-art style.

function EnglishSVG() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      {/* Left book page */}
      <path d="M8 16 C8 14 10 12 32 12 L32 54 C10 54 8 52 8 50 Z" />
      {/* Right book page */}
      <path d="M56 16 C56 14 54 12 32 12 L32 54 C54 54 56 52 56 50 Z" />
      {/* Spine */}
      <line x1="32" y1="12" x2="32" y2="54" />
      {/* Left page text lines */}
      <line x1="14" y1="23" x2="28" y2="23" />
      <line x1="14" y1="30" x2="28" y2="30" />
      <line x1="14" y1="37" x2="28" y2="37" />
      <line x1="14" y1="44" x2="22" y2="44" />
      {/* Right page text lines */}
      <line x1="36" y1="23" x2="50" y2="23" />
      <line x1="36" y1="30" x2="50" y2="30" />
      <line x1="36" y1="37" x2="50" y2="37" />
      <line x1="36" y1="44" x2="44" y2="44" />
      {/* Page curl on bottom-left */}
      <path d="M8 50 Q12 56 18 54" strokeWidth="1.3" />
    </svg>
  );
}

function MathSVG() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round">
      {/* Y axis */}
      <line x1="14" y1="58" x2="14" y2="8" />
      {/* Y axis arrow */}
      <path d="M11 13 L14 8 L17 13" />
      {/* X axis */}
      <line x1="8" y1="48" x2="58" y2="48" />
      {/* X axis arrow */}
      <path d="M53 45 L58 48 L53 51" />
      {/* Parabola / curve */}
      <path d="M14 48 C18 28 26 18 32 26 C38 34 44 22 58 12" />
      {/* Data points on curve */}
      <circle cx="22" cy="36" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="32" cy="26" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="46" cy="18" r="2.2" fill="currentColor" stroke="none" />
      {/* Origin tick */}
      <line x1="14" y1="48" x2="14" y2="50" />
    </svg>
  );
}

function ScienceSVG() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round">
      {/* Nucleus */}
      <circle cx="32" cy="32" r="6" />
      {/* Proton/neutron inside nucleus */}
      <circle cx="30" cy="31" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="34" cy="33" r="1.5" fill="currentColor" stroke="none" />
      {/* Orbital 1 – horizontal */}
      <ellipse cx="32" cy="32" rx="22" ry="9" />
      {/* Orbital 2 – rotated 60° */}
      <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(60 32 32)" />
      {/* Orbital 3 – rotated 120° */}
      <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(120 32 32)" />
      {/* Electrons – one on each orbit */}
      {/* Right of horizontal orbit */}
      <circle cx="54" cy="32" r="2.5" fill="currentColor" stroke="none" />
      {/* Upper-left (on 120° orbit) */}
      <circle cx="21" cy="13" r="2.5" fill="currentColor" stroke="none" />
      {/* Lower-left (on 60° orbit) */}
      <circle cx="21" cy="51" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ReasoningSVG() {
  // 3×3 grid: each row shows shapes decreasing in size;
  // bottom-right cell is the "missing piece" (dashed border).
  // Row 1: circles  Row 2: triangles  Row 3: squares + question
  const cellY = [0, 23, 46] as const;
  const cellX = [0, 23, 46] as const;

  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round">
      {/* Cell borders */}
      {cellY.map((y, ri) =>
        cellX.map((x, ci) => (
          <rect key={`c-${ri}-${ci}`} x={x} y={y} width="18" height="18" rx="2"
            strokeOpacity={ri === 2 && ci === 2 ? 0.7 : 0.25}
            strokeDasharray={ri === 2 && ci === 2 ? "2 2" : undefined}
          />
        ))
      )}

      {/* Row 1 – circles, decreasing */}
      <circle cx="9" cy="9" r="5.5" />
      <circle cx="32" cy="9" r="4" />
      <circle cx="55" cy="9" r="2.5" />

      {/* Row 2 – triangles, decreasing */}
      <polygon points="9,3.5 3.5,14.5 14.5,14.5" />
      <polygon points="32,4.5 27,13.5 37,13.5" />
      <polygon points="55,6 51.5,12 58.5,12" />

      {/* Row 3 – squares, decreasing */}
      <rect x="5" y="51" width="8" height="8" rx="0.5" />
      <rect x="29" y="52" width="6" height="6" rx="0.5" />
      {/* Question cell – small dot + hint */}
      <circle cx="55" cy="55" r="1.8" fill="currentColor" strokeOpacity="0" />
      <line x1="55" y1="48" x2="55" y2="52" strokeDasharray="1.5 1.5" strokeOpacity="0.5" />
    </svg>
  );
}

function FilipinoSVG() {
  // Philippine sun: circle + 4 triangular primary rays (N/S/E/W)
  // + 4 thin diagonal rays at 45°
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      {/* Central circle */}
      <circle cx="32" cy="32" r="9" />
      {/* North ray (triangular) */}
      <polygon points="29,23 35,23 32,6" />
      {/* South ray */}
      <polygon points="29,41 35,41 32,58" />
      {/* West ray */}
      <polygon points="23,29 23,35 6,32" />
      {/* East ray */}
      <polygon points="41,29 41,35 58,32" />
      {/* NE diagonal – thin line from circle edge to near-corner */}
      <line x1="38" y1="26" x2="49" y2="15" strokeWidth="1.4" />
      {/* NW diagonal */}
      <line x1="26" y1="26" x2="15" y2="15" strokeWidth="1.4" />
      {/* SE diagonal */}
      <line x1="38" y1="38" x2="49" y2="49" strokeWidth="1.4" />
      {/* SW diagonal */}
      <line x1="26" y1="38" x2="15" y2="49" strokeWidth="1.4" />
    </svg>
  );
}

function GearSVG() {
  // Gear: circle body + hub circle + 8 square-cap teeth at cardinal & ordinal angles.
  // Tooth = thick square-cap line from r=17 to r=23.
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="square">
      {/* Gear body */}
      <circle cx="32" cy="32" r="17" strokeWidth="1.8" />
      {/* Hub */}
      <circle cx="32" cy="32" r="7" strokeWidth="1.8" />
      {/* 8 teeth as thick short lines */}
      {/* 0° right */}
      <line x1="49" y1="32" x2="56" y2="32" strokeWidth="5" />
      {/* 45° bottom-right */}
      <line x1="44" y1="44" x2="49" y2="49" strokeWidth="5" />
      {/* 90° bottom */}
      <line x1="32" y1="49" x2="32" y2="56" strokeWidth="5" />
      {/* 135° bottom-left */}
      <line x1="20" y1="44" x2="15" y2="49" strokeWidth="5" />
      {/* 180° left */}
      <line x1="15" y1="32" x2="8" y2="32" strokeWidth="5" />
      {/* 225° top-left */}
      <line x1="20" y1="20" x2="15" y2="15" strokeWidth="5" />
      {/* 270° top */}
      <line x1="32" y1="15" x2="32" y2="8" strokeWidth="5" />
      {/* 315° top-right */}
      <line x1="44" y1="20" x2="49" y2="15" strokeWidth="5" />
    </svg>
  );
}

function GlobeSVG() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round">
      {/* Globe outline */}
      <circle cx="32" cy="32" r="24" />
      {/* Vertical meridian (center ellipse) */}
      <ellipse cx="32" cy="32" rx="10" ry="24" />
      {/* Vertical axis line */}
      <line x1="32" y1="8" x2="32" y2="56" />
      {/* Latitude line – upper */}
      <path d="M10 22 Q32 17 54 22" />
      {/* Equator */}
      <line x1="8" y1="32" x2="56" y2="32" />
      {/* Latitude line – lower */}
      <path d="M10 42 Q32 47 54 42" />
    </svg>
  );
}

const SUBJECT_SVGS: Record<string, () => React.ReactElement> = {
  "English":              EnglishSVG,
  "Mathematics":          MathSVG,
  "Science":              ScienceSVG,
  "Abstract Reasoning":   ReasoningSVG,
  "Filipino":             FilipinoSVG,
  "Mechanical-Technical": GearSVG,
  "General Information":  GlobeSVG,
};

// ─── Subject Tile (FullStack Open-inspired illustrated card) ─────────────────

function SubjectTile({
  subject,
  active,
  onClick,
}: {
  subject: string;
  active: boolean;
  onClick: () => void;
}) {
  const accent = SUBJECT_ACCENT[subject] ?? "#94A3B8";
  const Icon = SUBJECT_SVGS[subject];

  return (
    <button
      onClick={onClick}
      title={subject}
      style={{
        borderColor: active ? accent : "oklch(0.34 0.009 90)",
        backgroundColor: active ? `${accent}14` : "oklch(0.25 0.009 90)",
        color: accent,
      }}
      className="flex flex-col items-center gap-2 px-3 pt-4 pb-3 rounded-xl border
        transition-all duration-150 shrink-0 w-24 cursor-pointer
        hover:scale-105 active:scale-100"
    >
      {/* Illustration area */}
      <div className="size-14 flex items-center justify-center">
        {Icon ? <Icon /> : null}
      </div>
      {/* Label */}
      <span
        className="text-xs font-semibold text-center leading-snug w-full"
        style={{ color: active ? accent : "oklch(0.72 0.008 90)" }}
      >
        {subject}
      </span>
    </button>
  );
}

// ─── Quiz Card ────────────────────────────────────────────────────────────────

function SubjectBadge({ subject }: { subject: string }) {
  const cls = SUBJECT_BADGE[subject] ?? "bg-muted text-muted-foreground border border-border";
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${cls}`}>
      {subject}
    </span>
  );
}

function QuizCard({ quiz, index }: { quiz: QuizSummary; index: number }) {
  const timeMin = quiz.timeLimitSeconds ? Math.round(quiz.timeLimitSeconds / 60) : null;

  return (
    <Link href={`/quiz/${quiz.id}`} className="group block h-full">
      <div className="quiz-card h-full rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        {/* Subject + index */}
        <div className="flex items-start justify-between gap-2">
          {quiz.subject ? (
            <SubjectBadge subject={quiz.subject} />
          ) : (
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
              General
            </span>
          )}
          <span className="font-mono text-xs text-muted-foreground/40 tabular-nums shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors">
          {quiz.title}
        </h3>

        {/* Description */}
        {quiz.description && (
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 flex-1">
            {quiz.description}
          </p>
        )}

        {/* Exam tags */}
        {quiz.examTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {quiz.examTags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs border border-border/60 text-muted-foreground/70 px-1.5 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Card footer */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/50 mt-auto">
          <span className="font-mono text-xs text-muted-foreground">
            {quiz.questionCount} questions
          </span>
          {timeMin !== null && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="font-mono text-xs text-muted-foreground">{timeMin}m</span>
            </>
          )}
          <span className="font-mono text-xs text-muted-foreground ml-auto truncate">
            {quiz.creatorName ? `by ${quiz.creatorName}` : "Official"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function QuizCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <Skeleton className="h-5 w-24 rounded-md" />
      <Skeleton className="h-5 w-4/5" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="pt-3 border-t border-border/50">
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchQuizzes({
      exam: examFilter || undefined,
      subject: subjectFilter || undefined,
    })
      .then(setQuizzes)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [examFilter, subjectFilter]);

  const filtersActive = examFilter !== "" || subjectFilter !== "";

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-50 pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.20 195 / 0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/25 rounded-full px-3 py-1.5 mb-7">
            <span className="size-1.5 rounded-full bg-primary" />
            Free CET review platform for Filipino students
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5 max-w-3xl">
            Practice for{" "}
            <span className="text-primary">UPCAT, ACET</span>
            <br />
            and more<span className="text-primary">.</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed mb-10">
            Community-built reviewers for all major Philippine college entrance
            tests — free, timed, and organized by subject and exam.
          </p>

          <div className="flex flex-wrap gap-8">
            {[
              { value: "7", label: "Exams covered" },
              { value: "7", label: "Subjects" },
              { value: "Free", label: "Always, forever" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-extrabold text-foreground leading-none">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        {/* ── Subject Tiles (FullStack Open-style illustrated cards) ── */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Browse by Subject
          </p>
          {/* Horizontal scroll on mobile, wraps on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
            {(SUBJECTS as readonly string[]).map((subject) => (
              <SubjectTile
                key={subject}
                subject={subject}
                active={subjectFilter === subject}
                onClick={() =>
                  setSubjectFilter(subjectFilter === subject ? "" : subject)
                }
              />
            ))}
          </div>
        </div>

        {/* ── Exam filter pills ── */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Filter by Exam
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setExamFilter("")}
              className={`filter-pill ${!examFilter ? "filter-pill-active" : "filter-pill-inactive"}`}
            >
              All exams
            </button>
            {(EXAM_TAGS as readonly string[]).map((tag) => (
              <button
                key={tag}
                onClick={() => setExamFilter(examFilter === tag ? "" : tag)}
                className={`filter-pill font-mono ${
                  examFilter === tag ? "filter-pill-active" : "filter-pill-inactive"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── Count + clear ── */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            {loading
              ? "Loading..."
              : `${quizzes.length} quiz${quizzes.length !== 1 ? "zes" : ""}`}
          </p>
          {filtersActive && (
            <button
              onClick={() => {
                setExamFilter("");
                setSubjectFilter("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all filters ×
            </button>
          )}
        </div>

        {error && (
          <p className="text-destructive text-sm mb-6 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {/* ── Quiz card grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <QuizCardSkeleton key={i} />)
            : quizzes.map((quiz, i) => (
                <QuizCard key={quiz.id} quiz={quiz} index={i} />
              ))}
        </div>

        {/* ── Empty state ── */}
        {!loading && quizzes.length === 0 && !error && (
          <div className="text-center py-24">
            <p className="font-mono text-4xl text-muted-foreground/20 mb-4">[ ]</p>
            <p className="font-semibold text-muted-foreground mb-1">
              {filtersActive
                ? "No quizzes match your filters."
                : "No quizzes yet. Check back soon."}
            </p>
            {filtersActive && (
              <button
                onClick={() => {
                  setExamFilter("");
                  setSubjectFilter("");
                }}
                className="mt-3 text-sm text-primary hover:underline underline-offset-4"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
