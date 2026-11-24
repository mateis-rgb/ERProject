// Section liaisons stock d'un projet (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState } from "react";
import { api } from "../services/api";
import { ProjectStockLink, StockItem } from "../types";
import StockAutocomplete from "./StockAutocomplete";
import StockLinksTable from "./StockLinksTable";

interface Props {
    projectId: string;
    links: ProjectStockLink[];
    stockItems: StockItem[];
    stockNames: Record<string, string>;
    onChanged: () => void;
}

export default function StockLinksSection({ projectId, links, stockItems, stockNames, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [allocated, setAllocated] = useState("0");
    const [forecast, setForecast] = useState("0");

    const addLink = async (): Promise<void> => {
        if (selectedItem === null) return;
        const res = await api.post(`/api/projects/${projectId}/stock`, {
            stockItemId: selectedItem.id,
            allocatedQuantity: parseFloat(allocated),
            forecastQuantity: parseFloat(forecast),
        });
        if (res.success) { setSelectedItem(null); setAllocated("0"); setForecast("0"); onChanged(); }
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                Stock lié au projet
            </h2>
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
                <button className="btn" onClick={addLink} disabled={selectedItem === null}>+</button>
            </div>
            <StockLinksTable projectId={projectId} links={links} stockNames={stockNames}
                milestones={[]} canEdit onChanged={onChanged} />
        </div>
    );
}
