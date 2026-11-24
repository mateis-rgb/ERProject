import { FiFlag, FiFolder, FiUsers } from "react-icons/fi";
// Carte d'un modèle de projet - édition, application à un projet, suppression (Power of 10 R4)
import { useState } from "react";
import { api } from "../services/api";
import { useTranslation } from "../i18n/I18nContext";
import { Project, ProjectTemplate } from "../types";
import ConfirmModal from "./ConfirmModal";

interface Props {
    tpl: ProjectTemplate;
    projects: Project[];
    canEdit: boolean;
    isAdmin: boolean;
    onEdit: (t: ProjectTemplate) => void;
    onChanged: () => void;
}

function ApplyBar({ tpl, projects, onDone }: { tpl: ProjectTemplate; projects: Project[]; onDone: (msg: string) => void }): JSX.Element {
    const { t } = useTranslation();
    const [applyProject, setApplyProject] = useState("");
    return (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <select className="select" style={{ width: "auto" }} value={applyProject} onChange={(e) => setApplyProject(e.target.value)}>
                <option value="">{t("templates.chooseProject")}</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn" style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }} disabled={applyProject === ""}
                onClick={() => {
                    void api.post(`/api/templates/${tpl.id}/apply`, { projectId: applyProject }).then((r) => {
                        onDone(r.success ? t("templates.applied") : r.error);
                    });
                }}>
                {t("templates.applyGo")}
            </button>
        </div>
    );
}

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }): JSX.Element {
    const { t } = useTranslation();
    return (
        <ConfirmModal title={t("templates.deleteTitle")} message={t("templates.deleteMsg")}
            danger onConfirm={onConfirm} onCancel={onCancel} />
    );
}

function CardActions({ canEdit, isAdmin, onEdit, onApply, onDelete }: {
    canEdit: boolean; isAdmin: boolean; onEdit: () => void; onApply: () => void; onDelete: () => void;
}): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {canEdit && (
                <button className="btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }} onClick={onEdit}>{t("templates.edit")}</button>
            )}
            
			<button className="btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }} onClick={onApply}>{t("templates.apply")}</button>

            {isAdmin && (
                <button className="btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", color: "var(--danger)" }} onClick={onDelete}>
                    {t("common.delete")}
                </button>
            )}
        </div>
    );
}

export default function TemplateCard(props: Props): JSX.Element {
    const { tpl, projects, canEdit, isAdmin, onEdit, onChanged } = props;
    const [applyOpen, setApplyOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const doDelete = (): void => {
        void api.delete(`/api/templates/${tpl.id}`).then(() => { setDeleting(false); onChanged(); });
    };

    return (
        <div className="card" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                <div>
                    <strong style={{ fontSize: "1rem" }}>{tpl.name}</strong>
                    <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>{tpl.description}</p>
                    <p className="mono" style={{ margin: "0.4rem 0 0", fontSize: "0.7rem", color: "var(--muted)" }}>
                        <FiFlag /> {tpl.milestones.length} · <FiFolder /> {tpl.folders.length} · <FiUsers /> {tpl.collaboratorIds.length}
                    </p>
                    {msg !== null && <p style={{ color: "var(--green)", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>{msg}</p>}
                </div>
                <CardActions canEdit={canEdit} isAdmin={isAdmin} onEdit={() => onEdit(tpl)}
                    onApply={() => setApplyOpen(!applyOpen)} onDelete={() => setDeleting(true)} />
            </div>
            {applyOpen && <ApplyBar tpl={tpl} projects={projects} onDone={(m) => { setMsg(m); setApplyOpen(false); }} />}
            {deleting && <DeleteModal onCancel={() => setDeleting(false)} onConfirm={doDelete} />}
        </div>
    );
}
