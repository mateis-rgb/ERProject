import { FiBell } from "react-icons/fi";
// Cloche de notifications (Power of 10 R4)
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import NotifDropdown from "./NotifDropdown";

export default function NotificationBell(): JSX.Element {
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { notifications, markRead, markAllRead, removeNotif, clearAll } = useNotifications();

    useEffect(() => {
        const onClick = (e: MouseEvent): void => {
            if (ref.current !== null && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const goTo = (link: string | null, id: string): void => {
        markRead(id);
        setOpen(false);
        if (link !== null) navigate(link);
    };

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button className="btn-ghost" onClick={() => setOpen(!open)} aria-label="Notifications"
                style={{
                    position: "relative", width: "40px", height: "40px", padding: 0,
                    boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                <FiBell style={{ width: "18px", height: "18px" }} />
                {unreadCount > 0 && (
                    <span className="mono" style={{
                        position: "absolute", top: "-8px", right: "-8px",
                        background: "var(--danger)", color: "#fff", border: "2px solid var(--ink)",
                        fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px",
                    }}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>
            {open && <NotifDropdown notifications={notifications} unreadCount={unreadCount} onMarkAll={markAllRead}
                onClearAll={() => void clearAll()} onDismiss={(id) => void removeNotif(id)} onGo={goTo} />}
        </div>
    );
}
