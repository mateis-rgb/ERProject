import { FiChevronDown, FiChevronUp, FiEdit2, FiX } from "react-icons/fi";
// Tableau du stock - lignes cliquables, en-têtes triables (Power of 10 R4)
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/I18nContext";
import { StockItem, AvailabilityEntry } from "../../types";
import { StockSort, StockSortKey } from "../../hooks/useStockQuery";
import { api } from "../../services/api";

interface Props {
    items: StockItem[];
    avail: Record<string, AvailabilityEntry>;
    canEdit: boolean;
    sort: StockSort;
    onSort: (k: StockSortKey) => void;
    onChanged: () => void;
    onEdit: (item: StockItem) => void;
}

interface RowProps {
    item: StockItem;
    avail: AvailabilityEntry | undefined;
    canEdit: boolean;
    onDelete: (id: string) => void;
    onEdit: (item: StockItem) => void;
}

function SortTh(p: { label: string; k: StockSortKey; sort: StockSort; onSort: (k: StockSortKey) => void }): JSX.Element {
    const active = p.sort.key === p.k;
    return (
        <th className="table-header" style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
            onClick={() => p.onSort(p.k)}
            title={p.label}
        >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: active ? "var(--accent)" : undefined }}>
                {p.label}
                {active && (p.sort.dir === "asc" ? <FiChevronUp /> : <FiChevronDown />)}
            </span>
        </th>
    );
}

function StockRow({ item, avail: a, canEdit, onDelete, onEdit }: RowProps): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isLow = item.quantity <= item.minThreshold;
    const unavailable = a !== undefined && a.reserved > 0 && a.available <= 0;
    return (
        <tr
            onClick={() => navigate(`/stock/${item.id}`)}
            onKeyDown={(e) => { if (e.key === "Enter") navigate(`/stock/${item.id}`); }}
            tabIndex={0}
            role="link"
            aria-label={item.name}
            style={{ cursor: "pointer", ...(isLow ? { backgroundColor: "rgba(239,68,68,0.1)" } : {}) }}
        >
            <td className="table-cell" style={{ fontWeight: 600 }}>{item.name}</td>
            <td className="table-cell">{item.reference}</td>
            <td className="table-cell">
                <strong style={isLow ? { color: "var(--danger)" } : undefined}>
                    {item.quantity} {item.unit}
                </strong>
            </td>
            <td className="table-cell">
                {a === undefined ? "—" : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                        <strong style={unavailable ? { color: "var(--danger)" } : undefined}>
                            {a.available}/{a.totalQuantity}
                        </strong>
                        {unavailable && (
                            <span className="badge" style={{ background: "var(--danger)", color: "#fff" }}>
                                {t("stock.unavailable")}
                            </span>
                        )}
                    </span>
                )}
            </td>
            <td className="table-cell">{item.category || "—"}</td>
            <td className="table-cell">{item.location || "—"}</td>
            <td className="table-cell">{item.minThreshold}</td>
            <td className="table-cell">{item.purchasePrice !== null ? `${item.purchasePrice} €` : "—"}</td>
            {canEdit && (
                <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                    <span style={{ display: "inline-flex", gap: "0.3rem" }}>
                        <button className="btn-ghost" style={{ padding: "0.125rem 0.5rem", fontSize: "0.75rem" }}
                            title={t("stock.editArticle")} onClick={() => onEdit(item)}><FiEdit2 /></button>
                        <button className="btn-danger" style={{ padding: "0.125rem 0.5rem", fontSize: "0.75rem" }} onClick={() => onDelete(item.id)}><FiX /></button>
                    </span>
                </td>
            )}
        </tr>
    );
}

export default function StockTable({ items, avail, canEdit, sort, onSort, onChanged, onEdit }: Props): JSX.Element {
    const { t } = useTranslation();
    const deleteItem = async (id: string): Promise<void> => {
        if (!confirm(t("stock.deleteConfirm"))) return;
        await api.delete(`/api/stock/${id}`);
        onChanged();
    };

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <SortTh label={t("drive.name")} k="name" sort={sort} onSort={onSort} />
                        <SortTh label={t("stock.ref")} k="reference" sort={sort} onSort={onSort} />
                        <SortTh label={t("stock.qty")} k="quantity" sort={sort} onSort={onSort} />
                        <SortTh label={t("stock.dispo")} k="available" sort={sort} onSort={onSort} />
                        <SortTh label={t("stock.category")} k="category" sort={sort} onSort={onSort} />
                        <SortTh label={t("stock.location")} k="location" sort={sort} onSort={onSort} />
                        <SortTh label={t("stock.minThreshold")} k="minThreshold" sort={sort} onSort={onSort} />
                        <SortTh label={t("stock.purchasePrice")} k="purchasePrice" sort={sort} onSort={onSort} />
                        {canEdit && <th className="table-header"></th>}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <StockRow key={item.id} item={item} avail={avail[item.id]} canEdit={canEdit}
                            onDelete={(id) => void deleteItem(id)} onEdit={onEdit} />
                    ))}
                    {items.length === 0 && (
                        <tr><td className="table-cell" colSpan={canEdit ? 9 : 8} style={{ textAlign: "center", color: "var(--muted)" }}>{t("stock.noItems")}</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
