// Service Planning global cross-projets + détection de conflits de réservation stock (Power of 10)
import { Prisma } from "@prisma/client";
import { getPrisma } from "../config/prisma";
import { MAX_ITERATIONS } from "../utils/power10";
import { PlanningMilestoneDTO, StockConflictDTO, PlanningDTO, PlanningProjectDTO } from "../types";

const INACTIVE_STATUSES = ["Archivé", "Annulé"];
const MAX_CONFLICTS = 200;
const MAX_RES_PER_ITEM = 50; // borne O(n²) par article (R2)

interface Res {
    stockItemId: string;
    stockName: string;
    reference: string;
    projectId: string;
    projectName: string;
    milestoneId: string;
    milestoneName: string;
    start: Date;
    end: Date;
    quantity: number;
}

export async function listPlanningMilestones(): Promise<PlanningMilestoneDTO[]> {
    const prisma = getPrisma();
    const rows = await prisma.milestone.findMany({
        where: { project: { status: { notIn: INACTIVE_STATUSES } } },
        include: { project: { select: { id: true, name: true, status: true } } },
        orderBy: { startDate: "asc" },
        take: MAX_ITERATIONS,
    });
    return rows.map((m) => ({
        id: m.id,
        projectId: m.project.id,
        projectName: m.project.name,
        projectStatus: m.project.status,
        name: m.name,
        startDate: m.startDate,
        endDate: m.endDate,
        color: m.color,
        parentId: m.parentId,
    }));
}

function effectiveEndOf(r: Res, returnByProject: Map<string, Date>): Date {
    const ret = returnByProject.get(r.projectId) ?? null;
    return ret !== null && ret < r.end ? ret : r.end;
}

// Paaires de réservations de projets différents dont les périodes se chevauchent (borné R2)
function findConflicts(resByItem: Map<string, Res[]>, returnsByItem: Map<string, Map<string, Date>>): StockConflictDTO[] {
    const out: StockConflictDTO[] = [];
    for (const [stockItemId, list] of resByItem) {
        if (out.length >= MAX_CONFLICTS) break;
        const returns = returnsByItem.get(stockItemId) ?? new Map<string, Date>();
        const n = Math.min(list.length, MAX_RES_PER_ITEM);
        for (let i = 0; i < n && out.length < MAX_CONFLICTS; i++) {
            const a = list[i];
            if (a === undefined) continue;
            for (let j = i + 1; j < n && out.length < MAX_CONFLICTS; j++) {
                const b = list[j];
                if (b === undefined || a.projectId === b.projectId) continue;
                const endA = effectiveEndOf(a, returns);
                const endB = effectiveEndOf(b, returns);
                const overlapStart = a.start > b.start ? a.start : b.start;
                const overlapEnd = endA < endB ? endA : endB;
                if (overlapStart <= overlapEnd) {
                    out.push({
                        stockItemId,
                        stockItemName: a.stockName,
                        reference: a.reference,
                        quantity: Math.min(a.quantity, b.quantity),
                        overlapStart,
                        overlapEnd,
                        a: { projectId: a.projectId, projectName: a.projectName, milestoneId: a.milestoneId, milestoneName: a.milestoneName },
                        b: { projectId: b.projectId, projectName: b.projectName, milestoneId: b.milestoneId, milestoneName: b.milestoneName },
                    });
                }
            }
        }
    }
    return out;
}

const linkInclude = {
    stockItem: { select: { id: true, name: true, reference: true } },
    project: { select: { id: true, name: true } },
    milestone: { select: { id: true, name: true, startDate: true, endDate: true } },
} satisfies Prisma.ProjectStockInclude;
type LinkRow = Prisma.ProjectStockGetPayload<{ include: typeof linkInclude }>;

function buildReservations(links: LinkRow[]): Map<string, Res[]> {
    const resByItem = new Map<string, Res[]>();
    for (const l of links) {
        if (l.milestone === null) continue;
        const list = resByItem.get(l.stockItemId) ?? [];
        list.push({
            stockItemId: l.stockItemId,
            stockName: l.stockItem.name,
            reference: l.stockItem.reference,
            projectId: l.projectId,
            projectName: l.project.name,
            milestoneId: l.milestone.id,
            milestoneName: l.milestone.name,
            start: l.milestone.startDate,
            end: l.milestone.endDate,
            quantity: l.allocatedQuantity,
        });
        resByItem.set(l.stockItemId, list);
    }
    return resByItem;
}

function prismaLinks(): Promise<LinkRow[]> {
    return getPrisma().projectStock.findMany({
        where: {
            allocatedQuantity: { gt: 0 },
            milestoneId: { not: null },
            project: { status: { notIn: INACTIVE_STATUSES } },
        },
        include: linkInclude,
        take: MAX_ITERATIONS,
    });
}

// retours (RETURN) par article puis par projet, date la plus précoce
function buildReturnsMap(
    returns: Array<{ stockItemId: string; projectId: string | null; date: Date }>
): Map<string, Map<string, Date>> {
    const out = new Map<string, Map<string, Date>>();
    for (const r of returns.slice(0, MAX_ITERATIONS)) {
        if (r.projectId === null) continue;
        const byProject = out.get(r.stockItemId) ?? new Map<string, Date>();
        const prev = byProject.get(r.projectId);
        if (prev === undefined || r.date < prev) byProject.set(r.projectId, r.date);
        out.set(r.stockItemId, byProject);
    }
    return out;
}

// Projets actifs avec leurs propres dates (source de vérité pour la ligne projet)
export async function listPlanningProjects(): Promise<PlanningProjectDTO[]> {
    const prisma = getPrisma();
    const rows = await prisma.project.findMany({
        where: { status: { notIn: INACTIVE_STATUSES } },
        select: { id: true, name: true, status: true, startDate: true, endDate: true },
        orderBy: { name: "asc" },
        take: MAX_ITERATIONS,
    });
    return rows.map((p) => ({
        id: p.id, name: p.name, status: p.status, startDate: p.startDate, endDate: p.endDate,
    }));
}

export async function getPlanning(): Promise<PlanningDTO> {
    const prisma = getPrisma();
    const [projects, milestones, links, returns] = await Promise.all([
        listPlanningProjects(),
        listPlanningMilestones(),
        prismaLinks(),
        prisma.stockMovement.findMany({
            where: { type: "RETURN" },
            select: { stockItemId: true, projectId: true, date: true },
            orderBy: { date: "asc" },
            take: MAX_ITERATIONS,
        }),
    ]);
    return {
        projects,
        milestones,
        conflicts: findConflicts(buildReservations(links), buildReturnsMap(returns)),
    };
}
