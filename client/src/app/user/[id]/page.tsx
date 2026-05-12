"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCreatorProfile } from "@/lib/api/user.api";
import type { CreatorProfile } from "@/lib/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SUBJECT_BADGE } from "@/lib/constants/subjects";

function SubjectBadge({ subject }: { subject: string }) {
  const cls = SUBJECT_BADGE[subject] ?? "bg-muted text-muted-foreground border border-border";
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${cls}`}>
      {subject}
    </span>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-lg border border-border bg-card min-w-[80px]">
      <span className="text-lg font-extrabold tabular-nums leading-none">{value}</span>
      <span className="text-xs text-muted-foreground mt-1 text-center">{label}</span>
    </div>
  );
}

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCreatorProfile(id)
      .then(setProfile)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-20 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (!profile) return null;

  const joinedYear = new Date(profile.joinedAt).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-12">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{profile.name}</h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">Joined {joinedYear}</p>
          </div>
          <CopyLinkButton
            url={typeof window !== "undefined" ? window.location.href : ""}
            label="Share Profile"
            variant="outline"
            size="sm"
          />
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mt-6">
          <StatCard value={profile.quizCount} label="quizzes" />
          <StatCard value={profile.collectionCount} label="collections" />
          <StatCard value={profile.totalAttempts.toLocaleString()} label="attempts" />
          <StatCard
            value={profile.averageRating !== null ? profile.averageRating.toFixed(1) : "—"}
            label="avg rating"
          />
        </div>
      </div>

      {/* Quizzes */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Quizzes ({profile.quizCount})
        </p>

        {profile.quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public quizzes yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.quizzes.map((quiz) => (
              <Link key={quiz.id} href={`/quiz/${quiz.id}`} className="group block">
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 h-full group-hover:border-border/80 transition-colors">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quiz.subject ? (
                      <SubjectBadge subject={quiz.subject} />
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                        General
                      </span>
                    )}
                    {quiz.isOfficial && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25">
                        Official
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors flex-1">
                    {quiz.title}
                  </h3>
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-auto">
                    <span className="font-mono text-xs text-muted-foreground">
                      {quiz.questionCount} questions
                    </span>
                    {quiz.examTags.length > 0 && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="font-mono text-xs text-muted-foreground/70 truncate">
                          {quiz.examTags.slice(0, 2).join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Collections */}
      {profile.collections.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Collections ({profile.collectionCount})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.collections.map((col) => (
              <Link key={col.id} href={`/collection/${col.id}`} className="group block">
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 group-hover:border-border/80 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors">
                      {col.title}
                    </h3>
                    {col.isOfficial && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 shrink-0">
                        Official
                      </span>
                    )}
                  </div>
                  {col.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{col.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-auto">
                    <span className="font-mono text-xs text-muted-foreground">
                      {col.quizCount} quiz{col.quizCount !== 1 ? "zes" : ""}
                    </span>
                    {col.examTag && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="font-mono text-xs text-muted-foreground/70">{col.examTag}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
