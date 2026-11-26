// Carte bento du dashboard (Power of 10 R4)
import { ReactNode } from "react";

interface Props {
    value: string | number;
    label: string;
    icon: ReactNode;
    accent: string;
    warn?: boolean;
    live?: boolean;
    onClick?: () => void; // tuile cliquable -> détail du KPI
}

export default function BentoCard({ value, label, icon, accent, warn, live, onClick }: Props): JSX.Element {
    return (
        <div className="bento-item" role={onClick !== undefined ? "button" : undefined} onClick={onClick}
            style={{ ...(warn ? { borderColor: "var(--amber)" } : {}), cursor: onClick !== undefined ? "pointer" : "default" }}>
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
