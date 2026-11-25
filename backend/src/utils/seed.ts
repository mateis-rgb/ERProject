// Seed - crée un utilisateur admin par défaut si aucun utilisateur n'existe
import { getPrisma } from "../config/prisma";
import { hashPassword } from "../services/authService";
import { config } from "../config";

const DEFAULT_ADMIN_PASSWORD = "admin123456";

export async function seedAdmin(): Promise<void> {
 const prisma = getPrisma();
 const count = await prisma.user.count();
 if (count > 0) {
 console.log("[SEED] Des utilisateurs existent déjà, seed ignoré");
 return;
 }
 const email = process.env.ADMIN_EMAIL ?? "admin@entrepot.local";
 const envPassword = process.env.ADMIN_PASSWORD;
 if (config.nodeEnv === "production" && (envPassword === undefined || envPassword === DEFAULT_ADMIN_PASSWORD)) {
 throw new Error("[SEED] ADMIN_PASSWORD obligatoire en production (pas de mot de passe par défaut)");
 }
 const password = envPassword ?? DEFAULT_ADMIN_PASSWORD;
 const hash = await hashPassword(password);
 await prisma.user.create({
 data: {
 email,
 passwordHash: hash,
 name: "Administrateur",
 role: "ADMIN",
 },
 });
 // ne jamais logger le mot de passe (même par défaut) : fuite dans les logs
 console.log(`[SEED] Admin créé: ${email}`);
 if (config.nodeEnv !== "production") {
 console.log("[SEED] Change ce mot de passe après la première connexion !");
 }
}
