"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCollection } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXAM_TAGS } from "@/lib/constants";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function CreateCollectionPage() {
  const router = useRouter();
  const { token, role } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examTag, setExamTag] = useState("");
  const [visibility, setVisibility] = useState<"public" | "draft">("public");
  const [isOfficial, setIsOfficial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    router.replace("/login");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const col = await createCollection(
        {
          title,
          description,
          examTag: examTag || null,
          visibility,
          isOfficial,
        },
        token!
      );
      router.push(`/collection/${col.id}/edit`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <Link href="/collections" className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Collections
      </Link>

      <div className="mt-4 mb-8">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">
          New
        </p>
        <h1 className="font-mono font-bold text-2xl tracking-tight">
          Create a collection<span className="text-primary">.</span>
        </h1>
      </div>

      <ErrorAlert message={error} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="UPCAT Mathematics — Full Coverage"
            required
            className="font-mono text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Description
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of this collection"
            className="font-mono text-sm"
          />
        </div>

        {/* Exam tag */}
        <div className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Target Exam
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setExamTag("")}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                !examTag
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
            >
              None
            </button>
            {EXAM_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setExamTag(examTag === tag ? "" : tag)}
                className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  examTag === tag
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Visibility
          </p>
          <div className="flex gap-2">
            {(["public", "draft"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`font-mono text-xs px-4 py-2 rounded-lg border transition-colors ${
                  visibility === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Official (admin only) */}
        {role === "admin" && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="official"
              checked={isOfficial}
              onChange={(e) => setIsOfficial(e.target.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="official" className="font-mono text-xs text-muted-foreground">
              Mark as Official
            </Label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving || !title.trim()} className="font-mono text-sm">
            {saving ? "Creating..." : "Create & add quizzes →"}
          </Button>
          <Link href="/collections">
            <Button type="button" variant="ghost" className="font-mono text-sm">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
