// Formulaire de création de projet - avec choix d'un modèle (template) optionnel (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useEffect, useState, FormEvent } from "react";
import { api } from "../../services/api";
import { Project, ProjectTemplate } from "../../types";
import { useModules } from "../../context/ModulesContext";
import BrutalSelect from "../ui/BrutalSelect";
import BrutalCheckbox from "../ui/BrutalCheckbox";

interface Props {
    onCreated: () => void;
    onError: (msg: string) => void;
}

function useTemplates(on: boolean): ProjectTemplate[] {
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    useEffect(() => {
        if (!on) return;
        api.get<ProjectTemplate[]>("/api/templates").then((r) => { if (r.success) setTemplates(r.data); });
    }, [on]);
    return templates;
}

function buildProjectPayload(p: { name: string; description: string; client: string; type: string; templateId: string; encrypted: boolean }): Record<string, unknown> {
    return {
        name: p.name, description: p.description, client: p.client,
        status: "En étude", tags: [], type: p.type, collaboratorIds: [],
        templateId: p.templateId === "" ? null : p.templateId,
        encrypted: p.encrypted,
    };
}

function TemplatePicker({ templates, value, onChange }: { templates: ProjectTemplate[]; value: string; onChange: (v: string) => void }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div>
            <label className="label">{t("project.template")}</label>
            <BrutalSelect value={value} onChange={onChange}
                options={[
                    { value: "", label: t("project.noTemplate") },
                    ...templates.map((tpl) => ({ value: tpl.id, label: tpl.name })),
                ]} />
        </div>
    );
}

function EncryptedField({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div>
            <BrutalCheckbox checked={checked} onChange={onChange} label={t("project.encrypted")} />
            <p style={{ margin: "0 0 0 1.75rem", fontSize: "0.75rem", color: "var(--muted)" }}>{t("project.encryptedHint")}</p>
        </div>
    );
}

export default function ProjectForm({ onCreated, onError }: Props): JSX.Element {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [client, setClient] = useState("");
    const [type, setType] = useState("");
    const [templateId, setTemplateId] = useState("");
    const [encrypted, setEncrypted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [typeOptions, setTypeOptions] = useState<string[]>([]);
    const { enabled } = useModules();
    const templatesOn = enabled("templates");
    const templates = useTemplates(templatesOn);

    // Liste des types rechargée à chaque ouverture de la modale (cache frais, relié à settings/listes)
    useEffect(() => {
        api.get<Record<string, string[]>>("/api/config").then((r) => {
            if (r.success) setTypeOptions(r.data["project_types"] ?? []);
        });
    }, []);

    const handleSubmit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        const res = await api.post<Project>("/api/projects", buildProjectPayload({ name, description, client, type, templateId, encrypted }));
        setBusy(false);
        if (!res.success) { onError(res.error); return; }
        setName(""); setDescription(""); setClient(""); setType(""); setTemplateId(""); setEncrypted(false);
        onCreated();
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label className="label">{t("project.name")}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="span2">
                <label className="label">{t("project.description")}</label>
                <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
                <label className="label">{t("project.client")}</label>
                <input className="input" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div>
                <label className="label">{t("settings.lists.projectTypes")}</label>
                <BrutalSelect value={type} onChange={setType}
                    options={[{ value: "", label: "—" }, ...typeOptions.map((o) => ({ value: o, label: o }))]} />
            </div>
            {templatesOn && <TemplatePicker templates={templates} value={templateId} onChange={setTemplateId} />}
            <EncryptedField checked={encrypted} onChange={setEncrypted} />
            <button className="btn" type="submit" disabled={busy}>{busy ? t("common.creating") : t("projects.createProject")}</button>
        </form>
    );
}
