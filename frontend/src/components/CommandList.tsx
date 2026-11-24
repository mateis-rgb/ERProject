// Liste des résultats de la command palette (Power of 10 R4)
export interface CmdItem {
    label: string;
    hint: string;
    action: string;
    kbd?: string;
}

interface Props {
    items: CmdItem[];
    active: number;
    onHover: (i: number) => void;
    onRun: (item: CmdItem) => void;
}

export default function CommandList({ items, active, onHover, onRun }: Props): JSX.Element {
    if (items.length === 0) {
        return (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem" }}>
                Aucun résultat
            </div>
        );
    }
    return (
        <div style={{ maxHeight: "300px", overflow: "auto", padding: "0.375rem" }}>
            {items.map((item, i) => (
                <div
                    key={item.label}
                    className={`cmd-item ${i === active ? "active" : ""}`}
                    onClick={() => onRun(item)}
                    onMouseEnter={() => onHover(i)}
                >
                    <span>{item.label}</span>
                    <span style={{ color: "inherit", opacity: 0.6, fontSize: "0.78rem" }}>{item.hint}</span>
                    {item.kbd !== undefined && <span className="kbd">{item.kbd}</span>}
                </div>
            ))}
        </div>
    );
}
