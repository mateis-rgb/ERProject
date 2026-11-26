// Service Dashboard KPIs - Power of 10 : calculs simples, sous-fonctions courtes, boucles bornées
import { PrismaClient } from "@prisma/client";
import { getPrisma } from "../config/prisma";
import { boundedReduce, MAX_ITERATIONS } from "../utils/power10";
import { DashboardKPIs, KpiDetail, KpiDetailItem } from "../types";

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

// ---------- Détail d'un KPI (liste des entités concernées) ----------

const DETAIL_TAKE = 100; // borne dure d'affichage (R2)

function fmtD(iso: Date): string {
    return iso.toISOString().slice(0, 10);
}

async function projectItems(prisma: PrismaClient, where: Record<string, unknown>): Promise<KpiDetailItem[]> {
    const rows = await prisma.project.findMany({ where, select: { id: true, name: true, status: true }, take: DETAIL_TAKE });
    return rows.map((p) => ({ id: p.id, title: p.name, subtitle: p.status, href: `/projects/${p.id}` }));
}

async function milestoneItems(prisma: PrismaClient, where: Record<string, unknown>): Promise<KpiDetailItem[]> {
    const rows = await prisma.milestone.findMany({
        where, take: DETAIL_TAKE,
        select: { id: true, name: true, startDate: true, endDate: true, projectId: true, project: { select: { name: true } } },
        orderBy: { startDate: "asc" },
    });
    return rows.map((m) => ({
        id: m.id, title: m.name,
        subtitle: `${m.project.name} · ${fmtD(m.startDate)} -> ${fmtD(m.endDate)}`,
        href: `/projects/${m.projectId}/planning`,
    }));
}

async function stockItems(prisma: PrismaClient, where: Record<string, unknown>): Promise<KpiDetailItem[]> {
    const rows = await prisma.stockItem.findMany({
        where, take: DETAIL_TAKE,
        select: { id: true, name: true, reference: true, quantity: true, minThreshold: true },
        orderBy: { name: "asc" },
    });
    return rows.map((s) => ({
        id: s.id, title: `${s.name} (${s.reference})`,
        subtitle: `qté ${s.quantity} / seuil ${s.minThreshold}`,
        href: `/stock/${s.id}`,
    }));
}

async function timeItems(prisma: PrismaClient, where: Record<string, unknown>): Promise<KpiDetailItem[]> {
    const rows = await prisma.timeEntry.findMany({
        where, take: DETAIL_TAKE, orderBy: { createdAt: "desc" },
        select: { id: true, hours: true, createdAt: true, projectId: true, user: { select: { name: true } }, project: { select: { name: true } } },
    });
    return rows.map((e) => ({
        id: e.id, title: `${e.hours}h - ${e.user.name}`,
        subtitle: `${e.project.name} · ${fmtD(e.createdAt)}`,
        href: e.projectId !== null ? `/projects/${e.projectId}` : "",
    }));
}

async function reservedStockItems(prisma: PrismaClient): Promise<KpiDetailItem[]> {
    const links = await prisma.projectStock.findMany({
        where: { allocatedQuantity: { gt: 0 }, project: { status: ACTIVE_STATUS } },
        take: DETAIL_TAKE,
        select: { stockItemId: true, allocatedQuantity: true, stockItem: { select: { name: true, reference: true } } },
    });
    const seen = new Set<string>();
    const out: KpiDetailItem[] = [];
    for (const l of links) {
        if (seen.has(l.stockItemId)) continue;
        seen.add(l.stockItemId);
        out.push({
            id: l.stockItemId,
            title: `${l.stockItem.name} (${l.stockItem.reference})`,
            subtitle: `réservé x${l.allocatedQuantity}`,
            href: `/stock/${l.stockItemId}`,
        });
    }
    return out;
}

async function userItems(prisma: PrismaClient): Promise<KpiDetailItem[]> {
    const rows = await prisma.user.findMany({ take: DETAIL_TAKE, select: { id: true, name: true, email: true, role: true }, orderBy: { name: "asc" } });
    return rows.map((u) => ({ id: u.id, title: u.name, subtitle: `${u.email} · ${u.role}`, href: "" }));
}

export async function kpiDetail(id: string): Promise<KpiDetail | null> {
    const prisma = getPrisma();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7d = new Date(now.getTime() + UPCOMING_DAYS * DAY_MS);
    let items: KpiDetailItem[];
    switch (id) {
        case "totalProjects": items = await projectItems(prisma, {}); break;
        case "activeProjects": items = await projectItems(prisma, { status: ACTIVE_STATUS }); break;
        case "archivedProjects": items = await projectItems(prisma, { status: ARCHIVED_STATUS }); break;
        case "milestonesTotal": items = await milestoneItems(prisma, {}); break;
        case "milestonesOverdue": items = await milestoneItems(prisma, { endDate: { lt: now }, project: { status: ACTIVE_STATUS } }); break;
        case "milestonesUpcoming": items = await milestoneItems(prisma, { endDate: { gte: now, lt: in7d }, project: { status: ACTIVE_STATUS } }); break;
        case "lowStockItems": items = await prisma.stockItem.findMany({ where: { quantity: { lte: prisma.stockItem.fields.minThreshold } }, take: DETAIL_TAKE }).then((rows) => rows.map((s) => ({ id: s.id, title: `${s.name} (${s.reference})`, subtitle: `qté ${s.quantity} / seuil ${s.minThreshold}`, href: `/stock/${s.id}` }))); break;
        case "reservedItems": items = await reservedStockItems(prisma); break;
        case "totalStockItems": items = await stockItems(prisma, {}); break;
        case "totalStockValue": items = await stockItems(prisma, { purchasePrice: { not: null } }); break;
        case "timeThisMonth": items = await timeItems(prisma, { createdAt: { gte: monthStart } }); break;
        case "timeTotal": items = await timeItems(prisma, {}); break;
        case "usersCount": items = await userItems(prisma); break;
        default: return null;
    }
    return { id, items };
}
