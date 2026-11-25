import { FiArrowRight } from "react-icons/fi";
// Panneau détail d'un jalon (Power of 10 R4)
import { useState } from "react";
import { Milestone, StockItem } from "../../types";
import MilestoneForm from "./MilestoneForm";
import MilestoneStockList from "./MilestoneStockList";
import CommentsSection from "../projects/CommentsSection";

interface Props {
    milestone: Milestone;
    milestones: Milestone[]; // pour le choix du jalon parent
    projectId: string;
    stockItems: StockItem[];
    canEdit: boolean;
    onChanged: () => void;
    onDelete: () => void;
}

export default function MilestonePanel({ milestone, milestones, projectId, stockItems, canEdit, onChanged, onDelete }: Props): JSX.Element {
    const [editing, setEditing] = useState(false);

    if (editing) {
        return <MilestoneForm projectId={projectId} milestone={milestone} milestones={milestones}
            onSaved={() => { setEditing(false); onChanged(); }} onCancel={() => setEditing(false)} />;
    }

    return (
        <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ width: "16px", height: "16px", background: milestone.color, border: "2px solid var(--ink)" }} />
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase" }}>{milestone.name}</h3>
            </div>
            <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0.5rem 0" }}>
                <span className="ic">{new Date(milestone.startDate).toLocaleDateString("fr-FR")} <FiArrowRight /> {new Date(milestone.endDate).toLocaleDateString("fr-FR")}</span>
            </p>
            {milestone.description && <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{milestone.description}</p>}
            <MilestoneStockList milestoneId={milestone.id} stockItems={stockItems} canEdit={canEdit} onChanged={onChanged} />
            <CommentsSection scope={{ kind: "project", projectId, milestoneId: milestone.id }} />
            {canEdit && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button className="btn-ghost" onClick={() => setEditing(true)}>Modifier</button>
                    <button className="btn-danger" onClick={onDelete}>Supprimer le jalon</button>
                </div>
            )}
        </div>
    );
}
