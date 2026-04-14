import { z } from "zod";

export const answerReviewSchema = z.object({
  questionId: z.string().min(1),
  selectedAnswer: z.number().int(),
});

export type AnswerReviewInput = z.infer<typeof answerReviewSchema>;
