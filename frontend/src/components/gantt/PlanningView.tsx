// Vue de l'onglet Planning - Gantt pleine largeur + modale jalon + switch lecture/édition (Power of 10 R4)
import { Milestone, StockItem } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
import GanttChart from "./GanttChart";
import PlanningHeader from "./PlanningHeader";
import MilestoneForm from "./MilestoneForm";
import Modal from "../ui/Modal";
import MilestoneModal from "./MilestoneModal";
import ProjectDatesModal from "../projects/ProjectDatesModal";
import type { ResizeSide } from "../../hooks/useResizeDrag";
import { currentMilestone, milestonePath } from "./ganttUtils";

interface Props {
    projectId: string;
    milestones: Milestone[];
    stockItems: StockItem[];
    selectedId: string | null;
    creating: boolean;
    canEdit: boolean;
    editMode: boolean;
    projectStart: string | null;
    projectEnd: string | null;
    showDatesModal: boolean;
    onSelect: (id: string | null) => void;
    onToggleEdit: () => void;
    onMove: (id: string, dayOffset: number) => void;
    onResize: (id: string, side: ResizeSide, dayOffset: number) => void;
    onToggleCreate: () => void;
    onSaved: () => void;
    onCancelCreate: () => void;
    onDelete: () => void;
    onDatesSaved: () => void;
    onCloseDatesModal: () => void;
    onOpenDatesModal: () => void;
}

export default function PlanningView(props: Props): JSX.Element {
    const { projectId, milestones, stockItems, selectedId, creating, canEdit, editMode, projectStart, projectEnd,
        showDatesModal, onSelect, onToggleEdit, onMove, onResize, onToggleCreate, onSaved, onCancelCreate, onDelete,
        onDatesSaved, onCloseDatesModal, onOpenDatesModal } = props;
    const { t } = useTranslation();
    const selected = milestones.find((m) => m.id === selectedId) ?? null;
    const noDates = projectStart === null || projectEnd === null;
    const editing = canEdit && editMode;
    const cur = currentMilestone(milestones, new Date());
    const current = cur !== null ? milestonePath(milestones, cur).map((m) => m.name).join(" / ") : null;
    return (
        <div style={{ marginTop: "1.25rem" }}>
            <div className="card">
                <PlanningHeader current={current} canEdit={canEdit} editMode={editMode}
                    creating={creating} onToggleEdit={onToggleEdit} onToggleCreate={onToggleCreate} />
                {creating && editing && (
                    <Modal title={t("modals.newMilestoneTitle")} onClose={onCancelCreate} wide>
                        <MilestoneForm projectId={projectId} milestone={null} milestones={milestones}
                            onSaved={onSaved} onCancel={onCancelCreate} />
                    </Modal>
                )}
                {noDates && !showDatesModal ? (
                    <div style={{ border: "2px dashed var(--ink)", padding: "3rem 1.5rem", textAlign: "center" }}>
                        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 1rem" }}>
                            {t("gantt.noDates")}
                        </p>
                        <button className="btn" onClick={onOpenDatesModal}>{t("gantt.setDates")}</button>
                    </div>
                ) : (
                    <GanttChart milestones={milestones} selectedId={selectedId} editMode={editing}
                        minDate={projectStart} maxDate={projectEnd}
                        onSelect={(id) => onSelect(id)} onMove={onMove} onResize={onResize} />
                )}
                <p className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.75rem" }}>
                    {editing ? t("gantt.hint") : t("gantt.selectHint")}
                </p>
            </div>
            {selected !== null && (
                <MilestoneModal milestone={selected} milestones={milestones} projectId={projectId} stockItems={stockItems}
                    canEdit={editing} onClose={() => onSelect(null)} onChanged={onSaved} onDelete={onDelete} />
            )}
            {showDatesModal && (
                <ProjectDatesModal projectId={projectId}
                    initialStart={projectStart ?? ""} initialEnd={projectEnd ?? ""}
                    onSaved={onDatesSaved} onClose={onCloseDatesModal} />
            )}
        </div>
    );
}
