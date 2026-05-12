"use client";

import { useState } from "react";
import { reportQuestion } from "@/lib/api/report.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ReportModalProps {
  questionId: string;
  quizId: string;
  token: string;
  open: boolean;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "incorrect" as const, label: "Incorrect answer", desc: "The marked correct answer is wrong" },
  { value: "ambiguous" as const, label: "Ambiguous question", desc: "The question or options are unclear" },
  { value: "duplicate" as const, label: "Duplicate question", desc: "This question appears elsewhere" },
];

export function ReportModal({ questionId, quizId, token, open, onClose }: ReportModalProps) {
  const [reportType, setReportType] = useState<"incorrect" | "ambiguous" | "duplicate">("incorrect");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      await reportQuestion(questionId, { quizId, reportType, comment: comment.trim() || undefined }, token);
      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setComment("");
        setReportType("incorrect");
      }, 1500);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-tight text-base">Report a problem</DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            Help us improve question quality by flagging issues.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-6 text-center">
            <p className="font-mono text-sm text-primary font-semibold">Report submitted.</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">Thank you — our team will review it.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="font-mono text-xs tracking-tight">Issue type</Label>
              <div className="space-y-2">
                {REPORT_TYPES.map((rt) => (
                  <label
                    key={rt.value}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      reportType === rt.value
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={rt.value}
                      checked={reportType === rt.value}
                      onChange={() => setReportType(rt.value)}
                      className="accent-primary mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="font-mono text-sm font-medium leading-none mb-1">{rt.label}</p>
                      <p className="font-mono text-xs text-muted-foreground">{rt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="report-comment" className="font-mono text-xs tracking-tight">
                  Additional context <span className="text-muted-foreground">(optional)</span>
                </Label>
                <span className="font-mono text-xs text-muted-foreground">{comment.length}/500</span>
              </div>
              <textarea
                id="report-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Describe the issue..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            {status === "error" && (
              <p className="font-mono text-xs text-destructive">{errorMsg}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="font-mono text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={status === "submitting"}
                className="font-mono text-xs"
              >
                {status === "submitting" ? "Submitting..." : "Submit report"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
