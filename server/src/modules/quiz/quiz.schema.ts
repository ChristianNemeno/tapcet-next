import { z } from "zod";

export const csvImportRowSchema = z.object({
  question: z.string(),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  answer: z.string(),
});

export const csvImportSchema = z.object({
  rows: z.array(csvImportRowSchema).min(1, "at least one row required").max(200, "max 200 rows per import"),
});

export type CsvImportInput = z.infer<typeof csvImportSchema>;
export type CsvImportRow = z.infer<typeof csvImportRowSchema>;

export const submitQuizSchema = z.object({
  answers: z.record(z.string(), z.number().int()),
  nickname: z.string().optional(),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
