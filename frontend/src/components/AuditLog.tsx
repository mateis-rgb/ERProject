// Section audit log des actions admin (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { ActivityLog } from "../types";

export default function AuditLog(): JSX.Element {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<ActivityLog[]>([]);

    useEffect(() => {
        api.get<ActivityLog[]>("/api/admin/audit").then((r) => { if (r.success) setLogs(r.data); });
    }, []);

    return (
        <div className="card" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                Journal d'audit admin
            </h2>
            {logs.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{t("access.noAudit")}</p>
            ) : (
                <div style={{ maxHeight: "280px", overflow: "auto", border: "2px solid var(--ink)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th className="table-header">Action</th>
                                <th className="table-header">{t("drive.by")}</th>
                                <th className="table-header">{t("common.details")}</th>
                                <th className="table-header">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((l) => (
                                <tr key={l.id}>
                                    <td className="table-cell mono" style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700 }}>
                                        {l.action}
                                    </td>
                                    <td className="table-cell" style={{ fontSize: "0.85rem" }}>{l.userName}</td>
                                    <td className="table-cell mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                                        {l.details.slice(0, 80)}
                                    </td>
                                    <td className="table-cell mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                                        {new Date(l.timestamp).toLocaleString("fr-FR")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
