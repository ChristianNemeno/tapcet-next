import express from "express";
import cors from "cors";
import { db } from "./db/index.js";
import { seed } from "./db/seed.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pool } from "./db/index.js";
import quizRouter from "./routes/quiz.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000" })
  );
}

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api", quizRouter);

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

async function start() {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    await seed();
    app.listen(PORT, () => {
      console.log(`Server running on :${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

start();
