// Barre de filtres du stock : catégorie, emplacement, disponibilité, stock faible (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { DispoFilter } from "../../hooks/useStockQuery";
import BrutalCheckbox from "../ui/BrutalCheckbox";
import BrutalSelect, { SelectOption } from "../ui/BrutalSelect";
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

function FilterField(p: { label: string; children: React.ReactNode }): JSX.Element {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={FILTER_LABEL}>{p.label}</span>
            {p.children}
        </div>
    );
}

export default function StockFilters(p: Props): JSX.Element {
    const { t } = useTranslation();
    const hasFilter = p.category !== "" || p.location !== "" || p.dispo !== "all" || p.lowOnly;
    const toOptions = (all: string, values: string[]): SelectOption[] =>
        [{ value: "", label: all }, ...values.map((v) => ({ value: v, label: v }))];
    const dispoOptions: SelectOption[] = [
        { value: "all", label: t("stock.allAvailability") },
        { value: "available", label: t("stock.available") },
        { value: "unavailable", label: t("stock.outOfStock") },
    ];
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <FilterField label={t("stock.category")}>
                <BrutalSelect value={p.category} onChange={p.onCategory} options={toOptions(t("stock.allCategories"), p.categories)}
                    ariaLabel={t("stock.category")} minWidth="150px" />
            </FilterField>
            <FilterField label={t("stock.location")}>
                <BrutalSelect value={p.location} onChange={p.onLocation} options={toOptions(t("stock.allLocations"), p.locations)}
                    ariaLabel={t("stock.location")} minWidth="150px" />
            </FilterField>
            <FilterField label={t("stock.dispo")}>
                <BrutalSelect value={p.dispo} onChange={(v) => p.onDispo(v as DispoFilter)} options={dispoOptions}
                    ariaLabel={t("stock.dispo")} minWidth="140px" />
            </FilterField>
            <BrutalCheckbox checked={p.lowOnly} onChange={p.onLowOnly} label={t("stock.low")} />
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
