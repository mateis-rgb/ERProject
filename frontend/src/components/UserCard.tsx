// Carte utilisateur en bas de sidebar - clic  réglages/sécurité (Power of 10 R4)
import { useNavigate } from "react-router-dom";
import { AuthUser } from "../types";
import { useTranslation } from "../i18n/I18nContext";

interface Props {
    user: AuthUser;
    onLogout: () => void;
}

export default function UserCard({ user, onLogout }: Props): JSX.Element {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div style={{ marginTop: "auto", borderTop: "3px solid var(--ink)", paddingTop: "1rem" }}>
            <button
                onClick={() => navigate("/settings/security")}
                title={t("nav.account")}
                className="user-card-btn"
            >
                <div style={{
                    width: "36px", height: "36px", flexShrink: 0,
                    background: "var(--accent)", border: "2px solid var(--ink)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-ink)",
                }}>
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
