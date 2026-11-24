// Service chemin de stockage des fichiers (drive) - config storage_path, vide = défaut UPLOAD_DIR (Power of 10)
import fs from "fs";
import path from "path";
import { config } from "../config";
import { getConfigValue, CONFIG_KEYS } from "./configService";
import { assert } from "../utils/power10";

let currentDir: string | null = null;

export function getDefaultStorageDir(): string {
    return path.resolve(config.uploadDir);
}

function applyDir(dir: string): string {
    assert(dir.length > 0, "applyDir: empty dir");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    currentDir = dir;
    return dir;
}

// Résout le chemin depuis la config (appelé au boot et après chaque PUT storage_path)
export async function resolveStorageDir(): Promise<string> {
    const values = await getConfigValue(CONFIG_KEYS.STORAGE_PATH);
    const configured = (values[0] ?? "").trim();
    return applyDir(configured.length > 0 ? path.resolve(configured) : getDefaultStorageDir());
}

// Chemin effectif (synchrone, utilisé par multer et le static /uploads)
export function getStorageDir(): string {
    return currentDir ?? applyDir(getDefaultStorageDir());
}

export interface MigrateResult {
    moved: number;
    failed: number;
    skipped: boolean; // cible identique à la source
}

const MAX_MIGRATE_FILES = 100000; // borne dure (R2)

// Liste récursive itérative bornée des fichiers relatifs à root
function listFilesBounded(root: string): string[] {
    const out: string[] = [];
    const stack: string[] = [root];
    while (stack.length > 0 && out.length < MAX_MIGRATE_FILES) {
        const cur = stack.pop() as string;
        let entries: fs.Dirent[] = [];
        try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
        for (const e of entries) {
            const full = path.join(cur, e.name);
            if (e.isDirectory()) stack.push(full);
            else if (e.isFile()) out.push(path.relative(root, full));
        }
    }
    return out;
}

// Copie tout le contenu de l'ancien dossier vers `to` ; si 100% OK et dossiers non imbriqués, supprime l'ancien
// shortcut: fs.rmSync pour le nettoyage (lib standard), la copie reste itérative et bornée
export async function migrateStorage(to: string, onProgress: (pct: number) => void): Promise<MigrateResult> {
    const from = getStorageDir();
    const target = path.resolve(to);
    assert(target.length > 1 && target !== path.parse(target).root, "migrateStorage: invalid target");
    if (target === from) return { moved: 0, failed: 0, skipped: true };
    const files = listFilesBounded(from);
    let moved = 0;
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
        const rel = files[i] as string;
        if ((i + 1) % 10 === 0 || i + 1 === files.length) onProgress(Math.floor(((i + 1) / files.length) * 100));
        try {
            const dest = path.join(target, rel);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(path.join(from, rel), dest);
            moved++;
        } catch { failed++; }
    }
    onProgress(100);
    const nested = target.startsWith(from + path.sep) || from.startsWith(target + path.sep);
    if (failed === 0 && !nested) {
        try { fs.rmSync(from, { recursive: true, force: true }); } catch { /* ignore */ }
    }
    return { moved, failed, skipped: false };
}
