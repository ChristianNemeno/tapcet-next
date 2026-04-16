"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchQuizForEdit, updateQuiz, deleteQuiz } from "@/lib/api";
import { EXAM_TAGS, SUBJECTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/ErrorAlert";
import { CsvImporter } from "@/components/CsvImporter";
import { JsonImporter } from "@/components/JsonImporter";
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

export default function EditQuizPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [visibility, setVisibility] = useState<"public" | "draft">("public");
  const [examTags, setExamTags] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleExamTag(tag: string) {
    setExamTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchQuizForEdit(id, token)
      .then((quiz) => {
        setTitle(quiz.title);
        setDescription(quiz.description ?? "");
        setTimeLimit(quiz.timeLimitSeconds ? String(quiz.timeLimitSeconds) : "");
        setVisibility(quiz.visibility ?? "public");
        setExamTags(quiz.examTags ?? []);
        setSubject(quiz.subject ?? "");
        setTopic(quiz.topic ?? "");
        setQuestions(
          quiz.questions.map((q) => ({
            text: q.text,
            options: q.options as [string, string, string, string],
            answer: q.answer ?? 0,
          }))
        );
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, id, router]);

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
      await updateQuiz(
        id,
        {
          title,
          description,
          timeLimitSeconds: timeLimit ? parseInt(timeLimit) : null,
          visibility,
          examTags,
          subject: subject || null,
          topic: topic || null,
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

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteQuiz(id, token!);
      router.push("/dashboard?tab=my-quizzes");
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 space-y-16">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
            Community
          </p>
          <h1 className="font-mono font-bold text-2xl tracking-tight">
            Edit quiz<span className="text-primary">.</span>
          </h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-xs text-destructive hover:text-destructive tracking-tight"
                disabled={deleting}
              />
            }
          >
            {deleting ? "deleting..." : "delete quiz"}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-mono tracking-tight">
                Delete &ldquo;{title}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the quiz and all leaderboard entries.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="font-mono text-xs bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
          <CsvImporter
            token={token!}
            onImport={(imported) => setQuestions((prev) => [...prev, ...imported])}
            mode="append"
          />
          <JsonImporter
            onImport={(imported) => setQuestions((prev) => [...prev, ...imported])}
            mode="append"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setQuestions((prev) => [
                ...prev,
                { text: "", options: ["", "", "", ""], answer: 0 },
              ])
            }
            className="font-mono text-xs tracking-tight"
          >
            + add question
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="font-mono text-xs tracking-tight">
            {saving ? "saving..." : "save changes"}
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
