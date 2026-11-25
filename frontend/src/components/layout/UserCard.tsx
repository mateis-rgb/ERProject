// Carte utilisateur en bas de sidebar - clic -> réglages/sécurité, mode icône si rétractée (Power of 10 R4)
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { AuthUser } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";

interface Props {
    user: AuthUser;
    collapsed: boolean;
    onLogout: () => void;
}

const AVATAR_STYLE: React.CSSProperties = {
    width: "36px", height: "36px", flexShrink: 0,
    background: "var(--accent)", border: "2px solid var(--ink)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-ink)",
};

export default function UserCard({ user, collapsed, onLogout }: Props): JSX.Element {
    const navigate = useNavigate();
    const { t } = useTranslation();

    if (collapsed) {
        return (
            <div style={{ marginTop: "auto", borderTop: "3px solid var(--ink)", paddingTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <button onClick={() => navigate("/settings/security")} title={t("nav.account")} aria-label={t("nav.account")}
                    className="user-card-btn" style={{ width: "44px", justifyContent: "center", padding: "0.25rem" }}>
                    <div style={AVATAR_STYLE}>{user.name.slice(0, 2).toUpperCase()}</div>
                </button>
                <button className="btn-ghost" onClick={onLogout} title={t("nav.logout")} aria-label={t("nav.logout")}
                    style={{ padding: "0.35rem 0.55rem" }}>
                    <FiLogOut />
                </button>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "auto", borderTop: "3px solid var(--ink)", paddingTop: "1rem" }}>
            <button
                onClick={() => navigate("/settings/security")}
                title={t("nav.account")}
                className="user-card-btn"
            >
                <div style={AVATAR_STYLE}>
                    {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.name}
                    </div>
                    <div className="mono" style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {user.role}
                    </div>
                </div>
            </button>
            <button className="btn-ghost" onClick={onLogout} style={{ width: "100%", marginTop: "0.75rem", fontSize: "0.78rem" }}>
                {t("nav.logout")}
            </button>
        </div>
    );
}
