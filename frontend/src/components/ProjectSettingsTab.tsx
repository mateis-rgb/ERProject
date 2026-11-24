// Onglet Réglages d'un projet - logique (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Project, AuthUser } from "../types";
import ProjectSettingsView from "./ProjectSettingsView";

interface Props {
    project: Project;
    canEdit: boolean;
    isAdmin: boolean;
    onSaved: () => void;
}

export interface ProjectFormState {
    name: string;
    description: string;
    status: string;
    client: string;
    type: string;
    budget: string;
    startDate: string;
    endDate: string;
    tags: string;
    collaboratorIds: string[];
    quotaBytes: string;
}

function toForm(p: Project): ProjectFormState {
    return {
        name: p.name,
        description: p.description,
        status: p.status,
        client: p.client,
        type: p.type,
        budget: p.budget !== null ? String(p.budget) : "",
        startDate: p.startDate !== null ? p.startDate.slice(0, 10) : "",
        endDate: p.endDate !== null ? p.endDate.slice(0, 10) : "",
        tags: p.tags.join(", "),
        collaboratorIds: [...p.collaboratorIds],
        quotaBytes: p.quotaBytes !== null ? String(Math.round(p.quotaBytes)) : "",
    };
}

function buildPayload(form: ProjectFormState): Record<string, unknown> {
    return {
        name: form.name,
        description: form.description,
        status: form.status,
        client: form.client,
        type: form.type,
        budget: form.budget === "" ? null : parseFloat(form.budget),
        startDate: form.startDate === "" ? null : form.startDate,
        endDate: form.endDate === "" ? null : form.endDate,
        tags: form.tags.split(",").map((t) => t.trim()).filter((t) => t !== "").slice(0, 20),
        collaboratorIds: form.collaboratorIds,
        quotaBytes: form.quotaBytes === "" ? null : parseFloat(form.quotaBytes),
    };
}

export default function ProjectSettingsTab({ project, canEdit, isAdmin, onSaved }: Props): JSX.Element {
    const { t } = useTranslation();
    const [form, setForm] = useState<ProjectFormState>(toForm(project));
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        api.get<AuthUser[]>("/api/users").then((r) => { if (r.success) setUsers(r.data); });
        api.get<Record<string, string[]>>("/api/config").then((r) => {
            if (r.success) {
                setStatuses(r.data["project_statuses"] ?? []);
                setTypes(r.data["project_types"] ?? []);
            }
        });
    }, []);

    useEffect(() => setForm(toForm(project)), [project]);

    const set = (k: keyof ProjectFormState, v: string): void => setForm((f) => ({ ...f, [k]: v }));

    const toggleCollab = (uid: string): void => {
        setForm((f) => ({
            ...f,
            collaboratorIds: f.collaboratorIds.includes(uid)
                ? f.collaboratorIds.filter((x) => x !== uid)
                : [...f.collaboratorIds, uid],
        }));
    };

    const save = async (): Promise<void> => {
        setMsg(null);
        setErr(null);
        const res = await api.patch(`/api/projects/${project.id}`, buildPayload(form));
        if (res.success) { setMsg(t("project.saved")); onSaved(); }
        else setErr(res.error);
    };

    return (
        <ProjectSettingsView project={project} form={form} statuses={statuses} types={types} users={users}
            canEdit={canEdit} isAdmin={isAdmin} msg={msg} err={err}
            onChange={set} onToggleCollab={toggleCollab} onSave={save} />
    );
}
