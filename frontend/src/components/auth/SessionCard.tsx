// Card sessions - infos user + révoquer + déconnexion, boutons même taille (Power of 10 R4)
import { useState } from "react";
import { useAuth } from "../../context/AppContext";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n/I18nContext";
import ConfirmModal from "../ui/ConfirmModal";
import { AuthUser } from "../../types";

interface Props {
    user: AuthUser;
    onRevoked: () => void;
}

export default function SessionCard({ user, onRevoked }: Props): JSX.Element {
    const { logout } = useAuth();
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const { t } = useTranslation();

    const revokeAll = async (): Promise<void> => {
        setConfirming(false);
        setBusy(true);
        const res = await api.post("/api/auth/revoke-all", {});
        setBusy(false);
        if (res.success) onRevoked();
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                Sessions
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem",
                border: "2px solid var(--ink)", padding: "0.6rem 0.75rem", background: "var(--surface-2)", boxShadow: "3px 3px 0 var(--ink)" }}>
                <div style={{
                    width: "40px", height: "40px", background: "var(--accent)", border: "2px solid var(--ink)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-ink)",
                }}>
                    {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>{user.name}</div>
                    <div className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{user.email}</div>
                    <div className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase" }}>
                        Rôle : {user.role}
                    </div>
                </div>
            </div>
            <p className="label">Sessions actives</p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
                Révoque tous les refresh tokens de ton compte (déconnecte les autres appareils).
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => setConfirming(true)} disabled={busy}>
                    {busy ? "..." : "Révoquer les autres sessions"}
                </button>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={logout}>
                    Me déconnecter
                </button>
            </div>
            {confirming && (
                <ConfirmModal danger title={t("modals.revokeTitle")} message={t("modals.revokeMsg")}
                    busy={busy} onConfirm={() => void revokeAll()} onCancel={() => setConfirming(false)} />
            )}
        </div>
    );
}
