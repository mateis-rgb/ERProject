// En-tête du projet - statut, métadonnées, chips quantifiables (modale détail), export PDF (Power of 10 R4)
import { useEffect, useState } from "react";
import { FiLock, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n/I18nContext";
import { Milestone, Project, ProjectCollaborator } from "../../types";
import ProjectMetaChips from "./ProjectMetaChips";
import ProjectMetaModal, { MetaKind } from "./ProjectMetaModal";
import ProjectExport from "./ProjectExport";
import { ProgressBar } from "../ui/ProgressBar";
import BrutalSelect from "../ui/BrutalSelect";
import { computeProgress } from "../../utils/progress";
import { useModules } from "../../context/ModulesContext";
import ConfirmModal from "../ui/ConfirmModal";

interface Props {
    project: Project;
    milestones: Milestone[];
    canEdit: boolean;
    onUpdated: () => void;
    collapsed: boolean; // détail replié : seule la première ligne reste visible
    onToggleCollapse: () => void;
}

const STATUSES = ["En étude", "En cours", "Terminé", "Archivé", "Annulé"];

const STATUS_COLORS: Record<string, string> = {
    "En étude": "var(--accent)",
    "En cours": "var(--green)",
    "Terminé": "var(--accent)",
    "Archivé": "var(--muted)",
    "Annulé": "var(--danger)",
};

export default function ProjectHeader(props: Props): JSX.Element {
    const { project, milestones, canEdit, onUpdated, collapsed, onToggleCollapse } = props;
    const { t } = useTranslation();
    const { enabled } = useModules();
    const exportEnabled = enabled("export_pdf");
    const [status, setStatus] = useState(project.status);
    const [metaKind, setMetaKind] = useState<MetaKind | null>(null);
    const [collaborators, setCollaborators] = useState<ProjectCollaborator[] | null>(null);

    useEffect(() => {
        if (metaKind === "collaborators" && collaborators === null) {
            api.get<ProjectCollaborator[]>(`/api/projects/${project.id}/collaborators`)
                .then((r) => { if (r.success) setCollaborators(r.data); });
        }
    }, [metaKind, collaborators, project.id]);

    const [pendingStatus, setPendingStatus] = useState<string | null>(null);

    const changeStatus = async (newStatus: string): Promise<void> => {
        setPendingStatus(null);
        setStatus(newStatus);
        await api.patch(`/api/projects/${project.id}`, { status: newStatus });
        onUpdated();
    };

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <HeaderInfo project={project} status={status} milestones={milestones} onOpenMeta={setMetaKind} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    {canEdit && (
                        <BrutalSelect value={status} onChange={setPendingStatus} width="auto" minWidth="140px"
                            options={STATUSES.map((s) => ({ value: s, label: s }))} />
                    )}
                    {exportEnabled && <ProjectExport projectId={project.id} />}
                </div>
            </div>
            {metaKind !== null && (
                <ProjectMetaModal kind={metaKind} project={project} collaborators={collaborators}
                    milestones={milestones} onClose={() => setMetaKind(null)} />
            )}
            {pendingStatus !== null && pendingStatus !== status && (
                <ConfirmModal title={t("modals.changeStatusTitle")}
                    message={`${project.name} - ${pendingStatus}`}
                    onConfirm={() => void changeStatus(pendingStatus)} onCancel={() => setPendingStatus(null)} />
            )}
        </div>
    );
}

function HeaderInfo({ project, status, milestones, onOpenMeta, collapsed, onToggleCollapse }: { project: Project; status: string; milestones: Milestone[]; onOpenMeta: (k: MetaKind) => void; collapsed: boolean; onToggleCollapse: () => void }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span role="button" onClick={onToggleCollapse}
                    title={collapsed ? t("project.expandDetail") : t("project.collapseDetail")}
                    style={{ display: "flex", alignItems: "center", flexShrink: 0, cursor: "pointer", padding: "0 2px", color: "var(--ink)" }}>
                    {collapsed ? <FiChevronRight size={18} /> : <FiChevronDown size={18} />}
                </span>
                <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0 }}>{project.name}</h1>
                <span className="badge" style={{ backgroundColor: STATUS_COLORS[status] ?? "var(--muted)" }}>
                    {status}
                </span>
                {project.encrypted && (
                    <span className="badge" title={t("project.encryptedBadge")}
                        style={{ color: "var(--accent)", borderColor: "var(--accent)", background: "transparent" }}>
                        <span className="ic"><FiLock /> {t("project.encryptedBadge")}</span>
                    </span>
                )}
            </div>
            {!collapsed && (
                <>
                    <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>{project.description || "Aucune description"}</p>
                    <div style={{ marginTop: "0.6rem" }}>
                        <ProgressBar value={computeProgress(project.startDate, project.endDate, milestones.map((m) => m.endDate))} width={140} />
                    </div>
                    <ProjectMetaChips project={project} milestonesCount={milestones.length} onOpen={onOpenMeta} />
                </>
            )}
        </div>
    );
}
