// Tableau des projets (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { Link } from "react-router-dom";
import { Project } from "../types";

const STATUS_COLORS: Record<string, string> = {
    "En étude": "var(--accent)",
    "En cours": "var(--green)",
    "Terminé": "var(--accent)",
    "Archivé": "var(--muted)",
    "Annulé": "var(--danger)",
};

interface Props {
    projects: Project[];
}

export default function ProjectTable({ projects }: Props): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th className="table-header">{t("drive.name")}</th>
                        <th className="table-header">{t("project.client")}</th>
                        <th className="table-header">{t("project.status")}</th>
                        <th className="table-header">{t("project.type")}</th>
                        <th className="table-header">Budget</th>
                        <th className="table-header"></th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((p) => (
                        <tr key={p.id}>
                            <td className="table-cell" style={{ fontWeight: 600 }}>{p.name}</td>
                            <td className="table-cell">{p.client || "—"}</td>
                            <td className="table-cell">
                                <span className="badge" style={{ backgroundColor: STATUS_COLORS[p.status] ?? "var(--surface-2)", color: "white" }}>
                                    {p.status}
                                </span>
                            </td>
                            <td className="table-cell">{p.type || "—"}</td>
                            <td className="table-cell">{p.budget !== null ? `${p.budget} €` : "—"}</td>
                            <td className="table-cell">
                                <Link to={`/projects/${p.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                                    Voir →
                                </Link>
                            </td>
                        </tr>
                    ))}
                    {projects.length === 0 && (
                        <tr><td className="table-cell" colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>Aucun projet</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
