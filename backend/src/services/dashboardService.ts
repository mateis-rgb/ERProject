// Service Dashboard KPIs - Power of 10 : calculs simples, boucles bornées
import { getPrisma } from "../config/prisma";
import { boundedReduce } from "../utils/power10";
import { DashboardKPIs } from "../types";

export async function computeDashboardKPIs(): Promise<DashboardKPIs> {
    const prisma = getPrisma();

    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({
        where: { status: "En cours" },
    });
    const totalStockItems = await prisma.stockItem.count();

    const lowStockRaw = await prisma.stockItem.findMany({
        where: { quantity: { lte: prisma.stockItem.fields.minThreshold } },
        select: { id: true },
        take: 1000,
    });

    const stockItems = await prisma.stockItem.findMany({
        where: { purchasePrice: { not: null } },
        select: { quantity: true, purchasePrice: true },
        take: 10000,
    });
    const totalStockValue = boundedReduce(
        stockItems,
        0,
        (acc, item) => acc + (item.purchasePrice !== null ? item.quantity * item.purchasePrice : 0)
    );

    const outMovements = await prisma.stockMovement.aggregate({
        where: { type: "OUT" },
        _sum: { quantity: true },
    });

    const timeEntries = await prisma.timeEntry.aggregate({
        _sum: { hours: true },
    });

    return {
        totalProjects,
        activeProjects,
        totalStockItems,
        lowStockItems: lowStockRaw.length,
        totalStockValue,
        totalMovementsOut: outMovements._sum.quantity ?? 0,
        totalTimeLogged: timeEntries._sum.hours ?? 0,
    };
}
