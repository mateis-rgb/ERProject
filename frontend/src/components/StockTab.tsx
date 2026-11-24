// Onglet Stock engagé d'un projet - taguer chaque article sur le projet ou un jalon (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState } from "react";
import { api } from "../services/api";
import { ProjectStockLink, StockItem, Milestone } from "../types";
import StockAutocomplete from "./StockAutocomplete";
import StockLinksTable from "./StockLinksTable";

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
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [allocated, setAllocated] = useState("0");
    const [forecast, setForecast] = useState("0");

    const addLink = async (): Promise<void> => {
        if (selectedItem === null) return;
        const res = await api.post(`/api/projects/${projectId}/stock`, {
            stockItemId: selectedItem.id,
            allocatedQuantity: parseFloat(allocated) || 0,
            forecastQuantity: parseFloat(forecast) || 0,
            milestoneId: null,
        });
        if (res.success) { setSelectedItem(null); setAllocated("0"); setForecast("0"); onChanged(); }
    };

    return (
        <div className="card" style={{ marginTop: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                Stock engagé ({links.length})
            </h2>
            {canEdit && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "end", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <StockAutocomplete items={stockItems} onSelect={setSelectedItem} placeholder={t("stock.searchArticle")} />
                    <div style={{ width: "110px" }}>
                        <label className="label">{t("stock.allocated")}</label>
                        <input className="input" type="number" step="0.5" min="0" value={allocated} onChange={(e) => setAllocated(e.target.value)} />
                    </div>
                    <div style={{ width: "110px" }}>
                        <label className="label">{t("stock.forecast")}</label>
                        <input className="input" type="number" step="0.5" min="0" value={forecast} onChange={(e) => setForecast(e.target.value)} />
                    </div>
                    <button className="btn" onClick={addLink} disabled={selectedItem === null}>+ Ajouter</button>
                </div>
            )}
            <StockLinksTable projectId={projectId} links={links} stockNames={stockNames} milestones={milestones}
                canEdit={canEdit} onChanged={onChanged} />
        </div>
    );
}
