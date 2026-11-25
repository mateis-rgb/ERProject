// Routes Planning global cross-projets (timeline + conflits de stock)
import { Router, Request, Response } from "express";
import { getPlanning } from "../services/planningService";
import { requireAuth } from "../middleware/auth";
import { requireModule } from "../middleware/modules";

export const planningRouter = Router();

planningRouter.use(requireAuth);
planningRouter.use(requireModule("gantt"));

// Jalons de tous les projets actifs + conflits de réservation de stock
planningRouter.get("/", async (_req: Request, res: Response) => {
    const planning = await getPlanning();
    res.json({ success: true, data: planning });
});
