// Service Projets - Power of 10 : chaque fonction < 60 lignes, pas de récursivité
import { getPrisma } from "../config/prisma";
import { assert, boundedForEach } from "../utils/power10";
import { ProjectDTO } from "../types";
import { logActivity } from "./activityService";
import { generateDataKey, encryptDataKey } from "./cryptoService";

interface ProjectCreateInput {
    name: string;
    description: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    budget: number | null;
    client: string;
    tags: string[];
    type: string;
    quotaBytes: number | null;
    encrypted: boolean; // chiffrement at-rest du drive, fixé à la création uniquement
    collaboratorIds: string[];
}

function toProjectDTO(
    p: {
        id: string; name: string; description: string; status: string;
        startDate: Date | null; endDate: Date | null; budget: number | null;
        client: string; tags: string[]; type: string; quotaBytes: number | null; encrypted: boolean; createdById: string;
        createdAt: Date; updatedAt: Date;
        collaborators: { userId: string }[];
    }
): ProjectDTO {
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        budget: p.budget,
        client: p.client,
        tags: p.tags,
        type: p.type,
        quotaBytes: p.quotaBytes,
        encrypted: p.encrypted,
        createdById: p.createdById,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        collaboratorIds: p.collaborators.map((c) => c.userId),
    };
}

export async function createProject(
    input: ProjectCreateInput,
    userId: string
): Promise<ProjectDTO> {
    assert(input.name.length > 0, "createProject: name required");
    assert(userId.length > 0, "createProject: invalid userId");
    const prisma = getPrisma();

    // Projet chiffré : data key aléatoire, stockée en BDD chiffrée avec la master key (jamais en clair)
    const dataKey = input.encrypted ? generateDataKey() : null;

    const project = await prisma.project.create({
        data: {
            name: input.name,
            description: input.description,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            budget: input.budget,
            client: input.client,
            tags: input.tags,
            type: input.type,
            quotaBytes: input.quotaBytes,
            encrypted: input.encrypted,
            encryptionKey: dataKey !== null ? encryptDataKey(dataKey) : null,
            createdById: userId,
            collaborators: {
                create: input.collaboratorIds.map((uid) => ({ userId: uid })),
            },
        },
        include: { collaborators: true },
    });

    await logActivity(userId, "project.created", { projectId: project.id, name: project.name }, project.id);
    return toProjectDTO(project);
}

export async function getProjectById(id: string): Promise<ProjectDTO | null> {
    assert(id.length > 0, "getProjectById: invalid id");
    const prisma = getPrisma();
    const project = await prisma.project.findUnique({
        where: { id },
        include: { collaborators: true },
    });
    if (project === null) return null;
    return toProjectDTO(project);
}

interface ProjectFilter {
    status?: string;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export async function listProjects(filter: ProjectFilter): Promise<ProjectDTO[]> {
    const prisma = getPrisma();
    const safeLimit = Math.min(Math.max(1, filter.limit ?? 50), 200);
    const safeOffset = Math.max(0, filter.offset ?? 0);

    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.type) where.type = filter.type;
    if (filter.search) {
        where.OR = [
            { name: { contains: filter.search, mode: "insensitive" } },
            { client: { contains: filter.search, mode: "insensitive" } },
        ];
    }

    const projects = await prisma.project.findMany({
        where,
        include: { collaborators: true },
        orderBy: { updatedAt: "desc" },
        take: safeLimit,
        skip: safeOffset,
    });

    return projects.map(toProjectDTO);
}

export async function updateProject(
    id: string,
    input: Partial<ProjectCreateInput>,
    userId: string
): Promise<ProjectDTO> {
    assert(id.length > 0, "updateProject: invalid id");
    const prisma = getPrisma();

    const data: Record<string, unknown> = { ...input };
    delete data.collaboratorIds;
    delete data.encrypted; // le chiffrement se fixe à la création uniquement, jamais modifiable après

    const project = await prisma.project.update({
        where: { id },
        data,
        include: { collaborators: true },
    });

    if (input.collaboratorIds !== undefined) {
        await syncCollaborators(id, input.collaboratorIds);
    }

    await logActivity(userId, "project.updated", { projectId: id }, id);
    return toProjectDTO(project);
}

async function syncCollaborators(projectId: string, userIds: string[]): Promise<void> {
    const prisma = getPrisma();
    await prisma.projectCollaborator.deleteMany({ where: { projectId } });
    const safeIds = userIds.slice(0, 50);
    boundedForEach(safeIds, (uid) => {
        assert(uid.length > 0, "syncCollaborators: invalid userId");
    });
    if (safeIds.length > 0) {
        await prisma.projectCollaborator.createMany({
            data: safeIds.map((uid) => ({ projectId, userId: uid })),
        });
    }
}

export async function deleteProject(id: string, userId: string): Promise<void> {
    assert(id.length > 0, "deleteProject: invalid id");
    const prisma = getPrisma();
    await prisma.project.delete({ where: { id } });
    await logActivity(userId, "project.deleted", { projectId: id }, null);
}

export async function getProjectStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
}> {
    const prisma = getPrisma();
    const all = await prisma.project.findMany({ select: { status: true } });
    const byStatus: Record<string, number> = {};
    boundedForEach(all, (p) => {
        byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    });
    return { total: all.length, byStatus };
}
