"use client";

import { useState } from "react";
import { createAdminQuiz } from "@/lib/api/quiz-management.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXAM_TAGS } from "@/lib/constants";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  emptyQuestion,
  emptySection,
  type QuestionDraft,
  type SectionDraft,
} from "./types";

interface Props {
  token: string;
}

export function AdminMockExamsTab({ token }: Props) {
  const [mockTitle, setMockTitle] = useState("");
  const [mockDescription, setMockDescription] = useState("");
  const [mockExamTag, setMockExamTag] = useState<string>(EXAM_TAGS[0]);
  const [mockScoringMode, setMockScoringMode] = useState<"standard" | "penalized">("standard");
  const [mockPenalty, setMockPenalty] = useState("0.25");
  const [mockSections, setMockSections] = useState<SectionDraft[]>([emptySection()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateSection(si: number, patch: Partial<SectionDraft>) {
    setMockSections((prev) => prev.map((s, i) => (i === si ? { ...s, ...patch } : s)));
  }

  function updateSectionQuestion(si: number, qi: number, patch: Partial<QuestionDraft>) {
    setMockSections((prev) =>
      prev.map((s, i) =>
        i !== si ? s : { ...s, questions: s.questions.map((q, j) => (j === qi ? { ...q, ...patch } : q)) }
      )
    );
  }

  function updateSectionOption(si: number, qi: number, oi: number, val: string) {
    setMockSections((prev) =>
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await createAdminQuiz(
        {
          title: mockTitle,
          description: mockDescription,
          examTags: [mockExamTag],
          isOfficial: true,
          quizType: "mock_exam",
          scoringMode: mockScoringMode,
          penaltyFraction: mockScoringMode === "penalized" ? parseFloat(mockPenalty) || 0.25 : 0.25,
          sections: mockSections.map((s) => ({
            title: s.title,
            timeLimitSeconds: s.timeLimitSeconds ? parseInt(s.timeLimitSeconds) : null,
            questions: s.questions.map((q) => ({ text: q.text, options: q.options, answer: q.answer })),
          })),
        },
        token
      );
      setSuccess("Mock exam created!");
      setMockTitle(""); setMockDescription(""); setMockExamTag(EXAM_TAGS[0]);
      setMockScoringMode("standard"); setMockPenalty("0.25");
      setMockSections([emptySection()]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h2 className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase">
        Create Mock Exam
      </h2>
      <p className="font-mono text-xs text-muted-foreground -mt-4">
        Mock exams are official, sectioned quizzes that simulate the real exam experience.
      </p>

      <ErrorAlert message={error} />
      {success && (
        <div className="font-mono text-xs text-primary border border-primary/20 bg-primary/5 rounded px-3 py-2">
          {success}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="font-mono text-xs tracking-tight">Title</Label>
          <Input required value={mockTitle} onChange={(e) => setMockTitle(e.target.value)} placeholder="e.g. UPCAT Full Simulator" className="font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-mono text-xs tracking-tight">Target Exam</Label>
          <select
            value={mockExamTag}
            onChange={(e) => setMockExamTag(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {EXAM_TAGS.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-xs tracking-tight">Description</Label>
        <Input value={mockDescription} onChange={(e) => setMockDescription(e.target.value)} className="font-mono text-sm" />
      </div>

      <div className="space-y-3">
        <Label className="font-mono text-xs tracking-tight">Scoring Mode</Label>
        <div className="flex gap-3">
          {(["standard", "penalized"] as const).map((mode) => (
            <label
              key={mode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                mockScoringMode === mode ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              <input type="radio" name="mockScoringMode" value={mode} checked={mockScoringMode === mode} onChange={() => setMockScoringMode(mode)} className="accent-primary" />
              <span className="font-mono text-sm capitalize">{mode}</span>
            </label>
          ))}
        </div>
        {mockScoringMode === "penalized" && (
          <div className="space-y-1.5 max-w-48">
            <Label className="font-mono text-xs tracking-tight">Penalty fraction (per wrong answer)</Label>
            <Input type="number" step="0.05" min="0.05" max="1" value={mockPenalty} onChange={(e) => setMockPenalty(e.target.value)} className="font-mono text-sm" />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <p className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase">Sections</p>
        {mockSections.map((sec, si) => (
          <div key={si} className="border border-border rounded-sm p-5 space-y-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm font-semibold">Section {si + 1}</p>
              {mockSections.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMockSections((prev) => prev.filter((_, i) => i !== si))}
                  className="font-mono text-xs text-destructive hover:underline"
                >
                  remove
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs tracking-tight">Section title</Label>
                <Input required value={sec.title} onChange={(e) => updateSection(si, { title: e.target.value })} placeholder="e.g. Mathematics" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-xs tracking-tight">Time limit (seconds)</Label>
                <Input type="number" min={30} value={sec.timeLimitSeconds} onChange={(e) => updateSection(si, { timeLimitSeconds: e.target.value })} placeholder="optional" className="font-mono text-sm" />
              </div>
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-border">
              {sec.questions.map((q, qi) => (
                <div key={qi} className="space-y-3">
                  <Label className="font-mono text-xs tracking-tight text-muted-foreground">
                    Question {qi + 1}
                  </Label>
                  <Input required value={q.text} onChange={(e) => updateSectionQuestion(si, qi, { text: e.target.value })} placeholder="Question text" className="font-mono text-sm" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`mock-sec${si}-q${qi}`} checked={q.answer === oi} onChange={() => updateSectionQuestion(si, qi, { answer: oi })} className="accent-primary shrink-0" />
                        <Input required value={opt} onChange={(e) => updateSectionOption(si, qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="font-mono text-sm" />
                      </div>
                    ))}
                  </div>
                  {sec.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => updateSection(si, { questions: sec.questions.filter((_, j) => j !== qi) })}
                      className="font-mono text-xs text-muted-foreground hover:text-destructive"
                    >
                      remove question
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateSection(si, { questions: [...sec.questions, emptyQuestion()] })}
                className="font-mono text-xs"
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
          onClick={() => setMockSections((prev) => [...prev, emptySection()])}
          className="font-mono text-xs tracking-tight"
        >
          + add section
        </Button>
      </div>

      <Button type="submit" disabled={saving} className="font-mono text-xs tracking-tight">
        {saving ? "saving..." : "create mock exam"}
      </Button>
    </form>
  );
}
