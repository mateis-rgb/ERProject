// Routes Commentaires (projet ou jalon) + @mentions
import { Router, Request, Response } from "express";
import { z } from "zod";
import { listComments, createComment, updateComment, deleteComment } from "../services/commentService";
import { validateBody, validateQuery } from "../middleware/validation";
import { requireAuth, requireRole } from "../middleware/auth";

export const commentRouter = Router();

commentRouter.use(requireAuth);

const commentCreateSchema = z.object({
    content: z.string().min(1).max(2000),
    milestoneId: z.string().min(1).optional().nullable(),
});
const commentUpdateSchema = z.object({ content: z.string().min(1).max(2000) });
const commentsQuerySchema = z.object({ milestoneId: z.string().optional() });

// Liste des commentaires d'un projet (filtrés par jalon si milestoneId)
commentRouter.get("/projects/:projectId/comments", validateQuery(commentsQuerySchema), async (req: Request, res: Response) => {
    const projectId = req.params.projectId ?? "";
    const q = req.query as { milestoneId?: string };
    const milestoneId = q.milestoneId !== undefined && q.milestoneId !== "" && q.milestoneId !== "null" ? q.milestoneId : null;
    const comments = await listComments(projectId, milestoneId);
    res.json({ success: true, data: comments });
});

// Ajouter un commentaire (projet ou jalon)
commentRouter.post("/projects/:projectId/comments", requireRole("EDITOR"), validateBody(commentCreateSchema), async (req: Request, res: Response) => {
    const projectId = req.params.projectId ?? "";
    const user = req.authUser;
    if (user === undefined) {
        res.status(401).json({ success: false, error: "Non authentifié" });
        return;
    }
    const body = req.body as { content: string; milestoneId?: string | null };
    const milestoneId = body.milestoneId !== undefined && body.milestoneId !== null && body.milestoneId !== "" ? body.milestoneId : null;
    const comment = await createComment(projectId, milestoneId, user.id, body.content);
    res.status(201).json({ success: true, data: comment });
});

commentRouter.patch("/comments/:id", requireRole("EDITOR"), validateBody(commentUpdateSchema), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const user = req.authUser;
    if (user === undefined) {
        res.status(401).json({ success: false, error: "Non authentifié" });
        return;
    }
    const body = req.body as { content: string };
    const comment = await updateComment(id, user.id, user.role === "ADMIN", body.content);
    res.json({ success: true, data: comment });
});

commentRouter.delete("/comments/:id", requireRole("EDITOR"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const user = req.authUser;
    if (user === undefined) {
        res.status(401).json({ success: false, error: "Non authentifié" });
        return;
    }
    await deleteComment(id, user.id, user.role === "ADMIN");
    res.json({ success: true, data: { message: "Commentaire supprimé" } });
});
