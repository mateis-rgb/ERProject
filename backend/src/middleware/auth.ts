// Middleware d'authentification par session - Power of 10 : vérification des retours
import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/authService";
import { UserRole } from "@prisma/client";

declare module "express-session" {
    interface SessionData {
        userId?: string;
    }
}

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const userId = req.session.userId;
    if (userId === undefined) {
        res.status(401).json({ success: false, error: "Non authentifié" });
        return;
    }
    const user = await getUserById(userId);
    if (user === null) {
        req.session.destroy(() => undefined);
        res.status(401).json({ success: false, error: "Session invalide" });
        return;
    }
    req.authUser = user;
    next();
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
    VIEWER: 1,
    EDITOR: 2,
    ADMIN: 3,
};

export function requireRole(minRole: UserRole) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.authUser;
        if (user === undefined) {
            res.status(401).json({ success: false, error: "Non authentifié" });
            return;
        }
        if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
            res.status(403).json({ success: false, error: "Permissions insuffisantes" });
            return;
        }
        next();
    };
}
