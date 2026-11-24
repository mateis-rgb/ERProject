// Carte bento du dashboard (Power of 10 R4)
interface Props {
    value: string | number;
    label: string;
    icon: string;
    accent: string;
    warn?: boolean;
    live?: boolean;
}

export default function BentoCard({ value, label, icon, accent, warn, live }: Props): JSX.Element {
    return (
        <div className="bento-item" style={warn ? { borderColor: "var(--amber)" } : undefined}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="mono" style={{ fontSize: "1.2rem", color: accent }}>{icon}</span>
                {live === true && <span className="rec-dot" style={{ width: "7px", height: "7px" }} />}
            </div>
            <div className="bento-value" style={{ color: warn === true ? "var(--amber)" : "var(--text)" }}>
                {value}
            </div>
            <div className="bento-label">{label}</div>
        </div>
    );
}
