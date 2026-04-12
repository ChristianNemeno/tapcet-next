"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { QuizSummary, AdminReport } from "@/lib/types";
import { fetchQuizzes, fetchAdminReports, resolveReport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { EXAM_TAGS } from "@/lib/constants";

interface QuestionDraft {
  text: string;
  options: [string, string, string, string];
  answer: number;
}

interface SectionDraft {
  title: string;
  timeLimitSeconds: string;
  questions: QuestionDraft[];
}

const emptyQuestion = (): QuestionDraft => ({
  text: "",
  options: ["", "", "", ""],
  answer: 0,
});

const emptySection = (): SectionDraft => ({
  title: "",
  timeLimitSeconds: "",
  questions: [emptyQuestion()],
});

export default function AdminPage() {
  const { token, role } = useAuth();
  const router = useRouter();

  // --- Quizzes tab state ---
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Mock Exams tab state ---
  const [mockTitle, setMockTitle] = useState("");
  const [mockDescription, setMockDescription] = useState("");
  const [mockExamTag, setMockExamTag] = useState<string>(EXAM_TAGS[0]);
  const [mockScoringMode, setMockScoringMode] = useState<"standard" | "penalized">("standard");
  const [mockPenalty, setMockPenalty] = useState("0.25");
  const [mockSections, setMockSections] = useState<SectionDraft[]>([emptySection()]);
  const [mockSaving, setMockSaving] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);
  const [mockSuccess, setMockSuccess] = useState<string | null>(null);

  // --- Reports tab state ---
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [reportUpdating, setReportUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!token || role !== "admin") {
      router.replace("/");
      return;
    }
    fetchQuizzes().then(setQuizzes).catch(() => null);
  }, [token, role, router]);

  if (!token || role !== "admin") return null;

  // ---- Quizzes tab helpers ----

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          description,
          timeLimitSeconds: timeLimit ? parseInt(timeLimit) : undefined,
          isOfficial,
          questions: questions.map((q) => ({ text: q.text, options: q.options, answer: q.answer })),
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setSuccess("Quiz created!");
      setTitle(""); setDescription(""); setTimeLimit(""); setIsOfficial(false);
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

  // ---- Mock Exams tab helpers ----

  function updateMockSection(si: number, patch: Partial<SectionDraft>) {
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

  async function handleCreateMockExam(e: React.FormEvent) {
    e.preventDefault();
    setMockError(null);
    setMockSuccess(null);
    setMockSaving(true);
    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
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
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setMockSuccess("Mock exam created!");
      setMockTitle(""); setMockDescription(""); setMockExamTag(EXAM_TAGS[0]);
      setMockScoringMode("standard"); setMockPenalty("0.25");
      setMockSections([emptySection()]);
    } catch (err) {
      setMockError((err as Error).message);
    } finally {
      setMockSaving(false);
    }
  }

  // ---- Reports tab helpers ----

  async function loadReports(status: string) {
    if (!token) return;
    setReportsLoaded(false);
    try {
      const data = await fetchAdminReports({ status: status === "all" ? undefined : status }, token);
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setReportsLoaded(true);
    }
  }

  async function handleReportStatus(id: string, status: "open" | "reviewing" | "resolved") {
    if (!token) return;
    setReportUpdating(id);
    try {
      const updated = await resolveReport(id, status, token);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r)));
    } catch {
      // silent
    } finally {
      setReportUpdating(null);
    }
  }

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

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
          Administration
        </p>
        <h1 className="font-mono font-bold text-2xl tracking-tight">
          Manage content<span className="text-primary">.</span>
        </h1>
      </div>

      <Tabs defaultValue="quizzes">
        <TabsList className="mb-8">
          <TabsTrigger value="quizzes" className="font-mono text-xs">Quizzes</TabsTrigger>
          <TabsTrigger value="mock-exams" className="font-mono text-xs">Mock Exams</TabsTrigger>
          <TabsTrigger
            value="reports"
            className="font-mono text-xs"
            onClick={() => { if (!reportsLoaded) loadReports(statusFilter); }}
          >
            Reports
          </TabsTrigger>
        </TabsList>

        {/* ---- QUIZZES TAB ---- */}
        <TabsContent value="quizzes" className="space-y-12">
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

            {error && (
              <div className="font-mono text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2">
                {error}
              </div>
            )}
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
        </TabsContent>

        {/* ---- MOCK EXAMS TAB ---- */}
        <TabsContent value="mock-exams">
          <form onSubmit={handleCreateMockExam} className="space-y-8">
            <h2 className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase">
              Create Mock Exam
            </h2>
            <p className="font-mono text-xs text-muted-foreground -mt-4">
              Mock exams are official, sectioned quizzes that simulate the real exam experience.
            </p>

            {mockError && (
              <div className="font-mono text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2">
                {mockError}
              </div>
            )}
            {mockSuccess && (
              <div className="font-mono text-xs text-primary border border-primary/20 bg-primary/5 rounded px-3 py-2">
                {mockSuccess}
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

            {/* Scoring mode */}
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

            {/* Sections */}
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
                      <Input required value={sec.title} onChange={(e) => updateMockSection(si, { title: e.target.value })} placeholder={`e.g. Mathematics`} className="font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-xs tracking-tight">Time limit (seconds)</Label>
                      <Input type="number" min={30} value={sec.timeLimitSeconds} onChange={(e) => updateMockSection(si, { timeLimitSeconds: e.target.value })} placeholder="optional" className="font-mono text-sm" />
                    </div>
                  </div>

                  {/* Section questions */}
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
                            onClick={() => updateMockSection(si, { questions: sec.questions.filter((_, j) => j !== qi) })}
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
                      onClick={() => updateMockSection(si, { questions: [...sec.questions, emptyQuestion()] })}
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

            <Button type="submit" disabled={mockSaving} className="font-mono text-xs tracking-tight">
              {mockSaving ? "saving..." : "create mock exam"}
            </Button>
          </form>
        </TabsContent>

        {/* ---- REPORTS TAB ---- */}
        <TabsContent value="reports" className="space-y-6">
          <div>
            <h2 className="font-mono font-semibold text-sm tracking-tight text-muted-foreground uppercase mb-4">
              Question Reports
            </h2>
            {/* Status filter */}
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

          {!reportsLoaded ? (
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
                        disabled={reportUpdating === report.id}
                        onClick={() => handleReportStatus(report.id, "reviewing")}
                        className="font-mono text-xs h-7"
                      >
                        Mark reviewing
                      </Button>
                    )}
                    {(report.status === "open" || report.status === "reviewing") && (
                      <Button
                        size="sm"
                        disabled={reportUpdating === report.id}
                        onClick={() => handleReportStatus(report.id, "resolved")}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
