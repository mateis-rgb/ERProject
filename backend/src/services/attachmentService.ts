// Service Drive projet - dossiers hiérarchiques + fichiers + quota (Power of 10)
import { getPrisma } from "../config/prisma";
import { assert } from "../utils/power10";
import { logActivity } from "./activityService";
import { emitGlobal } from "./socketService";
import path from "path";
import fs from "fs";
import { config } from "../config";
import { getStorageDir } from "./storageService";
import { decryptDataKey, encryptBuffer, decryptBuffer, nameHash } from "./cryptoService";

const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "application/pdf", "text/", "application/zip", "application/json"];
const MAX_FILE_SIZE = config.maxUploadSize;
const MAX_TREE_DEPTH = 20; // boucle bornée pour la suppression d'un dossier (R2)
export const MAX_TEXT_EDIT_SIZE = 5 * 1024 * 1024; // 5 Mo max pour l'édition en ligne

const TEXT_EXTENSIONS = [
    ".md", ".markdown", ".txt", ".fountain", ".script", ".json", ".csv", ".tsv", ".log",
    ".xml", ".yml", ".yaml", ".html", ".htm", ".css", ".js", ".ts", ".jsx", ".tsx",
    ".py", ".sh", ".env", ".ini", ".toml", ".sql",
];

export function isTextEditableFile(fileName: string, mimeType: string): boolean {
    if (TEXT_EXTENSIONS.includes(path.extname(fileName).toLowerCase())) return true;
    return mimeType.startsWith("text/");
}

// Data key d'un projet chiffré (null si le projet est en clair ou introuvable)
async function projectKeyOf(projectId: string): Promise<Buffer | null> {
    const p = await getPrisma().project.findUnique({
        where: { id: projectId },
        select: { encrypted: true, encryptionKey: true },
    });
    if (p === null || !p.encrypted || p.encryptionKey === null) return null;
    return decryptDataKey(p.encryptionKey);
}

// Chemin disque effectif : anti-traversal, puis si le projet est chiffré chaque segment du chemin
// logique est remplacé par son empreinte HMAC (noms de répertoires/fichiers illisibles sur le disque)
function resolveDiskPath(relPath: string, key: Buffer | null): string | null {
    const root = path.resolve(getStorageDir());
    const full = path.resolve(root, relPath);
    if (!full.startsWith(root + path.sep) && full !== root) return null;
    if (key === null) return full;
    const segs = relPath.split(/[\\/]/).filter((s) => s.length > 0);
    return path.join(root, ...segs.map((s) => nameHash(key, s)));
}

export interface AttachmentDTO {
    id: string;
    projectId: string;
    parentId: string | null;
    isFolder: boolean;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    uploadedByName: string;
}

export function isAllowedMime(mimeType: string): boolean {
    if (mimeType.length === 0) return true;
    return ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p));
}

function toDTO(a: {
    id: string; projectId: string; parentId: string | null; isFolder: boolean;
    fileName: string; fileSize: number; mimeType: string; uploadedAt: Date;
    uploader: { name: string };
}): AttachmentDTO {
    return {
        id: a.id, projectId: a.projectId, parentId: a.parentId, isFolder: a.isFolder,
        fileName: a.fileName, fileSize: a.fileSize, mimeType: a.mimeType,
        uploadedAt: a.uploadedAt, uploadedByName: a.uploader.name,
    };
}

// Usage disque du projet (fichiers uniquement, pas les dossiers)
export async function getProjectUsage(projectId: string): Promise<{ usedBytes: number; quotaBytes: number | null }> {
    assert(projectId.length > 0, "getProjectUsage: invalid projectId");
    const prisma = getPrisma();
    const agg = await prisma.attachment.aggregate({
        where: { projectId, isFolder: false },
        _sum: { fileSize: true },
    });
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { quotaBytes: true } });
    return { usedBytes: agg._sum.fileSize ?? 0, quotaBytes: project?.quotaBytes ?? null };
}

async function assertQuotaOk(projectId: string, extraBytes: number): Promise<void> {
    const prisma = getPrisma();
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { quotaBytes: true } });
    if (project === null) throw new Error("Projet introuvable");
    if (project.quotaBytes === null) return; // illimité
    const usage = await getProjectUsage(projectId);
    assert(usage.usedBytes + extraBytes <= project.quotaBytes,
        `Quota dépassé (${usage.usedBytes + extraBytes} / ${project.quotaBytes} octets)`);
}

