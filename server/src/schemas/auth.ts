import { z } from "zod";

export const registerSchema = z.object({
  email: z.string({ error: "email is required" }).email(),
  password: z.string({ error: "password is required" }).min(1, "password is required"),
  name: z.string({ error: "name is required" }).trim().min(1, "name is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
