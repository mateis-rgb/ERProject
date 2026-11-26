// Tableau des liaisons stock d'un projet, avec affectation projet/jalon (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import { ProjectStockLink, Milestone } from "../../types";
import StockLinkRow from "./StockLinkRow";
import ConfirmModal from "../ui/ConfirmModal";
import { useState } from "react";

interface Props {
    projectId: string;
    links: ProjectStockLink[];
    stockNames: Record<string, string>;
    milestones: Milestone[];
    canEdit: boolean;
    onChanged: () => void;
}

export default function StockLinksTable(props: Props): JSX.Element {
    const { t } = useTranslation();
    const { projectId, links, stockNames, milestones, canEdit, onChanged } = props;
    const [pendingRemove, setPendingRemove] = useState<string | null>(null);
    const [pendingAffect, setPendingAffect] = useState<{ link: ProjectStockLink; milestoneId: string | null } | null>(null);

    const setAffectation = async (l: ProjectStockLink, milestoneId: string | null): Promise<void> => {
        setPendingAffect(null);
        await api.post(`/api/projects/${projectId}/stock`, {
            stockItemId: l.stockItemId,
            allocatedQuantity: l.allocatedQuantity,
            forecastQuantity: l.forecastQuantity,
            forecastDate: l.forecastDate,
            milestoneId,
        });
        onChanged();
    };

    const removeLink = async (sid: string): Promise<void> => {
        setPendingRemove(null);
        await api.delete(`/api/projects/${projectId}/stock/${sid}`);
        onChanged();
    };

    if (links.length === 0) {
        return <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{t("stock.noCommitted")}</p>;
    }

    return (
        <>
        <div style={{ border: "2px solid var(--ink)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th className="table-header">{t("stock.article")}</th>
                        <th className="table-header">{t("stock.allocated")}</th>
                        <th className="table-header">{t("stock.consumed")}</th>
                        <th className="table-header">{t("stock.forecast")}</th>
                        <th className="table-header">{t("stock.affectation")}</th>
                        <th className="table-header"></th>
                    </tr>
                </thead>
                <tbody>
                    {links.map((l) => (
                        <StockLinkRow key={l.stockItemId} link={l}
                            label={stockNames[l.stockItemId] ?? `#${l.stockItemId}`}
                            milestones={milestones} canEdit={canEdit}
                            onAffectation={(l, m) => setPendingAffect({ link: l, milestoneId: m })} onRemove={setPendingRemove} />
                    ))}
                </tbody>
            </table>
        </div>
        {pendingRemove !== null && (
            <ConfirmModal danger title={t("modals.removeLinkTitle")} message={t("common.irreversible")}
                onConfirm={() => void removeLink(pendingRemove)} onCancel={() => setPendingRemove(null)} />
        )}
        {pendingAffect !== null && (
            <ConfirmModal title={t("modals.affectTitle")}
                message={pendingAffect.milestoneId === null ? t("stock.affectProject") : (milestones.find((m) => m.id === pendingAffect.milestoneId)?.name ?? "")}
                onConfirm={() => void setAffectation(pendingAffect.link, pendingAffect.milestoneId)} onCancel={() => setPendingAffect(null)} />
        )}
        </>
    );
}
