"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { QuizSummary } from "@/lib/types";
import { fetchQuizzes } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

export default function AdminPage() {
  const { token, role } = useAuth();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token || role !== "admin") {
      router.replace("/");
      return;
    }
    fetchQuizzes().then(setQuizzes).catch(() => null);
  }, [token, role, router]);

  if (!token || role !== "admin") return null;

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
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          timeLimitSeconds: timeLimit ? parseInt(timeLimit) : undefined,
          questions: questions.map((q) => ({
            text: q.text,
            options: q.options,
            answer: q.answer,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setSuccess("Quiz created!");
      setTitle("");
      setDescription("");
      setTimeLimit("");
      setQuestions([emptyQuestion()]);
      const updated = await fetchQuizzes();
      setQuizzes(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/admin/quizzes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch {
      setError("Failed to delete quiz.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Admin</h1>
        <p className="text-muted-foreground">Manage quizzes.</p>
      </div>

      {/* Existing quizzes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Existing quizzes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quizzes.length === 0 && (
            <p className="text-muted-foreground text-sm">No quizzes yet.</p>
          )}
          {quizzes.map((q) => (
            <div key={q.id} className="flex items-center justify-between border rounded-md px-3 py-2">
              <div>
                <span className="font-medium text-sm">{q.title}</span>
                <Badge variant="secondary" className="ml-2">{q.questionCount}q</Badge>
              </div>
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="destructive" size="sm" />}
                >
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete &ldquo;{q.title}&rdquo;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the quiz and all leaderboard entries.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(q.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Create quiz form */}
      <form onSubmit={handleCreate} className="space-y-6">
        <h2 className="text-lg font-semibold">Create quiz</h2>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="timeLimit">Time limit (seconds, optional)</Label>
            <Input
              id="timeLimit"
              type="number"
              min={10}
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-4">
          <p className="font-medium text-sm">Questions</p>
          {questions.map((q, qi) => (
            <Card key={qi}>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Question {qi + 1}</Label>
                  <Input
                    required
                    value={q.text}
                    onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                    placeholder="Question text"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
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
                        placeholder={`Option ${oi + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
          >
            + Add question
          </Button>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create quiz"}
        </Button>
      </form>
    </div>
  );
}
