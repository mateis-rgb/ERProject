// ERProjects Backend - Point d'entrée HTTPS + WebSocket
// Power of 10 : initialisation linéaire, pas de récursivité
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import cors from "cors";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { config } from "./config";
import { requireAuth } from "./middleware/auth";
import { getStorageDir, resolveStorageDir } from "./services/storageService";
import { getPrisma, disconnectPrisma } from "./config/prisma";
import { authRouter } from "./routes/authRoutes";
import { projectRouter } from "./routes/projectRoutes";
import { stockRouter } from "./routes/stockRoutes";
import { miscRouter } from "./routes/miscRoutes";
import { attachmentRouter } from "./routes/attachmentRoutes";
import { adminRouter } from "./routes/adminRoutes";
import { featureRouter } from "./routes/featureRoutes";
import { milestoneRouter } from "./routes/milestoneRoutes";
import { templateRouter } from "./routes/templateRoutes";
import { planningRouter } from "./routes/planningRoutes";
import { commentRouter } from "./routes/commentRoutes";
import { errorHandler, notFoundHandler } from "./middleware/validation";
import { seedDefaultConfigs } from "./services/configService";
import { seedAdmin } from "./utils/seed";
import { startBackupScheduler } from "./services/backupService";
import { startAlertJob } from "./services/alertService";
import { checkAndNotify } from "./services/updateService";
import { log } from "./services/logService";
import { runAutoMigrate } from "./utils/migrate";
import { initSocket } from "./services/socketService";

const app = express();

app.disable("x-powered-by");
// CORS : en prod, uniquement l'origine configurée (CORS_ORIGIN) ou same-origin (false) ; en dev, ouvert (Vite sur 5173)
const corsOrigin = config.corsOrigin ?? (config.nodeEnv === "production" ? false : true);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// --- Session PostgreSQL (courte : 15 min, le refresh token prolonge) ---
const PgSession = connectPgSimple(session);
app.use(
    session({
        store: new PgSession({ conString: config.databaseUrl, createTableIfMissing: true }),
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 15 * 60 * 1000, // 15 min
            httpOnly: true,
            secure: config.https,
            sameSite: "lax",
        },
    })
);

// --- Uploads statiques (dossier résolu dynamiquement depuis la config storage_path) ---
// Protégé par requireAuth + headers anti-XSS (nosniff, CSP sandbox, attachment pour les extensions exécutables)
const DANGEROUS_UPLOAD_EXT = [".html", ".htm", ".svg", ".xml", ".xhtml", ".js", ".mjs", ".css"];
app.use("/uploads", requireAuth, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'");
    if (DANGEROUS_UPLOAD_EXT.includes(path.extname(req.path).toLowerCase())) {
        res.setHeader("Content-Disposition", "attachment");
    }
    express.static(getStorageDir())(req, res, next);
});

// --- Routes API ---
app.use("/api/auth", authRouter);
app.use("/api", featureRouter);
app.use("/api/projects", projectRouter);
app.use("/api/stock", stockRouter);
app.use("/api/attachments", attachmentRouter);
app.use("/api/admin", adminRouter);
app.use("/api", milestoneRouter);
app.use("/api/templates", templateRouter);
app.use("/api", miscRouter);
app.use("/api/planning", planningRouter);
app.use("/api", commentRouter);

// Error handler global : toute erreur (ex: validation métier) -> JSON 400/500, ne fait jamais tomber le process
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[ERROR]", err.message);
    log("error", err.message);
    const status = err.message.startsWith("Assertion failed") || err.message.includes("introuvable") || err.message.includes("invalide") || err.message.includes("Cycle") || err.message.includes("même projet") ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
});
process.on("unhandledRejection", (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[UNHANDLED]", msg);
    log("error", `unhandledRejection: ${msg}`);
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok", https: config.https, timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

// --- Création du serveur HTTP ou HTTPS ---
function createServer(): http.Server | https.Server {
    if (config.https && config.sslKeyPath !== null && config.sslCertPath !== null) {
        const key = fs.readFileSync(config.sslKeyPath);
        const cert = fs.readFileSync(config.sslCertPath);
        return https.createServer({ key, cert }, app);
    }
    return http.createServer(app);
}

async function bootstrap(): Promise<void> {
    runAutoMigrate();
    const prisma = getPrisma();
    await prisma.$connect();
    console.log("[DB] PostgreSQL connecté");
    log("info", "[DB] PostgreSQL connecté");
    await seedDefaultConfigs();
    await resolveStorageDir();
    await seedAdmin();
    startBackupScheduler();
    startAlertJob(); // alertes proactives (jalons J-3/J-1/retard, conflits stock, seuils) toutes les heures
    void checkAndNotify(true); // check de mise à jour au boot (notifie les admins si dispo)

    const server = createServer();
    initSocket(server);
    const proto = config.https ? "https" : "http";
    server.listen(config.port, () => {
        const msg = `[SERVER] ERProjects démarré sur ${proto}://localhost:${config.port} ${config.https ? "🔒" : ""}`;
        console.log(msg);
        log("info", msg);
    });
}

function shutdown(signal: string): void {
    console.log(`\n[SHUTDOWN] ${signal}, arrêt...`);
    disconnectPrisma().then(() => process.exit(0)).catch(() => process.exit(1));
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

bootstrap().catch((err: Error) => {
    console.error("[FATAL]", err.message);
    process.exit(1);
});
