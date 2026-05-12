import { z } from "zod";

const questionDraftSchema = z.object({
  text: z.string().min(1, "text is required"),
  options: z.array(z.string()).length(4, "four options required"),
  answer: z.number().int().min(0).max(3),
});

const sectionDraftSchema = z.object({
  title: z.string(),
  timeLimitSeconds: z.number().int().positive().nullable().optional(),
  questions: z.array(questionDraftSchema).min(1),
});

export const createQuizSchema = z
  .object({
    title: z.string().min(1, "title is required"),
    description: z.string().optional(),
    timeLimitSeconds: z.number().int().positive().nullable().optional(),
    visibility: z.enum(["public", "draft"]).optional(),
    examTags: z.array(z.string()).optional(),
    subject: z.string().nullable().optional(),
    topic: z.string().nullable().optional(),
    isOfficial: z.boolean().optional(),
    quizType: z.enum(["standard", "mock_exam"]).optional(),
    scoringMode: z.enum(["standard", "penalized"]).optional(),
    penaltyFraction: z.number().min(0).max(1).optional(),
    questions: z.array(questionDraftSchema).optional(),
    sections: z.array(sectionDraftSchema).optional(),
  })
  .refine(
    (v) => (v.questions && v.questions.length > 0) || (v.sections && v.sections.length > 0),
    { message: "questions or sections with questions are required" }
  );

export type CreateQuizInput = z.infer<typeof createQuizSchema>;

export const updateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  timeLimitSeconds: z.number().int().positive().nullable().optional(),
  visibility: z.enum(["public", "draft"]).optional(),
  examTags: z.array(z.string()).optional(),
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  isOfficial: z.boolean().optional(),
  quizType: z.enum(["standard", "mock_exam"]).optional(),
  scoringMode: z.enum(["standard", "penalized"]).optional(),
  penaltyFraction: z.number().min(0).max(1).optional(),
  questions: z.array(questionDraftSchema).optional(),
  sections: z.array(sectionDraftSchema).optional(),
});

export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
