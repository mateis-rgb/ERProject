// Modale de détail d'un KPI du dashboard - liste des entités concernées (Power of 10 R4)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import { DashboardKPIs, KpiDetail } from "../../types";
import Modal from "../ui/Modal";
import { KPI_CATALOG } from "./kpiCatalog";

interface Props {
    kpiId: string;
    kpis: DashboardKPIs;
    onClose: () => void;
}

export default function KpiDetailModal(props: Props): JSX.Element {
    const { kpiId, kpis, onClose } = props;
    const { t } = useTranslation();
    const def = KPI_CATALOG.find((k) => k.id === kpiId);
    const [detail, setDetail] = useState<KpiDetail | null>(null);

    useEffect(() => {
        api.get<KpiDetail>("/api/dashboard/kpi/" + encodeURIComponent(kpiId)).then((r) => {
            if (r.success) setDetail(r.data);
        });
    }, [kpiId]);

    if (def === undefined) return <></>;
    return (
        <Modal title={t(def.labelKey)} onClose={onClose} maxWidth="560px">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span className="ic" style={{ color: def.accent, fontSize: "1.6rem" }}>{def.icon}</span>
                    <span className="bento-value" style={{ fontSize: "2rem", color: def.warn !== undefined && def.warn(kpis) ? "var(--amber)" : "var(--text)" }}>
                        {def.format(kpis)}
                    </span>
                </div>
                <div style={{ maxHeight: "50vh", overflowY: "auto", border: "2px solid var(--ink)" }}>
                    {detail === null && <div style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.85rem" }}>{t("common.loading")}</div>}
                    {detail !== null && detail.items.length === 0 && (
                        <div style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.85rem" }}>{t("dashboard.kpiDetailEmpty")}</div>
                    )}
                    {detail !== null && detail.items.map((it) => (
                        <div key={it.id} style={{ display: "block", padding: "0.55rem 0.75rem", borderBottom: "1px solid var(--ink)", color: "var(--text)" }}>
                            {it.href !== "" ? (
                                <Link to={it.href} onClick={onClose} style={{ color: "var(--ink)", textDecoration: "none", display: "block" }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{it.title}</div>
                                    <div className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{it.subtitle}</div>
                                </Link>
                            ) : (
                                <>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{it.title}</div>
                                    <div className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{it.subtitle}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
