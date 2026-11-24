// Auto-migration au démarrage - évite l'erreur "table does not exist"
// En dev : prisma db push (pousse le schéma directement)
// En prod : prisma migrate deploy (applique les migrations versionnées)
import { execSync } from "child_process";
import { config } from "../config";

export function runAutoMigrate(): void {
    const cmd = config.nodeEnv === "production"
        ? "npx prisma migrate deploy"
        : "npx prisma db push --skip-generate --accept-data-loss";
    console.log(`[MIGRATE] Exécution: ${cmd}`);
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
    console.log("[MIGRATE] Schéma à jour ✅");
}
