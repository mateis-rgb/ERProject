import { FiAlertTriangle } from "react-icons/fi";
// Zone danger des réglages projet - archiver / supprimer avec modales de confirmation (Power of 10 R4)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n/I18nContext";
import { Project } from "../../types";
import ConfirmModal from "../ui/ConfirmModal";

interface Props {
    project: Project;
    canEdit: boolean;
    isAdmin: boolean;
    onSaved: () => void;
}

export default function ProjectDangerZone({ project, canEdit, isAdmin, onSaved }: Props): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [modal, setModal] = useState<"archive" | "delete" | null>(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const confirm = (): void => {
        if (modal === null) return;
        setBusy(true);
        setErr(null);
        if (modal === "archive") {
            void api.patch(`/api/projects/${project.id}`, { status: "Archivé" }).then((r) => {
                setBusy(false);
                if (r.success) { setModal(null); onSaved(); } else setErr(r.error);
            });
            return;
        }
        void api.delete(`/api/projects/${project.id}`).then((r) => {
            setBusy(false);
            if (r.success) { navigate("/projects"); return; }
            setErr(r.error);
        });
    };

    return (
        <div className="card" style={{ marginTop: "1.25rem", borderColor: "var(--danger)" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", color: "var(--danger)" }}>
                {t("project.dangerZone")}
            </h2>
            <p style={{ margin: "0 0 0.9rem", color: "var(--muted)", fontSize: "0.85rem" }}>{t("project.dangerHint")}</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {canEdit && project.status !== "Archivé" && (
                    <button className="btn-ghost" onClick={() => setModal("archive")}>{t("project.archive")}</button>
                )}
                {isAdmin && (
                    <button className="btn-danger" onClick={() => setModal("delete")}>{t("project.delete")}</button>
                )}
            </div>
            {err !== null && <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "0.6rem" }}><span className="ic"><FiAlertTriangle /> {err}</span></p>}
            {modal !== null && (
                <ConfirmModal
                    title={modal === "delete" ? t("project.deleteTitle") : t("project.archiveTitle")}
                    message={modal === "delete"
                        ? `${t("project.deleteMsg")} « ${project.name} » ?`
                        : `${t("project.archiveMsg")} « ${project.name} » ?`}
                    danger={modal === "delete"} busy={busy}
                    confirmLabel={modal === "delete" ? t("project.delete") : t("project.archive")}
                    onConfirm={confirm} onCancel={() => setModal(null)} />
            )}
        </div>
    );
}
