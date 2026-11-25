import { FiAlertTriangle } from "react-icons/fi";
// Page Login néo-brutaliste (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AppContext";
import LoginForm from "../components/auth/LoginForm";

export default function Login(): JSX.Element {
    const { login } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const handleLogin = async (email: string, password: string): Promise<void> => {
        setBusy(true);
        setError(null);
        const err = await login(email, password);
        setBusy(false);
        if (err !== null) { setError(err); return; }
        navigate("/");
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: "1.5rem", padding: "2rem" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem",
                    border: "3px solid var(--ink)", background: "var(--surface)", boxShadow: "8px 8px 0 var(--ink)", padding: "0.75rem 1.5rem" }}>
                    <span className="rec-dot" />
                    <h1 style={{ fontSize: "2.4rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", margin: 0 }}>
                        L’<span style={{ color: "var(--accent)" }}>Entrepôt</span>
                    </h1>
                </div>
                <p className="mono" style={{ marginTop: "1rem", fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    {t("login.tagline")}
                </p>
            </div>
            <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                    {t("login.title")}
                </h2>
                {error !== null && (
                    <p style={{ color: "var(--danger)", border: "2px solid var(--danger)", padding: "0.5rem 0.75rem",
                        fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem", background: "var(--surface-2)" }}>
                        <span className="ic"><FiAlertTriangle /> {error}</span>
                    </p>
                )}
                <LoginForm busy={busy} onSubmit={handleLogin} />
            </div>
        </div>
    );
}
