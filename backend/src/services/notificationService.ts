// Service Notifications in-app (Power of 10)
import { getPrisma } from "../config/prisma";
import { assert } from "../utils/power10";
import { emitToUser } from "./socketService";

export interface NotifInput {
    userId: string;
    type?: string;
    title: string;
    message?: string;
    link?: string | null;
    progress?: number | null; // tâche avec barre de progression
}

export async function createNotification(input: NotifInput): Promise<{ id: string }> {
    assert(input.userId.length > 0, "createNotification: invalid userId");
    assert(input.title.length > 0 && input.title.length <= 200, "createNotification: bad title");
    const prisma = getPrisma();
    const notif = await prisma.notification.create({
        data: {
            userId: input.userId,
            type: input.type ?? "info",
            title: input.title,
            message: input.message ?? "",
            link: input.link ?? null,
            progress: input.progress ?? null,
        },
    });
    return { id: notif.id };
}

// Avancement d'une tâche (0..100) - notif appartenant à l'utilisateur
export async function updateProgress(userId: string, notifId: string, progress: number): Promise<boolean> {
    assert(progress >= 0 && progress <= 100, "updateProgress: hors bornes");
    const prisma = getPrisma();
    const res = await prisma.notification.updateMany({
        where: { id: notifId, userId },
        data: { progress: Math.round(progress) },
    });
    emitToUser(userId, "notification", { id: notifId });
    return res.count > 0;
}

// Termine une tâche : progress 100 + type success/warning + message de bilan
export async function setNotificationResult(userId: string, notifId: string, ok: boolean, message: string): Promise<void> {
    assert(userId.length > 0 && notifId.length > 0, "setNotificationResult: invalid args");
    const prisma = getPrisma();
    await prisma.notification.updateMany({
        where: { id: notifId, userId },
        data: { progress: 100, type: ok ? "success" : "warning", message },
    });
    emitToUser(userId, "notification", { id: notifId, done: true });
}

// Notifie plusieurs users (ex: collaborateurs d'un projet)
export async function notifyMany(userIds: string[], input: Omit<NotifInput, "userId">): Promise<number> {
    assert(userIds.length <= 100, "notifyMany: too many users");
    const prisma = getPrisma();
    const result = await prisma.notification.createMany({
        data: userIds.slice(0, 100).map((uid) => ({
            userId: uid,
            type: input.type ?? "info",
            title: input.title,
            message: input.message ?? "",
            link: input.link ?? null,
        })),
    });
    return result.count;
}

export async function listNotifications(userId: string, unreadOnly: boolean): Promise<Array<{
    id: string; type: string; title: string; message: string; link: string | null; read: boolean; progress: number | null; createdAt: Date;
}>> {
    assert(userId.length > 0, "listNotifications: invalid userId");
    const prisma = getPrisma();
    const notifs = await prisma.notification.findMany({
        where: { userId, ...(unreadOnly ? { read: false } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
    return notifs.map((n) => ({
        id: n.id, type: n.type, title: n.title, message: n.message,
        link: n.link, read: n.read, progress: n.progress, createdAt: n.createdAt,
    }));
}

export async function countUnread(userId: string): Promise<number> {
    assert(userId.length > 0, "countUnread: invalid userId");
    const prisma = getPrisma();
    return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAsRead(userId: string, notifId: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.notification.updateMany({
        where: { id: notifId, userId },
        data: { read: true },
    });
}

export async function markAllAsRead(userId: string): Promise<void> {
    assert(userId.length > 0, "markAllAsRead: invalid userId");
    const prisma = getPrisma();
    await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
}

export async function deleteNotification(userId: string, notifId: string): Promise<boolean> {
    assert(userId.length > 0 && notifId.length > 0, "deleteNotification: invalid args");
    const prisma = getPrisma();
    const res = await prisma.notification.deleteMany({ where: { id: notifId, userId } });
    return res.count > 0;
}

export async function deleteAllNotifications(userId: string): Promise<number> {
    assert(userId.length > 0, "deleteAllNotifications: invalid userId");
    const prisma = getPrisma();
    const res = await prisma.notification.deleteMany({ where: { userId } });
    return res.count;
}
