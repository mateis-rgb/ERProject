import { FiEdit2, FiX } from "react-icons/fi";
// Tableau du stock (Power of 10 R4)
import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n/I18nContext";
import { StockItem, AvailabilityEntry } from "../../types";
import { api } from "../../services/api";

interface Props {
    items: StockItem[];
    avail: Record<string, AvailabilityEntry>;
    canEdit: boolean;
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

function StockRow({ item, avail: a, canEdit, onDelete, onEdit }: RowProps): JSX.Element {
    const { t } = useTranslation();
    const isLow = item.quantity <= item.minThreshold;
    const unavailable = a !== undefined && a.reserved > 0 && a.available <= 0;
    return (
        <tr style={isLow ? { backgroundColor: "rgba(239,68,68,0.1)" } : undefined}>
            <td className="table-cell" style={{ fontWeight: 600 }}>
                <Link to={`/stock/${item.id}`} style={{ color: "var(--ink)" }}>{item.name}</Link>
            </td>
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
                            <span style={{
                                border: "var(--border-w) solid var(--ink)", boxShadow: "var(--shadow-btn)",
                                background: "var(--danger)", color: "#fff",
                                padding: "0.1rem 0.45rem", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
                            }}>
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
                <td className="table-cell">
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

export default function StockTable({ items, avail, canEdit, onChanged, onEdit }: Props): JSX.Element {
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
                        <th className="table-header">{t("drive.name")}</th>
                        <th className="table-header">{t("stock.ref")}</th>
                        <th className="table-header">{t("stock.qty")}</th>
                        <th className="table-header">{t("stock.dispo")}</th>
                        <th className="table-header">{t("stock.category")}</th>
                        <th className="table-header">{t("stock.location")}</th>
                        <th className="table-header">Seuil</th>
                        <th className="table-header">Prix</th>
                        {canEdit && <th className="table-header"></th>}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <StockRow key={item.id} item={item} avail={avail[item.id]} canEdit={canEdit}
                            onDelete={(id) => void deleteItem(id)} onEdit={onEdit} />
                    ))}
                    {items.length === 0 && (
                        <tr><td className="table-cell" colSpan={9} style={{ textAlign: "center", color: "var(--muted)" }}>Aucun article</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