function assertParentOk(parentId: string | null, projectId: string, prisma: ReturnType<typeof getPrisma>): Promise<void> {
    if (parentId === null) return Promise.resolve();
    return prisma.attachment.findUnique({ where: { id: parentId } }).then((p) => {
        assert(p !== null && p.projectId === projectId && p.isFolder, "Dossier parent invalide");
    });
}

export async function saveAttachment(
    projectId: string,
    userId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
    parentId: string | null = null
): Promise<AttachmentDTO> {
    assert(projectId.length > 0, "saveAttachment: invalid projectId");
    assert(userId.length > 0, "saveAttachment: invalid userId");
    assert(fileName.length > 0 && fileName.length <= 255, "saveAttachment: invalid fileName");
    assert(buffer.length <= MAX_FILE_SIZE, `saveAttachment: file too large (max ${MAX_FILE_SIZE})`);
    assert(isAllowedMime(mimeType), `saveAttachment: type non autorisé: ${mimeType}`);
    await assertQuotaOk(projectId, buffer.length);
    const prisma = getPrisma();
    await assertParentOk(parentId, projectId, prisma);

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
    const stamp = Date.now();
    const storedName = `${projectId}_${stamp}_${safeName}`;
    // filePath en BDD = chemin logique (métadonnée) ; sur le disque chaque segment est chiffré si le projet est chiffré
    const logicalRel = path.join(`project_${projectId}`, storedName);
    const key = await projectKeyOf(projectId);
    const diskFull = resolveDiskPath(logicalRel, key);
    if (diskFull === null) throw new Error("Chemin invalide");
    fs.mkdirSync(path.dirname(diskFull), { recursive: true });
    fs.writeFileSync(diskFull, key !== null ? encryptBuffer(key, buffer) : buffer);

    const att = await prisma.attachment.create({
        data: {
            projectId,
            parentId,
            isFolder: false,
            fileName: safeName,
            filePath: logicalRel,
            fileSize: buffer.length,
            mimeType,
            uploadedBy: userId,
        },
        include: { uploader: { select: { name: true } } },
    });

    await logActivity(userId, "drive.uploaded", { attachmentId: att.id, fileName: safeName }, projectId);
    return toDTO(att);
}

export async function createFolder(
    projectId: string,
    userId: string,
    name: string,
    parentId: string | null = null
): Promise<AttachmentDTO> {
    assert(projectId.length > 0, "createFolder: invalid projectId");
    assert(name.length > 0 && name.length <= 200, "createFolder: invalid name");
    const prisma = getPrisma();
    await assertParentOk(parentId, projectId, prisma);
    const folder = await prisma.attachment.create({
        data: { projectId, parentId, isFolder: true, fileName: name, uploadedBy: userId },
        include: { uploader: { select: { name: true } } },
    });
    await logActivity(userId, "drive.folder_created", { folderId: folder.id, name }, projectId);
    return toDTO(folder);
}

export async function listAttachments(projectId: string): Promise<AttachmentDTO[]> {
    assert(projectId.length > 0, "listAttachments: invalid projectId");
    const prisma = getPrisma();
    const atts = await prisma.attachment.findMany({
        where: { projectId },
        include: { uploader: { select: { name: true } } },
        orderBy: [{ isFolder: "desc" }, { uploadedAt: "desc" }],
        take: 1000,
    });
    return atts.map(toDTO);
}

export async function updateAttachment(
    id: string,
    userId: string,
    input: { fileName?: string; parentId?: string | null }
): Promise<AttachmentDTO> {
    assert(id.length > 0, "updateAttachment: invalid id");
    const prisma = getPrisma();
    const att = await prisma.attachment.findUnique({ where: { id } });
    if (att === null) throw new Error("Élément introuvable");
    if (input.parentId !== undefined) await assertParentOk(input.parentId, att.projectId, prisma);
    if (input.fileName !== undefined) {
        assert(input.fileName.length > 0 && input.fileName.length <= 255, "updateAttachment: invalid fileName");
    }
    const updated = await prisma.attachment.update({
        where: { id },
        data: { fileName: input.fileName ?? att.fileName, parentId: input.parentId !== undefined ? input.parentId : att.parentId },
        include: { uploader: { select: { name: true } } },
    });
    await logActivity(userId, "drive.updated", { attachmentId: id }, att.projectId);
    return toDTO(updated);
}

