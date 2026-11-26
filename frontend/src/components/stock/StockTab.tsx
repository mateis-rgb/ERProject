// Onglet Stock engagé d'un projet - taguer chaque article sur le projet ou un jalon (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useState } from "react";
import { ProjectStockLink, StockItem, Milestone } from "../../types";
import StockLinksTable from "./StockLinksTable";
import LinkStockModal from "./LinkStockModal";

interface Props {
    projectId: string;
    links: ProjectStockLink[];
    stockItems: StockItem[];
    stockNames: Record<string, string>;
    milestones: Milestone[];
    canEdit: boolean;
    onChanged: () => void;
}

export default function StockTab(props: Props): JSX.Element {
    const { t } = useTranslation();
    const { projectId, links, stockItems, stockNames, milestones, canEdit, onChanged } = props;
    const [linkOpen, setLinkOpen] = useState(false);

    return (
        <div className="card" style={{ marginTop: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                Stock engagé ({links.length})
            </h2>
            {canEdit && (
                <div style={{ marginBottom: "1rem" }}>
                    <button className="btn" onClick={() => setLinkOpen(true)}>+ {t("modals.addStockLinkTitle")}</button>
                </div>
            )}
            {linkOpen && (
                <LinkStockModal projectId={projectId} stockItems={stockItems} milestones={milestones}
                    onClose={() => setLinkOpen(false)} onSaved={onChanged} />
            )}
            <StockLinksTable projectId={projectId} links={links} stockNames={stockNames} milestones={milestones}
                canEdit={canEdit} onChanged={onChanged} />
        </div>
    );
}
