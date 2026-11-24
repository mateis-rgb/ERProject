// Dashboard en bento grid style "régie" (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { DashboardKPIs } from "../types";
import BentoCard from "../components/BentoCard";
import { useModules } from "../context/ModulesContext";

export default function Dashboard(): JSX.Element {
    const { t } = useTranslation();
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { enabled } = useModules();

    useEffect(() => {
        api.get<DashboardKPIs>("/api/dashboard").then((res) => {
            if (res.success) setKpis(res.data);
            else setError(res.error);
        });
    }, []);

    if (error !== null) return <p style={{ color: "var(--tally)" }}>{error}</p>;
    if (kpis === null) return <p className="mono" style={{ color: "var(--text-dim)" }}>{t("topbar.loadingSignal")}</p>;

    return (
        <div>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">{t("topbar.live")}</p>
            </div>
            <div className="bento">
                <BentoCard value={kpis.totalProjects} label={t("dashboard.kpiProjects")} icon="◫" accent="var(--tally)" />
                <BentoCard value={kpis.activeProjects} label={t("dashboard.kpiActive")} icon="●" accent="var(--green)" live={kpis.activeProjects > 0} />
                <BentoCard value={kpis.milestonesOverdue} label={t("dashboard.kpiOverdue")} icon="✗" accent="var(--danger)" warn={kpis.milestonesOverdue > 0} />
                <BentoCard value={kpis.milestonesUpcoming} label={t("dashboard.kpiUpcoming")} icon="◔" accent="var(--blue)" />
                {enabled("stock") && (
                    <>
                        <BentoCard value={kpis.lowStockItems} label={t("stock.low")} icon="▲" accent="var(--amber)" warn={kpis.lowStockItems > 0} />
                        <BentoCard value={kpis.reservedItems} label={t("dashboard.kpiReserved")} icon="▤" accent="var(--blue)" />
                        <BentoCard value={`${kpis.totalStockValue.toFixed(0)} €`} label={t("dashboard.kpiValue")} icon="¤" accent="var(--green)" />
                    </>
                )}
                <BentoCard value={`${kpis.timeThisMonth}h`} label={t("dashboard.kpiTimeMonth")} icon="◷" accent="var(--violet)" />
            </div>
        </div>
    );
}
