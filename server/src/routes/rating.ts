import { Router } from "express";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import { rateQuizSchema, type RateQuizInput } from "../schemas/rating.js";
import { getRatingSummary, upsertRating } from "../services/ratingService.js";

const router = Router();

// GET /api/quiz/:id/rating
router.get("/quiz/:id/rating", optionalAuth, async (req, res, next) => {
  try {
    const data = await getRatingSummary(req.params.id, req.user?.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/quiz/:id/rate
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
