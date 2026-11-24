// Section suivi du temps (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useState } from "react";
import { api } from "../../services/api";
import { TimeEntry } from "../../types";

interface Props {
    projectId: string;
    entries: TimeEntry[];
    totalHours: number;
    onChanged: () => void;
}

export default function TimeSection({ projectId, entries, totalHours, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const [hours, setHours] = useState("1");
    const [desc, setDesc] = useState("");

    const addTime = async (): Promise<void> => {
        const res = await api.post(`/api/projects/${projectId}/time`, {
            hours: parseFloat(hours), description: desc,
        });
        if (res.success) { setHours("1"); setDesc(""); onChanged(); }
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "0.5rem" }}>
                Temps passé — <span style={{ color: "var(--accent)" }}>Total : {totalHours} h</span>
            </h2>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input className="input" type="number" step="0.5" min="0.5" max="24" value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: "70px" }} />
                <input className="input" placeholder={t("project.description")} value={desc} onChange={(e) => setDesc(e.target.value)} />
                <button className="btn" onClick={addTime}>+</button>
            </div>
            {entries.slice(0, 10).map((e) => (
                <div key={e.id} style={{ fontSize: "0.875rem", padding: "0.25rem 0", borderBottom: "1px solid var(--surface-2)" }}>
                    <strong>{e.hours}h</strong> — {e.description || "—"} <span style={{ color: "var(--muted)" }}>({e.userName}, {new Date(e.date).toLocaleDateString("fr-FR")})</span>
                </div>
            ))}
        </div>
    );
}
