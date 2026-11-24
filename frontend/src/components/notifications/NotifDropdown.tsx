// Dropdown des notifications (Power of 10 R4)
import { AppNotification } from "../../context/NotificationContext";
import NotifItem from "./NotifItem";

interface Props {
    notifications: AppNotification[];
    unreadCount: number;
    onMarkAll: () => void;
    onClearAll: () => void;
    onDismiss: (id: string) => void;
    onGo: (link: string | null, id: string) => void;
}

export default function NotifDropdown({ notifications, unreadCount, onMarkAll, onClearAll, onDismiss, onGo }: Props): JSX.Element {
    return (
        <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)", width: "340px",
            background: "var(--surface)", border: "3px solid var(--ink)", boxShadow: "8px 8px 0 var(--ink)",
            maxHeight: "400px", overflow: "auto", zIndex: 200,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0.85rem", borderBottom: "2px solid var(--ink)", background: "var(--surface-2)" }}>
                <strong style={{ textTransform: "uppercase", fontSize: "0.8rem" }}>Notifications</strong>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                    {notifications.length > 0 && (
                        <button className="btn-ghost" title="Tout supprimer" style={{ padding: "0.2rem 0.5rem", fontSize: "0.68rem", boxShadow: "2px 2px 0 var(--ink)" }}
                            onClick={onClearAll}>
                            Tout supprimer
                        </button>
                    )}
                    {unreadCount > 0 && (
                        <button className="btn-ghost" style={{ padding: "0.2rem 0.5rem", fontSize: "0.68rem", boxShadow: "2px 2px 0 var(--ink)" }}
                            onClick={onMarkAll}>
                            Tout lire
                        </button>
                    )}
                </div>
            </div>
            {notifications.length === 0 ? (
                <p style={{ padding: "1.25rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                    Aucune notification
                </p>
            ) : (
                notifications.slice(0, 30).map((n) => (
                    <NotifItem key={n.id} notif={n} onClick={() => onGo(n.link, n.id)} onDismiss={onDismiss} />
                ))
            )}
        </div>
    );
}
