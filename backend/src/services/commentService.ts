// Service Commentaires (projet/jalon ou article stock) - @mentions avec scope + @all (Power of 10)
import { getPrisma } from "../config/prisma";
import { assert, MAX_ITERATIONS } from "../utils/power10";
import { CommentDTO, MentionCandidatesDTO } from "../types";
import { logActivity } from "./activityService";
import { notifyMany } from "./notificationService";
import { emitGlobal } from "./socketService";
import { getConfigValue, CONFIG_KEYS } from "./configService";

const MAX_MENTIONS = 20;
const MAX_USERS = 200;

export type CommentKind = "project" | "stock";

interface CommentRow {
    id: string;
    projectId: string | null;
    stockItemId: string | null;
    milestoneId: string | null;
    authorId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: { name: string };
}

function toDTO(c: CommentRow): CommentDTO {
    return {
        id: c.id, projectId: c.projectId, stockItemId: c.stockItemId, milestoneId: c.milestoneId,
        authorId: c.authorId, authorName: c.author.name,
        content: c.content, createdAt: c.createdAt, updatedAt: c.updatedAt,
    };
}

export async function listProjectComments(projectId: string, milestoneId: string | null): Promise<CommentDTO[]> {
    assert(projectId.length > 0, "listProjectComments: invalid projectId");
    const prisma = getPrisma();
    const rows = await prisma.comment.findMany({
        where: { projectId, stockItemId: null, milestoneId },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: MAX_ITERATIONS,
    });
    return rows.map(toDTO);
}

export async function listStockComments(stockItemId: string): Promise<CommentDTO[]> {
    assert(stockItemId.length > 0, "listStockComments: invalid stockItemId");
    const prisma = getPrisma();
    const rows = await prisma.comment.findMany({
        where: { stockItemId, projectId: null },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: MAX_ITERATIONS,
    });
    return rows.map(toDTO);
}

// Extrait les @mentions uniques du contenu (borne MAX_MENTIONS - R2)
function parseMentions(content: string): string[] {
    const found = [...content.matchAll(/@([^\s@.,;:!?]+)/g)].map((m) => m[1] ?? "").filter((s) => s.length > 0);
    return [...new Set(found)].slice(0, MAX_MENTIONS);
}

// Scope configuré par l'admin : project -> "collaborators" | "all", stock -> "all" | "none"
async function mentionScope(kind: CommentKind): Promise<string> {
    const key = kind === "project" ? CONFIG_KEYS.MENTION_SCOPE_PROJECT : CONFIG_KEYS.MENTION_SCOPE_STOCK;
    const values = await getConfigValue(key);
    return values[0] ?? (kind === "project" ? "collaborators" : "all");
}

// IDs des membres d'un projet = créateur + collaborateurs
async function projectMemberIds(projectId: string): Promise<Set<string>> {
    const prisma = getPrisma();
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdById: true, collaborators: { select: { userId: true } } },
    });
    const ids = new Set<string>();
    if (project !== null) {
        ids.add(project.createdById);
        for (const c of project.collaborators) ids.add(c.userId);
    }
    return ids;
}

// Résout les cibles des mentions selon le scope (null pool = tous les utilisateurs)
async function resolveTargets(kind: CommentKind, refId: string, authorId: string, mentions: string[]): Promise<string[]> {
    const prisma = getPrisma();
    const scope = await mentionScope(kind);
    if (scope === "none") return [];
    let pool: Set<string> | null = null;
    if (kind === "project" && scope === "collaborators") pool = await projectMemberIds(refId);
    const wantAll = mentions.some((m) => m.toLowerCase() === "all");
    if (wantAll) {
        if (pool === null) {
            const all = await prisma.user.findMany({ select: { id: true }, take: MAX_USERS });
            return all.map((u) => u.id).filter((id) => id !== authorId);
        }
        return [...pool].filter((id) => id !== authorId);
    }
    const names = mentions.filter((m) => m.toLowerCase() !== "all");
    if (names.length === 0) return [];
    const users = await prisma.user.findMany({
        where: { OR: names.flatMap((n) => [{ name: { equals: n, mode: "insensitive" } }, { email: { startsWith: n.toLowerCase() } }]) },
        select: { id: true },
        take: MAX_USERS,
    });
    let ids = users.map((u) => u.id);
    if (pool !== null) ids = ids.filter((id) => pool.has(id));
    return ids.filter((id) => id !== authorId);
}

