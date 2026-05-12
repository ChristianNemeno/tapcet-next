"use client";

import { useEffect, useState } from "react";
import { fetchQuizzes } from "@/lib/api/quiz.api";
import { createAdminQuiz, deleteAdminQuiz } from "@/lib/api/quiz-management.api";
import type { QuizSummary } from "@/lib/types/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ErrorAlert } from "@/components/ErrorAlert";
import { emptyQuestion, type QuestionDraft } from "./types";

interface Props {
  token: string;
}

export function AdminQuizzesTab({ token }: Props) {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes()
      .then(setQuizzes)
      .catch((e: Error) => setError(e.message));
  }, []);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await createAdminQuiz(
        {
          title,
          description,
          timeLimitSeconds: timeLimit ? parseInt(timeLimit) : undefined,
          isOfficial,
          questions: questions.map((q) => ({ text: q.text, options: q.options, answer: q.answer })),
        },
        token
      );
      setSuccess("Quiz created!");
      setTitle(""); setDescription(""); setTimeLimit(""); setIsOfficial(false);
      setQuestions([emptyQuestion()]);
      setQuizzes(await fetchQuizzes());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAdminQuiz(id, token);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase mb-6">
          Existing Quizzes
        </h2>
        {quizzes.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">No quizzes yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {quizzes.map((q) => (
              <div key={q.id} className="flex items-center justify-between py-4 first:pt-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium">{q.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">{q.questionCount}q</span>
                  {q.quizType === "mock_exam" && (
                    <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">mock</Badge>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-mono text-xs text-destructive hover:text-destructive tracking-tight"
                      />
                    }
                  >
                    delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-mono tracking-tight">
                        Delete &ldquo;{q.title}&rdquo;?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the quiz and all leaderboard entries.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(q.id)}
                        className="font-mono text-xs bg-destructive text-white hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="border-t border-border" />

      <form onSubmit={handleCreate} className="space-y-8">
        <h2 className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase">
          Create Quiz
        </h2>

        <ErrorAlert message={error} />
        {success && (
          <div className="font-mono text-xs text-primary border border-primary/20 bg-primary/5 rounded px-3 py-2">
            {success}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="font-mono text-xs tracking-tight">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timeLimit" className="font-mono text-xs tracking-tight">Time limit (seconds)</Label>
            <Input id="timeLimit" type="number" min={10} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="optional" className="font-mono text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-mono text-xs tracking-tight">Description</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="font-mono text-sm" />
        </div>

        <div className="border border-amber-500/20 bg-amber-500/5 rounded-sm px-4 py-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isOfficial} onChange={(e) => setIsOfficial(e.target.checked)} className="accent-primary size-4" />
            <div>
              <p className="font-mono text-sm font-semibold text-amber-400">Mark as Official</p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">Official quizzes are shown first in listings with a badge.</p>
            </div>
          </label>
        </div>

        <div className="space-y-6">
          <p className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase">Questions</p>
          {questions.map((q, qi) => (
            <div key={qi} className="border border-border rounded-sm p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs tracking-tight">Question {String(qi + 1).padStart(2, "0")}</Label>
                <Input required value={q.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })} placeholder="Question text" className="font-mono text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`answer-${qi}`} checked={q.answer === oi} onChange={() => updateQuestion(qi, { answer: oi })} className="accent-primary" />
                    <Input required value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="font-mono text-sm" />
                  </div>
                ))}
              </div>
              <p className="font-mono text-xs text-muted-foreground">Select the correct answer above.</p>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])} className="font-mono text-xs tracking-tight">
            + add question
          </Button>
        </div>

        <Button type="submit" disabled={saving} className="font-mono text-xs tracking-tight">
          {saving ? "saving..." : "create quiz"}
        </Button>
      </form>
    </div>
  );
}
