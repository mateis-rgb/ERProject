// Routes Admin - gestion des utilisateurs (réservé au rôle ADMIN)
import { Router, Request, Response } from "express";
import { z } from "zod";
import {
    listUsers, registerUser, updateUserRole, deleteUser, updateUser,
} from "../services/authService";
import { getActivityLogs } from "../services/activityService";
import { validateBody } from "../middleware/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireDefined } from "../utils/power10";
import { logActivity } from "../services/activityService";
import { UserRole } from "@prisma/client";
import { getPrisma } from "../config/prisma";
import { getConfigValue, CONFIG_KEYS } from "../services/configService";
import { getStorageDir } from "../services/storageService";
import { getLocalVersion } from "../services/updateService";
import { getLogs } from "../services/logService";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1).max(100),
    role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).default("VIEWER"),
});

const updateUserSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).optional(),
});

// Lister tous les utilisateurs
adminRouter.get("/users", async (_req: Request, res: Response) => {
    const users = await listUsers();
    res.json({ success: true, data: users });
});

// Créer un utilisateur
adminRouter.post("/users", validateBody(createUserSchema), async (req: Request, res: Response) => {
    const body = req.body as { email: string; password: string; name: string; role: UserRole };
    const admin = requireDefined(req.authUser, "authUser");
    const user = await registerUser(body.email, body.password, body.name, body.role);
    await logActivity(admin.id, "admin.user.created", { targetUserId: user.id, email: user.email, role: user.role });
    res.status(201).json({ success: true, data: user });
});

// Modifier un utilisateur (nom, email, rôle)
adminRouter.patch("/users/:id", validateBody(updateUserSchema), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const body = req.body as { name?: string; email?: string; role?: UserRole };
    let user = await listUsers().then((us) => us.find((u) => u.id === id) ?? null);
    if (user === null) {
        res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
        return;
    }
    if (body.name !== undefined || body.email !== undefined) {
        user = await updateUser(id, body.name ?? user.name, body.email ?? user.email);
    }
    if (body.role !== undefined) {
        user = await updateUserRole(id, body.role);
        const admin = requireDefined(req.authUser, "authUser");
        await logActivity(admin.id, "admin.role.changed", { targetUserId: id, newRole: body.role });
    }
    res.json({ success: true, data: user });
});

// Supprimer un utilisateur (sauf soi-même)
adminRouter.delete("/users/:id", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const currentUser = requireDefined(req.authUser, "authUser");
    await deleteUser(id, currentUser.id);
    await logActivity(currentUser.id, "admin.user.deleted", { targetUserId: id });
    res.json({ success: true, data: { message: "Utilisateur supprimé" } });
});

// Audit log des actions admin
adminRouter.get("/audit", async (_req: Request, res: Response) => {
    const logs = await getActivityLogs(undefined, 200);
    const adminLogs = logs.filter((l) => l.action.startsWith("admin."));
    res.json({ success: true, data: adminLogs });
});

// --- Status & logs applicatifs (admin) ---
adminRouter.get("/status", async (_req: Request, res: Response) => {
    const prisma = getPrisma();
    const [users, projects, stockItems, attachments, unreadNotifs] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.stockItem.count(),
        prisma.attachment.count(),
        prisma.notification.count({ where: { read: false } }),
    ]);
    const modules = await getConfigValue(CONFIG_KEYS.ENABLED_MODULES);
    res.json({
        success: true,
        data: {
            version: getLocalVersion(),
            uptimeSec: Math.round(process.uptime()),
            now: new Date().toISOString(),
            storageDir: getStorageDir(),
            modules,
            counts: { users, projects, stockItems, attachments, unreadNotifs },
        },
    });
});

adminRouter.get("/logs", (req: Request, res: Response) => {
    const raw = parseInt((req.query.limit as string | undefined) ?? "200", 10);
    const limit = Number.isFinite(raw) ? raw : 200;
    res.json({ success: true, data: getLogs(limit) });
});
