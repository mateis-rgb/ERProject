// Service Templates de projets - CRUD + application à un projet (jalons, dossiers, collaborateurs) (Power of 10)
import { getPrisma } from "../config/prisma";
import { Prisma } from "@prisma/client";
import { assert } from "../utils/power10";
import { logActivity } from "./activityService";

export interface TemplateMilestone {
    name: string;
    description: string;
    offsetStartDays: number; // relatif au début du projet
    durationDays: number;
    color: string;
}

export interface TemplateInput {
    name: string;
    description: string;
    milestones: TemplateMilestone[];
    folders: string[]; // chemins plats "A/B/C"
    collaboratorIds: string[];
}

export interface TemplateDTO extends TemplateInput {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

const MAX_MILESTONES = 100; // bornes (R2)
const MAX_FOLDERS = 200;
const MAX_COLLABS = 50;
const DAY_MS = 86400000;

function parseMilestones(raw: unknown): TemplateMilestone[] {
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, MAX_MILESTONES).map((x) => {
        const m = x as Record<string, unknown>;
        return {
            name: String(m.name ?? "").slice(0, 200),
            description: String(m.description ?? "").slice(0, 1000),
            offsetStartDays: Math.max(-3650, Math.min(3650, Number(m.offsetStartDays ?? 0) || 0)),
            durationDays: Math.max(1, Math.min(3650, Number(m.durationDays ?? 1) || 1)),
            color: /^#[0-9a-fA-F]{6}$/.test(String(m.color ?? "")) ? String(m.color) : "#ffd600",
        };
    }).filter((m) => m.name !== "");
}

function parseFolders(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, MAX_FOLDERS)
        .map((x) => String(x).replace(/^\/+|\/+$/g, "").slice(0, 300))
        .filter((s) => s !== "" && !s.includes(".."));
}

function toDTO(t: { id: string; name: string; description: string; milestones: unknown; folders: unknown; collaboratorIds: string[]; createdAt: Date; updatedAt: Date }): TemplateDTO {
    return {
        id: t.id, name: t.name, description: t.description,
        milestones: parseMilestones(t.milestones),
        folders: parseFolders(t.folders),
        collaboratorIds: t.collaboratorIds.slice(0, MAX_COLLABS),
        createdAt: t.createdAt, updatedAt: t.updatedAt,
    };
}

export async function listTemplates(): Promise<TemplateDTO[]> {
    const rows = await getPrisma().projectTemplate.findMany({ orderBy: { name: "asc" } });
    return rows.map(toDTO);
}

export async function getTemplate(id: string): Promise<TemplateDTO | null> {
    const t = await getPrisma().projectTemplate.findUnique({ where: { id } });
    return t === null ? null : toDTO(t);
}

export async function createTemplate(input: TemplateInput): Promise<TemplateDTO> {
    assert(input.name.trim().length > 0, "createTemplate: name requis");
    const t = await getPrisma().projectTemplate.create({
        data: {
            name: input.name.trim().slice(0, 200),
            description: input.description.slice(0, 2000),
            milestones: parseMilestones(input.milestones) as unknown as Prisma.InputJsonValue,
            folders: parseFolders(input.folders),
            collaboratorIds: input.collaboratorIds.slice(0, MAX_COLLABS),
        },
    });
    return toDTO(t);
}

export async function updateTemplate(id: string, input: TemplateInput): Promise<TemplateDTO | null> {
    const prisma = getPrisma();
    const existing = await prisma.projectTemplate.findUnique({ where: { id } });
    if (existing === null) return null;
    const t = await prisma.projectTemplate.update({
        where: { id },
        data: {
            name: input.name.trim().slice(0, 200),
            description: input.description.slice(0, 2000),
            milestones: parseMilestones(input.milestones) as unknown as Prisma.InputJsonValue,
            folders: parseFolders(input.folders),
            collaboratorIds: input.collaboratorIds.slice(0, MAX_COLLABS),
        },
    });
    return toDTO(t);
}

export async function deleteTemplate(id: string): Promise<boolean> {
    const res = await getPrisma().projectTemplate.deleteMany({ where: { id } });
    return res.count > 0;
}

// Applique un template à un projet : jalons (relatifs au début du projet), arborescence de dossiers, collaborateurs
export async function applyTemplate(projectId: string, templateId: string, userId: string): Promise<{
    milestones: number; folders: number; collaborators: number;
}> {
    assert(projectId.length > 0 && templateId.length > 0, "applyTemplate: ids requis");
    const prisma = getPrisma();
    const tpl = await prisma.projectTemplate.findUnique({ where: { id: templateId } });
    assert(tpl !== null, "applyTemplate: template introuvable");
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    assert(project !== null, "applyTemplate: projet introuvable");
    const base = project.startDate ?? new Date();
    let mCount = 0;
    const ms = parseMilestones(tpl.milestones);
    for (const m of ms) { // borné par MAX_MILESTONES (R2)
        await prisma.milestone.create({
            data: {
                projectId,
                name: m.name,
                description: m.description,
                startDate: new Date(base.getTime() + m.offsetStartDays * DAY_MS),
                endDate: new Date(base.getTime() + (m.offsetStartDays + m.durationDays) * DAY_MS),
                color: m.color,
            },
        });
        mCount++;
    }
    const idByPath = new Map<string, string>();
    const folders = parseFolders(tpl.folders);
    for (const path of folders) { // borné par MAX_FOLDERS (R2), création itérative des parents (pas de récursion - R1)
        const parts = path.split("/").map((s) => s.trim()).filter((s) => s !== "");
        let parentId: string | null = null;
        let acc = "";
        for (const part of parts) {
            acc = acc === "" ? part : `${acc}/${part}`;
            const known = idByPath.get(acc);
            if (known !== undefined) { parentId = known; continue; }
            const created: { id: string } = await prisma.attachment.create({
                data: { projectId, parentId, isFolder: true, fileName: part, uploadedBy: userId },
            });
            idByPath.set(acc, created.id);
            parentId = created.id;
        }
    }
    const existing = await prisma.projectCollaborator.findMany({ where: { projectId }, select: { userId: true } });
    const existingIds = new Set(existing.map((e) => e.userId));
    let cCount = 0;
    const colIds = tpl.collaboratorIds.slice(0, MAX_COLLABS);
    for (const uid of colIds) { // borné (R2)
        if (!existingIds.has(uid)) {
            await prisma.projectCollaborator.create({ data: { projectId, userId: uid } });
            cCount++;
        }
    }
    await logActivity(userId, "template.applied", { projectId, templateId, name: tpl.name }, projectId);
    return { milestones: mCount, folders: idByPath.size, collaborators: cCount };
}
