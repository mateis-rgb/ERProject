// Schémas de validation Zod - règle 7 : vérification des paramètres à l'entrée
import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Mot de passe trop court (min 6 caractères)"),
});

export const registerSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Mot de passe trop court (min 6 caractères)"),
    name: z.string().min(1, "Nom requis").max(100),
    role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).optional(),
});

// Accepte datetime ISO complet ou date seule YYYY-MM-DD (input type=date)
export const dateInputSchema = z.union([
    z.string().datetime(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid datetime"),
]);

export const projectCreateSchema = z.object({
    name: z.string().min(1, "Nom requis").max(200),
    description: z.string().max(5000).optional().default(""),
    status: z.string().max(50).optional().default("En étude"),
    startDate: dateInputSchema.optional().nullable(),
    endDate: dateInputSchema.optional().nullable(),
    budget: z.number().nonnegative().optional().nullable(),
    client: z.string().max(200).optional().default(""),
    tags: z.array(z.string().max(50)).max(20).optional().default([]),
    type: z.string().max(100).optional().default(""),
    quotaBytes: z.number().nonnegative().optional().nullable(), // admin only (vérifié côté route)
    collaboratorIds: z.array(z.string().min(1)).max(50).optional().default([]),
    templateId: z.string().min(1).optional().nullable(), // applique un template à la création
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const stockItemCreateSchema = z.object({
    name: z.string().min(1, "Nom requis").max(200),
    reference: z.string().min(1, "Référence requise").max(100),
    quantity: z.number().nonnegative().optional().default(0),
    unit: z.string().max(20).optional().default("pièces"),
    category: z.string().max(100).optional().default(""),
    supplier: z.string().max(200).optional().default(""),
    purchasePrice: z.number().nonnegative().optional().nullable(),
    location: z.string().max(200).optional().default(""),
    minThreshold: z.number().nonnegative().optional().default(0),
});

export const stockItemUpdateSchema = stockItemCreateSchema.partial();

export const movementCreateSchema = z.object({
    stockItemId: z.string().min(1),
    projectId: z.string().min(1).optional().nullable(),
    type: z.enum(["IN", "OUT", "RETURN"]),
    quantity: z.number().positive("La quantité doit être positive"),
    reason: z.string().max(500).optional().default(""),
});

export const projectStockSchema = z.object({
    stockItemId: z.string().min(1),
    allocatedQuantity: z.number().nonnegative().optional().default(0),
    forecastQuantity: z.number().nonnegative().optional().default(0),
    forecastDate: dateInputSchema.optional().nullable(),
    milestoneId: z.string().min(1).optional().nullable(), // null = projet entier, sinon jalon précis
});

export const timeEntrySchema = z.object({
    hours: z.number().positive().max(24, "Max 24h par entrée"),
    description: z.string().max(500).optional().default(""),
    date: z.string().datetime().optional(),
});

export const configUpdateSchema = z.object({
    key: z.string().min(1).max(100),
    values: z.array(z.string().max(200)).max(100),
});

export const attachmentMetaSchema = z.object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().max(100).optional().default(""),
});

// ===== DRIVE =====
export const folderCreateSchema = z.object({
    name: z.string().min(1, "Nom requis").max(200),
    parentId: z.string().min(1).optional().nullable(), // null/absent = racine
});

export const attachmentUpdateSchema = z.object({
    fileName: z.string().min(1).max(255).optional(),
    parentId: z.string().min(1).optional().nullable(), // déplacer dans un dossier (null = racine)
});
