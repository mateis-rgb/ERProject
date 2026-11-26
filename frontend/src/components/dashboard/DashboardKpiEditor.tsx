// Modale d'édition des KPI du dashboard - ajouter/retirer via recherche autocomplétée (Power of 10 R4)
import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import Modal from "../ui/Modal";
import { KPI_CATALOG, KpiDef } from "./kpiCatalog";

interface Props {
    kpiIds: string[];
    onClose: () => void;
    onSaved: (ids: string[]) => void;
}

function ShownChips(props: { draft: string[]; onRemove: (id: string) => void }): JSX.Element {
    const { draft, onRemove } = props;
    const { t } = useTranslation();
    if (draft.length === 0) {
        return <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{t("dashboard.kpiNoneShown")}</span>;
    }
    return (
        <>
            {draft.map((id) => {
                const def = KPI_CATALOG.find((k) => k.id === id);
                if (def === undefined) return null;
                return (
                    <span key={id} className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "var(--surface-2)" }}>
                        <span className="ic" style={{ color: def.accent }}>{def.icon}</span>
                        {t(def.labelKey)}
                        <button type="button" className="btn-ghost" style={{ padding: "0 2px" }} title={t("dashboard.kpiRemove")}
                            onClick={() => onRemove(id)}><FiX size={13} /></button>
                    </span>
                );
            })}
        </>
    );
}

function KpiSearch(props: { query: string; onQuery: (q: string) => void; suggestions: KpiDef[]; onAdd: (id: string) => void }): JSX.Element {
    const { query, onQuery, suggestions, onAdd } = props;
    const { t } = useTranslation();
    const open = query.trim() !== "";
    return (
        <div>
            <label className="label" htmlFor="kpi-search">{t("dashboard.kpiSearchLabel")}</label>
            <input id="kpi-search" className="input" value={query} onChange={(e) => onQuery(e.target.value)}
                placeholder={t("dashboard.kpiSearchPlaceholder")} autoComplete="off" />
            {open && (
                <div style={{ marginTop: "0.4rem", border: "2px solid var(--ink)", background: "var(--surface-2)" }}>
                    {suggestions.length === 0 && (
                        <div style={{ padding: "0.5rem 0.75rem", color: "var(--muted)", fontSize: "0.85rem" }}>{t("dashboard.kpiEmpty")}</div>
                    )}
                    {suggestions.map((s) => (
                        <button key={s.id} type="button" onClick={() => onAdd(s.id)} className="kpi-suggest"
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <span className="ic" style={{ color: s.accent }}>{s.icon}</span>
                            {t(s.labelKey)}
                            <FiPlus size={14} style={{ marginLeft: "auto", flexShrink: 0 }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DashboardKpiEditor(props: Props): JSX.Element {
    const { kpiIds, onClose, onSaved } = props;
    const { t } = useTranslation();
    const [draft, setDraft] = useState<string[]>(kpiIds);
    const [query, setQuery] = useState("");
    const [saving, setSaving] = useState(false);

    const add = (id: string): void => {
        if (!draft.includes(id)) setDraft([...draft, id]);
        setQuery("");
    };
    const remove = (id: string): void => setDraft(draft.filter((x) => x !== id));

    const q = query.trim().toLowerCase();
    const suggestions = KPI_CATALOG
        .filter((k) => !draft.includes(k.id))
        .filter((k) => q === "" || t(k.labelKey).toLowerCase().includes(q) || k.id.toLowerCase().includes(q))
        .slice(0, 6);

    const save = async (): Promise<void> => {
        setSaving(true);
        const r = await api.put<{ kpiIds: string[] }>("/api/dashboard/prefs", { kpiIds: draft });
        setSaving(false);
        if (r.success) { onSaved(r.data.kpiIds); onClose(); }
    };

    return (
        <Modal title={t("dashboard.kpiEditorTitle")} onClose={onClose} maxWidth="620px">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                    <div className="label">{t("dashboard.kpiShown")}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        <ShownChips draft={draft} onRemove={remove} />
                    </div>
                </div>
                <KpiSearch query={query} onQuery={setQuery} suggestions={suggestions} onAdd={add} />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button className="btn" onClick={onClose}>{t("common.cancel")}</button>
                    <button className="btn" disabled={saving} onClick={() => void save()}>{t("common.save")}</button>
                </div>
            </div>
        </Modal>
    );
}
