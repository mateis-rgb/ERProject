// Modale d'édition d'un jalon (Power of 10 R4)
import { Milestone, StockItem } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
import MilestonePanel from "./MilestonePanel";
import CommentsSection from "../projects/CommentsSection";

interface Props {
    milestone: Milestone;
    milestones: Milestone[]; // pour le choix du jalon parent
    projectId: string;
    stockItems: StockItem[];
    canEdit: boolean;
    onClose: () => void;
    onChanged: () => void;
    onDelete: () => void;
}

export default function MilestoneModal(props: Props): JSX.Element {
    const { milestone, milestones, projectId, stockItems, canEdit, onClose, onChanged, onDelete } = props;
    const { t } = useTranslation();
    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.55)",
                display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6vh 1.5rem 1.5rem",
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{ width: "100%", maxWidth: "640px", maxHeight: "85vh", overflowY: "auto", boxShadow: "8px 8px 0 var(--ink)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>
                        {milestone.name}
                    </h2>
                    <button className="btn-ghost" style={{ padding: "0.25rem 0.7rem" }} onClick={onClose}>
                        {t("common.close")}
                    </button>
                </div>
                <MilestonePanel milestone={milestone} milestones={milestones} projectId={projectId} stockItems={stockItems}
                    canEdit={canEdit} onChanged={onChanged} onDelete={() => { onDelete(); onClose(); }} />
                <CommentsSection scope={{ kind: "project", projectId, milestoneId: milestone.id }} />
            </div>
        </div>
    );
}
