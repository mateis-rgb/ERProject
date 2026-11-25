// Service Stock - Power of 10 : fonctions courtes, boucles bornées, assertions
import fs from "fs";
import path from "path";
import { getPrisma } from "../config/prisma";
import { getStorageDir } from "./storageService";
import { assert, boundedForEach, MAX_ITERATIONS } from "../utils/power10";
import { earliestReturnsByProject, sumReserved, toReservationLink, ReservationLink } from "../utils/availability";
import { StockItemDTO, StockMovementDTO, ProjectStockDTO, AvailabilityEntry, StockItemDetailsDTO } from "../types";
import { MovementType } from "@prisma/client";
import { logActivity } from "./activityService";
import { emitGlobal } from "./socketService";
import { notifyMany } from "./notificationService";

interface StockItemInput {
    name: string;
    reference: string;
    quantity: number;
    unit: string;
    category: string;
    supplier: string;
    purchasePrice: number | null;
    location: string;
    minThreshold: number;
}

function toStockDTO(s: {
    id: string; name: string; reference: string; quantity: number;
    unit: string; category: string; supplier: string; purchasePrice: number | null;
    location: string; minThreshold: number; imagePath: string | null; createdAt: Date; updatedAt: Date;
}): StockItemDTO {
    return {
        id: s.id, name: s.name, reference: s.reference, quantity: s.quantity,
        unit: s.unit, category: s.category, supplier: s.supplier,
        purchasePrice: s.purchasePrice, location: s.location,
        minThreshold: s.minThreshold, imagePath: s.imagePath, createdAt: s.createdAt, updatedAt: s.updatedAt,
    };
}

function toMovementDTO(m: {
    id: string; stockItemId: string; projectId: string | null; userId: string;
    type: MovementType; quantity: number; reason: string; date: Date; createdAt: Date;
}): StockMovementDTO {
    return {
        id: m.id, stockItemId: m.stockItemId, projectId: m.projectId, userId: m.userId,
        type: m.type, quantity: m.quantity, reason: m.reason, date: m.date, createdAt: m.createdAt,
    };
}

export async function createStockItem(input: StockItemInput): Promise<StockItemDTO> {
    assert(input.name.length > 0, "createStockItem: name required");
    assert(input.reference.length > 0, "createStockItem: reference required");
    assert(input.quantity >= 0, "createStockItem: quantity must be >= 0");
    const prisma = getPrisma();
    const item = await prisma.stockItem.create({
        data: {
            name: input.name, reference: input.reference, quantity: input.quantity,
            unit: input.unit, category: input.category, supplier: input.supplier,
            purchasePrice: input.purchasePrice, location: input.location,
            minThreshold: input.minThreshold,
        },
    });
    return toStockDTO(item);
}

export async function getStockItemById(id: string): Promise<StockItemDTO | null> {
    assert(id.length > 0, "getStockItemById: invalid id");
    const prisma = getPrisma();
    const item = await prisma.stockItem.findUnique({ where: { id } });
    if (item === null) return null;
    return toStockDTO(item);
}

interface StockFilter {
    search?: string;
    category?: string;
    location?: string;
    lowStock?: boolean;
    limit?: number;
    offset?: number;
}

export async function listStockItems(filter: StockFilter): Promise<StockItemDTO[]> {
    const prisma = getPrisma();
    const safeLimit = Math.min(Math.max(1, filter.limit ?? 100), 500);
    const safeOffset = Math.max(0, filter.offset ?? 0);

    const where: Record<string, unknown> = {};
    if (filter.search) {
        where.OR = [
            { name: { contains: filter.search, mode: "insensitive" } },
            { reference: { contains: filter.search, mode: "insensitive" } },
        ];
    }
    if (filter.category) where.category = filter.category;
    if (filter.location) where.location = filter.location;
    if (filter.lowStock === true) {
        where.quantity = { lte: prisma.stockItem.fields.minThreshold };
    }

    const items = await prisma.stockItem.findMany({
        where,
        orderBy: { name: "asc" },
        take: safeLimit,
        skip: safeOffset,
    });
    return items.map(toStockDTO);
}

