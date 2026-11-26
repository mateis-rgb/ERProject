// Section liaisons stock d'un projet (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useState } from "react";
import { ProjectStockLink, StockItem } from "../../types";
import StockLinksTable from "./StockLinksTable";
import LinkStockModal from "./LinkStockModal";

interface Props {
    projectId: string;
    links: ProjectStockLink[];
    stockItems: StockItem[];
    stockNames: Record<string, string>;
    onChanged: () => void;
}

export default function StockLinksSection({ projectId, links, stockItems, stockNames, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const [linkOpen, setLinkOpen] = useState(false);

    return (
        <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                Stock lié au projet
            </h2>
            <div style={{ marginBottom: "1rem" }}>
                <button className="btn" onClick={() => setLinkOpen(true)}>+ {t("modals.addStockLinkTitle")}</button>
            </div>
            {linkOpen && (
                <LinkStockModal projectId={projectId} stockItems={stockItems}
                    onClose={() => setLinkOpen(false)} onSaved={onChanged} />
            )}
            <StockLinksTable projectId={projectId} links={links} stockNames={stockNames}
                milestones={[]} canEdit onChanged={onChanged} />
        </div>
    );
}
