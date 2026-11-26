// Service Dashboard KPIs - Power of 10 : calculs simples, sous-fonctions courtes, boucles bornées
import { PrismaClient } from "@prisma/client";
import { getPrisma } from "../config/prisma";
import { boundedReduce, MAX_ITERATIONS } from "../utils/power10";
import { DashboardKPIs } from "../types";

const ACTIVE_STATUS = "En cours";
const ARCHIVED_STATUS = "Archivé";
const UPCOMING_DAYS = 7;
const DAY_MS = 24 * 3600 * 1000;

async function countMilestonesBetween(prisma: PrismaClient, from: Date, to: Date): Promise<number> {
    return prisma.milestone.count({
        where: { endDate: { gte: from, lt: to }, project: { status: ACTIVE_STATUS } },
    });
}

async function countReservedItems(prisma: PrismaClient): Promise<number> {
    const rows = await prisma.projectStock.findMany({
        where: { allocatedQuantity: { gt: 0 }, project: { status: ACTIVE_STATUS } },
        select: { stockItemId: true },
        distinct: ["stockItemId"],
        take: MAX_ITERATIONS,
    });
    return rows.length;
}

async function sumStockValue(prisma: PrismaClient): Promise<number> {
    const items = await prisma.stockItem.findMany({
        where: { purchasePrice: { not: null } },
        select: { quantity: true, purchasePrice: true },
        take: MAX_ITERATIONS,
    });
    return boundedReduce(
        items,
        0,
        (acc, item) => acc + (item.purchasePrice !== null ? item.quantity * item.purchasePrice : 0)
    );
}

async function sumTimeThisMonth(prisma: PrismaClient, now: Date): Promise<number> {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const agg = await prisma.timeEntry.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { hours: true },
    });
    return agg._sum.hours ?? 0;
}

async function countLowStock(prisma: PrismaClient): Promise<number> {
    const rows = await prisma.stockItem.findMany({
        where: { quantity: { lte: prisma.stockItem.fields.minThreshold } },
        select: { id: true },
        take: MAX_ITERATIONS,
    });
    return rows.length;
}

export async function computeDashboardKPIs(): Promise<DashboardKPIs> {
    const prisma = getPrisma();
    const now = new Date();
    const in7d = new Date(now.getTime() + UPCOMING_DAYS * DAY_MS);
    const [totalProjects, activeProjects, archived, milestonesTotal, overdue, upcoming, low, reserved, totalItems, value, timeMonth, timeTotal, usersCount] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { status: ACTIVE_STATUS } }),
        prisma.project.count({ where: { status: ARCHIVED_STATUS } }),
        prisma.milestone.count(),
        countMilestonesBetween(prisma, new Date(0), now),
        countMilestonesBetween(prisma, now, in7d),
        countLowStock(prisma),
        countReservedItems(prisma),
        prisma.stockItem.count(),
        sumStockValue(prisma),
        sumTimeThisMonth(prisma, now),
        prisma.timeEntry.aggregate({ _sum: { hours: true } }).then((a) => a._sum.hours ?? 0),
        prisma.user.count(),
    ]);
    return {
        totalProjects,
        activeProjects,
        archivedProjects: archived,
        milestonesTotal,
        milestonesOverdue: overdue,
        milestonesUpcoming: upcoming,
        lowStockItems: low,
        reservedItems: reserved,
        totalStockItems: totalItems,
        totalStockValue: value,
        timeThisMonth: timeMonth,
        timeTotal,
        usersCount,
    };
}
