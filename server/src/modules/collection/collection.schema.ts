import { z } from "zod";

export const createCollectionSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  description: z.string().optional(),
  examTag: z.string().nullable().optional(),
  visibility: z.enum(["public", "draft"]).optional(),
  isOfficial: z.boolean().optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  examTag: z.string().nullable().optional(),
  visibility: z.enum(["public", "draft"]).optional(),
  isOfficial: z.boolean().optional(),
});

export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
