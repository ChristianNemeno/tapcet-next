"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { QuizFormPayload } from "@/lib/types/quiz";

interface QuestionDraft {
  text: string;
  options: [string, string, string, string];
  answer: number;
}

interface JsonImporterProps {
  onImport: (questions: QuestionDraft[], meta?: Partial<Pick<QuizFormPayload, "title" | "description" | "examTags" | "subject" | "topic">>) => void;
  mode?: "replace" | "append";
}

const MAX_FILE_BYTES = 1 * 1024 * 1024; // 1 MB

export function JsonImporter({ onImport, mode = "replace" }: JsonImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  function reset() {
    setStatus("idle");
    setFeedback(null);
    setImportedCount(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFile(file: File) {
    reset();

    if (file.size > MAX_FILE_BYTES) {
      setStatus("error");
      setFeedback("File exceeds 1 MB limit.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setStatus("error");
      setFeedback("Only .json files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string) as unknown;

        if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
          setStatus("error");
          setFeedback("Invalid JSON: expected an object matching the QuizFormPayload shape.");
          return;
        }

        const payload = raw as Partial<QuizFormPayload>;

        // Extract questions from flat list or from sections
        const flatQuestions = payload.questions ?? [];
        const sectionQuestions = (payload.sections ?? []).flatMap((s) => s.questions ?? []);
        const allQuestions = flatQuestions.length > 0 ? flatQuestions : sectionQuestions;

        if (allQuestions.length === 0) {
          setStatus("error");
          setFeedback("No questions found in the JSON file.");
          return;
        }

        // Validate each question
        const errors: string[] = [];
        const valid: QuestionDraft[] = [];

        allQuestions.forEach((q, i) => {
          if (typeof q.text !== "string" || !q.text.trim()) {
            errors.push(`Question ${i + 1}: text is required`);
            return;
          }
          if (!Array.isArray(q.options) || q.options.length !== 4) {
            errors.push(`Question ${i + 1}: options must be an array of 4 strings`);
            return;
          }
          if (typeof q.answer !== "number" || q.answer < 0 || q.answer > 3) {
            errors.push(`Question ${i + 1}: answer must be 0–3`);
            return;
          }
          valid.push({
            text: q.text,
            options: q.options as [string, string, string, string],
            answer: q.answer,
          });
        });

        if (valid.length === 0) {
          setStatus("error");
          setFeedback(`No valid questions found. ${errors[0] ?? ""}`);
          return;
        }

        const meta: Partial<Pick<QuizFormPayload, "title" | "description" | "examTags" | "subject" | "topic">> = {};
        if (mode === "replace") {
          if (typeof payload.title === "string") meta.title = payload.title;
          if (typeof payload.description === "string") meta.description = payload.description;
          if (Array.isArray(payload.examTags)) meta.examTags = payload.examTags as string[];
          if (typeof payload.subject === "string" || payload.subject === null) meta.subject = payload.subject ?? undefined;
          if (typeof payload.topic === "string" || payload.topic === null) meta.topic = payload.topic ?? undefined;
        }

        onImport(valid, mode === "replace" ? meta : undefined);
        setImportedCount(valid.length);
        setStatus("done");
        setFeedback(
          mode === "append"
            ? `${valid.length} question${valid.length !== 1 ? "s" : ""} appended.`
            : `${valid.length} question${valid.length !== 1 ? "s" : ""} imported.`
        );

        if (errors.length > 0) {
          setFeedback((prev) => `${prev} (${errors.length} row${errors.length !== 1 ? "s" : ""} skipped)`);
        }
      } catch {
        setStatus("error");
        setFeedback("Could not parse JSON. Make sure the file is valid JSON.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="rounded-sm border border-dashed border-border bg-muted/20 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted-foreground">Import questions from JSON</p>
        <div className="flex items-center gap-2">
          {status !== "idle" && (
            <button
              type="button"
              onClick={reset}
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              clear
            </button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={() => inputRef.current?.click()}
          >
            Choose JSON file
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {status === "done" && feedback && (
        <p className="font-mono text-xs text-emerald-400">{feedback}</p>
      )}
      {status === "error" && feedback && (
        <p className="font-mono text-xs text-destructive">{feedback}</p>
      )}

      {importedCount !== null && importedCount > 0 && status === "done" && mode === "replace" && (
        <p className="font-mono text-xs text-muted-foreground">
          Quiz metadata (title, subject, tags) was also imported if present.
        </p>
      )}
    </div>
  );
}
