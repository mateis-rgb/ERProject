// Section journal d'activité (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { ActivityLog } from "../types";

interface Props {
    logs: ActivityLog[];
}

export default function ActivitySection({ logs }: Props): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="card">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>{t("activity.title")}</h2>
            {logs.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{t("activity.none")}</p>
            ) : (
                <div style={{ maxHeight: "300px", overflow: "auto" }}>
                    {logs.slice(0, 5).map((l) => (
                        <div key={l.id} style={{ fontSize: "0.8125rem", padding: "0.375rem 0", borderBottom: "1px solid var(--surface-2)" }}>
                            <span style={{ color: "var(--accent)" }}>{l.action}</span>
                            <span style={{ color: "var(--muted)" }}> par {l.userName} — {new Date(l.timestamp).toLocaleString("fr-FR")}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
