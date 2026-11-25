// Barre de filtres du stock : catégorie, emplacement, disponibilité, stock faible (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { DispoFilter } from "../../hooks/useStockQuery";
import CheckToggle from "../ui/CheckToggle";
import { FiRotateCcw } from "react-icons/fi";

interface Props {
    categories: string[];
    locations: string[];
    category: string;
    onCategory: (v: string) => void;
    location: string;
    onLocation: (v: string) => void;
    dispo: DispoFilter;
    onDispo: (v: DispoFilter) => void;
    lowOnly: boolean;
    onLowOnly: (v: boolean) => void;
    onReset: () => void;
    resultCount: number;
    totalCount: number;
}

const FILTER_LABEL: React.CSSProperties = {
    fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.04em",
};

export default function StockFilters(p: Props): JSX.Element {
    const { t } = useTranslation();
    const hasFilter = p.category !== "" || p.location !== "" || p.dispo !== "all" || p.lowOnly;
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={FILTER_LABEL}>{t("stock.category")}</span>
                <select className="select" value={p.category} onChange={(e) => p.onCategory(e.target.value)} style={{ minWidth: "150px" }}>
                    <option value="">{t("stock.allCategories")}</option>
                    {p.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={FILTER_LABEL}>{t("stock.location")}</span>
                <select className="select" value={p.location} onChange={(e) => p.onLocation(e.target.value)} style={{ minWidth: "150px" }}>
                    <option value="">{t("stock.allLocations")}</option>
                    {p.locations.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={FILTER_LABEL}>{t("stock.dispo")}</span>
                <select className="select" value={p.dispo} onChange={(e) => p.onDispo(e.target.value as DispoFilter)} style={{ minWidth: "140px" }}>
                    <option value="all">{t("stock.allAvailability")}</option>
                    <option value="available">{t("stock.available")}</option>
                    <option value="unavailable">{t("stock.outOfStock")}</option>
                </select>
            </div>
            <div style={{ paddingBottom: "0.35rem" }}>
                <CheckToggle checked={p.lowOnly} onChange={p.onLowOnly} label={t("stock.low")} />
            </div>
            {hasFilter && (
                <button className="btn-ghost" onClick={p.onReset} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
                    <FiRotateCcw /> {t("stock.resetFilters")}
                </button>
            )}
            <span className="mono" style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)", paddingBottom: "0.45rem" }}>
                {p.resultCount}/{p.totalCount} {t("stock.results")}
            </span>
        </div>
    );
}
