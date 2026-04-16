"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { validateCsvImport, type CsvRow } from "@/lib/api";

interface QuestionDraft {
  text: string;
  options: [string, string, string, string];
  answer: number;
}

interface CsvImporterProps {
  token: string;
  onImport: (questions: QuestionDraft[]) => void;
  mode?: "replace" | "append"; // default: replace
}

const MAX_FILE_BYTES = 1 * 1024 * 1024; // 1 MB
const REQUIRED_HEADERS = ["question", "option_a", "option_b", "option_c", "option_d", "answer"];

export function CsvImporter({ token, onImport, mode = "replace" }: CsvImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "validating" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<{ row: number; message: string }[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  function reset() {
    setStatus("idle");
    setFeedback(null);
    setRowErrors([]);
    setImportedCount(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    reset();

    if (file.size > MAX_FILE_BYTES) {
      setStatus("error");
      setFeedback("File exceeds 1 MB limit. Please split it into smaller files.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStatus("error");
      setFeedback("Only .csv files are supported.");
      return;
    }

    setStatus("parsing");

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        // Check required headers
        const headers = result.meta.fields ?? [];
        const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          setStatus("error");
          setFeedback(`Missing columns: ${missing.join(", ")}. Download the template to see the required format.`);
          return;
        }

        if (result.data.length === 0) {
          setStatus("error");
          setFeedback("The file is empty. Add at least one question row.");
          return;
        }

        setStatus("validating");

        try {
          const rows = result.data as unknown as CsvRow[];
          const { parsed, errors } = await validateCsvImport(rows, token);

          setRowErrors(errors);
          setImportedCount(parsed.length);

          if (parsed.length === 0) {
            setStatus("error");
            setFeedback("No valid rows found. Fix the errors below and try again.");
            return;
          }

          onImport(parsed);
          setStatus("done");
          setFeedback(
            mode === "append"
              ? `${parsed.length} question${parsed.length !== 1 ? "s" : ""} appended.`
              : `${parsed.length} question${parsed.length !== 1 ? "s" : ""} imported.`
          );
        } catch (e) {
          setStatus("error");
          setFeedback((e as Error).message);
        }
      },
      error: (err) => {
        setStatus("error");
        setFeedback(`Could not parse file: ${err.message}`);
      },
    });
  }

  return (
    <div className="rounded-sm border border-dashed border-border bg-muted/20 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted-foreground">Import questions from CSV</p>
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
            disabled={status === "parsing" || status === "validating"}
          >
            {status === "parsing" || status === "validating" ? "processing..." : "Choose CSV file"}
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {/* Success feedback */}
      {status === "done" && feedback && (
        <p className="font-mono text-xs text-emerald-400">{feedback}</p>
      )}

      {/* Error feedback */}
      {status === "error" && feedback && (
        <p className="font-mono text-xs text-destructive">{feedback}</p>
      )}

      {/* Row-level errors */}
      {rowErrors.length > 0 && (
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">
            {rowErrors.length} row{rowErrors.length !== 1 ? "s" : ""} skipped:
          </p>
          <ul className="space-y-0.5 max-h-32 overflow-y-auto">
            {rowErrors.map((e) => (
              <li key={e.row} className="font-mono text-xs text-destructive/80">
                Row {e.row}: {e.message}
              </li>
            ))}
          </ul>
          {importedCount !== null && importedCount > 0 && (
            <p className="font-mono text-xs text-emerald-400">
              {importedCount} valid row{importedCount !== 1 ? "s" : ""} were imported.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
