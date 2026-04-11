"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchCollection,
  fetchQuizzes,
  updateCollection,
  addQuizToCollection,
  removeQuizFromCollection,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CollectionDetail, QuizSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EXAM_TAGS } from "@/lib/constants";

export default function EditCollectionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, role } = useAuth();

  const [col, setCol] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examTag, setExamTag] = useState("");
  const [visibility, setVisibility] = useState<"public" | "draft">("public");
  const [isOfficial, setIsOfficial] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quiz management
  const [allQuizzes, setAllQuizzes] = useState<QuizSummary[]>([]);
  const [quizSearch, setQuizSearch] = useState("");
  const [addingQuiz, setAddingQuiz] = useState<string | null>(null);
  const [removingQuiz, setRemovingQuiz] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }

    Promise.all([
      fetchCollection(id, token),
      fetchQuizzes(),
    ])
      .then(([colData, quizData]) => {
        setCol(colData);
        setTitle(colData.title);
        setDescription(colData.description);
        setExamTag(colData.examTag ?? "");
        setVisibility(colData.visibility);
        setIsOfficial(colData.isOfficial);
        setAllQuizzes(quizData);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, token, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !token) return;
    setSaving(true);
    setError(null);
    try {
      await updateCollection(id, { title, description, examTag: examTag || null, visibility, isOfficial }, token);
      setCol((prev) => prev ? { ...prev, title, description, examTag: examTag || null, visibility, isOfficial } : prev);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(quizId: string) {
    if (!token) return;
    setAddingQuiz(quizId);
    try {
      await addQuizToCollection(id, quizId, token);
      const quiz = allQuizzes.find((q) => q.id === quizId);
      if (quiz) {
        setCol((prev) =>
          prev
            ? {
                ...prev,
                quizCount: prev.quizCount + 1,
                quizzes: [...prev.quizzes, { ...quiz, orderIndex: prev.quizzes.length }],
              }
            : prev
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingQuiz(null);
    }
  }

  async function handleRemove(quizId: string) {
    if (!token) return;
    setRemovingQuiz(quizId);
    try {
      await removeQuizFromCollection(id, quizId, token);
      setCol((prev) =>
        prev
          ? {
              ...prev,
              quizCount: prev.quizCount - 1,
              quizzes: prev.quizzes.filter((q) => q.id !== quizId),
            }
          : prev
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemovingQuiz(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  if (!col) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="font-mono text-sm text-destructive">{error ?? "Collection not found."}</p>
      </div>
    );
  }

  const currentQuizIds = new Set(col.quizzes.map((q) => q.id));
  const filteredAll = allQuizzes.filter(
    (q) =>
      !currentQuizIds.has(q.id) &&
      (quizSearch === "" ||
        q.title.toLowerCase().includes(quizSearch.toLowerCase()) ||
        (q.subject?.toLowerCase().includes(quizSearch.toLowerCase()) ?? false))
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`/collection/${id}`} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Back to collection
      </Link>

      <div className="mt-4 mb-8">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">Edit</p>
        <h1 className="font-mono font-bold text-2xl tracking-tight truncate">
          {col.title}<span className="text-primary">.</span>
        </h1>
      </div>

      {error && (
        <div className="font-mono text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2 mb-6">
          {error}
        </div>
      )}

      {/* Metadata form */}
      <form onSubmit={handleSave} className="space-y-5 mb-10">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Metadata</p>

        <div className="space-y-1.5">
          <Label htmlFor="title" className="font-mono text-xs text-muted-foreground">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="font-mono text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-mono text-xs text-muted-foreground">Description</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="font-mono text-sm" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground">Target Exam</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setExamTag("")}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${!examTag ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              None
            </button>
            {EXAM_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => setExamTag(examTag === tag ? "" : tag)}
                className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${examTag === tag ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground">Visibility</p>
          <div className="flex gap-2">
            {(["public", "draft"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setVisibility(v)}
                className={`font-mono text-xs px-4 py-2 rounded-lg border transition-colors ${visibility === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {role === "admin" && (
          <div className="flex items-center gap-3">
            <input type="checkbox" id="official" checked={isOfficial} onChange={(e) => setIsOfficial(e.target.checked)} className="size-4 accent-primary" />
            <Label htmlFor="official" className="font-mono text-xs text-muted-foreground">Mark as Official</Label>
          </div>
        )}

        <Button type="submit" disabled={saving || !title.trim()} size="sm" className="font-mono text-xs">
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>

      {/* Current quizzes */}
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
          Quizzes in collection ({col.quizzes.length})
        </p>
        {col.quizzes.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground px-1">No quizzes yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {col.quizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/quiz/${quiz.id}`} className="font-mono text-sm flex-1 truncate hover:text-primary transition-colors">
                  {quiz.title}
                </Link>
                <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">
                  {quiz.questionCount} qs
                </span>
                <button
                  onClick={() => handleRemove(quiz.id)}
                  disabled={removingQuiz === quiz.id}
                  className="font-mono text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  {removingQuiz === quiz.id ? "..." : "remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add quizzes */}
      <div>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
          Add Quizzes
        </p>
        <Input
          value={quizSearch}
          onChange={(e) => setQuizSearch(e.target.value)}
          placeholder="Search by title or subject..."
          className="font-mono text-sm mb-3"
        />
        {filteredAll.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground px-1">
            {quizSearch ? "No matching quizzes." : "All public quizzes are already in this collection."}
          </p>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden max-h-80 overflow-y-auto">
            {filteredAll.map((quiz) => (
              <div key={quiz.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{quiz.title}</p>
                  {quiz.subject && (
                    <p className="font-mono text-xs text-muted-foreground">{quiz.subject}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">
                  {quiz.questionCount} qs
                </span>
                <button
                  onClick={() => handleAdd(quiz.id)}
                  disabled={addingQuiz === quiz.id}
                  className="font-mono text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
                >
                  {addingQuiz === quiz.id ? "..." : "add"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
