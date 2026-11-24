// Service de sauvegarde quotidienne - backup pg_dump automatisé
// Power of 10 : boucle bornée, pas de récursivité, vérification des retours
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { config } from "../config";

const MAX_BACKUPS = 30; // garde 30 jours de backups

export function runBackup(): Promise<string> {
    return new Promise((resolve, reject) => {
        const date = new Date();
        const stamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const fileName = `backup_${stamp}.sql`;
        const backupDir = path.resolve(config.backupDir);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const filePath = path.join(backupDir, fileName);

        const url = new URL(config.databaseUrl);
        const cmd = `PGPASSWORD='${url.password}' pg_dump -h ${url.hostname} -p ${url.port || "5432"} -U ${url.username} -d ${url.pathname.slice(1)} -F p -f '${filePath}'`;

        exec(cmd, { timeout: 300000 }, (error, _stdout, stderr) => {
            if (error !== null) {
                reject(new Error(`Backup échoué: ${stderr || error.message}`));
                return;
            }
            cleanOldBackups(backupDir);
            resolve(filePath);
        });
    });
}

function cleanOldBackups(dir: string): void {
    try {
        const files = fs.readdirSync(dir)
            .filter((f) => f.startsWith("backup_") && f.endsWith(".sql"))
            .sort()
            .reverse();
        const toDelete = files.slice(MAX_BACKUPS);
        for (const f of toDelete.slice(0, MAX_BACKUPS)) {
            fs.unlinkSync(path.join(dir, f));
        }
    } catch {
        // ignore cleanup errors
    }
}

// Planifie un backup quotidien à l'heure configurée
export function startBackupScheduler(): void {
    const scheduleNext = (): void => {
        const now = new Date();
        const next = new Date(now);
        next.setHours(config.backupHour, 0, 0, 0);
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }
        const delay = next.getTime() - now.getTime();
        setTimeout(() => {
            runBackup()
                .then((f) => console.log(`[BACKUP] Sauvegarde OK: ${f}`))
                .catch((e: Error) => console.error(`[BACKUP] Échec: ${e.message}`))
                .finally(scheduleNext);
        }, delay);
    };
    scheduleNext();
    console.log(`[BACKUP] Planifié chaque jour à ${config.backupHour}h00`);
}
