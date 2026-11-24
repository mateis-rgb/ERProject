// Onglets de la page Stock (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
export type StockTabId = "inventory" | "movements";

interface Props {
    active: StockTabId;
    onChange: (t: StockTabId) => void;
}

const TABS: { id: StockTabId; key: string }[] = [
    { id: "inventory", key: "stockTabs.inventory" },
    { id: "movements", key: "stockTabs.movements" },
];

export default function StockTabs({ active, onChange }: Props): JSX.Element {
    const { t: tt } = useTranslation();
    return (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {TABS.map((t) => (
                <button
                    key={t.id}
                    className={active === t.id ? "btn" : "btn-ghost"}
                    onClick={() => onChange(t.id)}
                >
                    {tt(t.key)}
                </button>
            ))}
        </div>
    );
}
