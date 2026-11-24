// Routes Projets - CRUD + collaborateurs + liaisons stock + time tracking
import { Router, Request, Response } from "express";
import { z } from "zod";
import {
    createProject, getProjectById, listProjects, updateProject, deleteProject, getProjectStats,
} from "../services/projectService";
import { linkStockToProject, getProjectStockLinks, unlinkStockFromProject } from "../services/stockService";
import { addTimeEntry, getProjectTimeEntries, getTotalHoursByProject } from "../services/timeService";
import { getActivityLogs } from "../services/activityService";
import { generateProjectPdf, ExportMode } from "../services/pdfService";
import { applyTemplate } from "../services/templateService";
import { getPrisma } from "../config/prisma";
import { validateBody, validateQuery } from "../middleware/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireModule } from "../middleware/modules";
import { projectCreateSchema, projectUpdateSchema, projectStockSchema, timeEntrySchema } from "../types/schemas";
import { requireDefined } from "../utils/power10";

export const projectRouter = Router();

const querySchema = z.object({
    status: z.string().optional(),
    type: z.string().optional(),
    search: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
});

projectRouter.use(requireAuth);

projectRouter.get("/", validateQuery(querySchema), async (req: Request, res: Response) => {
    const q = req.query as { status?: string; type?: string; search?: string; limit?: string; offset?: string };
    const projects = await listProjects({
        status: q.status,
        type: q.type,
        search: q.search,
        limit: q.limit ? parseInt(q.limit, 10) : undefined,
        offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
    res.json({ success: true, data: projects });
});

projectRouter.get("/stats", async (_req: Request, res: Response) => {
    const stats = await getProjectStats();
    res.json({ success: true, data: stats });
});

projectRouter.post("/", requireRole("EDITOR"), validateBody(projectCreateSchema), async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const body = req.body as {
        name: string; description: string; status: string;
        startDate?: string | null; endDate?: string | null;
        budget?: number | null; client: string; tags: string[]; type: string;
        quotaBytes?: number | null;
        collaboratorIds: string[];
    };
    const project = await createProject({
        name: body.name,
        description: body.description,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        budget: body.budget ?? null,
        client: body.client,
        tags: body.tags,
        type: body.type,
        quotaBytes: body.quotaBytes ?? null,
        collaboratorIds: body.collaboratorIds,
    }, user.id);
    // Applique le template demandé (jalons + dossiers + collaborateurs)
    const templateId = (req.body as { templateId?: string | null }).templateId;
    if (templateId !== undefined && templateId !== null && templateId !== "") {
        await applyTemplate(project.id, templateId, user.id);
    }
    res.status(201).json({ success: true, data: project });
});

projectRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const project = await getProjectById(id);
    if (project === null) {
        res.status(404).json({ success: false, error: "Projet non trouvé" });
        return;
    }
    res.json({ success: true, data: project });
});

// Collaborateurs du projet (noms/emails/rôles) - pour la modale de l'en-tête
projectRouter.get("/:id/collaborators", async (req: Request, res: Response) => {
    const id = requireDefined(req.params.id, "id");
    const rows = await getPrisma().projectCollaborator.findMany({
        where: { projectId: id },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    res.json({ success: true, data: rows.map((r) => r.user) });
});

// Export PDF du projet : ?mode=complet|previsionnel|definitif
projectRouter.get("/:id/export", requireModule("export_pdf"), async (req: Request, res: Response) => {
    const id = requireDefined(req.params.id, "id");
    const q = req.query.mode;
    const mode: ExportMode = q === "previsionnel" || q === "definitif" ? q : "complet";
    const pdf = await generateProjectPdf(id, mode);
    if (pdf === null) {
        res.status(404).json({ success: false, error: "Projet non trouvé" });
        return;
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="projet-${id}-${mode}.pdf"`);
    res.send(pdf);
});

projectRouter.patch("/:id", requireRole("EDITOR"), validateBody(projectUpdateSchema), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const user = requireDefined(req.authUser, "authUser");
    const body = req.body as Record<string, unknown>;
    if (body.quotaBytes !== undefined && user.role !== "ADMIN") {
        res.status(403).json({ success: false, error: "Seul un administrateur peut définir le quota" });
        return;
    }
    const input: Record<string, unknown> = { ...body };
    if (typeof body.startDate === "string") input.startDate = new Date(body.startDate);
    if (typeof body.endDate === "string") input.endDate = new Date(body.endDate);
    const project = await updateProject(id, input, user.id);
    res.json({ success: true, data: project });
});

projectRouter.delete("/:id", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const user = requireDefined(req.authUser, "authUser");
    await deleteProject(id, user.id);
    res.json({ success: true, data: { message: "Projet supprimé" } });
});

// Liaisons stock
projectRouter.get("/:id/stock", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const links = await getProjectStockLinks(id);
    res.json({ success: true, data: links });
});

projectRouter.post("/:id/stock", requireRole("EDITOR"), validateBody(projectStockSchema), async (req: Request, res: Response) => {
    const projectId = req.params.id ?? "";
    const body = req.body as {
        stockItemId: string; allocatedQuantity: number;
        forecastQuantity: number; forecastDate?: string | null; milestoneId?: string | null;
    };
    const link = await linkStockToProject(projectId, {
        stockItemId: body.stockItemId,
        allocatedQuantity: body.allocatedQuantity,
        forecastQuantity: body.forecastQuantity,
        forecastDate: body.forecastDate ? new Date(body.forecastDate) : null,
        milestoneId: body.milestoneId ?? null,
    });
    res.status(201).json({ success: true, data: link });
});

projectRouter.delete("/:id/stock/:stockItemId", requireRole("EDITOR"), async (req: Request, res: Response) => {
    const projectId = req.params.id ?? "";
    const stockItemId = req.params.stockItemId ?? "";
    await unlinkStockFromProject(projectId, stockItemId);
    res.json({ success: true, data: { message: "Liaison supprimée" } });
});

// Time tracking
projectRouter.get("/:id/time", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const entries = await getProjectTimeEntries(id);
    const total = await getTotalHoursByProject(id);
    res.json({ success: true, data: { entries, totalHours: total } });
});

projectRouter.post("/:id/time", requireRole("EDITOR"), validateBody(timeEntrySchema), async (req: Request, res: Response) => {
    const projectId = req.params.id ?? "";
    const user = requireDefined(req.authUser, "authUser");
    const body = req.body as { hours: number; description: string; date?: string };
    const entry = await addTimeEntry(projectId, user.id, {
        hours: body.hours,
        description: body.description,
        date: body.date ? new Date(body.date) : new Date(),
    });
    res.status(201).json({ success: true, data: entry });
});

// Activity logs
projectRouter.get("/:id/activity", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const logs = await getActivityLogs(id, 200);
    res.json({ success: true, data: logs });
});
