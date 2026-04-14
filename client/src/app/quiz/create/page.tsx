"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createQuiz } from "@/lib/api";
import { EXAM_TAGS, SUBJECTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/ErrorAlert";

interface QuestionDraft {
  text: string;
  options: [string, string, string, string];
  answer: number;
}

interface SectionDraft {
  title: string;
  timeLimitSeconds: string;
  questions: QuestionDraft[];
}

const emptyQuestion = (): QuestionDraft => ({
  text: "",
  options: ["", "", "", ""],
  answer: 0,
});

const emptySection = (): SectionDraft => ({
  title: "",
  timeLimitSeconds: "",
  questions: [emptyQuestion()],
});

export default function CreateQuizPage() {
  const { token, role } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [visibility, setVisibility] = useState<"public" | "draft">("public");
  const [examTags, setExamTags] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [scoringMode, setScoringMode] = useState<"standard" | "penalized">("standard");
  const [penaltyFraction, setPenaltyFraction] = useState("0.25");
  const [useSections, setUseSections] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [sectionDrafts, setSectionDrafts] = useState<SectionDraft[]>([emptySection()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleExamTag(tag: string) {
    setExamTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  if (!token) return null;

  // Flat question helpers
  function updateQuestion(i: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function updateOption(qi: number, oi: number, val: string) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qi) return q;
        const opts = [...q.options] as [string, string, string, string];
        opts[oi] = val;
        return { ...q, options: opts };
      })
    );
  }

  // Section helpers
  function updateSection(si: number, patch: Partial<SectionDraft>) {
    setSectionDrafts((prev) => prev.map((s, i) => (i === si ? { ...s, ...patch } : s)));
  }

  function updateSectionQuestion(si: number, qi: number, patch: Partial<QuestionDraft>) {
    setSectionDrafts((prev) =>
      prev.map((s, i) =>
        i !== si ? s : { ...s, questions: s.questions.map((q, j) => (j === qi ? { ...q, ...patch } : q)) }
      )
    );
  }

  function updateSectionOption(si: number, qi: number, oi: number, val: string) {
    setSectionDrafts((prev) =>
      prev.map((s, i) => {
        if (i !== si) return s;
        return {
          ...s,
          questions: s.questions.map((q, j) => {
            if (j !== qi) return q;
            const opts = [...q.options] as [string, string, string, string];
            opts[oi] = val;
            return { ...q, options: opts };
          }),
        };
      })
    );
  }

  function addSectionQuestion(si: number) {
    setSectionDrafts((prev) =>
      prev.map((s, i) => (i === si ? { ...s, questions: [...s.questions, emptyQuestion()] } : s))
    );
  }

  function removeSectionQuestion(si: number, qi: number) {
    setSectionDrafts((prev) =>
      prev.map((s, i) =>
        i !== si ? s : { ...s, questions: s.questions.filter((_, j) => j !== qi) }
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (useSections) {
        await createQuiz(
          {
            title,
            description,
            visibility,
            examTags,
            subject: subject || null,
            topic: topic || null,
            isOfficial: role === "admin" ? isOfficial : undefined,
            scoringMode,
            penaltyFraction: scoringMode === "penalized" ? parseFloat(penaltyFraction) : undefined,
            questions: [],
            sections: sectionDrafts.map((s, i) => ({
              title: s.title || `Section ${i + 1}`,
              timeLimitSeconds: s.timeLimitSeconds ? parseInt(s.timeLimitSeconds) : null,
              questions: s.questions.map((q) => ({
                text: q.text,
                options: q.options,
                answer: q.answer,
              })),
            })),
          },
          token!
        );
      } else {
        await createQuiz(
          {
            title,
            description,
            timeLimitSeconds: timeLimit ? parseInt(timeLimit) : null,
            visibility,
            examTags,
            subject: subject || null,
            topic: topic || null,
            isOfficial: role === "admin" ? isOfficial : undefined,
            scoringMode,
            penaltyFraction: scoringMode === "penalized" ? parseFloat(penaltyFraction) : undefined,
            questions: questions.map((q) => ({
              text: q.text,
              options: q.options,
              answer: q.answer,
            })),
          },
          token!
        );
      }
      router.push("/dashboard?tab=my-quizzes");
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 space-y-16">
      <div>
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
          Community
        </p>
        <h1 className="font-mono font-bold text-2xl tracking-tight">
          Create a quiz<span className="text-primary">.</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <ErrorAlert message={error} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="font-mono text-xs tracking-tight">Title</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          {!useSections && (
            <div className="space-y-1.5">
              <Label htmlFor="timeLimit" className="font-mono text-xs tracking-tight">
                Time limit (seconds)
              </Label>
              <Input
                id="timeLimit"
                type="number"
                min={10}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="optional"
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-mono text-xs tracking-tight">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <p className="font-mono text-xs tracking-tight">Visibility</p>
          <div className="flex items-center gap-6">
            {(["public", "draft"] as const).map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                  className="accent-primary"
                />
                <span className="font-mono text-sm">{v}</span>
              </label>
            ))}
          </div>
          {visibility === "draft" && (
            <p className="font-mono text-xs text-muted-foreground">
              Draft quizzes are only visible to you.
            </p>
          )}
        </div>

        {/* Scoring mode */}
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-tight">Scoring mode</p>
          <div className="flex items-center gap-6">
            {(["standard", "penalized"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scoringMode"
                  value={m}
                  checked={scoringMode === m}
                  onChange={() => setScoringMode(m)}
                  className="accent-primary"
                />
                <span className="font-mono text-sm">{m}</span>
              </label>
            ))}
          </div>
          {scoringMode === "penalized" && (
            <div className="flex items-center gap-3 mt-2">
              <Label htmlFor="penaltyFraction" className="font-mono text-xs text-muted-foreground">
                Penalty per wrong answer
              </Label>
              <Input
                id="penaltyFraction"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={penaltyFraction}
                onChange={(e) => setPenaltyFraction(e.target.value)}
                className="font-mono text-sm w-24"
              />
            </div>
          )}
          {scoringMode === "penalized" && (
            <p className="font-mono text-xs text-muted-foreground">
              UPCAT standard: −0.25 per wrong answer. Unanswered questions are not penalized.
            </p>
          )}
        </div>

        {/* Section-level timers toggle */}
        <div className="space-y-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="useSections"
              checked={useSections}
              onChange={(e) => setUseSections(e.target.checked)}
              className="accent-primary size-4"
            />
            <span className="font-mono text-xs">Use section-level timers</span>
          </label>
          {useSections && (
            <p className="font-mono text-xs text-muted-foreground pl-7">
              Questions are grouped into named sections, each with its own countdown.
            </p>
          )}
        </div>

        {/* Exam tags */}
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-tight">Target exams</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {EXAM_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={examTags.includes(tag)}
                  onChange={() => toggleExamTag(tag)}
                  className="accent-primary"
                />
                <span className="font-mono text-sm">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="font-mono text-xs tracking-tight">Subject</Label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full font-mono text-sm bg-background border border-border rounded-sm px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">— none —</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="topic" className="font-mono text-xs tracking-tight">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quadratic Equations"
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Official flag — admin only */}
        {role === "admin" && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-sm px-4 py-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOfficial}
                onChange={(e) => setIsOfficial(e.target.checked)}
                className="accent-primary size-4"
              />
              <div>
                <p className="font-mono text-sm font-semibold text-amber-400">Mark as Official</p>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  Official quizzes are admin-curated, shown first in listings, and marked with a badge.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Questions — flat mode */}
        {!useSections && (
          <div className="space-y-6">
            <p className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase">
              Questions
            </p>
            {questions.map((q, qi) => (
              <div key={qi} className="border border-border rounded-sm p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <Label className="font-mono text-xs tracking-tight pt-0.5">
                    Question {String(qi + 1).padStart(2, "0")}
                  </Label>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                      className="font-mono text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      remove
                    </button>
                  )}
                </div>
                <Input
                  required
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                  placeholder="Question text"
                  className="font-mono text-sm"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`answer-${qi}`}
                        checked={q.answer === oi}
                        onChange={() => updateQuestion(qi, { answer: oi })}
                        className="accent-primary"
                      />
                      <Input
                        required
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className="font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  Select the correct answer above.
                </p>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
              className="font-mono text-xs tracking-tight"
            >
              + add question
            </Button>
          </div>
        )}

        {/* Sections mode */}
        {useSections && (
          <div className="space-y-6">
            <p className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase">
              Sections
            </p>
            {sectionDrafts.map((sec, si) => (
              <div key={si} className="border border-border rounded-sm p-5 space-y-5">
                {/* Section header */}
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-xs text-muted-foreground">
                    Section {String(si + 1).padStart(2, "0")}
                  </p>
                  {sectionDrafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSectionDrafts((prev) => prev.filter((_, i) => i !== si))}
                      className="font-mono text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      remove section
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-xs tracking-tight">Section title</Label>
                    <Input
                      value={sec.title}
                      onChange={(e) => updateSection(si, { title: e.target.value })}
                      placeholder={`Section ${si + 1}`}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-xs tracking-tight">Time limit (seconds)</Label>
                    <Input
                      type="number"
                      min={10}
                      value={sec.timeLimitSeconds}
                      onChange={(e) => updateSection(si, { timeLimitSeconds: e.target.value })}
                      placeholder="optional"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Questions within section */}
                <div className="space-y-4 pl-4 border-l border-border/50">
                  {sec.questions.map((q, qi) => (
                    <div key={qi} className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <Label className="font-mono text-xs tracking-tight pt-0.5 text-muted-foreground">
                          Q{String(qi + 1).padStart(2, "0")}
                        </Label>
                        {sec.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSectionQuestion(si, qi)}
                            className="font-mono text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            remove
                          </button>
                        )}
                      </div>
                      <Input
                        required
                        value={q.text}
                        onChange={(e) => updateSectionQuestion(si, qi, { text: e.target.value })}
                        placeholder="Question text"
                        className="font-mono text-sm"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`sec-${si}-answer-${qi}`}
                              checked={q.answer === oi}
                              onChange={() => updateSectionQuestion(si, qi, { answer: oi })}
                              className="accent-primary"
                            />
                            <Input
                              required
                              value={opt}
                              onChange={(e) => updateSectionOption(si, qi, oi, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              className="font-mono text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSectionQuestion(si)}
                    className="font-mono text-xs tracking-tight"
                  >
                    + add question
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSectionDrafts((prev) => [...prev, emptySection()])}
              className="font-mono text-xs tracking-tight"
            >
              + add section
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="font-mono text-xs tracking-tight">
            {saving ? "saving..." : "create quiz"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="font-mono text-xs tracking-tight text-muted-foreground"
          >
            cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
