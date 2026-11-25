// Routes Commentaires (projet, jalon ou article stock) + @mentions + candidats d'autocomplétion
import { Router, Request, Response } from "express";
import { z } from "zod";
import {
    listProjectComments, listStockComments, createProjectComment, createStockComment,
    updateComment, deleteComment, getMentionCandidates,
} from "../services/commentService";
import { validateBody, validateQuery } from "../middleware/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireModule } from "../middleware/modules";

export const commentRouter = Router();

commentRouter.use(requireAuth);

const commentCreateSchema = z.object({
    content: z.string().min(1).max(2000),
    milestoneId: z.string().min(1).optional().nullable(),
});
const commentUpdateSchema = z.object({ content: z.string().min(1).max(2000) });
const commentsQuerySchema = z.object({ milestoneId: z.string().optional() });
const stockCommentSchema = z.object({ content: z.string().min(1).max(2000) });

function cleanMilestoneId(raw: unknown): string | null {
    return typeof raw === "string" && raw !== "" && raw !== "null" ? raw : null;
}

function authUserId(req: Request, res: Response): string | null {
    const user = req.authUser;
    if (user === undefined) {
        res.status(401).json({ success: false, error: "Non authentifié" });
        return null;
    }
    return user.id;
}

// Liste des commentaires d'un projet (filtrés par jalon si milestoneId)
commentRouter.get("/projects/:projectId/comments", validateQuery(commentsQuerySchema), async (req: Request, res: Response) => {
    const projectId = req.params.projectId ?? "";
    const milestoneId = cleanMilestoneId((req.query as { milestoneId?: string }).milestoneId);
    const comments = await listProjectComments(projectId, milestoneId);
    res.json({ success: true, data: comments });
});

// Ajouter un commentaire (projet ou jalon)
commentRouter.post("/projects/:projectId/comments", requireRole("EDITOR"), validateBody(commentCreateSchema), async (req: Request, res: Response) => {
    const projectId = req.params.projectId ?? "";
    const userId = authUserId(req, res);
    if (userId === null) return;
    const body = req.body as { content: string; milestoneId?: string | null };
    const comment = await createProjectComment(projectId, cleanMilestoneId(body.milestoneId), userId, body.content);
    res.status(201).json({ success: true, data: comment });
});

// Liste des commentaires d'un article de stock (module stock)
commentRouter.get("/stock/:stockItemId/comments", requireModule("stock"), async (req: Request, res: Response) => {
    const comments = await listStockComments(req.params.stockItemId ?? "");
    res.json({ success: true, data: comments });
});

// Ajouter un commentaire sur un article de stock (module stock)
commentRouter.post("/stock/:stockItemId/comments", requireModule("stock"), requireRole("EDITOR"), validateBody(stockCommentSchema), async (req: Request, res: Response) => {
    const userId = authUserId(req, res);
    if (userId === null) return;
    const body = req.body as { content: string };
    const comment = await createStockComment(req.params.stockItemId ?? "", userId, body.content);
    res.status(201).json({ success: true, data: comment });
});

// Candidats @mention pour l'autocomplétion (scope appliqué côté serveur)
commentRouter.get("/mention-candidates/project/:projectId", async (req: Request, res: Response) => {
    const data = await getMentionCandidates("project", req.params.projectId ?? "");
    res.json({ success: true, data });
});

commentRouter.get("/mention-candidates/stock/:stockItemId", requireModule("stock"), async (req: Request, res: Response) => {
    const data = await getMentionCandidates("stock", req.params.stockItemId ?? "");
    res.json({ success: true, data });
});

commentRouter.patch("/comments/:id", requireRole("EDITOR"), validateBody(commentUpdateSchema), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const userId = authUserId(req, res);
    if (userId === null) return;
    const body = req.body as { content: string };
    const comment = await updateComment(id, userId, req.authUser?.role === "ADMIN", body.content);
    res.json({ success: true, data: comment });
});

commentRouter.delete("/comments/:id", requireRole("EDITOR"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const userId = authUserId(req, res);
    if (userId === null) return;
    await deleteComment(id, userId, req.authUser?.role === "ADMIN");
    res.json({ success: true, data: { message: "Commentaire supprimé" } });
});
