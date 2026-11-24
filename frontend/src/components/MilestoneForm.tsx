// Formulaire création/édition de jalon (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState, FormEvent } from "react";
import { api } from "../services/api";
import { Milestone } from "../types";

interface Props {
    projectId: string;
    milestone: Milestone | null;
    milestones: Milestone[]; // pour choisir un jalon parent
    onSaved: () => void;
    onCancel: () => void;
}

const COLORS = ["#ffd600", "#ff6b9d", "#4d9fff", "#3ddc68", "#b967ff", "#ff8c1a"];

function toInputDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function DateFields({ startDate, endDate, onStart, onEnd }: {
    startDate: string; endDate: string;
    onStart: (v: string) => void; onEnd: (v: string) => void;
}): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}>
                <label className="label">{t("project.startDate")}</label>
                <input className="input" type="date" value={startDate} onChange={(e) => onStart(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
                <label className="label">{t("project.endDate")}</label>
                <input className="input" type="date" value={endDate} onChange={(e) => onEnd(e.target.value)} required />
            </div>
        </div>
    );
}

function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }): JSX.Element {
    return (
        <div>
            <label className="label">Couleur</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
                {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => onChange(c)}
                        style={{ width: "32px", height: "32px", background: c, border: "3px solid var(--ink)",
                            boxShadow: color === c ? "3px 3px 0 var(--ink)" : "none", cursor: "pointer" }} />
                ))}
            </div>
        </div>
    );
}

interface FormBody {
    name: string; description: string; startDate: string; endDate: string; color: string; parentId: string | null;
}

async function saveMilestone(
    projectId: string,
    milestone: Milestone | null,
    f: FormBody
): Promise<{ success: boolean; error: string }> {
    const body = {
        name: f.name, description: f.description,
        startDate: new Date(f.startDate).toISOString(),
        endDate: new Date(f.endDate).toISOString(),
        color: f.color,
        parentId: f.parentId,
    };
    const res = milestone === null
        ? await api.post<Milestone>(`/api/projects/${projectId}/milestones`, body)
        : await api.patch<Milestone>(`/api/milestones/${milestone.id}`, body);
    return res.success ? { success: true, error: "" } : { success: false, error: res.error };
}

export default function MilestoneForm({ projectId, milestone, milestones, onSaved, onCancel }: Props): JSX.Element {
    const { t } = useTranslation();
    const [name, setName] = useState(milestone?.name ?? "");
    const [description, setDescription] = useState(milestone?.description ?? "");
    const [startDate, setStartDate] = useState(milestone ? toInputDate(new Date(milestone.startDate)) : "");
    const [endDate, setEndDate] = useState(milestone ? toInputDate(new Date(milestone.endDate)) : "");
    const [color, setColor] = useState(milestone?.color ?? "#ffd600");
    const [parentId, setParentId] = useState<string | null>(milestone?.parentId ?? null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await saveMilestone(projectId, milestone, { name, description, startDate, endDate, color, parentId });
        setBusy(false);
        if (!res.success) { setError(res.error); return; }
        onSaved();
    };

    return (
        <form className="card" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>
                {milestone === null ? "Nouveau jalon" : "Modifier le jalon"}
            </h3>
            {error !== null && <p style={{ color: "var(--danger)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", margin: 0 }}>⚠ {error}</p>}
            <input className="input" placeholder={t("gantt.milestoneNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} required />
            <div>
                <label className="label">{t("gantt.parentMilestone")}</label>
                <select className="select" value={parentId ?? ""} onChange={(e) => setParentId(e.target.value === "" ? null : e.target.value)}>
                    <option value="">{t("gantt.rootMilestone")}</option>
                    {milestones.filter((m) => m.id !== milestone?.id).map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>
            <textarea className="input" placeholder={t("project.description")} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            <DateFields startDate={startDate} endDate={endDate} onStart={setStartDate} onEnd={setEndDate} />
            <ColorPicker color={color} onChange={setColor} />
            <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn" type="submit" disabled={busy}>{busy ? "..." : "Enregistrer"}</button>
                <button className="btn-ghost" type="button" onClick={onCancel}>{t("common.cancel")}</button>
            </div>
        </form>
    );
}
