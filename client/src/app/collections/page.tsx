"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCollections } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CollectionSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EXAM_TAGS } from "@/lib/constants";

function CollectionCard({ col, index }: { col: CollectionSummary; index: number }) {
  return (
    <Link
      href={`/collection/${col.id}`}
      className="group rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {col.examTag && (
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              {col.examTag}
            </span>
          )}
          {col.isOfficial && (
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ★ Official
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-muted-foreground/50 tabular-nums shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div>
        <h3 className="font-mono font-semibold text-sm tracking-tight group-hover:text-primary transition-colors leading-snug mb-1">
          {col.title}
        </h3>
        {col.description && (
          <p className="font-mono text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {col.description}
          </p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <span>{col.quizCount} quiz{col.quizCount !== 1 ? "zes" : ""}</span>
          <span>{col.followerCount} follower{col.followerCount !== 1 ? "s" : ""}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground truncate max-w-24 text-right">
          {col.creatorName ?? "Community"}
        </span>
      </div>
    </Link>
  );
}

function CollectionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-6" />
      </div>
      <div>
        <Skeleton className="h-4 w-3/4 mb-1.5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3 mt-1" />
      </div>
      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const { token, role } = useAuth();
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState("");
  const [officialOnly, setOfficialOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchCollections({
      exam: examFilter || undefined,
      official: officialOnly || undefined,
    })
      .then(setCollections)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [examFilter, officialOnly]);

  const filtered = collections;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">
            Browse
          </p>
          <h1 className="font-mono font-bold text-2xl tracking-tight">
            Collections<span className="text-primary">.</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            Curated quiz sets by subject and exam.
          </p>
        </div>
        {token && (
          <Link href="/collection/create">
            <Button size="sm" className="font-mono text-xs">
              + New Collection
            </Button>
          </Link>
        )}
        {!token && role === null && (
          <Link href="/collection/create">
            <Button size="sm" variant="outline" className="font-mono text-xs">
              + New Collection
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => { setExamFilter(""); setOfficialOnly(false); }}
          className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            !examFilter && !officialOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
          }`}
        >
          All
        </button>
        {EXAM_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => { setExamFilter(examFilter === tag ? "" : tag); setOfficialOnly(false); }}
            className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              examFilter === tag
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
        <button
          onClick={() => setOfficialOnly(!officialOnly)}
          className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            officialOnly
              ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
              : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
          }`}
        >
          ★ Official
        </button>
      </div>

      {/* Count */}
      <p className="font-mono text-xs text-muted-foreground mb-4">
        {loading ? "Loading..." : `${filtered.length} collection${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CollectionCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-mono text-sm text-muted-foreground mb-4">
            No collections found.
          </p>
          {token && (
            <Link href="/collection/create">
              <Button variant="outline" className="font-mono text-sm">
                Create the first one
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((col, i) => (
            <CollectionCard key={col.id} col={col} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
