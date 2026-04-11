"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createQuiz } from "@/lib/api";
import { EXAM_TAGS, SUBJECTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuestionDraft {
  text: string;
  options: [string, string, string, string];
  answer: number;
}

const emptyQuestion = (): QuestionDraft => ({
  text: "",
  options: ["", "", "", ""],
  answer: 0,
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
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
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
          questions: questions.map((q) => ({
            text: q.text,
            options: q.options,
            answer: q.answer,
          })),
        },
        token!
      );
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
        {error && (
          <div className="font-mono text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2">
            {error}
          </div>
        )}

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

        {/* Questions */}
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
