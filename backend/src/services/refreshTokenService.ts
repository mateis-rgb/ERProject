// Service Refresh Token - rotation sécurisée (Power of 10)
// Token = 64 bytes random, stocké hashé SHA-256 en DB
import { createHash, randomBytes } from "crypto";
import { getPrisma } from "../config/prisma";
import { assert } from "../utils/power10";

const REFRESH_TTL_DAYS = 30;

function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): { token: string; hash: string } {
    const token = randomBytes(64).toString("hex");
    return { token, hash: hashToken(token) };
}

export async function issueRefreshToken(userId: string): Promise<string> {
    assert(userId.length > 0, "issueRefreshToken: invalid userId");
    const { token, hash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000);
    const prisma = getPrisma();
    await prisma.refreshToken.create({
        data: { tokenHash: hash, userId, expiresAt },
    });
    return token;
}

export async function rotateRefreshToken(token: string): Promise<string | null> {
    assert(token.length > 0, "rotateRefreshToken: empty token");
    const hash = hashToken(token);
    const prisma = getPrisma();
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (stored === null || stored.revoked || stored.expiresAt < new Date()) {
        return null;
    }
    // Rotation : révoque l'ancien, crée un nouveau
    await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
    });
    await issueRefreshToken(stored.userId);
    return stored.userId;
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
    assert(userId.length > 0, "revokeAllUserTokens: invalid userId");
    const prisma = getPrisma();
    await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
    });
}

export async function cleanupExpiredTokens(): Promise<number> {
    const prisma = getPrisma();
    const result = await prisma.refreshToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }] },
    });
    return result.count;
}
