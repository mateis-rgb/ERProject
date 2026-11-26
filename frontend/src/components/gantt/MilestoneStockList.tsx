import { FiX } from "react-icons/fi";
// Liste du stock réservé sur un jalon + formulaire d'ajout (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { MilestoneStockLink, StockItem } from "../../types";
import LinkStockModal from "../stock/LinkStockModal";
import ConfirmModal from "../ui/ConfirmModal";

interface Props {
    milestoneId: string;
    stockItems: StockItem[];
    canEdit: boolean;
    onChanged: () => void;
}

export default function MilestoneStockList({ milestoneId, stockItems, canEdit, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const [links, setLinks] = useState<MilestoneStockLink[]>([]);
    const [linkOpen, setLinkOpen] = useState(false);
    const [pendingRemove, setPendingRemove] = useState<string | null>(null);

    const load = (): void => {
        api.get<MilestoneStockLink[]>(`/api/milestones/${milestoneId}/stock`).then((r) => {
            if (r.success) setLinks(r.data);
        });
    };

    useEffect(load, [milestoneId]);

    const removeStock = async (sid: string): Promise<void> => {
        setPendingRemove(null);
        await api.delete(`/api/milestones/${milestoneId}/stock/${sid}`);
        load();
    };

    return (
        <div>
            <p className="label" style={{ marginTop: "1rem" }}>{t("gantt.reservedStock")}</p>
            {links.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{t("gantt.noReserved")}</p>
            ) : (
                <div style={{ border: "2px solid var(--ink)", marginBottom: "0.75rem" }}>
                    {links.map((l) => (
                        <div key={l.stockItemId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "0.45rem 0.7rem", borderBottom: "1px solid var(--ink)", fontSize: "0.85rem" }}>
                            <span><strong>{l.stockName}</strong> <span className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)" }}>({l.stockReference})</span></span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span className="mono" style={{ fontWeight: 700 }}>{l.quantity}</span>
                                {canEdit && (
                                    <button className="btn-danger" style={{ padding: "0.1rem 0.4rem", boxShadow: "2px 2px 0 var(--danger)" }}
                                        onClick={() => setPendingRemove(l.stockItemId)}><FiX /></button>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {canEdit && (
                <button className="btn" onClick={() => setLinkOpen(true)}>+ {t("modals.addStockLinkTitle")}</button>
            )}
            {linkOpen && (
                <LinkStockModal projectId="" fixedMilestoneId={milestoneId} stockItems={stockItems}
                    onClose={() => setLinkOpen(false)} onSaved={() => { load(); onChanged(); }} />
            )}
            {pendingRemove !== null && (
                <ConfirmModal danger title={t("modals.removeLinkTitle")} message={t("common.irreversible")}
                    onConfirm={() => void removeStock(pendingRemove)} onCancel={() => setPendingRemove(null)} />
            )}
        </div>
    );
}
