// Client Prisma singleton - une seule instance (règle 3 : pas d'allocation dynamique après init)
import { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
    if (prismaInstance === null) {
        prismaInstance = new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
        });
    }
    return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
    if (prismaInstance !== null) {
        await prismaInstance.$disconnect();
        prismaInstance = null;
    }
}