export async function updateStockItem(
    id: string,
    input: Partial<StockItemInput>
): Promise<StockItemDTO> {
    assert(id.length > 0, "updateStockItem: invalid id");
    const prisma = getPrisma();
    const item = await prisma.stockItem.update({ where: { id }, data: input });
    return toStockDTO(item);
}

export async function deleteStockItem(id: string): Promise<void> {
    assert(id.length > 0, "deleteStockItem: invalid id");
    const prisma = getPrisma();
    await prisma.stockItem.delete({ where: { id } });
}

// ============================================================
// MOUVEMENTS DE STOCK
// ============================================================

interface MovementInput {
    stockItemId: string;
    projectId: string | null;
    userId: string;
    type: MovementType;
    quantity: number;
    reason: string;
}

export async function createMovement(input: MovementInput): Promise<StockMovementDTO> {
    assert(input.stockItemId.length > 0, "createMovement: invalid stockItemId");
    assert(input.userId.length > 0, "createMovement: invalid userId");
    assert(input.quantity > 0, "createMovement: quantity must be > 0");
    const prisma = getPrisma();

    const movement = await prisma.$transaction(async (tx) => {
        const m = await tx.stockMovement.create({
            data: {
                stockItemId: input.stockItemId,
                projectId: input.projectId,
                userId: input.userId,
                type: input.type,
                quantity: input.quantity,
                reason: input.reason,
            },
        });

        const delta = computeDelta(input.type, input.quantity);
        await tx.stockItem.update({
            where: { id: input.stockItemId },
            data: { quantity: { increment: delta } },
        });

        if (input.projectId !== null && input.type === "OUT") {
            await tx.projectStock.updateMany({
                where: { projectId: input.projectId, stockItemId: input.stockItemId },
                data: { consumedQuantity: { increment: input.quantity } },
            });
        }

        return m;
    });

    await logActivity(
        input.userId,
        `stock.${input.type.toLowerCase()}`,
        { stockItemId: input.stockItemId, quantity: input.quantity, projectId: input.projectId },
        input.projectId
    );

    // WebSocket temps réel + notif stock faible
    emitGlobal("stock:movement", { movement: toMovementDTO(movement), itemId: input.stockItemId });
    await checkLowStock(input.stockItemId);

    return toMovementDTO(movement);
}

async function checkLowStock(stockItemId: string): Promise<void> {
    const item = await getStockItemById(stockItemId);
    if (item === null || item.quantity > item.minThreshold) return;
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    const ids = admins.map((a) => a.id);
    if (ids.length === 0) return;
    await notifyMany(ids, {
        type: "warning",
        title: "Stock faible",
        message: `${item.name} : ${item.quantity} ${item.unit} (seuil ${item.minThreshold})`,
        link: "/stock",
    });
    emitGlobal("stock:low", { item });
}

function computeDelta(type: MovementType, quantity: number): number {
    if (type === "IN") return quantity;
    if (type === "RETURN") return quantity;
    return -quantity;
}

export async function listMovements(
    stockItemId?: number,
    projectId?: number,
    limit: number = 100
): Promise<StockMovementDTO[]> {
    const prisma = getPrisma();
    const safeLimit = Math.min(Math.max(1, limit), 500);
    const where: Record<string, unknown> = {};
    if (stockItemId !== undefined) where.stockItemId = stockItemId;
    if (projectId !== undefined) where.projectId = projectId;

    const movements = await prisma.stockMovement.findMany({
        where,
        orderBy: { date: "desc" },
        take: safeLimit,
    });
    return movements.map(toMovementDTO);
}

// ============================================================
// LIAISON PROJET <-> STOCK
// ============================================================

