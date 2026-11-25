// Routes Stock - CRUD articles + mouvements + export
import { Router, Request, Response } from "express";
import { z } from "zod";
import {
    createStockItem, getStockItemById, listStockItems, updateStockItem,
    deleteStockItem, createMovement, listMovements, getLowStockItems, getStockValue,
    getAvailabilityMap, getStockItemDetails, setStockItemImage, clearStockItemImage,
} from "../services/stockService";
import multer from "multer";
import { config } from "../config";
import { validateBody, validateQuery } from "../middleware/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireModule } from "../middleware/modules";
import { stockItemCreateSchema, stockItemUpdateSchema, movementCreateSchema } from "../types/schemas";
import { requireDefined, boundedForEach } from "../utils/power10";
import { MovementType } from "@prisma/client";

export const stockRouter = Router();

const querySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    lowStock: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
});

stockRouter.use(requireAuth);
stockRouter.use(requireModule("stock"));

stockRouter.get("/", validateQuery(querySchema), async (req: Request, res: Response) => {
    const q = req.query as Record<string, string | undefined>;
    const items = await listStockItems({
        search: q.search,
        category: q.category,
        location: q.location,
        lowStock: q.lowStock === "true",
        limit: q.limit ? parseInt(q.limit, 10) : undefined,
        offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
    res.json({ success: true, data: items });
});

stockRouter.get("/low-stock", async (_req: Request, res: Response) => {
    const items = await getLowStockItems();
    res.json({ success: true, data: items });
});

stockRouter.get("/value", async (_req: Request, res: Response) => {
    const value = await getStockValue();
    res.json({ success: true, data: { totalValue: value } });
});

// Disponibilité de tous les articles à une date (pris sur un projet = indisponible,
// sauf si rentré (RETURN) avant la fin du jalon) — doit rester avant /:id
const availabilityQuerySchema = z.object({ date: z.string().optional() });

stockRouter.get("/availability", validateQuery(availabilityQuerySchema), async (req: Request, res: Response) => {
    const q = req.query as { date?: string };
    const at = q.date !== undefined ? new Date(q.date) : new Date();
    const entries = await getAvailabilityMap(at);
    res.json({ success: true, data: entries });
});

// Export CSV
stockRouter.get("/export/csv", async (_req: Request, res: Response) => {
    const items = await listStockItems({ limit: 10000 });
    const header = "id;name;reference;quantity;unit;category;supplier;purchasePrice;location;minThreshold\n";
    const rows: string[] = [];
    boundedForEach(items, (item) => {
        rows.push(
            `${item.id};"${item.name}";"${item.reference}";${item.quantity};${item.unit};"${item.category}";"${item.supplier}";${item.purchasePrice ?? ""};"${item.location}";${item.minThreshold}`
        );
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=stock_export.csv");
    res.send(header + rows.join("\n"));
});

// Export JSON
stockRouter.get("/export/json", async (_req: Request, res: Response) => {
    const items = await listStockItems({ limit: 10000 });
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=stock_export.json");
    res.send(JSON.stringify(items, null, 2));
});

stockRouter.post("/", requireRole("EDITOR"), validateBody(stockItemCreateSchema), async (req: Request, res: Response) => {
    const body = req.body as {
        name: string; reference: string; quantity: number; unit: string;
        category: string; supplier: string; purchasePrice?: number | null;
        location: string; minThreshold: number;
    };
    const item = await createStockItem({
        name: body.name, reference: body.reference, quantity: body.quantity,
        unit: body.unit, category: body.category, supplier: body.supplier,
        purchasePrice: body.purchasePrice ?? null, location: body.location,
        minThreshold: body.minThreshold,
    });
    res.status(201).json({ success: true, data: item });
});

stockRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const item = await getStockItemById(id);
    if (item === null) {
        res.status(404).json({ success: false, error: "Article non trouvé" });
        return;
    }
    res.json({ success: true, data: item });
});

// Détail article : mouvements, réservations (projets/jalons), dispo actuelle
stockRouter.get("/:id/details", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const details = await getStockItemDetails(id);
    if (details === null) {
        res.status(404).json({ success: false, error: "Article non trouvé" });
        return;
    }
    res.json({ success: true, data: details });
});

// Photo de l'article (upload image)
const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: Math.min(config.maxUploadSize, 10 * 1024 * 1024), files: 1 },
});

stockRouter.post("/:id/image", requireRole("EDITOR"), imageUpload.single("image"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const file = req.file;
    if (file === undefined) {
        res.status(400).json({ success: false, error: "Image manquante" });
        return;
    }
    const rel = await setStockItemImage(id, file.buffer, file.mimetype);
    res.status(201).json({ success: true, data: { imagePath: rel } });
});

stockRouter.delete("/:id/image", requireRole("EDITOR"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    await clearStockItemImage(id);
    res.json({ success: true, data: { message: "Photo supprimée" } });
});

stockRouter.patch("/:id", requireRole("EDITOR"), validateBody(stockItemUpdateSchema), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const item = await updateStockItem(id, req.body as Record<string, unknown>);
    res.json({ success: true, data: item });
});

stockRouter.delete("/:id", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    await deleteStockItem(id);
    res.json({ success: true, data: { message: "Article supprimé" } });
});

// Mouvements
const movementQuerySchema = z.object({
    stockItemId: z.string().optional(),
    projectId: z.string().optional(),
    limit: z.string().optional(),
});

stockRouter.get("/movements/list", validateQuery(movementQuerySchema), async (req: Request, res: Response) => {
    const q = req.query as { stockItemId?: string; projectId?: string; limit?: string };
    const movements = await listMovements(
        q.stockItemId ? parseInt(q.stockItemId, 10) : undefined,
        q.projectId ? parseInt(q.projectId, 10) : undefined,
        q.limit ? parseInt(q.limit, 10) : 100
    );
    res.json({ success: true, data: movements });
});

stockRouter.post("/movements", requireRole("EDITOR"), validateBody(movementCreateSchema), async (req: Request, res: Response) => {
    const user = requireDefined(req.authUser, "authUser");
    const body = req.body as {
        stockItemId: string; projectId?: string | null;
        type: MovementType; quantity: number; reason: string;
    };
    const movement = await createMovement({
        stockItemId: body.stockItemId,
        projectId: body.projectId ?? null,
        userId: user.id,
        type: body.type,
        quantity: body.quantity,
        reason: body.reason,
    });
    res.status(201).json({ success: true, data: movement });
});
