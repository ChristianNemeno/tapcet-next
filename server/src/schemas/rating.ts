import { z } from "zod";

export const rateQuizSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export type RateQuizInput = z.infer<typeof rateQuizSchema>;
