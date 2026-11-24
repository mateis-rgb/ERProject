// Middleware de validation Zod + gestion d'erreurs - règle 7 : check params & retours
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
                res.status(400).json({ success: false, error: messages.join("; ") });
                return;
            }
            res.status(400).json({ success: false, error: "Données invalides" });
        }
    };
}

export function validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as unknown as Request["query"];
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: err.errors.map((e) => e.message).join("; "),
                });
                return;
            }
            res.status(400).json({ success: false, error: "Paramètres invalides" });
        }
    };
}

// Gestionnaire d'erreurs global - attrape tout, log, répond proprement
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    if (res.headersSent) return;
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === "development" ? err.message : "Erreur interne du serveur",
    });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({ success: false, error: `Route non trouvée: ${req.method} ${req.path}` });
}