// Lit le contenu d'un fichier, déchiffré si le projet est chiffré
export async function readAttachmentFile(attachmentId: string): Promise<{ data: Buffer; fileName: string; mimeType: string } | null> {
    assert(attachmentId.length > 0, "readAttachmentFile: invalid id");
    const prisma = getPrisma();
    const att = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (att === null || att.isFolder) return null;
    const key = await projectKeyOf(att.projectId);
    const full = resolveDiskPath(att.filePath, key);
    if (full === null || !fs.existsSync(full)) return null;
    const raw = fs.readFileSync(full);
    return { data: key !== null ? decryptBuffer(key, raw) : raw, fileName: att.fileName, mimeType: att.mimeType };
}

// Lecture du contenu texte d'un fichier éditable (null si dossier/non texte/trop gros/inexistant)
export async function readTextContent(attachmentId: string): Promise<{ content: string; fileName: string; mimeType: string } | null> {
    assert(attachmentId.length > 0, "readTextContent: invalid id");
    const prisma = getPrisma();
    const att = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (att === null || att.isFolder) return null;
    if (!isTextEditableFile(att.fileName, att.mimeType)) return null;
    if (att.fileSize > MAX_TEXT_EDIT_SIZE) return null;
    const key = await projectKeyOf(att.projectId);
    const full = resolveDiskPath(att.filePath, key);
    if (full === null || !fs.existsSync(full)) return null;
    const raw = fs.readFileSync(full);
    const content = (key !== null ? decryptBuffer(key, raw) : raw).toString("utf8");
    return { content, fileName: att.fileName, mimeType: att.mimeType };
}

// Écriture du contenu texte (vérifie le quota si le fichier grossit, log + websocket)
export async function writeTextContent(attachmentId: string, userId: string, content: string): Promise<AttachmentDTO> {
    assert(attachmentId.length > 0, "writeTextContent: invalid id");
    assert(userId.length > 0, "writeTextContent: invalid userId");
    assert(content.length <= MAX_TEXT_EDIT_SIZE, "writeTextContent: contenu trop volumineux");
    const prisma = getPrisma();
    const att = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: { uploader: { select: { name: true } } },
    });
    if (att === null || att.isFolder) throw new Error("Fichier introuvable");
    if (!isTextEditableFile(att.fileName, att.mimeType)) throw new Error("Fichier non éditable en tant que texte");
    const buffer = Buffer.from(content, "utf8");
    if (buffer.length > att.fileSize) await assertQuotaOk(att.projectId, buffer.length - att.fileSize);
    const key = await projectKeyOf(att.projectId);
    const full = resolveDiskPath(att.filePath, key);
    if (full === null) throw new Error("Chemin invalide");
    fs.writeFileSync(full, key !== null ? encryptBuffer(key, buffer) : buffer);
    const updated = await prisma.attachment.update({
        where: { id: attachmentId },
        data: { fileSize: buffer.length, mimeType: "text/plain" },
        include: { uploader: { select: { name: true } } },
    });
    await logActivity(userId, "drive.edited", { attachmentId, fileName: att.fileName, size: buffer.length }, att.projectId);
    emitGlobal("drive:updated", { projectId: att.projectId, attachmentId });
    return toDTO(updated);
}

// Suppression d'un élément (dossier = suppression en cascade bornée par niveaux, R1/R2)
export async function deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    assert(attachmentId.length > 0, "deleteAttachment: invalid id");
    const prisma = getPrisma();
    const att = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (att === null) return;

    const idsToDelete: string[] = [att.id];
    if (att.isFolder) {
        let frontier: string[] = [att.id];
        for (let depth = 0; depth < MAX_TREE_DEPTH && frontier.length > 0; depth++) {
            const children = await prisma.attachment.findMany({
                where: { parentId: { in: frontier } },
                select: { id: true },
                take: 1000,
            });
            frontier = children.map((c) => c.id);
            for (const fid of frontier) idsToDelete.push(fid);
        }
    }

    const files = await prisma.attachment.findMany({
        where: { id: { in: idsToDelete }, isFolder: false },
        select: { filePath: true },
        take: 1000,
    });
    await prisma.attachment.deleteMany({ where: { id: { in: idsToDelete } } });
    const key = await projectKeyOf(att.projectId);
    for (const f of files) {
        try {
            const fullPath = resolveDiskPath(f.filePath, key);
            if (fullPath !== null && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        } catch { /* ignore */ }
    }
    await logActivity(userId, "drive.deleted", { attachmentId }, att.projectId);
}
