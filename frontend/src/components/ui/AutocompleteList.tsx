// Liste déroulante de suggestions autocomplétion (Power of 10 R4)
import { StockItem } from "../../types";

interface Props {
    items: StockItem[];
    highlight: number;
    onPick: (item: StockItem) => void;
    onHover: (i: number) => void;
}

export default function AutocompleteList({ items, highlight, onPick, onHover }: Props): JSX.Element {
    return (
        <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300,
            background: "var(--surface)", border: "2px solid var(--ink)", boxShadow: "5px 5px 0 var(--ink)",
            maxHeight: "240px", overflow: "auto",
        }}>
            {items.map((item, i) => (
                <div
                    key={item.id}
                    onClick={() => onPick(item)}
                    onMouseEnter={() => onHover(i)}
                    style={{
                        padding: "0.5rem 0.75rem", cursor: "pointer",
                        background: i === highlight ? "var(--accent)" : "transparent",
                        color: i === highlight ? "var(--accent-ink)" : "var(--text)",
                        borderBottom: "1px solid var(--ink)", fontSize: "0.85rem",
                    }}
                >
                    <strong>{item.name}</strong>
                    <span className="mono" style={{ marginLeft: "0.5rem", fontSize: "0.72rem", opacity: 0.7 }}>
                        {item.reference} · dispo: {item.quantity} {item.unit}
                    </span>
                </div>
            ))}
        </div>
    );
}
