// Section suivi du temps (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useState } from "react";
import { api } from "../../services/api";
import Modal from "../ui/Modal";
import { TimeEntry } from "../../types";

interface Props {
    projectId: string;
    entries: TimeEntry[];
    totalHours: number;
    onChanged: () => void;
}

export default function TimeSection({ projectId, entries, totalHours, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [hours, setHours] = useState("1");
    const [desc, setDesc] = useState("");

    const addTime = async (): Promise<void> => {
        const res = await api.post(`/api/projects/${projectId}/time`, {
            hours: parseFloat(hours), description: desc,
        });
        if (res.success) { setHours("1"); setDesc(""); setOpen(false); onChanged(); }
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "0.5rem" }}>
                Temps passé — <span style={{ color: "var(--accent)" }}>Total : {totalHours} h</span>
            </h2>
            <div style={{ marginBottom: "1rem" }}>
                <button className="btn" onClick={() => setOpen(true)}>+ {t("modals.addTimeTitle")}</button>
            </div>
            {open && (
                <Modal title={t("modals.addTimeTitle")} onClose={() => setOpen(false)}>
                    <form onSubmit={(e) => { e.preventDefault(); void addTime(); }}>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            <div style={{ width: "90px" }}>
                                <label className="label">{t("project.timeHours")}</label>
                                <input className="input" type="number" step="0.5" min="0.5" max="24" value={hours} onChange={(e) => setHours(e.target.value)} />
                            </div>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                                <label className="label">{t("project.description")}</label>
                                <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
                            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
                            <button type="submit" className="btn">{t("common.confirm")}</button>
                        </div>
                    </form>
                </Modal>
            )}
            {entries.slice(0, 10).map((e) => (
                <div key={e.id} style={{ fontSize: "0.875rem", padding: "0.25rem 0", borderBottom: "1px solid var(--surface-2)" }}>
                    <strong>{e.hours}h</strong> — {e.description || "—"} <span style={{ color: "var(--muted)" }}>({e.userName}, {new Date(e.date).toLocaleDateString("fr-FR")})</span>
                </div>
            ))}
        </div>
    );
}
