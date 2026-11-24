// Configuration environnement - chargnée une seule fois au démarrage
import dotenv from "dotenv";

dotenv.config();

interface AppConfig {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    sessionSecret: string;
    sessionMaxAge: number;
    uploadDir: string;
    maxUploadSize: number;
    backupDir: string;
    backupHour: number;
    https: boolean;
    sslKeyPath: string | null;
    sslCertPath: string | null;
    corsOrigin: string | null;
}

const DEFAULT_SESSION_SECRET = "change-this-secret-min-16-chars";

function loadSessionSecret(): string {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 16) {
        throw new Error("SESSION_SECRET must be at least 16 characters");
    }
    if (sessionSecret === DEFAULT_SESSION_SECRET && (process.env.NODE_ENV ?? "development") === "production") {
        throw new Error("SESSION_SECRET par défaut interdit en production : définis une valeur aléatoire (openssl rand -hex 32)");
    }
    return sessionSecret;
}

function loadConfig(): AppConfig {
    const portStr = process.env.PORT ?? "3001";
    const port = parseInt(portStr, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid PORT: ${portStr}`);
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required");
    }

    const sessionSecret = loadSessionSecret();

    const sessionMaxAgeStr = process.env.SESSION_MAX_AGE ?? "86400000";
    const sessionMaxAge = parseInt(sessionMaxAgeStr, 10);
    if (isNaN(sessionMaxAge)) {
        throw new Error(`Invalid SESSION_MAX_AGE: ${sessionMaxAgeStr}`);
    }

    const maxUploadSizeStr = process.env.MAX_UPLOAD_SIZE ?? "52428800";
    const maxUploadSize = parseInt(maxUploadSizeStr, 10);
    if (isNaN(maxUploadSize)) {
        throw new Error(`Invalid MAX_UPLOAD_SIZE: ${maxUploadSizeStr}`);
    }

    const backupHourStr = process.env.BACKUP_HOUR ?? "3";
    const backupHour = parseInt(backupHourStr, 10);
    if (isNaN(backupHour) || backupHour < 0 || backupHour > 23) {
        throw new Error(`Invalid BACKUP_HOUR: ${backupHourStr}`);
    }

    const httpsEnabled = (process.env.HTTPS ?? "false") === "true";
    const sslKeyPath = process.env.SSL_KEY_PATH ?? null;
    const sslCertPath = process.env.SSL_CERT_PATH ?? null;
    if (httpsEnabled && (sslKeyPath === null || sslCertPath === null)) {
        throw new Error("HTTPS=true mais SSL_KEY_PATH / SSL_CERT_PATH manquants");
    }

    return {
        port,
        nodeEnv: process.env.NODE_ENV ?? "development",
        databaseUrl,
        sessionSecret,
        sessionMaxAge,
        uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
        maxUploadSize,
        backupDir: process.env.BACKUP_DIR ?? "./backups",
        backupHour,
        https: httpsEnabled,
        sslKeyPath,
        sslCertPath,
        corsOrigin: process.env.CORS_ORIGIN ?? null,
    };
}

export const config: AppConfig = loadConfig();
