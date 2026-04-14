import { z } from "zod";
import { REPORT_REASONS, REPORT_STATUSES } from "../constants/reportStatus.js";
import { MAX_REPORT_COMMENT_LENGTH } from "../constants/limits.js";

export const createReportSchema = z.object({
  quizId: z.string().min(1),
  reportType: z.enum(REPORT_REASONS),
  comment: z.string().max(MAX_REPORT_COMMENT_LENGTH).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES),
});

export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
