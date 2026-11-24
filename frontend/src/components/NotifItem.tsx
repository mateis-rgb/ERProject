// Item de notification (Power of 10 R4)
import { AppNotification } from "../context/NotificationContext";

const TYPE_COLORS: Record<string, string> = {
    info: "var(--blue)",
    warning: "var(--accent)",
    success: "var(--green)",
    admin: "var(--danger)",
};

interface Props {
    notif: AppNotification;
    onClick: () => void;
    onDismiss: (id: string) => void;
}

export default function NotifItem({ notif, onClick, onDismiss }: Props): JSX.Element {
    return (
        <div onClick={onClick} style={{
            padding: "0.6rem 0.85rem", borderBottom: "1px solid var(--ink)", cursor: "pointer",
            background: notif.read ? "transparent" : "var(--surface-2)", position: "relative",
        }}>
            <button
                className="btn-ghost"
                title="Supprimer"
                onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                style={{
                    position: "absolute", top: "0.4rem", right: "0.4rem", padding: "0 0.35rem",
                    fontSize: "0.7rem", lineHeight: 1.4, boxShadow: "2px 2px 0 var(--ink)",
                }}
            >
                ✕
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingRight: "1.4rem" }}>
                <span style={{ width: "10px", height: "10px", background: TYPE_COLORS[notif.type] ?? "var(--blue)",
                    border: "2px solid var(--ink)", flexShrink: 0 }} />
                <strong style={{ fontSize: "0.82rem" }}>{notif.title}</strong>
            </div>
            {notif.message && <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>{notif.message}</p>}
            {notif.progress !== null && (
                <div style={{ marginTop: "0.35rem", height: "10px", border: "2px solid var(--ink)", background: "var(--surface)" }}>
                    <div style={{ height: "100%", width: `${notif.progress}%`, background: notif.progress >= 100 ? "var(--green)" : "var(--accent)", transition: "width 0.3s ease" }} />
                </div>
            )}
            <span className="mono" style={{ fontSize: "0.62rem", color: "var(--muted)" }}>
                {new Date(notif.createdAt).toLocaleString("fr-FR")}
            </span>
        </div>
    );
}
