// Modale d'édition des KPI du dashboard - tuiles réorganisables (haut/bas) + recherche autocomplétée (Power of 10 R4)
import { useState } from "react";
import { FiArrowDown, FiArrowUp, FiPlus, FiX } from "react-icons/fi";
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import { DashboardKPIs } from "../../types";
import Modal from "../ui/Modal";
import { KPI_CATALOG, KpiDef } from "./kpiCatalog";

interface Props {
    kpis: DashboardKPIs;
    kpiIds: string[];
    onClose: () => void;
    onSaved: (ids: string[]) => void;
}

// échange deux positions dans la liste (borné, R2/R7)
function moveItem(list: string[], id: string, dir: -1 | 1): string[] {
    const i = list.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return list;
    const out = [...list];
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) return list;
    out[i] = b;
    out[j] = a;
    return out;
}

function KpiTile(props: { def: KpiDef; kpis: DashboardKPIs; first: boolean; last: boolean; onUp: () => void; onDown: () => void; onRemove: () => void }): JSX.Element {
    const { def, kpis, first, last, onUp, onDown, onRemove } = props;
    const { t } = useTranslation();
    return (
        <div className="kpi-tile">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4rem" }}>
                <span className="ic" style={{ color: def.accent, fontSize: "1.1rem" }}>{def.icon}</span>
                <div style={{ display: "flex", gap: "2px" }}>
                    <button type="button" className="btn-ghost kpi-tile-btn" disabled={first} onClick={onUp} title={t("dashboard.kpiMoveUp")}><FiArrowUp size={12} /></button>
                    <button type="button" className="btn-ghost kpi-tile-btn" disabled={last} onClick={onDown} title={t("dashboard.kpiMoveDown")}><FiArrowDown size={12} /></button>
                    <button type="button" className="btn-ghost kpi-tile-btn" onClick={onRemove} title={t("dashboard.kpiRemove")}><FiX size={12} /></button>
                </div>
            </div>
            <div className="bento-value" style={{ fontSize: "1.35rem", color: def.warn !== undefined && def.warn(kpis) ? "var(--amber)" : "var(--text)" }}>
                {def.format(kpis)}
            </div>
            <div className="bento-label">{t(def.labelKey)}</div>
        </div>
    );
}

function ShownTiles(props: { draft: string[]; kpis: DashboardKPIs; onMove: (id: string, dir: -1 | 1) => void; onRemove: (id: string) => void }): JSX.Element {
    const { draft, kpis, onMove, onRemove } = props;
    const { t } = useTranslation();
    if (draft.length === 0) {
        return <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>{t("dashboard.kpiNoneShown")}</p>;
    }
    return (
        <div className="kpi-tile-grid">
            {draft.map((id, i) => {
                const def = KPI_CATALOG.find((k) => k.id === id);
                if (def === undefined) return null;
                return (
                    <KpiTile key={id} def={def} kpis={kpis}
                        first={i === 0} last={i === draft.length - 1}
                        onUp={() => onMove(id, -1)} onDown={() => onMove(id, 1)} onRemove={() => onRemove(id)} />
                );
            })}
        </div>
    );
}

function KpiSearch(props: { query: string; onQuery: (q: string) => void; suggestions: KpiDef[]; onAdd: (id: string) => void }): JSX.Element {
    const { query, onQuery, suggestions, onAdd } = props;
    const { t } = useTranslation();
    const [focused, setFocused] = useState(false);
    const open = focused; // dès le focus : on voit les KPI disponibles même champ vide
    return (
        <div>
            <label className="label" htmlFor="kpi-search">{t("dashboard.kpiSearchLabel")}</label>
            <div style={{ position: "relative" }}>
                <input id="kpi-search" className="input" value={query} onChange={(e) => onQuery(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    placeholder={t("dashboard.kpiSearchPlaceholder")} autoComplete="off" />
                {open && (
                <div className="kpi-suggest-box" style={{ position: "absolute", left: 0, right: 0, bottom: "calc(100% + 6px)", zIndex: 20 }}>
                    {suggestions.length === 0 && (
                        <div style={{ padding: "0.5rem 0.75rem", color: "var(--muted)", fontSize: "0.85rem" }}>{t("dashboard.kpiEmpty")}</div>
                    )}
                    {suggestions.map((s) => (
                        <button key={s.id} type="button" onMouseDown={(e) => { e.preventDefault(); onAdd(s.id); }} className="kpi-suggest"
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
        </div>
    );
}

export default function DashboardKpiEditor(props: Props): JSX.Element {
    const { kpis, kpiIds, onClose, onSaved } = props;
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
        <Modal title={t("dashboard.kpiEditorTitle")} onClose={onClose} maxWidth="680px">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>{t("dashboard.kpiEditorHint")}</p>
                <div>
                    <div className="label">{t("dashboard.kpiShown")}</div>
                    <ShownTiles draft={draft} kpis={kpis} onMove={(id, dir) => setDraft((d) => moveItem(d, id, dir))} onRemove={remove} />
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
