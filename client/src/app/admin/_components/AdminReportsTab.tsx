"use client";

import { useEffect, useState } from "react";
import { fetchAdminReports, resolveReport } from "@/lib/api";
import type { AdminReport } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ErrorAlert";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-destructive/10 text-destructive border-destructive/20",
  reviewing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const TYPE_COLORS: Record<string, string> = {
  incorrect: "bg-destructive/10 text-destructive border-destructive/20",
  ambiguous: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  duplicate: "bg-primary/10 text-primary border-primary/20",
};

interface Props {
  token: string;
}

export function AdminReportsTab({ token }: Props) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReports(status: string) {
    setLoaded(false);
    setError(null);
    try {
      const data = await fetchAdminReports(
        { status: status === "all" ? undefined : status },
        token
      );
      setReports(data);
    } catch (err) {
      setError((err as Error).message);
      setReports([]);
    } finally {
      setLoaded(true);
    }
  }

  async function handleStatus(id: string, status: "open" | "reviewing" | "resolved") {
    setUpdatingId(id);
    try {
      const updated = await resolveReport(id, status, token);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase mb-4">
          Question Reports
        </h2>
        <div className="flex gap-2 flex-wrap">
          {["all", "open", "reviewing", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                loadReports(s);
              }}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <ErrorAlert message={error} />

      {!loaded ? (
        <p className="font-mono text-xs text-muted-foreground">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No reports found.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium truncate">{report.questionText}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5 truncate">
                    in <span className="text-foreground">{report.quizTitle}</span> · reported by {report.reporterName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-mono text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS[report.reportType]}`}>
                    {report.reportType}
                  </span>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[report.status]}`}>
                    {report.status}
                  </span>
                </div>
              </div>

              {report.comment && (
                <p className="font-mono text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
                  &ldquo;{report.comment}&rdquo;
                </p>
              )}

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
                <span className="text-muted-foreground/40">·</span>
                {report.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === report.id}
                    onClick={() => handleStatus(report.id, "reviewing")}
                    className="font-mono text-xs h-7"
                  >
                    Mark reviewing
                  </Button>
                )}
                {(report.status === "open" || report.status === "reviewing") && (
                  <Button
                    size="sm"
                    disabled={updatingId === report.id}
                    onClick={() => handleStatus(report.id, "resolved")}
                    className="font-mono text-xs h-7"
                  >
                    Resolve
                  </Button>
                )}
                {report.status === "resolved" && (
                  <span className="font-mono text-xs text-muted-foreground">
                    Resolved {report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString() : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
