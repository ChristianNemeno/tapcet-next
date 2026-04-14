import type { DashboardEntry, MyQuizSummary } from "@/lib/types";
import { StatCard } from "./StatCard";

interface Props {
  entries: DashboardEntry[];
  myQuizzes: MyQuizSummary[];
  loadingAttempts: boolean;
  loadingQuizzes: boolean;
}

export function DashboardOverview({ entries, myQuizzes, loadingAttempts, loadingQuizzes }: Props) {
  const totalAttempts = entries.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(entries.reduce((s, e) => s + e.percentage, 0) / totalAttempts)
      : 0;
  const bestScore =
    totalAttempts > 0 ? Math.round(Math.max(...entries.map((e) => e.percentage))) : 0;
  const totalCreated = myQuizzes.length;
  const publicCount = myQuizzes.filter((q) => q.visibility === "public").length;
  const totalQuestions = myQuizzes.reduce((s, q) => s + q.questionCount, 0);

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">
          Overview
        </p>
        <h2 className="font-mono font-bold text-xl tracking-tight">
          Your stats<span className="text-primary">.</span>
        </h2>
      </div>

      <div className="mb-6">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
          Quiz Taking
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="total attempts" value={totalAttempts} loading={loadingAttempts} />
          <StatCard label="average score" value={`${avgScore}%`} loading={loadingAttempts} />
          <StatCard label="best score" value={`${bestScore}%`} loading={loadingAttempts} />
        </div>
      </div>

      <div>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
          Quiz Creation
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="quizzes created" value={totalCreated} loading={loadingQuizzes} />
          <StatCard label="public quizzes" value={publicCount} loading={loadingQuizzes} />
          <StatCard label="questions authored" value={totalQuestions} loading={loadingQuizzes} />
        </div>
      </div>
    </div>
  );
}
