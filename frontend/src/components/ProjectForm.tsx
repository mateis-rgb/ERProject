// Formulaire de création de projet - avec choix d'un modèle (template) optionnel (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useEffect, useState, FormEvent } from "react";
import { api } from "../services/api";
import { Project, ProjectTemplate } from "../types";
import { useModules } from "../context/ModulesContext";

interface Props {
    onCreated: () => void;
    onError: (msg: string) => void;
}

export default function ProjectForm({ onCreated, onError }: Props): JSX.Element {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [client, setClient] = useState("");
    const [templateId, setTemplateId] = useState("");
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [busy, setBusy] = useState(false);
    const { enabled } = useModules();
    const templatesOn = enabled("templates");

    useEffect(() => {
        if (!templatesOn) return;
        api.get<ProjectTemplate[]>("/api/templates").then((r) => { if (r.success) setTemplates(r.data); });
    }, [templatesOn]);

    const handleSubmit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        const res = await api.post<Project>("/api/projects", {
            name, description, client, status: "En étude", tags: [], type: "", collaboratorIds: [],
            templateId: templateId === "" ? null : templateId,
        });
        setBusy(false);
        if (!res.success) { onError(res.error); return; }
        setName(""); setDescription(""); setClient(""); setTemplateId("");
        onCreated();
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
                <label className="label">{t("project.name")}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
                <label className="label">{t("project.description")}</label>
                <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
                <label className="label">{t("project.client")}</label>
                <input className="input" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            {templatesOn && (
                <div>
                    <label className="label">{t("project.template")}</label>
                    <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                        <option value="">{t("project.noTemplate")}</option>
                        {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
                    </select>
                </div>
            )}
            <button className="btn" type="submit" disabled={busy}>{busy ? t("common.creating") : t("projects.createProject")}</button>
        </form>
    );
}
