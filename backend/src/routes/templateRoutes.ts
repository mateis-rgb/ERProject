// Routes Templates de projets - CRUD + application à un projet
import { Router, Request, Response } from "express";
import { z } from "zod";
import { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, applyTemplate, TemplateInput } from "../services/templateService";
import { validateBody } from "../middleware/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireModule } from "../middleware/modules";
import { requireDefined } from "../utils/power10";

export const templateRouter = Router();

const milestoneSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional().default(""),
    offsetStartDays: z.number().int().min(-3650).max(3650).optional().default(0),
    durationDays: z.number().int().min(1).max(3650).optional().default(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#ffd600"),
});

const templateSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional().default(""),
    milestones: z.array(milestoneSchema).max(100).optional().default([]),
    folders: z.array(z.string().max(300)).max(200).optional().default([]),
    collaboratorIds: z.array(z.string().min(1)).max(50).optional().default([]),
});

const applySchema = z.object({ projectId: z.string().min(1) });

templateRouter.use(requireAuth);
templateRouter.use(requireModule("templates"));

templateRouter.get("/", async (_req: Request, res: Response) => {
    res.json({ success: true, data: await listTemplates() });
});

templateRouter.get("/:id", async (req: Request, res: Response) => {
    const tpl = await getTemplate(requireDefined(req.params.id, "id"));
    if (tpl === null) { res.status(404).json({ success: false, error: "Modèle introuvable" }); return; }
    res.json({ success: true, data: tpl });
});

templateRouter.post("/", requireRole("EDITOR"), validateBody(templateSchema), async (req: Request, res: Response) => {
    const body = req.body as TemplateInput;
    const tpl = await createTemplate(body);
    res.status(201).json({ success: true, data: tpl });
});

templateRouter.patch("/:id", requireRole("EDITOR"), validateBody(templateSchema), async (req: Request, res: Response) => {
    const tpl = await updateTemplate(requireDefined(req.params.id, "id"), req.body as TemplateInput);
    if (tpl === null) { res.status(404).json({ success: false, error: "Modèle introuvable" }); return; }
    res.json({ success: true, data: tpl });
});

templateRouter.delete("/:id", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const ok = await deleteTemplate(requireDefined(req.params.id, "id"));
    if (!ok) { res.status(404).json({ success: false, error: "Modèle introuvable" }); return; }
    res.json({ success: true, data: { message: "supprimé" } });
});

templateRouter.post("/:id/apply", requireRole("EDITOR"), validateBody(applySchema), async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const id = requireDefined(req.params.id, "id");
    const projectId = (req.body as { projectId: string }).projectId;
    const result = await applyTemplate(projectId, id, user.id);
    res.json({ success: true, data: result });
});
