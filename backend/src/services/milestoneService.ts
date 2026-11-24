// Service Jalons (Milestones) - CRUD + réservation stock via ProjectStock.milestoneId (Power of 10)
import { getPrisma } from "../config/prisma";
import { assert } from "../utils/power10";

export interface MilestoneDTO {
    id: string;
    projectId: string;
    parentId: string | null;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    color: string;
}

export interface MilestoneStockDTO {
    milestoneId: string;
    stockItemId: string;
    stockName: string;
    stockReference: string;
    quantity: number;
}

interface MilestoneInput {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    color: string;
    parentId?: string | null; // sous-jalon
}

const MAX_DEPTH = 50; // borne anti-cycle sur la chaîne des parents (R2)

// Valide le parent : même projet, pas soi-même, pas de cycle (boucle bornée sur les ancêtres)
async function validateParent(projectId: string, parentId: string | null, selfId: string | null): Promise<void> {
    if (parentId === null) return;
    assertId(parentId, "validateParent");
    if (selfId !== null && parentId === selfId) throw new Error("Un jalon ne peut pas être son propre parent");
    const prisma = getPrisma();
    let current: string | null = parentId;
    for (let i = 0; i < MAX_DEPTH && current !== null; i++) {
        if (current === selfId) throw new Error("Cycle de sous-jalons détecté");
        const p: { projectId: string; parentId: string | null } | null =
            await prisma.milestone.findUnique({ where: { id: current }, select: { projectId: true, parentId: true } });
        if (p === null) throw new Error("Jalon parent introuvable");
        if (p.projectId !== projectId) throw new Error("Le jalon parent doit appartenir au même projet");
        current = p.parentId;
    }
}

function toDTO(m: {
    id: string; projectId: string; parentId: string | null; name: string; description: string;
    startDate: Date; endDate: Date; color: string;
}): MilestoneDTO {
    return {
        id: m.id, projectId: m.projectId, parentId: m.parentId, name: m.name, description: m.description,
        startDate: m.startDate, endDate: m.endDate, color: m.color,
    };
}

function assertId(id: string, ctx: string): void {
    assert(typeof id === "string" && id.length > 0, `${ctx}: invalid id`);
}

export async function createMilestone(projectId: string, input: MilestoneInput): Promise<MilestoneDTO> {
    assertId(projectId, "createMilestone");
    assert(input.name.length > 0, "createMilestone: name required");
    assert(input.startDate <= input.endDate, "createMilestone: startDate > endDate");
    const prisma = getPrisma();
    await validateParent(projectId, input.parentId ?? null, null);
    const m = await prisma.milestone.create({
        data: {
            projectId, name: input.name, description: input.description,
            startDate: input.startDate, endDate: input.endDate, color: input.color,
            parentId: input.parentId ?? null,
        },
    });
    return toDTO(m);
}

export async function listMilestones(projectId: string): Promise<MilestoneDTO[]> {
    assertId(projectId, "listMilestones");
    const prisma = getPrisma();
    const ms = await prisma.milestone.findMany({
        where: { projectId },
        orderBy: { startDate: "asc" },
        take: 200,
    });
    return ms.map(toDTO);
}

export async function updateMilestone(id: string, input: Partial<MilestoneInput>): Promise<MilestoneDTO> {
    assertId(id, "updateMilestone");
    const prisma = getPrisma();
    const current = await prisma.milestone.findUnique({ where: { id }, select: { projectId: true } });
    if (current === null) throw new Error("Jalon introuvable");
    if (input.parentId !== undefined) await validateParent(current.projectId, input.parentId, id);
    const m = await prisma.milestone.update({ where: { id }, data: input });
    return toDTO(m);
}

export async function deleteMilestone(id: string): Promise<void> {
    assertId(id, "deleteMilestone");
    const prisma = getPrisma();
    await prisma.milestone.delete({ where: { id } });
}

// --- Stock réservé sur un jalon (via ProjectStock.milestoneId) ---

export async function linkStockToMilestone(
    milestoneId: string,
    stockItemId: string,
    quantity: number
): Promise<MilestoneStockDTO> {
    assertId(milestoneId, "linkStockToMilestone");
    assertId(stockItemId, "linkStockToMilestone");
    assert(quantity >= 0, "linkStockToMilestone: quantity >= 0");
    const prisma = getPrisma();
    const ms = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (ms === null) throw new Error("Jalon introuvable");
    const link = await prisma.projectStock.upsert({
        where: { projectId_stockItemId: { projectId: ms.projectId, stockItemId } },
        create: { projectId: ms.projectId, stockItemId, milestoneId, allocatedQuantity: quantity },
        update: { milestoneId, allocatedQuantity: quantity },
    });
    const item = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
    return {
        milestoneId: link.milestoneId ?? milestoneId,
        stockItemId: link.stockItemId,
        stockName: item?.name ?? "?",
        stockReference: item?.reference ?? "",
        quantity: link.allocatedQuantity,
    };
}

export async function unlinkStockFromMilestone(milestoneId: string, stockItemId: string): Promise<void> {
    assertId(milestoneId, "unlinkStockFromMilestone");
    const prisma = getPrisma();
    const links = await prisma.projectStock.findMany({ where: { milestoneId, stockItemId }, take: 10 });
    for (const l of links) {
        await prisma.projectStock.update({
            where: { projectId_stockItemId: { projectId: l.projectId, stockItemId } },
            data: { milestoneId: null },
        });
    }
}

export async function getMilestoneStock(milestoneId: string): Promise<MilestoneStockDTO[]> {
    assertId(milestoneId, "getMilestoneStock");
    const prisma = getPrisma();
    const links = await prisma.projectStock.findMany({
        where: { milestoneId },
        include: { stockItem: { select: { name: true, reference: true } } },
        take: 200,
    });
    return links.map((l) => ({
        milestoneId: l.milestoneId ?? milestoneId,
        stockItemId: l.stockItemId,
        stockName: l.stockItem.name,
        stockReference: l.stockItem.reference,
        quantity: l.allocatedQuantity,
    }));
}

// --- Disponibilité d'un article à une date donnée ---
// dispo = stock actuel - réservations des jalons couvrant la date (via ProjectStock.milestoneId)
export async function getAvailabilityAt(stockItemId: string, date: Date): Promise<{
    stockItemId: string;
    totalQuantity: number;
    reserved: number;
    available: number;
    reservations: Array<{ milestoneId: string; projectId: string; milestoneName: string; quantity: number }>;
}> {
    assertId(stockItemId, "getAvailabilityAt");
    const prisma = getPrisma();
    const item = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
    if (item === null) throw new Error("Article introuvable");

    const links = await prisma.projectStock.findMany({
        where: {
            stockItemId,
            milestoneId: { not: null },
            milestone: { startDate: { lte: date }, endDate: { gte: date } },
        },
        include: { milestone: { select: { id: true, name: true, projectId: true } } },
        take: 100,
    });

    let reserved = 0;
    const reservations = links.map((l) => {
        reserved += l.allocatedQuantity;
        return {
            milestoneId: l.milestone?.id ?? "",
            projectId: l.milestone?.projectId ?? "",
            milestoneName: l.milestone?.name ?? "",
            quantity: l.allocatedQuantity,
        };
    });

    return {
        stockItemId,
        totalQuantity: item.quantity,
        reserved,
        available: Math.max(0, item.quantity - reserved),
        reservations,
    };
}
