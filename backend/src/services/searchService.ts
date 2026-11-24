// Service Recherche globale (Power of 10 R4)
import { getPrisma } from "../config/prisma";
import { assert } from "../utils/power10";
import { getConfigValue, CONFIG_KEYS } from "./configService";

export interface SearchResult {
    type: "project" | "stock" | "user";
    id: string;
    title: string;
    subtitle: string;
    link: string;
}

const MAX_PER_TYPE = 10;
const MAX_TOTAL = 30;

async function searchProjects(q: string): Promise<SearchResult[]> {
    const prisma = getPrisma();
    const projects = await prisma.project.findMany({
        where: { OR: [
            { name: { contains: q, mode: "insensitive" } },
            { client: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
        ] },
        select: { id: true, name: true, status: true, client: true },
        take: MAX_PER_TYPE,
    });
    return projects.map((p) => ({
        type: "project" as const, id: p.id, title: p.name,
        subtitle: `${p.status}${p.client ? " · " + p.client : ""}`,
        link: `/projects/${p.id}`,
    }));
}

async function searchStock(q: string): Promise<SearchResult[]> {
    const prisma = getPrisma();
    const items = await prisma.stockItem.findMany({
        where: { OR: [
            { name: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
        ] },
        select: { id: true, name: true, reference: true, quantity: true, unit: true },
        take: MAX_PER_TYPE,
    });
    return items.map((s) => ({
        type: "stock" as const, id: s.id, title: s.name,
        subtitle: `${s.reference} · ${s.quantity} ${s.unit}`,
        link: "/stock",
    }));
}

async function searchUsers(q: string): Promise<SearchResult[]> {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
        where: { OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
        ] },
        select: { id: true, name: true, email: true, role: true },
        take: MAX_PER_TYPE,
    });
    return users.map((u) => ({
        type: "user" as const, id: u.id, title: u.name,
        subtitle: `${u.email} · ${u.role}`,
        link: "/admin",
    }));
}

export async function globalSearch(query: string, includeUsers: boolean): Promise<SearchResult[]> {
    assert(query.length > 0, "globalSearch: empty query");
    const q = query.trim().slice(0, 100);
    if (q.length === 0) return [];
    const modules = await getConfigValue(CONFIG_KEYS.ENABLED_MODULES);
    const results: SearchResult[] = [];
    results.push(...await searchProjects(q));
    if (modules.includes("stock")) results.push(...await searchStock(q));
    if (includeUsers) results.push(...await searchUsers(q));
    return results.slice(0, MAX_TOTAL);
}
