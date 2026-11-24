// Rangée de "chips" de l'en-tête projet - collaborateurs, tags, jalons (🚩) + deadline (📅) (Power of 10 R4)
import { Project } from "../types";
import { useTranslation } from "../i18n/I18nContext";
import { useModules } from "../context/ModulesContext";
import { MetaKind } from "./ProjectMetaModal";

interface Props {
    project: Project;
    milestonesCount: number;
    onOpen: (k: MetaKind) => void;
}

interface Chip { kind: MetaKind; icon: string; count: number; labelKey: string }

export default function ProjectMetaChips(props: Props): JSX.Element {
    const { project, milestonesCount, onOpen } = props;
    const { t } = useTranslation();
    const { enabled } = useModules();
    const chips: Chip[] = [
        { kind: "collaborators", icon: "👥", count: project.collaboratorIds.length, labelKey: "projectHeader.meta.collaborators" },
        { kind: "tags", icon: "🏷️", count: project.tags.length, labelKey: "projectHeader.meta.tags" },
        ...(enabled("gantt") ? [{ kind: "milestones" as MetaKind, icon: "🚩", count: milestonesCount, labelKey: "projectHeader.meta.milestones" }] : []),
    ];
    const deadline = project.endDate !== null ? new Date(project.endDate).toLocaleDateString("fr-FR") : "—";
    return (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem", flexWrap: "wrap", alignItems: "center" }}>
            {chips.map((c) => (
                <button key={c.kind} className="btn-ghost" title={t(c.labelKey)}
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    onClick={() => onOpen(c.kind)}>
                    <span>{c.icon}</span>
                    <span className="mono" style={{ fontWeight: 700 }}>{c.count}</span>
                </button>
            ))}
            <span title={t("projectHeader.meta.deadline")}
                style={{
                    border: "var(--border-w) solid var(--ink)", background: "var(--surface)",
                    boxShadow: "var(--shadow-btn)", padding: "0.25rem 0.6rem", fontSize: "0.78rem",
                    display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700,
                }}>
                <span>📅</span>
                <span className="mono">{deadline}</span>
            </span>
        </div>
    );
}
