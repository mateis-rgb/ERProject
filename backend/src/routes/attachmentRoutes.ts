// Routes Drive projet - dossiers, fichiers, quota
import { Router, Request, Response } from "express";
import multer from "multer";
import {
    saveAttachment, listAttachments, getAttachmentPath, deleteAttachment,
    createFolder, updateAttachment, getProjectUsage,
} from "../services/attachmentService";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireModule } from "../middleware/modules";
import { validateBody } from "../middleware/validation";
import { folderCreateSchema, attachmentUpdateSchema } from "../types/schemas";
import { config } from "../config";

export const attachmentRouter = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadSize, files: 1 },
});

attachmentRouter.use(requireAuth);
attachmentRouter.use(requireModule("drive"));

// Upload d'un fichier (multipart) dans le drive, optionnellement dans un dossier
attachmentRouter.post(
    "/project/:projectId",
    requireRole("EDITOR"),
    upload.single("file"),
    async (req: Request, res: Response) => {
        const projectId = req.params.projectId ?? "";
        const user = req.authUser;
        const file = req.file;
        if (user === undefined || file === undefined) {
            res.status(400).json({ success: false, error: "Fichier ou utilisateur manquant" });
            return;
        }
        const parentRaw = req.body.parentId as string | undefined;
        const parentId = parentRaw !== undefined && parentRaw !== "" && parentRaw !== "root" ? parentRaw : null;
        try {
            const result = await saveAttachment(
                projectId, user.id, file.originalname, file.buffer, file.mimetype, parentId
            );
            res.status(201).json({ success: true, data: result });
        } catch (e) {
            res.status(400).json({ success: false, error: (e as Error).message });
        }
    }
);

// Création d'un dossier
attachmentRouter.post(
    "/project/:projectId/folder",
    requireRole("EDITOR"),
    validateBody(folderCreateSchema),
    async (req: Request, res: Response) => {
        const projectId = req.params.projectId ?? "";
        const user = requireAuthUser(req, res);
        if (user === null) return;
        const body = req.body as { name: string; parentId?: string | null };
        try {
            const folder = await createFolder(projectId, user.id, body.name, body.parentId ?? null);
            res.status(201).json({ success: true, data: folder });
        } catch (e) {
            res.status(400).json({ success: false, error: (e as Error).message });
        }
    }
);

// Liste du drive (dossiers + fichiers, triés dossiers d'abord)
attachmentRouter.get("/project/:projectId", async (req: Request, res: Response) => {
    const projectId = req.params.projectId ?? "";
    const atts = await listAttachments(projectId);
    res.json({ success: true, data: atts });
});

// Usage disque + quota du projet
attachmentRouter.get("/project/:projectId/usage", async (req: Request, res: Response) => {
    const projectId = req.params.projectId ?? "";
    const usage = await getProjectUsage(projectId);
    res.json({ success: true, data: usage });
});

// Renommer / déplacer un élément
attachmentRouter.patch("/:id", requireRole("EDITOR"), validateBody(attachmentUpdateSchema), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const user = requireAuthUser(req, res);
    if (user === null) return;
    const body = req.body as { fileName?: string; parentId?: string | null };
    try {
        const updated = await updateAttachment(id, user.id, {
            fileName: body.fileName,
            parentId: body.parentId === undefined ? undefined : (body.parentId === null ? null : body.parentId),
        });
        res.json({ success: true, data: updated });
    } catch (e) {
        res.status(400).json({ success: false, error: (e as Error).message });
    }
});

attachmentRouter.get("/download/:id", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const filePath = await getAttachmentPath(id);
    if (filePath === null) {
        res.status(404).json({ success: false, error: "Fichier non trouvé" });
        return;
    }
    res.download(filePath);
});

attachmentRouter.delete("/:id", requireRole("EDITOR"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const user = requireAuthUser(req, res);
    if (user === null) return;
    await deleteAttachment(id, user.id);
    res.json({ success: true, data: { message: "Élément supprimé" } });
});

function requireAuthUser(req: Request, res: Response) {
    const user = req.authUser;
    if (user === undefined) {
        res.status(401).json({ success: false, error: "Non authentifié" });
        return null;
    }
    return user;
}
