// En-tête du projet - statut, métadonnées, chips quantifiables (modale détail), export PDF (Power of 10 R4)
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Milestone, Project, ProjectCollaborator } from "../../types";
import ProjectMetaChips from "./ProjectMetaChips";
import ProjectMetaModal, { MetaKind } from "./ProjectMetaModal";
import ProjectExport from "./ProjectExport";
import { ProgressBar } from "../ui/ProgressBar";
import BrutalSelect from "../ui/BrutalSelect";
import { computeProgress } from "../../utils/progress";
import { useModules } from "../../context/ModulesContext";

interface Props {
    project: Project;
    milestones: Milestone[];
    canEdit: boolean;
    onUpdated: () => void;
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
    const { project, milestones, canEdit, onUpdated } = props;
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

    const changeStatus = async (newStatus: string): Promise<void> => {
        setStatus(newStatus);
        await api.patch(`/api/projects/${project.id}`, { status: newStatus });
        onUpdated();
    };

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0 }}>{project.name}</h1>
                        <span className="badge" style={{ backgroundColor: STATUS_COLORS[status] ?? "var(--muted)" }}>
                            {status}
                        </span>
                    </div>
                    <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>{project.description || "Aucune description"}</p>
                    <div style={{ marginTop: "0.6rem" }}>
                        <ProgressBar value={computeProgress(project.startDate, project.endDate, milestones.map((m) => m.endDate))} width={140} />
                    </div>
                    <ProjectMetaChips project={project} milestonesCount={milestones.length} onOpen={setMetaKind} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    {canEdit && (
                        <BrutalSelect value={status} onChange={(v) => void changeStatus(v)} width="auto" minWidth="140px"
                            options={STATUSES.map((s) => ({ value: s, label: s }))} />
                    )}
                    {exportEnabled && <ProjectExport projectId={project.id} />}
                </div>
            </div>
            {metaKind !== null && (
                <ProjectMetaModal kind={metaKind} project={project} collaborators={collaborators}
                    milestones={milestones} onClose={() => setMetaKind(null)} />
            )}
        </div>
    );
}
