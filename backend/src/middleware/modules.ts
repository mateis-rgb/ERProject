// Middleware : bloque l'accès si le module est désactivé dans la config (Power of 10)
import { Request, Response, NextFunction } from "express";
import { getConfigValue, CONFIG_KEYS } from "../services/configService";

export function requireModule(moduleId: string): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const enabled = await getConfigValue(CONFIG_KEYS.ENABLED_MODULES);
            if (enabled.includes(moduleId)) {
                next();
                return;
            }
            res.status(403).json({ success: false, error: `Module désactivé: ${moduleId}` });
        } catch (err) {
            next(err instanceof Error ? err : new Error(String(err)));
        }
    };
}
