// Context Notifications + WebSocket temps réel (Power of 10 R4)
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "../services/api";
import { useAuth } from "./AppContext";

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    progress: number | null; // tâche en cours : 0..100
    createdAt: string;
}

interface NotifContextType {
    notifications: AppNotification[];
    unreadCount: number;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    removeNotif: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    refresh: () => Promise<void>;
    socket: Socket | null;
    lastEvent: { name: string; at: number } | null;
}

const NotifContext = createContext<NotifContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lastEvent, setLastEvent] = useState<{ name: string; at: number } | null>(null);

    const refresh = useCallback(async (): Promise<void> => {
        const res = await api.get<{ notifications: AppNotification[]; unreadCount: number }>("/api/notifications");
        if (res.success) {
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        }
    }, []);

    useEffect(() => {
        if (user === null) return;
        refresh();
        const proto = window.location.protocol === "https:" ? "https" : "http";
        // En dev (Vite sur 5173) le backend est sur :3001, sinon même origine (Nginx proxy)
        const target = window.location.port === "5173"
            ? `${proto}://${window.location.hostname}:3001`
            : `${proto}://${window.location.host}`;
        const s = io(target, {
            auth: { userId: user.id },
            transports: ["websocket", "polling"],
        });
        s.on("notification", () => { refresh(); });
        s.onAny((name: string) => { setLastEvent({ name, at: Date.now() }); });
        setSocket(s);
        return () => { s.disconnect(); setSocket(null); };
    }, [user, refresh]);

    const markRead = async (id: string): Promise<void> => {
        await api.post(`/api/notifications/${id}/read`, {});
        refresh();
    };

    const markAllRead = async (): Promise<void> => {
        await api.post("/api/notifications/read-all", {});
        refresh();
    };

    const removeNotif = async (id: string): Promise<void> => {
        if (id.length === 0) return;
        await api.delete(`/api/notifications/${id}`);
        refresh();
    };

    const clearAll = async (): Promise<void> => {
        await api.delete("/api/notifications?all=true");
        refresh();
    };

    return (
        <NotifContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, removeNotif, clearAll, refresh, socket, lastEvent }}>
            {children}
        </NotifContext.Provider>
    );
}

export function useNotifications(): NotifContextType {
    const ctx = useContext(NotifContext);
    if (ctx === null) throw new Error("useNotifications hors provider");
    return ctx;
}
