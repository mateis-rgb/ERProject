// Service d'authentification - Power of 10 : fonctions courtes, assertions
import bcrypt from "bcryptjs";
import { getPrisma } from "../config/prisma";
import { assert, requireDefined } from "../utils/power10";
import { AuthUser } from "../types";
import { UserRole } from "@prisma/client";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
    assert(password.length >= 6, "hashPassword: password too short");
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    assert(password.length > 0, "verifyPassword: empty password");
    assert(hash.length > 0, "verifyPassword: empty hash");
    const result = await bcrypt.compare(password, hash);
    return result;
}

function toAuthUser(user: { id: string; email: string; name: string; role: UserRole }): AuthUser {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function registerUser(
    email: string,
    password: string,
    name: string,
    role: UserRole = "VIEWER"
): Promise<AuthUser> {
    assert(email.includes("@"), "registerUser: invalid email");
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing !== null) {
        throw new Error("Un utilisateur avec cet email existe déjà");
    }
    const hash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { email, passwordHash: hash, name, role },
    });
    return toAuthUser(user);
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    assert(email.includes("@"), "authenticateUser: invalid email");
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user === null) {
        return null;
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
        return null;
    }
    return toAuthUser(user);
}

export async function getUserById(id: string): Promise<AuthUser | null> {
    assert(id.length > 0, "getUserById: invalid id");
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id } });
    if (user === null) {
        return null;
    }
    return toAuthUser(user);
}

export async function listUsers(): Promise<AuthUser[]> {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true },
        orderBy: { name: "asc" },
        take: 100,
    });
    return users.map(toAuthUser);
}

export async function updateUserRole(userId: string, role: UserRole): Promise<AuthUser> {
    assert(userId.length > 0, "updateUserRole: invalid id");
    const prisma = getPrisma();
    const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
    });
    return requireDefined(toAuthUser(user), "updated user");
}

export async function deleteUser(userId: string, currentUserId: string): Promise<void> {
    assert(userId.length > 0, "deleteUser: invalid id");
    assert(userId !== currentUserId, "deleteUser: cannot delete yourself");
    const prisma = getPrisma();
    await prisma.user.delete({ where: { id: userId } });
}

// Mise à jour du profil perso (nom et/ou mot de passe)
export async function updateProfile(
    userId: string,
    name: string | null,
    currentPassword: string | null,
    newPassword: string | null
): Promise<AuthUser> {
    assert(userId.length > 0, "updateProfile: invalid id");
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user === null) throw new Error("Utilisateur introuvable");

    const data: { name?: string; passwordHash?: string } = {};
    if (name !== null && name.trim().length > 0) {
        data.name = name.trim().slice(0, 100);
    }
    if (newPassword !== null && newPassword.length > 0) {
        assert(newPassword.length >= 6, "updateProfile: new password min 6 chars");
        assert(currentPassword !== null, "updateProfile: current password required");
        const valid = await verifyPassword(currentPassword, user.passwordHash);
        if (!valid) throw new Error("Mot de passe actuel incorrect");
        data.passwordHash = await hashPassword(newPassword);
    }
    const updated = await prisma.user.update({ where: { id: userId }, data });
    return toAuthUser(updated);
}

export async function updateUser(
    userId: string,
    name: string,
    email: string
): Promise<AuthUser> {
    assert(userId.length > 0, "updateUser: invalid id");
    assert(name.length > 0, "updateUser: name required");
    assert(email.includes("@"), "updateUser: invalid email");
    const prisma = getPrisma();
    const user = await prisma.user.update({
        where: { id: userId },
        data: { name, email },
    });
    return requireDefined(toAuthUser(user), "updated user");
}
