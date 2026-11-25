// Service Config - listes modifiables (statuts, types, unités, emplacements)
import { getPrisma } from "../config/prisma";
import { assert, safeJsonParse } from "../utils/power10";

export const CONFIG_KEYS = {
    PROJECT_STATUSES: "project_statuses",
    PROJECT_TYPES: "project_types",
    STOCK_UNITS: "stock_units",
    STOCK_LOCATIONS: "stock_locations",
    STOCK_CATEGORIES: "stock_categories",
    ENABLED_MODULES: "enabled_modules",
    STORAGE_PATH: "storage_path",
    UPDATE_REPO: "update_repo",
    MENTION_SCOPE_PROJECT: "mention_scope_project", // "collaborators" | "all"
    MENTION_SCOPE_STOCK: "mention_scope_stock",     // "all" | "none"
} as const;

const DEFAULT_CONFIGS: Record<string, string[]> = {
    [CONFIG_KEYS.PROJECT_STATUSES]: ["En étude", "En cours", "Terminé", "Archivé", "Annulé"],
    [CONFIG_KEYS.PROJECT_TYPES]: ["Clip", "Publicité", "Court-métrage", "Documentaire", "Événementiel", "Autre"],
    [CONFIG_KEYS.STOCK_UNITS]: ["kg", "pièces", "m", "L"],
    [CONFIG_KEYS.STOCK_LOCATIONS]: ["Entrepôt A", "Entrepôt B", "Régie", "Studio"],
    [CONFIG_KEYS.STOCK_CATEGORIES]: ["Matériel caméra", "Éclairage", "Son", "Accessoires", "Consommables", "Autre"],
    [CONFIG_KEYS.ENABLED_MODULES]: ["gantt", "drive", "stock", "notifications", "export_pdf", "templates"],
    [CONFIG_KEYS.STORAGE_PATH]: [""], // vide = emplacement par défaut (UPLOAD_DIR)
    [CONFIG_KEYS.UPDATE_REPO]: [""], // vide = vérification des mises à jour désactivée
    [CONFIG_KEYS.MENTION_SCOPE_PROJECT]: ["collaborators"], // @ réservés aux collaborateurs du projet
    [CONFIG_KEYS.MENTION_SCOPE_STOCK]: ["all"], // @ ouverts à tous sur les articles stock
};

export async function getConfigValue(key: string): Promise<string[]> {
    assert(key.length > 0 && key.length <= 100, "getConfigValue: invalid key");
    const prisma = getPrisma();
    const entry = await prisma.config.findUnique({ where: { key } });
    if (entry === null) {
        return DEFAULT_CONFIGS[key] ?? [];
    }
    return safeJsonParse<string[]>(entry.value, []);
}

export async function setConfigValue(key: string, values: string[]): Promise<void> {
    assert(key.length > 0 && key.length <= 100, "setConfigValue: invalid key");
    assert(values.length <= 100, "setConfigValue: too many values");
    const prisma = getPrisma();
    await prisma.config.upsert({
        where: { key },
        create: { key, value: JSON.stringify(values) },
        update: { value: JSON.stringify(values) },
    });
}

export async function getAllConfigs(): Promise<Record<string, string[]>> {
    const prisma = getPrisma();
    const entries = await prisma.config.findMany({ take: 100 });
    const result: Record<string, string[]> = { ...DEFAULT_CONFIGS };
    for (const entry of entries) {
        result[entry.key] = safeJsonParse<string[]>(entry.value, []);
    }
    return result;
}

export async function seedDefaultConfigs(): Promise<void> {
    const keys = Object.values(CONFIG_KEYS);
    for (const key of keys) {
        const prisma = getPrisma();
        const existing = await prisma.config.findUnique({ where: { key } });
        if (existing === null && DEFAULT_CONFIGS[key] !== undefined) {
            await prisma.config.create({
                data: { key, value: JSON.stringify(DEFAULT_CONFIGS[key]) },
            });
        }
    }
}
