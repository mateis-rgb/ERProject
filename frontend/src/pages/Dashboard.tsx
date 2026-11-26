// Dashboard en bento grid style "régie" - KPI personnalisables par utilisateur (Power of 10 R4)
import { useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { useTranslation } from "../i18n/I18nContext";
import { api } from "../services/api";
import { DashboardKPIs } from "../types";
import BentoCard from "../components/ui/BentoCard";
import DashboardKpiEditor from "../components/dashboard/DashboardKpiEditor";
import KpiDetailModal from "../components/dashboard/KpiDetailModal";
import { ALL_KPI_IDS, KPI_CATALOG, KpiDef } from "../components/dashboard/kpiCatalog";
import { useModules } from "../context/ModulesContext";

function KpiGrid(props: { kpis: DashboardKPIs; kpiIds: string[]; stockEnabled: boolean; onOpen: (id: string) => void }): JSX.Element {
    const { kpis, kpiIds, stockEnabled, onOpen } = props;
    const { t } = useTranslation();
    const defs = kpiIds
        .map((id) => KPI_CATALOG.find((k) => k.id === id))
        .filter((d): d is KpiDef => d !== undefined && (!d.needsStockModule || stockEnabled));
    return (
        <div className="bento">
            {defs.map((d) => (
                <BentoCard key={d.id} value={d.format(kpis)} label={t(d.labelKey)} icon={d.icon} accent={d.accent}
                    warn={d.warn !== undefined ? d.warn(kpis) : false}
                    live={d.live !== undefined ? d.live(kpis) : false}
                    onClick={() => onOpen(d.id)} />
            ))}
        </div>
    );
}

export default function Dashboard(): JSX.Element {
    const { t } = useTranslation();
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [kpiIds, setKpiIds] = useState<string[]>(ALL_KPI_IDS);
    const [editorOpen, setEditorOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { enabled } = useModules();

    useEffect(() => {
        api.get<DashboardKPIs>("/api/dashboard").then((res) => {
            if (res.success) setKpis(res.data);
            else setError(res.error);
        });
        api.get<{ kpiIds: string[] }>("/api/dashboard/prefs").then((res) => {
            if (res.success && res.data.kpiIds.length > 0) setKpiIds(res.data.kpiIds);
        });
    }, []);

    if (error !== null) return <p style={{ color: "var(--tally)" }}>{error}</p>;
    if (kpis === null) return <p className="mono" style={{ color: "var(--text-dim)" }}>{t("topbar.loadingSignal")}</p>;

    return (
        <div>
            <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">{t("topbar.live")}</p>
                </div>
                <button className="btn" onClick={() => setEditorOpen(true)}>
                    <span className="ic"><FiEdit2 /> {t("dashboard.editKpis")}</span>
                </button>
            </div>
            <KpiGrid kpis={kpis} kpiIds={kpiIds} stockEnabled={enabled("stock")} onOpen={setDetailId} />
            {editorOpen && (
                <DashboardKpiEditor kpis={kpis} kpiIds={kpiIds} onClose={() => setEditorOpen(false)} onSaved={setKpiIds} />
            )}
            {detailId !== null && (
                <KpiDetailModal kpiId={detailId} kpis={kpis} onClose={() => setDetailId(null)} />
            )}
        </div>
    );
}
