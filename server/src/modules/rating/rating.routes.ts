import { Router } from "express";
import { authenticateToken, optionalAuth } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/middleware/validate-request.middleware.js";
import { rateQuizSchema, type RateQuizInput } from "./rating.schema.js";
import { getRatingSummary, upsertRating } from "./rating.service.js";

const router = Router();

router.get("/quiz/:id/rating", optionalAuth, async (req, res, next) => {
  try {
    const data = await getRatingSummary(req.params.id, req.user?.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/quiz/:id/rate", authenticateToken, validateBody(rateQuizSchema), async (req, res, next) => {
  try {
    const { rating } = req.body as RateQuizInput;
    await upsertRating(req.params.id, req.user!.userId, rating);
    const data = await getRatingSummary(req.params.id, req.user!.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
