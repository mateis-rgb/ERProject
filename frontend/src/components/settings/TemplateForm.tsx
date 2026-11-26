import { FiX } from "react-icons/fi";
// Formulaire d'édition d'un modèle de projet (nom, jalons préfaits, arborescence, collaborateurs) (Power of 10 R4)
import { useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import { AuthUser, ProjectTemplate, TemplateMilestone } from "../../types";

interface Props {
    initial: ProjectTemplate | null;
    users: AuthUser[];
    onSave: (t: Omit<ProjectTemplate, "id" | "createdAt" | "updatedAt">) => void;
    onCancel: () => void;
}

const COLORS = ["#ffd600", "#ff4d4d", "#4d9fff", "#3ddc68", "#b967ff", "#ff8c1a"];

function MilestoneRow({ m, index, onChange, onRemove }: {
    m: TemplateMilestone; index: number;
    onChange: (i: number, m: TemplateMilestone) => void; onRemove: (i: number) => void;
}): JSX.Element {
    const { t } = useTranslation();
    const set = (k: keyof TemplateMilestone, v: string | number): void => {
        onChange(index, { ...m, [k]: v } as TemplateMilestone);
    };
    return (
        <div style={{ border: "2px solid var(--ink)", padding: "0.5rem", marginBottom: "0.4rem" }}>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div>
                    <label className="label">{t("gantt.color")}</label>
                    <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                        <input className="input" style={{ width: "80px", padding: "0.3rem 0.5rem" }} value={m.color} onChange={(e) => set("color", e.target.value)} />
                        {COLORS.map((c) => (
                            <button key={c} type="button" onClick={() => set("color", c)}
                                style={{ width: "18px", height: "18px", background: c, border: m.color === c ? "3px solid var(--ink)" : "2px solid var(--ink)", cursor: "pointer", padding: 0 }} />
                        ))}
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: "140px" }}>
                    <label className="label">{t("templates.milestoneName")}</label>
                    <input className="input" style={{ width: "100%", padding: "0.3rem 0.5rem" }}
                        value={m.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                    <label className="label" title={t("templates.offsetStart")}>{t("templates.offsetShort")}</label>
                    <input className="input" type="number" style={{ width: "70px", padding: "0.3rem 0.5rem" }} title={t("templates.offsetStart")}
                        value={m.offsetStartDays} onChange={(e) => set("offsetStartDays", parseInt(e.target.value, 10) || 0)} />
                </div>
                <div>
                    <label className="label">{t("templates.duration")}</label>
                    <input className="input" type="number" min="1" style={{ width: "70px", padding: "0.3rem 0.5rem" }}
                        value={m.durationDays} onChange={(e) => set("durationDays", parseInt(e.target.value, 10) || 1)} />
                </div>
                <button type="button" className="btn-danger" style={{ padding: "0.2rem 0.45rem", boxShadow: "2px 2px 0 var(--danger)" }} onClick={() => onRemove(index)}><FiX /></button>
            </div>
        </div>
    );
}

function MilestonesEditor({ milestones, onChange, onRemove, onAdd }: {
    milestones: TemplateMilestone[];
    onChange: (i: number, m: TemplateMilestone) => void;
    onRemove: (i: number) => void;
    onAdd: () => void;
}): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{ marginBottom: "0.9rem" }}>
            <label className="label">{t("templates.milestones")} (J+ offset / durée en jours)</label>
            {milestones.map((m, i) => (
                <MilestoneRow key={i} m={m} index={i} onChange={onChange} onRemove={onRemove} />
            ))}
            <button type="button" className="btn-ghost" onClick={onAdd}>+ {t("templates.addMilestone")}</button>
        </div>
    );
}

function CollabPicker({ users, selected, onToggle }: {
    users: AuthUser[]; selected: string[]; onToggle: (uid: string) => void;
}): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{ marginBottom: "1.1rem" }}>
            <label className="label">{t("templates.collaborators")}</label>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {users.map((u) => (
                    <button key={u.id} type="button" className={selected.includes(u.id) ? "btn" : "btn-ghost"}
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }} onClick={() => onToggle(u.id)}>
                        {u.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function TemplateForm({ initial, users, onSave, onCancel }: Props): JSX.Element {
    const { t } = useTranslation();
    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [milestones, setMilestones] = useState<TemplateMilestone[]>(initial?.milestones ?? []);
    const [foldersText, setFoldersText] = useState((initial?.folders ?? []).join("\n"));
    const [collabIds, setCollabIds] = useState<string[]>(initial?.collaboratorIds ?? []);

    const setMilestone = (i: number, m: TemplateMilestone): void =>
        setMilestones((list) => list.map((x, j) => (j === i ? m : x)));
    const removeMilestone = (i: number): void => setMilestones((list) => list.filter((_, j) => j !== i));
    const addMilestone = (): void =>
        setMilestones((list) => [...list, { name: "", description: "", offsetStartDays: 0, durationDays: 1, color: "#ffd600" }]);
    const toggleCollab = (uid: string): void =>
        setCollabIds((list) => (list.includes(uid) ? list.filter((x) => x !== uid) : [...list, uid]));

    const submit = (): void => {
        onSave({
            name: name.trim(), description,
            milestones: milestones.filter((m) => m.name.trim() !== ""),
            folders: foldersText.split("\n").map((s) => s.trim()).filter((s) => s !== ""),
            collaboratorIds: collabIds,
        });
    };

    return (
        <div className="form-grid">
            <h2 className="span2" style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>
                {initial === null ? t("templates.new") : t("templates.edit")}
            </h2>
            <div style={{ marginBottom: "0.6rem" }}>
                <label className="label">{t("templates.name")}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="span2" style={{ marginBottom: "0.9rem" }}>
                <label className="label">{t("templates.description")}</label>
                <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="span2"><MilestonesEditor milestones={milestones} onChange={setMilestone} onRemove={removeMilestone} onAdd={addMilestone} /></div>
            <div className="span2" style={{ marginBottom: "0.9rem" }}>
                <label className="label">{t("templates.folders")} ({t("templates.foldersHint")})</label>
                <textarea className="input mono" value={foldersText} onChange={(e) => setFoldersText(e.target.value)} rows={5}
                    placeholder={"01_Admin\n03_Tournage/Rushes"} style={{ fontSize: "0.78rem" }} />
            </div>
            <div className="span2"><CollabPicker users={users} selected={collabIds} onToggle={toggleCollab} /></div>
            <div className="span2" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={onCancel}>{t("common.cancel")}</button>
                <button className="btn" disabled={name.trim() === ""} onClick={submit}>{t("common.save")}</button>
            </div>
        </div>
    );
}
