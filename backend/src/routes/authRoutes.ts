// Routes d'authentification + rate limiting + refresh token (Power of 10 R4)
import { Router, Request, Response } from "express";
import RateLimit from "express-rate-limit";
import { authenticateUser, registerUser, listUsers, updateUserRole } from "../services/authService";
import { issueRefreshToken, revokeAllUserTokens } from "../services/refreshTokenService";
import { validateBody } from "../middleware/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { loginSchema, registerSchema } from "../types/schemas";
import { z } from "zod";
import { log } from "../services/logService";
import { UserRole } from "@prisma/client";

export const authRouter = Router();

// Rate limiting : 5 tentatives / 15 min sur login et register
const authLimiter = RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Trop de tentatives, réessaie dans 15 min." },
});

function setRefreshCookie(res: Response, token: string): void {
    res.cookie("refresh_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 3600 * 1000,
        path: "/api",
    });
}

authRouter.post("/register", authLimiter, validateBody(registerSchema), async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body as {
        email: string; password: string; name: string; role?: UserRole;
    };
    const user = await registerUser(email, password, name, role ?? "VIEWER");
    req.session.userId = user.id;
    const token = await issueRefreshToken(user.id);
    setRefreshCookie(res, token);
    res.status(201).json({ success: true, data: user });
});

authRouter.post("/login", authLimiter, validateBody(loginSchema), async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await authenticateUser(email, password);
    if (user === null) {
        log("warn", `login échoué: ${email}`);
        res.status(401).json({ success: false, error: "Email ou mot de passe incorrect" });
        return;
    }
    log("info", `login OK: ${user.email} (${user.role})`);
    req.session.userId = user.id;
    const token = await issueRefreshToken(user.id);
    setRefreshCookie(res, token);
    res.json({ success: true, data: user });
});

authRouter.post("/logout", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (userId !== undefined) await revokeAllUserTokens(userId).catch(() => undefined);
    res.clearCookie("refresh_token", { path: "/api" });
    req.session.destroy(() => {
        res.json({ success: true, data: { message: "Déconnecté" } });
    });
});

authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, data: req.authUser });
});

const roleSchema = z.object({ role: z.enum(["ADMIN", "EDITOR", "VIEWER"]) });

authRouter.get("/users", requireAuth, async (_req: Request, res: Response) => {
    const users = await listUsers();
    res.json({ success: true, data: users });
});

authRouter.patch("/users/:id/role", requireAuth, requireRole("ADMIN"), validateBody(roleSchema), async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const { role } = req.body as { role: UserRole };
    const user = await updateUserRole(id, role);
    res.json({ success: true, data: user });
});
