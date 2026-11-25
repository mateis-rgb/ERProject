// Alertes proactives (job périodique) : jalons J-3/J-1, jalons en retard,
// stock sous le seuil, conflits de réservation cross-projets. Anti-spam par dédup (Power of 10)
import { PrismaClient } from "@prisma/client";
import { getPrisma } from "../config/prisma";
import { MAX_ITERATIONS } from "../utils/power10";
import { CONFIG_KEYS, getConfigValue } from "./configService";
import { notifyMany } from "./notificationService";
import { getPlanning } from "./planningService";

const INTERVAL_MS = 60 * 60 * 1000; // toutes les heures
const DAY_MS = 24 * 3600 * 1000;
const ACTIVE_STATUS = "En cours";
const MAX_NOTIFY = 100; // borne dure de notifyMany (assert interne)

let started = false;

export function startAlertJob(): void {
    if (started) return;
    started = true;
    const tick = (): void => {
        runAlerts().catch((e: unknown) => console.error("[ALERT]", e instanceof Error ? e.message : String(e)));
    };
    setInterval(tick, INTERVAL_MS);
    setTimeout(tick, 60 * 1000); // première passe 1 min après le boot
}

async function notificationsEnabled(): Promise<boolean> {
    const mods = await getConfigValue(CONFIG_KEYS.ENABLED_MODULES);
    return mods.includes("notifications");
}

// dédup : une notif avec ce préfixe existe déjà pour cet utilisateur dans les dernières `hours`
async function wasNotified(prisma: PrismaClient, userId: string, key: string, hours: number): Promise<boolean> {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const n = await prisma.notification.findFirst({
        where: { userId, title: { startsWith: key }, createdAt: { gte: since } },
        select: { id: true },
    });
    return n !== null;
}

async function milestoneRecipients(prisma: PrismaClient, projectId: string): Promise<string[]> {
    const [collabs, project] = await Promise.all([
        prisma.projectCollaborator.findMany({ where: { projectId }, select: { userId: true }, take: 500 }),
        prisma.project.findUnique({ where: { id: projectId }, select: { createdById: true } }),
    ]);
    const ids = collabs.map((c) => c.userId);
    if (project !== null) ids.push(project.createdById);
    return [...new Set(ids)];
}

async function notifyMilestone(
    prisma: PrismaClient,
    milestoneId: string,
    key: string,
    type: string,
    title: string,
    message: string,
    link: string,
    hours: number
): Promise<void> {
    const ms = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        select: { projectId: true },
    });
    if (ms === null) return;
    const recipients = await milestoneRecipients(prisma, ms.projectId);
    const targets: string[] = [];
    for (const uid of recipients.slice(0, MAX_NOTIFY)) { // borne notifyMany (assert <= 100)
        if (!(await wasNotified(prisma, uid, key, hours))) targets.push(uid);
    }
    if (targets.length > 0) {
        await notifyMany(targets, { type, title: `${key} ${title}`, message, link });
    }
}

async function alertMilestoneStarts(prisma: PrismaClient, now: Date): Promise<void> {
    const in3dMin = new Date(now.getTime() + 3 * DAY_MS);
    const in3dMax = new Date(in3dMin.getTime() + 3600 * 1000);
    const in1dMin = new Date(now.getTime() + 1 * DAY_MS);
    const in1dMax = new Date(in1dMin.getTime() + 3600 * 1000);
    const soon = await prisma.milestone.findMany({
        where: {
            project: { status: ACTIVE_STATUS },
            OR: [
                { startDate: { gte: in3dMin, lte: in3dMax } },
                { startDate: { gte: in1dMin, lte: in1dMax } },
            ],
        },
        select: { id: true, name: true, projectId: true, startDate: true },
        take: MAX_ITERATIONS,
    });
    for (const m of soon) {
        const days = Math.round((m.startDate.getTime() - now.getTime()) / DAY_MS);
        const key = days <= 1 ? `ALERT:J1:${m.id}` : `ALERT:J3:${m.id}`;
        await notifyMilestone(
            prisma, m.id, key, "task",
            `Jalon à J-${days} : ${m.name}`,
            `Le jalon "${m.name}" démarre le ${m.startDate.toLocaleDateString("fr-FR")}.`,
            `/projects/${m.projectId}/planning`,
            24
        );
    }
}

async function alertMilestoneOverdue(prisma: PrismaClient, now: Date): Promise<void> {
    const late = await prisma.milestone.findMany({
        where: { endDate: { lt: now }, project: { status: ACTIVE_STATUS } },
        select: { id: true, name: true, projectId: true, endDate: true },
        take: MAX_ITERATIONS,
    });
    for (const m of late) {
        await notifyMilestone(
            prisma, m.id, `ALERT:RETARD:${m.id}`, "warning",
            `Jalon en retard : ${m.name}`,
            `Échéance dépassée le ${m.endDate.toLocaleDateString("fr-FR")}.`,
            `/projects/${m.projectId}/planning`,
            24
        );
    }
}

async function alertAdminsOnce(prisma: PrismaClient, key: string, type: string, title: string, message: string, link: string): Promise<void> {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true }, take: 100 });
    const targets: string[] = [];
    for (const a of admins) {
        if (!(await wasNotified(prisma, a.id, key, 24))) targets.push(a.id);
    }
    if (targets.length > 0) await notifyMany(targets, { type, title: `${key} ${title}`, message, link });
}

async function alertStockLow(prisma: PrismaClient): Promise<void> {
    const items = await prisma.stockItem.findMany({
        where: { quantity: { lte: prisma.stockItem.fields.minThreshold } },
        select: { id: true, name: true, quantity: true, unit: true, minThreshold: true },
        take: MAX_ITERATIONS,
    });
    for (const it of items) {
        await alertAdminsOnce(
            prisma, `ALERT:SEUIL:${it.id}`, "warning",
            `Stock faible : ${it.name}`,
            `${it.quantity} ${it.unit} (seuil ${it.minThreshold})`,
            `/stock/${it.id}`
        );
    }
}

async function alertConflicts(): Promise<void> {
    const prisma = getPrisma();
    const { conflicts } = await getPlanning();
    for (const c of conflicts.slice(0, MAX_ITERATIONS)) {
        const key = `ALERT:CONFLIT:${c.stockItemId}:${c.a.milestoneId}:${c.b.milestoneId}`;
        await alertAdminsOnce(
            prisma, key, "warning",
            `Conflit de réservation : ${c.stockItemName}`,
            `« ${c.a.milestoneName} » (${c.a.projectName}) et « ${c.b.milestoneName} » (${c.b.projectName}) se chevauchent du ${c.overlapStart.toLocaleDateString("fr-FR")} au ${c.overlapEnd.toLocaleDateString("fr-FR")}.`,
            "/planning"
        );
    }
}

export async function runAlerts(): Promise<void> {
    if (!(await notificationsEnabled())) return;
    const prisma = getPrisma();
    const now = new Date();
    await alertMilestoneStarts(prisma, now);
    await alertMilestoneOverdue(prisma, now);
    await alertStockLow(prisma);
    await alertConflicts();
}
