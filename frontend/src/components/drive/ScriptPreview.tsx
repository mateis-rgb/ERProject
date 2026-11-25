// Aperçu d'un script Fountain, rendu façon page de scénario (Power of 10 R4)
import { parseFountain, ScriptBlock } from "../../utils/fountain";

const BASE: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
};

function blockStyle(type: ScriptBlock["type"]): React.CSSProperties {
    switch (type) {
        case "slug": return { ...BASE, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", margin: "0.9rem 0 0.4rem" };
        case "character": return { ...BASE, fontWeight: 700, textAlign: "center", margin: "0.6rem auto 0", maxWidth: "60%" };
        case "parenthetical": return { ...BASE, fontStyle: "italic", textAlign: "center", margin: "0 auto", maxWidth: "50%" };
        case "dialogue": return { ...BASE, textAlign: "center", margin: "0 auto", maxWidth: "70%" };
        case "transition": return { ...BASE, textAlign: "right", fontWeight: 700 };
        case "note": return { ...BASE, border: "2px dashed var(--muted)", padding: "0.3rem 0.5rem", color: "var(--muted)", fontSize: "0.78rem" };
        case "pagebreak": return { ...BASE, textAlign: "center", color: "var(--muted)", margin: "1rem 0" };
        case "empty": return { ...BASE, height: "0.6rem" };
        default: return { ...BASE, margin: "0.3rem 0" }; // action : pleine largeur, alignée à gauche (pas de retrait)
    }
}

export default function ScriptPreview({ src }: { src: string }): JSX.Element {
    const blocks = parseFountain(src);
    return (
        <div style={{ padding: "1rem 1.25rem", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
            {blocks.map((b, i) => (
                <p key={i} style={blockStyle(b.type)}>{b.type === "pagebreak" ? "———" : b.text}</p>
            ))}
        </div>
    );
}
