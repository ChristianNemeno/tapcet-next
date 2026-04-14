import { Router } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { signToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "../schemas/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: "Too many registration attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", registerLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body as RegisterInput;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(users)
      .values({ email: email.toLowerCase(), passwordHash, name })
      .returning({ id: users.id, role: users.role, name: users.name });

    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({ token, name: user.name, role: user.role });
  } catch (err) {
    next(err);
  }
});

router.post("/login", loginLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as LoginInput;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.json({ token, name: user.name, role: user.role });
  } catch (err) {
    next(err);
  }
});

export default router;