function mentionLink(kind: CommentKind, refId: string, milestoneId: string | null): string {
    if (kind === "stock") return `/stock/${refId}`;
    return milestoneId !== null ? `/projects/${refId}/gantt` : `/projects/${refId}`;
}

async function notifyMentions(
    kind: CommentKind, refId: string, milestoneId: string | null, authorId: string, authorName: string, content: string
): Promise<void> {
    const mentions = parseMentions(content);
    if (mentions.length === 0) return;
    const targets = (await resolveTargets(kind, refId, authorId, mentions)).slice(0, 100); // borne notifyMany
    if (targets.length === 0) return;
    await notifyMany(targets, {
        type: "info",
        title: `${authorName} vous a mentionné`,
        message: content.length > 120 ? content.slice(0, 120) + "…" : content,
        link: mentionLink(kind, refId, milestoneId),
    });
}

async function createRow(
    kind: CommentKind, refId: string, milestoneId: string | null, authorId: string, content: string
): Promise<CommentDTO> {
    assert(refId.length > 0 && authorId.length > 0, "createRow: invalid ids");
    assert(content.trim().length > 0 && content.length <= 2000, "createRow: bad content");
    const prisma = getPrisma();
    const data = kind === "project"
        ? { projectId: refId, milestoneId, stockItemId: null }
        : { stockItemId: refId, milestoneId: null, projectId: null };
    const c = await prisma.comment.create({ data: { ...data, authorId, content: content.trim() }, include: { author: { select: { name: true } } } });
    const author = await prisma.user.findUnique({ where: { id: authorId }, select: { name: true } });
    await logActivity(authorId, "comment", { kind, refId, milestoneId, preview: content.slice(0, 80) }, kind === "project" ? refId : null);
    void notifyMentions(kind, refId, milestoneId, authorId, author?.name ?? "?", content);
    const dto = toDTO(c);
    emitGlobal("comment:new", { kind, projectId: dto.projectId, stockItemId: dto.stockItemId, milestoneId, comment: dto });
    return dto;
}

export async function createProjectComment(
    projectId: string, milestoneId: string | null, authorId: string, content: string
): Promise<CommentDTO> {
    assert(projectId.length > 0, "createProjectComment: invalid projectId");
    const prisma = getPrisma();
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (project === null) throw new Error("Projet introuvable");
    if (milestoneId !== null) {
        const ms = await prisma.milestone.findUnique({ where: { id: milestoneId }, select: { projectId: true } });
        if (ms === null || ms.projectId !== projectId) throw new Error("Jalon introuvable pour ce projet");
    }
    return createRow("project", projectId, milestoneId, authorId, content);
}

export async function createStockComment(stockItemId: string, authorId: string, content: string): Promise<CommentDTO> {
    assert(stockItemId.length > 0, "createStockComment: invalid stockItemId");
    const prisma = getPrisma();
    const item = await prisma.stockItem.findUnique({ where: { id: stockItemId }, select: { id: true } });
    if (item === null) throw new Error("Article introuvable");
    return createRow("stock", stockItemId, null, authorId, content);
}

// Candidats @ pour l'autocomplétion front, selon le scope admin
export async function getMentionCandidates(kind: CommentKind, refId: string): Promise<MentionCandidatesDTO> {
    assert(refId.length > 0, "getMentionCandidates: invalid refId");
    const prisma = getPrisma();
    const scope = await mentionScope(kind);
    if (scope === "none") return { users: [], allowAll: false };
    if (kind === "project" && scope === "collaborators") {
        const ids = [...await projectMemberIds(refId)].slice(0, MAX_USERS);
        const users = await prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" },
            take: MAX_USERS,
        });
        return { users, allowAll: true };
    }
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
        take: MAX_USERS,
    });
    return { users, allowAll: true };
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
    const current = await prisma.comment.findUnique({
        where: { id },
        select: { authorId: true, projectId: true, stockItemId: true },
    });
    if (current === null) throw new Error("Commentaire introuvable");
    if (current.authorId !== userId && !isAdmin) throw new Error("Non autorisé à supprimer ce commentaire");
    await prisma.comment.delete({ where: { id } });
    emitGlobal("comment:deleted", { projectId: current.projectId, stockItemId: current.stockItemId, commentId: id });
}
