// Page d'erreur générique (404 / 500) - style néo-brutaliste (Power of 10 R4)
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/I18nContext";

interface Props {
    code: number;
    titleKey: string;
    bodyKey: string;
}

export default function ErrorPage({ code, titleKey, bodyKey }: Props): JSX.Element {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: "70vh", gap: "1rem", textAlign: "center",
        }}>
            <div className="card" style={{ maxWidth: "480px", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
                <div className="mono" style={{
                    fontSize: "4rem", fontWeight: 700, lineHeight: 1,
                    border: "3px solid var(--ink)", padding: "0.5rem 1.5rem",
                    background: "var(--danger)", color: "#fff", boxShadow: "6px 6px 0 var(--ink)",
                }}>
                    {code}
                </div>
                <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, textTransform: "uppercase" }}>
                    {t(titleKey)}
                </h1>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>{t(bodyKey)}</p>
                <button className="btn" onClick={() => navigate("/")}>{t("common.backHome")}</button>
            </div>
        </div>
    );
}
