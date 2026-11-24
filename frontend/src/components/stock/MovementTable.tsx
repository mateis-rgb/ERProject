// Table des mouvements (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { StockMovement, StockItem } from "../../types";

interface Props {
    movements: StockMovement[];
    items: StockItem[];
}

const TYPE_COLORS: Record<string, string> = {
    IN: "var(--green)",
    OUT: "var(--danger)",
    RETURN: "var(--accent)",
};

function typeLabel(t: (k: string) => string, type: string): string {
    if (type === "IN") return t("movement.in");
    if (type === "OUT") return t("movement.out");
    return t("movement.return");
}

export default function MovementTable({ movements, items }: Props): JSX.Element {
    const { t } = useTranslation();
    const itemName = (id: string): string => {
        const found = items.find((i) => i.id === id);
        return found !== undefined ? found.name : `#${id}`;
    };

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th className="table-header">Date</th>
                        <th className="table-header">{t("stock.article")}</th>
                        <th className="table-header">{t("project.type")}</th>
                        <th className="table-header">{t("stock.quantity")}</th>
                        <th className="table-header">Raison</th>
                        <th className="table-header">Projet</th>
                    </tr>
                </thead>
                <tbody>
                    {movements.map((m) => (
                        <tr key={m.id}>
                            <td className="table-cell">{new Date(m.date).toLocaleString("fr-FR")}</td>
                            <td className="table-cell">{itemName(m.stockItemId)}</td>
                            <td className="table-cell">
                                <span className="badge" style={{ backgroundColor: TYPE_COLORS[m.type] ?? "var(--muted)" }}>
                                    {typeLabel(t, m.type)}
                                </span>
                            </td>
                            <td className="table-cell">{m.quantity}</td>
                            <td className="table-cell">{m.reason || "—"}</td>
                            <td className="table-cell">{m.projectId !== null ? `#${m.projectId}` : "—"}</td>
                        </tr>
                    ))}
                    {movements.length === 0 && (
                        <tr><td className="table-cell" colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>Aucun mouvement</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
