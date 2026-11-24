// Service WebSocket - singleton Socket.io (Power of 10)
// Émet des événements temps réel aux clients connectés
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocket(server: unknown): SocketIOServer {
    if (io === null) {
        io = new SocketIOServer(server as never, {
            cors: { origin: true, credentials: true },
        });
        io.on("connection", (socket) => {
            const userId = (socket.handshake.auth as { userId?: number }).userId;
            if (userId !== undefined) {
                socket.join(`user:${userId}`);
            }
            socket.join("global");
        });
    }
    return io;
}

export function getIO(): SocketIOServer | null {
    return io;
}

// Émet à tous les clients connectés
export function emitGlobal(event: string, payload: unknown): void {
    if (io !== null) io.to("global").emit(event, payload);
}

// Émet à un utilisateur spécifique (ex: notification)
export function emitToUser(userId: string, event: string, payload: unknown): void {
    if (io !== null) io.to(`user:${userId}`).emit(event, payload);
}
