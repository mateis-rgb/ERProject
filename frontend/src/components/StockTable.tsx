// Tableau du stock (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { StockItem } from "../types";
import { api } from "../services/api";

interface Props {
    items: StockItem[];
    canEdit: boolean;
    onChanged: () => void;
}

export default function StockTable({ items, canEdit, onChanged }: Props): JSX.Element {
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
                        <th className="table-header">{t("stock.category")}</th>
                        <th className="table-header">{t("stock.location")}</th>
                        <th className="table-header">Seuil</th>
                        <th className="table-header">Prix</th>
                        {canEdit && <th className="table-header"></th>}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => {
                        const isLow = item.quantity <= item.minThreshold;
                        return (
                            <tr key={item.id} style={isLow ? { backgroundColor: "rgba(239,68,68,0.1)" } : undefined}>
                                <td className="table-cell" style={{ fontWeight: 600 }}>{item.name}</td>
                                <td className="table-cell">{item.reference}</td>
                                <td className="table-cell">
                                    <strong style={isLow ? { color: "var(--danger)" } : undefined}>
                                        {item.quantity} {item.unit}
                                    </strong>
                                </td>
                                <td className="table-cell">{item.category || "—"}</td>
                                <td className="table-cell">{item.location || "—"}</td>
                                <td className="table-cell">{item.minThreshold}</td>
                                <td className="table-cell">{item.purchasePrice !== null ? `${item.purchasePrice} €` : "—"}</td>
                                {canEdit && (
                                    <td className="table-cell">
                                        <button className="btn-danger" style={{ padding: "0.125rem 0.5rem", fontSize: "0.75rem" }} onClick={() => deleteItem(item.id)}>✕</button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                    {items.length === 0 && (
                        <tr><td className="table-cell" colSpan={8} style={{ textAlign: "center", color: "var(--muted)" }}>Aucun article</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
