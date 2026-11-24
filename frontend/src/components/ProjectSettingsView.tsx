// Vue de l'onglet réglages projet (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { Project, AuthUser } from "../types";
import ProjectFormFields from "./ProjectFormFields";
import type { ProjectFormState } from "./ProjectSettingsTab";
import CollaboratorPicker from "./CollaboratorPicker";
import QuotaField from "./QuotaField";
import ProjectDangerZone from "./ProjectDangerZone";

interface Props {
    project: Project;
    form: ProjectFormState;
    statuses: string[];
    types: string[];
    users: AuthUser[];
    canEdit: boolean;
    isAdmin: boolean;
    msg: string | null;
    err: string | null;
    onChange: (k: keyof ProjectFormState, v: string) => void;
    onToggleCollab: (uid: string) => void;
    onSave: () => void;
}

export default function ProjectSettingsView(props: Props): JSX.Element {
    const { t } = useTranslation();
    const { project, form, statuses, types, users, canEdit, isAdmin, msg, err, onChange, onToggleCollab, onSave } = props;
    return (
        <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start" }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>{t("project.info")}</h2>
                <ProjectFormFields form={form} statuses={statuses} types={types} canEdit={canEdit} onChange={onChange} />
                {canEdit && (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button className="btn" onClick={onSave}>{t("common.save")}</button>
                        {msg !== null && <span className="mono" style={{ color: "var(--ok, #3ddc68)", fontSize: "0.78rem" }}>{msg}</span>}
                        {err !== null && <span className="mono" style={{ color: "var(--danger)", fontSize: "0.78rem" }}>⚠ {err}</span>}
                    </div>
                )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <CollaboratorPicker users={users} selected={form.collaboratorIds} excludeId={project.createdById} canEdit={canEdit} onToggle={onToggleCollab} />
                {isAdmin && <QuotaField value={form.quotaBytes} canEdit={canEdit} onChange={(v) => onChange("quotaBytes", v)} />}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
                <ProjectDangerZone project={project} canEdit={canEdit} isAdmin={isAdmin} onSaved={onSave} />
            </div>
        </div>
    );
}
