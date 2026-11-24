// Routes Notifications + Recherche globale + Refresh token
import { Router, Request, Response } from "express";
import { z } from "zod";
import { listNotifications, countUnread, markAsRead, markAllAsRead, createNotification, updateProgress, deleteNotification, deleteAllNotifications } from "../services/notificationService";
import { globalSearch } from "../services/searchService";
import { rotateRefreshToken, issueRefreshToken, revokeAllUserTokens } from "../services/refreshTokenService";
import { getUserById, updateProfile } from "../services/authService";
import { requireAuth } from "../middleware/auth";
import { requireModule } from "../middleware/modules";
import { validateQuery, validateBody } from "../middleware/validation";
import { requireDefined } from "../utils/power10";

const profileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).max(100).optional(),
});

export const featureRouter = Router();

// --- Notifications ---
featureRouter.use("/notifications", requireAuth, requireModule("notifications"));

featureRouter.get("/notifications", async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const unreadOnly = req.query.unread === "true";
    const notifs = await listNotifications(user.id, unreadOnly);
    const unread = await countUnread(user.id);
    res.json({ success: true, data: { notifications: notifs, unreadCount: unread } });
});

featureRouter.post("/notifications/:id/read", async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const id = req.params.id ?? "";
    await markAsRead(user.id, id);
    res.json({ success: true, data: { message: "lue" } });
});

featureRouter.post("/notifications/read-all", async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    await markAllAsRead(user.id);
    res.json({ success: true, data: { message: "toutes lues" } });
});

featureRouter.delete("/notifications/:id", async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const id = requireDefined(req.params.id, "id");
    if (id.length === 0) { res.status(400).json({ success: false, error: "id requis" }); return; }
    const ok = await deleteNotification(user.id, id);
    if (!ok) { res.status(404).json({ success: false, error: "Notification introuvable" }); return; }
    res.json({ success: true, data: { message: "supprimée" } });
});

// Suppression globale protégée : exige ?all=true pour éviter toute suppression accidentelle (ex: URL sans id)
featureRouter.delete("/notifications", async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    if (req.query.all !== "true") { res.status(400).json({ success: false, error: "Paramètre all=true requis" }); return; }
    const count = await deleteAllNotifications(user.id);
    res.json({ success: true, data: { deleted: count } });
});

// Crée une notification pour soi (ex: tâche de fond avec progression - mock MAJ)
const notifCreateSchema = z.object({
    type: z.string().max(20).optional().default("info"),
    title: z.string().min(1).max(200),
    message: z.string().max(1000).optional().default(""),
    link: z.string().max(300).optional().nullable(),
    progress: z.number().int().min(0).max(100).optional().nullable(),
});

featureRouter.post("/notifications", requireAuth, validateBody(notifCreateSchema), async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const body = req.body as { type?: string; title: string; message?: string; link?: string | null; progress?: number | null };
    const notif = await createNotification({
        userId: user.id, type: body.type, title: body.title,
        message: body.message, link: body.link ?? null, progress: body.progress ?? null,
    });
    res.status(201).json({ success: true, data: notif });
});

// Avancement d'une tâche (0..100)
featureRouter.patch("/notifications/:id", requireAuth, async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const id = requireDefined(req.params.id, "id");
    const progress = Number((req.body as { progress?: number }).progress);
    if (!Number.isFinite(progress)) { res.status(400).json({ success: false, error: "progress invalide" }); return; }
    const ok = await updateProgress(user.id, id, progress);
    if (!ok) { res.status(404).json({ success: false, error: "Notification introuvable" }); return; }
    res.json({ success: true, data: { message: "ok" } });
});

// --- Recherche globale ---
const searchQuerySchema = z.object({ q: z.string().min(1).max(100) });

featureRouter.get("/search", requireAuth, validateQuery(searchQuerySchema), async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const q = (req.query as { q: string }).q;
    const results = await globalSearch(q, user.role === "ADMIN");
    res.json({ success: true, data: results });
});

// --- Refresh token (pas besoin d'être authentifié, le token suffit) ---
featureRouter.post("/auth/refresh", async (req: Request, res: Response) => {
    const token = req.cookies?.refresh_token as string | undefined;
    if (token === undefined || token.length === 0) {
        res.status(401).json({ success: false, error: "Pas de refresh token" });
        return;
    }
    const userId = await rotateRefreshToken(token);
    if (userId === null) {
        res.status(401).json({ success: false, error: "Refresh token invalide ou expiré" });
        return;
    }
    const user = await getUserById(userId);
    if (user === null) {
        res.status(401).json({ success: false, error: "Utilisateur introuvable" });
        return;
    }
    // Nouvelle session + nouveau refresh token (rotation)
    req.session.userId = user.id;
    const newToken = await issueRefreshToken(user.id);
    res.cookie("refresh_token", newToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 3600 * 1000,
        path: "/api",
    });
    res.json({ success: true, data: user });
});

featureRouter.post("/auth/revoke-all", requireAuth, async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    await revokeAllUserTokens(user.id);
    res.json({ success: true, data: { message: "Toutes les sessions révoquées" } });
});

// Mise à jour du profil (nom / mot de passe)
featureRouter.patch("/auth/me", requireAuth, validateBody(profileSchema), async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const body = req.body as { name?: string; currentPassword?: string; newPassword?: string };
    const updated = await updateProfile(user.id, body.name ?? null, body.currentPassword ?? null, body.newPassword ?? null);
    res.json({ success: true, data: updated });
});
