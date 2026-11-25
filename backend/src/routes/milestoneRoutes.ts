// Routes Jalons (milestones) d'un projet + stock réservé par jalon
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
    createMilestone, listMilestones, updateMilestone, deleteMilestone,
    linkStockToMilestone, unlinkStockFromMilestone, getMilestoneStock, getAvailability,
} from "../services/milestoneService";
import { validateBody, validateQuery } from "../middleware/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireModule } from "../middleware/modules";

export const milestoneRouter = Router();

milestoneRouter.use(requireAuth);
// Gate "gantt" uniquement sur les chemins jalons (sinon il bloquerait ex. /stock/:id/comments du commentRouter)
const GANTT_PATH = /^\/(milestones|projects\/[^/]+\/milestones|stock\/[^/]+\/availability)/;
milestoneRouter.use((req: Request, _res: Response, next: NextFunction) => {
    if (GANTT_PATH.test(req.path)) {
        void requireModule("gantt")(req, _res, next);
        return;
    }
    next();
});

// Accepte datetime ISO complet ou date seule YYYY-MM-DD (input type=date)
const dateSchema = z.union([
    z.string().datetime(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid datetime"),
]);

const milestoneSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional().default(""),
    startDate: dateSchema,
    endDate: dateSchema,
    color: z.string().max(20).optional().default("#ffd600"),
    parentId: z.string().min(1).optional().nullable(), // sous-jalon
});

const stockLinkSchema = z.object({
    stockItemId: z.string().min(1),
    quantity: z.number().nonnegative(),
});

// CRUD jalons d'un projet
milestoneRouter.get("/projects/:projectId/milestones", async (req: Request, res: Response) => {
    const pid = req.params.projectId ?? "";
    const ms = await listMilestones(pid);
    res.json({ success: true, data: ms });
});

milestoneRouter.post("/projects/:projectId/milestones", requireRole("EDITOR"), validateBody(milestoneSchema), async (req: Request, res: Response) => {
    const pid = req.params.projectId ?? "";
    const b = req.body as { name: string; description: string; startDate: string; endDate: string; color: string; parentId?: string | null };
    try {
        const m = await createMilestone(pid, {
            name: b.name, description: b.description,
            startDate: new Date(b.startDate), endDate: new Date(b.endDate), color: b.color,
            parentId: b.parentId ?? null,
        });
        res.status(201).json({ success: true, data: m });
    } catch (err) {
        res.status(400).json({ success: false, error: err instanceof Error ? err.message : "Erreur" });
    }
});

milestoneRouter.patch("/milestones/:id", requireRole("EDITOR"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const b = req.body as Partial<{ name: string; description: string; startDate: string; endDate: string; color: string; parentId: string | null }>;
    const input: Record<string, unknown> = { ...b };
    if (typeof b.startDate === "string") input.startDate = new Date(b.startDate);
    if (typeof b.endDate === "string") input.endDate = new Date(b.endDate);
    try {
        const m = await updateMilestone(id, input);
        res.json({ success: true, data: m });
    } catch (err) {
        res.status(400).json({ success: false, error: err instanceof Error ? err.message : "Erreur" });
    }
});

milestoneRouter.delete("/milestones/:id", requireRole("EDITOR"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    await deleteMilestone(id);
    res.json({ success: true, data: { message: "Jalon supprimé" } });
});

// Stock réservé sur un jalon
milestoneRouter.get("/milestones/:id/stock", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const links = await getMilestoneStock(id);
    res.json({ success: true, data: links });
});

milestoneRouter.post("/milestones/:id/stock", requireRole("EDITOR"), validateBody(stockLinkSchema), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const b = req.body as { stockItemId: string; quantity: number };
    const link = await linkStockToMilestone(id, b.stockItemId, b.quantity);
    res.status(201).json({ success: true, data: link });
});

milestoneRouter.delete("/milestones/:id/stock/:stockItemId", requireRole("EDITOR"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const sid = req.params.stockItemId ?? "";
    await unlinkStockFromMilestone(id, sid);
    res.json({ success: true, data: { message: "Réservation supprimée" } });
});

// Disponibilité d'un article sur une plage [from, to] (défaut : maintenant)
// Règle : pris sur un projet = indisponible, sauf si rentré (RETURN) avant la fin du jalon
const availSchema = z.object({
    date: dateSchema.optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
});

milestoneRouter.get("/stock/:stockItemId/availability", validateQuery(availSchema), async (req: Request, res: Response) => {
    const sid = req.params.stockItemId ?? "";
    const q = req.query as { date?: string; from?: string; to?: string };
    const now = new Date();
    const from = q.from !== undefined ? new Date(q.from) : (q.date !== undefined ? new Date(q.date) : now);
    const to = q.to !== undefined ? new Date(q.to) : from;
    const avail = await getAvailability(sid, from, to);
    res.json({ success: true, data: avail });
});
