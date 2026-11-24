// Modale de saisie des dates limites du projet (affichée si non définies) (Power of 10 R4)
import { useState } from "react";
import { api } from "../services/api";
import { useTranslation } from "../i18n/I18nContext";

interface Props {
    projectId: string;
    initialStart: string;
    initialEnd: string;
    onSaved: () => void;
    onClose: () => void;
}

export default function ProjectDatesModal({ projectId, initialStart, initialEnd, onSaved, onClose }: Props): JSX.Element {
    const { t } = useTranslation();
    const [start, setStart] = useState(initialStart);
    const [end, setEnd] = useState(initialEnd);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const save = async (): Promise<void> => {
        if (start === "" || end === "") { setErr(t("project.datesRequired")); return; }
        if (new Date(start) > new Date(end)) { setErr(t("project.datesOrder")); return; }
        setBusy(true);
        setErr(null);
        const res = await api.patch(`/api/projects/${projectId}`, { startDate: start, endDate: end });
        setBusy(false);
        if (!res.success) { setErr(res.error); return; }
        onSaved();
    };

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
            }}
            onClick={onClose}
        >
            <div className="card" style={{ width: "100%", maxWidth: "440px", boxShadow: "8px 8px 0 var(--ink)" }}
                onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>
                        {t("project.datesTitle")}
                    </h2>
                    <button className="btn-ghost" style={{ padding: "0.25rem 0.7rem" }} onClick={onClose}>{t("common.close")}</button>
                </div>
                <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 0 }}>
                    {t("project.datesHint")}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", margin: "1rem 0" }}>
                    <div>
                        <label className="label">{t("project.startDate")}</label>
                        <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">{t("project.endDate")}</label>
                        <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                    </div>
                </div>
                {err !== null && <p style={{ color: "var(--danger)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>⚠ {err}</p>}
                <button className="btn" style={{ width: "100%" }} onClick={save} disabled={busy}>
                    {busy ? t("common.saving") : t("common.save")}
                </button>
            </div>
        </div>
    );
}
