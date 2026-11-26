// Routes Dashboard, Config, Activity, Attachments
import { Router, Request, Response } from "express";
import { computeDashboardKPIs, kpiDetail } from "../services/dashboardService";
import { getAllConfigs, getConfigValue, setConfigValue, CONFIG_KEYS } from "../services/configService";
import { getActivityLogs } from "../services/activityService";
import { listUsers } from "../services/authService";
import { requireAuth, requireRole } from "../middleware/auth";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import { requireDefined } from "../utils/power10";
import { getStorageDir, getDefaultStorageDir, resolveStorageDir, migrateStorage } from "../services/storageService";
import { getPrisma } from "../config/prisma";
import { createNotification, updateProgress, setNotificationResult } from "../services/notificationService";
import { checkAndNotify, getRepoInfo } from "../services/updateService";

export const miscRouter = Router();

miscRouter.use(requireAuth);

// Liste des utilisateurs (id + nom + email) pour les sélecteurs de collaborateurs
miscRouter.get("/users", async (_req: Request, res: Response) => {
    const users = await listUsers();
    res.json({ success: true, data: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })) });
});

// Dashboard
miscRouter.get("/dashboard", async (_req: Request, res: Response) => {
    const kpis = await computeDashboardKPIs();
    res.json({ success: true, data: kpis });
});

// Catalogue des KPI disponibles + préférences d'affichage par utilisateur
export const KPI_CATALOG_IDS = [
    "totalProjects", "activeProjects", "archivedProjects",
    "milestonesTotal", "milestonesOverdue", "milestonesUpcoming",
    "lowStockItems", "reservedItems", "totalStockItems", "totalStockValue",
    "timeThisMonth", "timeTotal", "usersCount",
] as const;

const prefsSchema = z.object({
    kpiIds: z.array(z.string().min(1).max(64)).max(KPI_CATALOG_IDS.length),
});

function parseKpiPrefs(raw: string | null): string[] {
    if (raw === null || raw === "") return [...KPI_CATALOG_IDS];
    try {
        const arr: unknown = JSON.parse(raw);
        if (!Array.isArray(arr)) return [...KPI_CATALOG_IDS];
        const valid = KPI_CATALOG_IDS as readonly string[];
        return arr.filter((x): x is string => typeof x === "string" && valid.includes(x)).slice(0, KPI_CATALOG_IDS.length);
    } catch {
        return [...KPI_CATALOG_IDS];
    }
}

miscRouter.get("/dashboard/kpi/:id", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    if (!(KPI_CATALOG_IDS as readonly string[]).includes(id)) {
        res.status(400).json({ success: false, error: "KPI inconnu" });
        return;
    }
    const detail = await kpiDetail(id);
    if (detail === null) {
        res.status(404).json({ success: false, error: "KPI inconnu" });
        return;
    }
    res.json({ success: true, data: detail });
});

miscRouter.get("/dashboard/prefs", async (req: Request, res: Response) => {
    const auth = requireDefined(req.authUser, "authUser");
    const user = await getPrisma().user.findUnique({ where: { id: auth.id }, select: { dashboardKpis: true } });
    res.json({ success: true, data: { kpiIds: parseKpiPrefs(user?.dashboardKpis ?? null) } });
});

miscRouter.put("/dashboard/prefs", validateBody(prefsSchema), async (req: Request, res: Response) => {
    const auth = requireDefined(req.authUser, "authUser");
    const body = req.body as { kpiIds: string[] };
    const valid = KPI_CATALOG_IDS as readonly string[];
    const ids = body.kpiIds.filter((id) => valid.includes(id));
    await getPrisma().user.update({ where: { id: auth.id }, data: { dashboardKpis: JSON.stringify(ids) } });
    res.json({ success: true, data: { kpiIds: ids } });
});

// Config
miscRouter.get("/config", async (_req: Request, res: Response) => {
    const configs = await getAllConfigs();
    res.json({ success: true, data: configs });
});

miscRouter.get("/config/:key", async (req: Request, res: Response) => {
    const key = req.params.key ?? "";
    const values = await getConfigValue(key);
    res.json({ success: true, data: { key, values } });
});

miscRouter.put("/config/:key", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const key = req.params.key ?? "";
    const body = req.body as { values: string[] };
    if (!Array.isArray(body.values)) {
        res.status(400).json({ success: false, error: "values doit être un tableau" });
        return;
    }
    await setConfigValue(key, body.values);
    if (key === CONFIG_KEYS.STORAGE_PATH) await resolveStorageDir(); // applique le nouveau chemin à chaud
    res.json({ success: true, data: { key, values: body.values } });
});

// Infos sur le stockage des fichiers (admin) : chemin configuré, effectif et défaut
miscRouter.get("/storage", requireRole("ADMIN"), async (_req: Request, res: Response) => {
    const values = await getConfigValue(CONFIG_KEYS.STORAGE_PATH);
    res.json({
        success: true,
        data: {
            configured: values[0] ?? "",
            effective: getStorageDir(),
            default: getDefaultStorageDir(),
        },
    });
});

// Migration du stockage vers un nouveau dossier (admin) : copie les fichiers existants puis met à jour la config.
// La progression est suivie via une notification "tâche" (barre de progression temps réel).
const migrateSchema = z.object({ to: z.string().min(1).max(500) });

miscRouter.post("/storage/migrate", requireRole("ADMIN"), validateBody(migrateSchema), async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const to = (req.body as { to: string }).to.trim();
    const notif = await createNotification({ userId: user.id, type: "task", title: "Migration du stockage", message: `Vers ${to}`, progress: 0 });
    res.status(202).json({ success: true, data: { notifId: notif.id } });
    void runStorageMigration(user.id, notif.id, to);
});

async function runStorageMigration(userId: string, notifId: string, to: string): Promise<void> {
    try {
        const result = await migrateStorage(to, (pct) => { void updateProgress(userId, notifId, pct); });
        await setConfigValue(CONFIG_KEYS.STORAGE_PATH, [to]);
        await resolveStorageDir();
        const bilan = result.skipped
            ? "Chemin identique, rien à migrer"
            : `${result.moved} fichier(s) déplacé(s)` + (result.failed > 0 ? `, ${result.failed} échec(s)` : "");
        await setNotificationResult(userId, notifId, result.failed === 0, bilan);
    } catch (err) {
        await setNotificationResult(userId, notifId, false, err instanceof Error ? err.message : "Erreur inconnue");
    }
}

miscRouter.get("/config-keys", (_req: Request, res: Response) => {
    res.json({ success: true, data: CONFIG_KEYS });
});

// Check des mises à jour (admin) - signale seulement, n'exécute rien. ?force=true pour ignorer le cache
miscRouter.get("/update/check", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const info = await checkAndNotify(req.query.force === "true");
    res.json({ success: true, data: info });
});

// Vérifie le dépôt de mises à jour configuré (existe, accessible, branche par défaut) - admin
miscRouter.get("/update/repo", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const info = await getRepoInfo(req.query.force === "true");
    res.json({ success: true, data: info });
});

// Activity logs globaux
miscRouter.get("/activity", async (req: Request, res: Response) => {
    const projectIdStr = req.query.projectId as string | undefined;
    const projectId = projectIdStr;
    const logs = await getActivityLogs(projectId, 200);
    res.json({ success: true, data: logs });
});
