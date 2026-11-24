// Tooltip d'un jalon au survol - toujours affiché EN HAUT, centré sur la barre (Power of 10 R4)
import { Milestone } from "../types";

interface Props {
    milestone: Milestone;
    rect: { top: number; left: number; width: number } | null;
}

const MAX_DESC = 50;
const TIP_W = 240;

export function truncateDesc(desc: string): string {
    if (desc.length <= MAX_DESC) return desc;
    return `${desc.slice(0, MAX_DESC)}…`;
}

export default function MilestoneTooltip({ milestone, rect }: Props): JSX.Element {
    if (rect === null) return <></>;
    const fmt = (d: string): string => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    // Centré horizontalement au-dessus de la barre, clamé dans la fenêtre ; épinglé en haut si manque de place
    const center = rect.left + rect.width / 2;
    const left = Math.min(Math.max(center, TIP_W / 2 + 8), window.innerWidth - TIP_W / 2 - 8);
    const above = rect.top > 150;
    const top = above ? rect.top - 8 : 8;
    const transform = above ? "translate(-50%, -100%)" : "translateX(-50%)";
    return (
        <div style={{
            position: "fixed", top, left, zIndex: 9999,
            width: `${TIP_W}px`, background: "var(--surface)", color: "var(--text)",
            border: "2px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)",
            padding: "0.6rem 0.75rem", pointerEvents: "none", transform,
        }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>{milestone.name}</div>
            {milestone.description !== "" && (
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                    {truncateDesc(milestone.description)}
                </div>
            )}
            <div className="mono" style={{ fontSize: "0.7rem", marginTop: "0.4rem" }}>
                Du {fmt(milestone.startDate)} au {fmt(milestone.endDate)}
            </div>
        </div>
    );
}
