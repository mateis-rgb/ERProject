// Service de journal d'activité - trace toutes les actions
import { getPrisma } from "../config/prisma";
import { toJsonString } from "../utils/power10";

export async function logActivity(
    userId: string,
    action: string,
    details: unknown,
    projectId?: string | null
): Promise<void> {
    const prisma = getPrisma();
    await prisma.activityLog.create({
        data: {
            userId,
            action,
            details: toJsonString(details),
            projectId: projectId ?? null,
        },
    });
}

export async function getActivityLogs(
    projectId?: string,
    limit: number = 100
): Promise<Array<{ id: string; action: string; details: string; timestamp: Date; userName: string }>> {
    const prisma = getPrisma();
    const safeLimit = Math.min(Math.max(1, limit), 500);
    const logs = await prisma.activityLog.findMany({
        where: projectId !== undefined ? { projectId } : {},
        include: { user: { select: { name: true } } },
        orderBy: { timestamp: "desc" },
        take: safeLimit,
    });
    return logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        timestamp: log.timestamp,
        userName: log.user.name,
    }));
}