export async function linkStockToProject(
    projectId: string,
    input: { stockItemId: string; allocatedQuantity: number; forecastQuantity: number; forecastDate: Date | null; milestoneId: string | null }
): Promise<ProjectStockDTO> {
    assert(projectId.length > 0, "linkStockToProject: invalid projectId");
    assert(input.stockItemId.length > 0, "linkStockToProject: invalid stockItemId");
    assert(input.allocatedQuantity >= 0, "allocatedQuantity >= 0");
    const prisma = getPrisma();

    const link = await prisma.projectStock.upsert({
        where: { projectId_stockItemId: { projectId, stockItemId: input.stockItemId } },
        create: {
            projectId,
            stockItemId: input.stockItemId,
            allocatedQuantity: input.allocatedQuantity,
            forecastQuantity: input.forecastQuantity,
            forecastDate: input.forecastDate,
            milestoneId: input.milestoneId,
        },
        update: {
            allocatedQuantity: input.allocatedQuantity,
            forecastQuantity: input.forecastQuantity,
            forecastDate: input.forecastDate,
            milestoneId: input.milestoneId,
        },
    });

    return {
        projectId: link.projectId,
        stockItemId: link.stockItemId,
        allocatedQuantity: link.allocatedQuantity,
        consumedQuantity: link.consumedQuantity,
        forecastQuantity: link.forecastQuantity,
        forecastDate: link.forecastDate,
        milestoneId: link.milestoneId,
    };
}

export async function getProjectStockLinks(projectId: string): Promise<ProjectStockDTO[]> {
    assert(projectId.length > 0, "getProjectStockLinks: invalid projectId");
    const prisma = getPrisma();
    const links = await prisma.projectStock.findMany({
        where: { projectId },
        take: 500,
    });
    return links.map((l) => ({
        projectId: l.projectId,
        stockItemId: l.stockItemId,
        allocatedQuantity: l.allocatedQuantity,
        consumedQuantity: l.consumedQuantity,
        forecastQuantity: l.forecastQuantity,
        forecastDate: l.forecastDate,
        milestoneId: l.milestoneId,
    }));
}

export async function unlinkStockFromProject(projectId: string, stockItemId: string): Promise<void> {
    assert(projectId.length > 0 && stockItemId.length > 0, "unlinkStockFromProject: invalid ids");
    const prisma = getPrisma();
    await prisma.projectStock.delete({
        where: { projectId_stockItemId: { projectId, stockItemId } },
    });
}

// ============================================================
// KPIs STOCK
// ============================================================

export async function getLowStockItems(): Promise<StockItemDTO[]> {
    const prisma = getPrisma();
    const items = await prisma.stockItem.findMany({
        where: { quantity: { lte: prisma.stockItem.fields.minThreshold } },
        orderBy: { quantity: "asc" },
        take: 100,
    });
    return items.map(toStockDTO);
}

export async function getStockValue(): Promise<number> {
    const prisma = getPrisma();
    const items = await prisma.stockItem.findMany({
        where: { purchasePrice: { not: null } },
        select: { quantity: true, purchasePrice: true },
        take: 10000,
    });
    let total = 0;
    boundedForEach(items, (item) => {
        if (item.purchasePrice !== null) {
            total += item.quantity * item.purchasePrice;
        }
    });
    return total;
}

// Disponibilité de tous les articles à une date donnée (règle availability.ts)
export async function getAvailabilityMap(at: Date): Promise<AvailabilityEntry[]> {
    const prisma = getPrisma();
    const items = await prisma.stockItem.findMany({
        select: { id: true, quantity: true },
        take: MAX_ITERATIONS,
    });
    const links = await prisma.projectStock.findMany({
        where: { allocatedQuantity: { gt: 0 } },
        include: {
            milestone: { select: { name: true, startDate: true, endDate: true } },
            project: { select: { name: true, startDate: true, endDate: true } },
        },
        take: MAX_ITERATIONS,
    });
    const returns = await prisma.stockMovement.findMany({
        where: { type: "RETURN" },
        select: { stockItemId: true, projectId: true, date: true },
        orderBy: { date: "asc" },
        take: MAX_ITERATIONS,
    });

    const linksByItem = new Map<string, ReservationLink[]>();
    for (const l of links.slice(0, MAX_ITERATIONS)) {
        const list = linksByItem.get(l.stockItemId) ?? [];
        list.push(toReservationLink(l));
        linksByItem.set(l.stockItemId, list);
    }
    const returnsByItem = new Map<string, Array<{ projectId: string | null; date: Date }>>();
    for (const r of returns.slice(0, MAX_ITERATIONS)) {
        const list = returnsByItem.get(r.stockItemId) ?? [];
        list.push({ projectId: r.projectId, date: r.date });
        returnsByItem.set(r.stockItemId, list);
    }

    return items.slice(0, MAX_ITERATIONS).map((it) => {
        const itemLinks = linksByItem.get(it.id) ?? [];
        const itemReturns = returnsByItem.get(it.id) ?? [];
        const { reserved } = sumReserved(itemLinks, earliestReturnsByProject(itemReturns, MAX_ITERATIONS), at, at, MAX_ITERATIONS);
        return {
            stockItemId: it.id,
            totalQuantity: it.quantity,
            reserved,
            available: Math.max(0, it.quantity - reserved),
        };
    });
}

