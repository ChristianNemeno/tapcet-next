import "./env.js";
import express from "express";
import cors from "cors";
import { db } from "./core/db/index.js";
import { seed } from "./core/db/seed.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pool } from "./core/db/index.js";
import authRouter from "./modules/auth/auth.routes.js";
import quizRouter from "./modules/quiz/quiz.routes.js";
import userQuizRouter from "./modules/quiz-management/user-quiz.routes.js";
import adminQuizRouter from "./modules/quiz-management/admin-quiz.routes.js";
import collectionRouter from "./modules/collection/collection.routes.js";
import reviewRouter from "./modules/review/review.routes.js";
import ratingRouter from "./modules/rating/rating.routes.js";
import reportRouter from "./modules/report/report.routes.js";
import userRouter from "./modules/user/user.routes.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Trust the nginx reverse proxy so express-rate-limit can read the real client IP
app.set("trust proxy", 1);

if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000" })
  );
}

app.use(express.json());

app.use((req, res, next) => {
  const shouldLog =
    req.path.startsWith("/api/auth") ||
    req.path.startsWith("/api/admin") ||
    req.path.startsWith("/api/review-queue") ||
    (req.method === "POST" && /^\/api\/quiz\/[^/]+\/submit$/.test(req.path));

  if (!shouldLog) {
    next();
    return;
  }

  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const userId = req.user?.userId ?? "anonymous";
    console.info(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms user=${userId}`
    );
  });

  next();
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminQuizRouter);
app.use("/api", quizRouter);
app.use("/api", userQuizRouter);
app.use("/api", reviewRouter);
app.use("/api", collectionRouter);
app.use("/api", ratingRouter);
app.use("/api", reportRouter);
app.use("/api", userRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

async function start(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await migrate(db, { migrationsFolder: "./drizzle" });
      await seed();
      app.listen(PORT, () => {
        console.log(`Server running on :${PORT}`);
      });
      return;
    } catch (err) {
      if (attempt === retries) {
        console.error("Startup failed after all retries:", err);
        process.exit(1);
      }
      console.warn(`Startup attempt ${attempt}/${retries} failed, retrying in ${delayMs}ms...`, (err as Error).message);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

start();
