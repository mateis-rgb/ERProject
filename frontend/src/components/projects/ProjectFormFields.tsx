// Champs du formulaire de réglages projet (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import type { ProjectFormState } from "./ProjectSettingsTab";
import BrutalSelect from "../ui/BrutalSelect";

interface Props {
    form: ProjectFormState;
    statuses: string[];
    types: string[];
    canEdit: boolean;
    onChange: (k: keyof ProjectFormState, v: string) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
    return (
        <div>
            <label className="label">{label}</label>
            {children}
        </div>
    );
}

// La valeur courante est toujours proposée même si absente de la liste (édition, chargement async)
function withCurrent(value: string, options: string[]): string[] {
    return value !== "" && !options.includes(value) ? [value, ...options] : options;
}

export default function ProjectFormFields({ form, statuses, types, canEdit, onChange }: Props): JSX.Element {
    const { t } = useTranslation();
    const dis = !canEdit;
    const statusOpts = withCurrent(form.status, statuses);
    const typeOpts = withCurrent(form.type, types);
    return (
        <>
            <Field label={t("project.name")}>
                <input className="input" value={form.name} disabled={dis}
                    onChange={(e) => onChange("name", e.target.value)} />
            </Field>
            <Field label={t("project.description")}>
                <textarea className="input" rows={3} value={form.description} disabled={dis}
                    onChange={(e) => onChange("description", e.target.value)} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label={t("project.status")}>
                    <BrutalSelect value={form.status} disabled={dis} width="100%" minWidth="100%"
                        onChange={(v) => onChange("status", v)}
                        options={statusOpts.map((s) => ({ value: s, label: s }))} />
                </Field>
                <Field label={t("project.type")}>
                    <BrutalSelect value={form.type} disabled={dis} width="100%" minWidth="100%"
                        onChange={(v) => onChange("type", v)}
                        options={[{ value: "", label: "—" }, ...typeOpts.map((x) => ({ value: x, label: x }))]} />
                </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label={t("project.client")}>
                    <input className="input" value={form.client} disabled={dis}
                        onChange={(e) => onChange("client", e.target.value)} />
                </Field>
                <Field label={t("project.budget")}>
                    <input className="input" type="number" min="0" step="0.01" value={form.budget} disabled={dis}
                        onChange={(e) => onChange("budget", e.target.value)} />
                </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label={t("project.startDate")}>
                    <input className="input" type="date" value={form.startDate} disabled={dis}
                        onChange={(e) => onChange("startDate", e.target.value)} />
                </Field>
                <Field label={t("project.endDate")}>
                    <input className="input" type="date" value={form.endDate} disabled={dis}
                        onChange={(e) => onChange("endDate", e.target.value)} />
                </Field>
            </div>
            <Field label={t("project.tags")}>
                <input className="input" value={form.tags} disabled={dis} placeholder={t("project.tagsPlaceholder")}
                    onChange={(e) => onChange("tags", e.target.value)} />
            </Field>
        </>
    );
}