// ============================================================
// DÉTAIL ARTICLE (mouvements, réservations, dispo) + PHOTO
// ============================================================

export async function getStockItemDetails(id: string): Promise<StockItemDetailsDTO | null> {
    assert(id.length > 0, "getStockItemDetails: invalid id");
    const prisma = getPrisma();
    const item = await prisma.stockItem.findUnique({ where: { id } });
    if (item === null) return null;

    const [movements, links] = await Promise.all([
        prisma.stockMovement.findMany({
            where: { stockItemId: id },
            include: { user: { select: { name: true } }, project: { select: { name: true } } },
            orderBy: { date: "desc" },
            take: MAX_ITERATIONS,
        }),
        prisma.projectStock.findMany({
            where: { stockItemId: id },
            include: {
                project: { select: { id: true, name: true } },
                milestone: { select: { id: true, name: true } },
            },
            take: MAX_ITERATIONS,
        }),
    ]);
    const avail = (await getAvailabilityMap(new Date())).find((a) => a.stockItemId === id) ?? {
        stockItemId: id, totalQuantity: item.quantity, reserved: 0, available: item.quantity,
    };
    return {
        item: toStockDTO(item),
        movements: movements.map((m) => ({
            ...toMovementDTO(m),
            userName: m.user.name,
            projectName: m.project?.name ?? null,
        })),
        reservations: links.map((l) => ({
            projectId: l.projectId,
            projectName: l.project.name,
            milestoneId: l.milestoneId,
            milestoneName: l.milestone?.name ?? null,
            allocatedQuantity: l.allocatedQuantity,
            consumedQuantity: l.consumedQuantity,
            forecastQuantity: l.forecastQuantity,
            forecastDate: l.forecastDate,
        })),
        availability: avail,
    };
}

const IMAGE_EXTS: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
};

function removeOldImage(imagePath: string | null): void {
    if (imagePath === null) return;
    const old = path.resolve(getStorageDir(), imagePath);
    if (fs.existsSync(old)) fs.unlinkSync(old);
}

export async function setStockItemImage(id: string, buffer: Buffer, mimetype: string): Promise<string> {
    assert(id.length > 0, "setStockItemImage: invalid id");
    const ext = IMAGE_EXTS[mimetype];
    if (ext === undefined) throw new Error("Format image non supporté (jpg, png, webp, gif)");
    const prisma = getPrisma();
    const item = await prisma.stockItem.findUnique({ where: { id }, select: { imagePath: true } });
    if (item === null) throw new Error("Article introuvable");
    const dir = path.join(getStorageDir(), "stock");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const rel = path.join("stock", `${id}${ext}`);
    // Écrit d'abord, met à jour la BDD ensuite, puis nettoie : si l'écriture échoue, l'ancienne image reste valide
    fs.writeFileSync(path.join(getStorageDir(), rel), buffer);
    await prisma.stockItem.update({ where: { id }, data: { imagePath: rel } });
    if (item.imagePath !== null && item.imagePath !== rel) removeOldImage(item.imagePath);
    return rel;
}

export async function clearStockItemImage(id: string): Promise<void> {
    assert(id.length > 0, "clearStockItemImage: invalid id");
    const prisma = getPrisma();
    const item = await prisma.stockItem.findUnique({ where: { id }, select: { imagePath: true } });
    if (item === null) throw new Error("Article introuvable");
    removeOldImage(item.imagePath);
    await prisma.stockItem.update({ where: { id }, data: { imagePath: null } });
}
