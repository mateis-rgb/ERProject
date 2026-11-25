// Service Commentaires (projet ou jalon) avec @mentions -> notifications (Power of 10)
import { getPrisma } from "../config/prisma";
import { assert, MAX_ITERATIONS } from "../utils/power10";
import { CommentDTO } from "../types";
import { logActivity } from "./activityService";
import { notifyMany } from "./notificationService";
import { emitGlobal } from "./socketService";

function toDTO(c: {
    id: string; projectId: string; milestoneId: string | null; authorId: string;
    content: string; createdAt: Date; updatedAt: Date;
    author: { name: string };
}): CommentDTO {
    return {
        id: c.id, projectId: c.projectId, milestoneId: c.milestoneId,
        authorId: c.authorId, authorName: c.author.name,
        content: c.content, createdAt: c.createdAt, updatedAt: c.updatedAt,
    };
}

export async function listComments(projectId: string, milestoneId: string | null): Promise<CommentDTO[]> {
    assert(projectId.length > 0, "listComments: invalid projectId");
    const prisma = getPrisma();
    const rows = await prisma.comment.findMany({
        where: { projectId, milestoneId },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: MAX_ITERATIONS,
    });
    return rows.map(toDTO);
}

// Extrait les @mentions et notifie les utilisateurs correspondants (sauf l'auteur)
async function notifyMentions(projectId: string, authorId: string, authorName: string, content: string): Promise<void> {
    const prisma = getPrisma();
    const mentions = [...content.matchAll(/@([^\s@.,;:!?]+)/g)].map((m) => m[1] ?? "").filter((s) => s.length > 0);
    if (mentions.length === 0) return;
    const uniq = [...new Set(mentions)].slice(0, 20);
    const users = await prisma.user.findMany({
        where: { OR: uniq.flatMap((name) => [{ name: { equals: name, mode: "insensitive" } }, { email: { startsWith: name.toLowerCase() } }]) },
        select: { id: true, name: true },
        take: 50,
    });
    const targets = users.filter((u) => u.id !== authorId).map((u) => u.id);
    if (targets.length > 0) {
        await notifyMany(targets, {
            type: "info",
            title: `${authorName} vous a mentionné`,
            message: content.length > 120 ? content.slice(0, 120) + "…" : content,
            link: `/projects/${projectId}`,
        });
    }
}

export async function createComment(
    projectId: string,
    milestoneId: string | null,
    authorId: string,
    content: string
): Promise<CommentDTO> {
    assert(projectId.length > 0 && authorId.length > 0, "createComment: invalid ids");
    assert(content.trim().length > 0 && content.length <= 2000, "createComment: bad content");
    const prisma = getPrisma();
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (project === null) throw new Error("Projet introuvable");
    if (milestoneId !== null) {
        const ms = await prisma.milestone.findUnique({ where: { id: milestoneId }, select: { projectId: true } });
        if (ms === null || ms.projectId !== projectId) throw new Error("Jalon introuvable pour ce projet");
    }
    const c = await prisma.comment.create({
        data: { projectId, milestoneId, authorId, content: content.trim() },
        include: { author: { select: { name: true } } },
    });
    const author = await prisma.user.findUnique({ where: { id: authorId }, select: { name: true } });
    await logActivity(authorId, "comment", { projectId, milestoneId, preview: content.slice(0, 80) }, projectId);
    void notifyMentions(projectId, authorId, author?.name ?? "?", content);
    const dto = toDTO(c);
    emitGlobal("comment:new", { projectId, milestoneId, comment: dto });
    return dto;
}

export async function updateComment(id: string, userId: string, isAdmin: boolean, content: string): Promise<CommentDTO> {
    assert(id.length > 0, "updateComment: invalid id");
    assert(content.trim().length > 0 && content.length <= 2000, "updateComment: bad content");
    const prisma = getPrisma();
    const current = await prisma.comment.findUnique({ where: { id }, include: { author: { select: { name: true } } } });
    if (current === null) throw new Error("Commentaire introuvable");
    if (current.authorId !== userId && !isAdmin) throw new Error("Non autorisé à modifier ce commentaire");
    const c = await prisma.comment.update({
        where: { id },
        data: { content: content.trim() },
        include: { author: { select: { name: true } } },
    });
    return toDTO(c);
}

export async function deleteComment(id: string, userId: string, isAdmin: boolean): Promise<void> {
    assert(id.length > 0, "deleteComment: invalid id");
    const prisma = getPrisma();
    const current = await prisma.comment.findUnique({ where: { id }, select: { authorId: true, projectId: true } });
    if (current === null) throw new Error("Commentaire introuvable");
    if (current.authorId !== userId && !isAdmin) throw new Error("Non autorisé à supprimer ce commentaire");
    await prisma.comment.delete({ where: { id } });
    emitGlobal("comment:deleted", { projectId: current.projectId, commentId: id });
}
