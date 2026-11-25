// Icône d'article : photo uploadée si présente, sinon icône auto (catégorie) dans un carré néo-brutaliste (Power of 10 R4)
import { stockIconFor } from "../../utils/stockIcon";

interface Props {
    category: string;
    name: string;
    imagePath: string | null;
    size?: number;
}

export default function StockIcon({ category, name, imagePath, size = 32 }: Props): JSX.Element {
    const box: React.CSSProperties = {
        width: size, height: size, flexShrink: 0,
        border: "2px solid var(--ink)",
        background: "var(--surface-2, var(--surface))",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
    };
    if (imagePath !== null) {
        return (
            <span style={box}>
                <img src={`/uploads/${imagePath}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </span>
        );
    }
    const Icon = stockIconFor(category, name);
    return (
        <span style={{ ...box, color: "var(--accent)" }} title={name}>
            <Icon size={Math.round(size * 0.6)} />
        </span>
    );
}
