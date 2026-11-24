// Service mises à jour - check GitHub releases vs version locale + notif admins.
// Non destructeur : rien n'est exécuté automatiquement, on ne fait que signaler (Power of 10)
import fs from "fs";
import path from "path";
import { getPrisma } from "../config/prisma";
import { getConfigValue, CONFIG_KEYS } from "./configService";
import { notifyMany } from "./notificationService";
import { assert } from "../utils/power10";

export interface UpdateInfo {
    enabled: boolean;
    current: string;
    latest: string | null;
    available: boolean;
    changelog: string;
    url: string | null;
    publishedAt: string | null;
    error: string | null;
}

const CACHE_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;
let cache: { at: number; info: UpdateInfo } | null = null;

export function getLocalVersion(): string {
    const pkgPath = path.resolve(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
}

function parseSemver(v: string): number[] {
    const parts = v.replace(/^v/i, "").split(".");
    const out: number[] = [];
    for (let i = 0; i < 3; i++) {
        const n = parseInt(parts[i] ?? "0", 10);
        out.push(Number.isFinite(n) ? n : 0);
    }
    return out;
}

export function isNewer(latest: string, current: string): boolean {
    const a = parseSemver(latest);
    const b = parseSemver(current);
    for (let i = 0; i < 3; i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;
        if (av > bv) return true;
        if (av < bv) return false;
    }
    return false;
}

function emptyInfo(current: string, enabled: boolean, error: string | null = null): UpdateInfo {
    return { enabled, current, latest: null, available: false, changelog: "", url: null, publishedAt: null, error };
}

async function fetchLatestRelease(repo: string, current: string): Promise<UpdateInfo> {
    assert(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo), "fetchLatestRelease: repo invalide");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
            headers: { Accept: "application/vnd.github+json", "User-Agent": "erprojects-updater" },
            signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`GitHub API: HTTP ${res.status}`);
        const data = (await res.json()) as { tag_name?: string; body?: string; html_url?: string; published_at?: string };
        const latest = (data.tag_name ?? "").trim();
        if (latest.length === 0) throw new Error("Aucune release publiée");
        return {
            enabled: true,
            current,
            latest,
            available: isNewer(latest, current),
            changelog: (data.body ?? "").slice(0, 2000),
            url: data.html_url ?? null,
            publishedAt: data.published_at ?? null,
            error: null,
        };
    } finally {
        clearTimeout(timer);
    }
}

// Check avec cache mémoire 10 min ; force=true pour le bouton "vérifier"
export async function checkUpdate(force: boolean): Promise<UpdateInfo> {
    if (!force && cache !== null && Date.now() - cache.at < CACHE_MS) return cache.info;
    const current = getLocalVersion();
    const repo = (await getConfigValue(CONFIG_KEYS.UPDATE_REPO))[0]?.trim() ?? "";
    let info: UpdateInfo;
    if (repo.length === 0) {
        info = emptyInfo(current, false);
    } else {
        try {
            info = await fetchLatestRelease(repo, current);
        } catch (err) {
            info = emptyInfo(current, true, err instanceof Error ? err.message : "Erreur réseau");
        }
    }
    cache = { at: Date.now(), info };
    return info;
}

// Notifie les admins d'une mise à jour dispo, une seule fois par version (anti-spam)
export async function notifyAdminsOnce(info: UpdateInfo): Promise<void> {
    if (!info.available || info.latest === null) return;
    const prisma = getPrisma();
    const already = await prisma.notification.findFirst({
        where: { type: "update", title: { contains: info.latest } },
        take: 1,
    });
    if (already !== null) return;
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    if (admins.length === 0) return;
    await notifyMany(
        admins.map((a) => a.id),
        {
            type: "update",
            title: `Mise à jour disponible : ${info.latest}`,
            message: `Version locale ${info.current}. Procédure dans Réglages -> À propos.`,
            link: "/settings/about",
        },
    );
}

export interface RepoInfo {
    configured: string;
    ok: boolean;
    fullName: string | null;
    description: string | null;
    defaultBranch: string | null;
    private: boolean;
    url: string | null;
    error: string | null;
}

let repoCache: { at: number; info: RepoInfo } | null = null;

function emptyRepoInfo(configured: string, error: string | null = null): RepoInfo {
    return { configured, ok: false, fullName: null, description: null, defaultBranch: null, private: false, url: null, error };
}

// Vérifie que le dépôt configuré existe et est accessible (API GitHub /repos/:repo)
export async function getRepoInfo(force: boolean): Promise<RepoInfo> {
    if (!force && repoCache !== null && Date.now() - repoCache.at < CACHE_MS) return repoCache.info;
    const repo = (await getConfigValue(CONFIG_KEYS.UPDATE_REPO))[0]?.trim() ?? "";
    let info: RepoInfo;
    if (repo.length === 0) {
        info = emptyRepoInfo("");
    } else if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
        info = emptyRepoInfo(repo, "Format invalide (attendu: owner/repo)");
    } else {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
            try {
                const res = await fetch(`https://api.github.com/repos/${repo}`, {
                    headers: { Accept: "application/vnd.github+json", "User-Agent": "erprojects-updater" },
                    signal: ctrl.signal,
                });
                if (res.status === 404) throw new Error("Dépôt introuvable (404)");
                if (!res.ok) throw new Error(`GitHub API: HTTP ${res.status}`);
                const data = (await res.json()) as { full_name?: string; description?: string | null; default_branch?: string; private?: boolean; html_url?: string };
                info = {
                    configured: repo,
                    ok: true,
                    fullName: data.full_name ?? repo,
                    description: data.description ?? null,
                    defaultBranch: data.default_branch ?? null,
                    private: data.private ?? false,
                    url: data.html_url ?? null,
                    error: null,
                };
            } finally {
                clearTimeout(timer);
            }
        } catch (err) {
            info = emptyRepoInfo(repo, err instanceof Error ? err.message : "Erreur réseau");
        }
    }
    repoCache = { at: Date.now(), info };
    return info;
}

// Appelé au boot (background) et par la route de check manuel ; retourne l'info checkée
export async function checkAndNotify(force: boolean): Promise<UpdateInfo> {
    try {
        const info = await checkUpdate(force);
        await notifyAdminsOnce(info);
        return info;
    } catch (err) {
        console.error("[UPDATE] check failed:", err instanceof Error ? err.message : String(err));
        return emptyInfo(getLocalVersion(), true, err instanceof Error ? err.message : String(err));
    }
}
