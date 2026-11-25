// Onglet Planning d'un projet - Gantt borné aux dates du projet + jalons (Power of 10 R4)
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Milestone, StockItem, Project } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
import PlanningView from "./PlanningView";
import ConfirmModal from "../ui/ConfirmModal";
import { useDatesModal } from "../../hooks/useDatesModal";
import { useMilestoneActions } from "../../hooks/useMilestoneActions";

interface Props {
    projectId: string;
    project: Project;
    canEdit: boolean;
    onUpdated: () => void;
}

export default function PlanningTab({ projectId, project, canEdit, onUpdated }: Props): JSX.Element {
    const { t } = useTranslation();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

    const hasDates = project.startDate !== null && project.endDate !== null;
    const datesModal = useDatesModal(hasDates);

    const load = (): void => {
        api.get<Milestone[]>(`/api/projects/${projectId}/milestones`).then((r) => { if (r.success) setMilestones(r.data); });
        api.get<StockItem[]>("/api/stock?limit=500").then((r) => { if (r.success) setStockItems(r.data); });
    };

    useEffect(load, [projectId]);

    const selected = milestones.find((m) => m.id === selectedId) ?? null;
    const actions = useMilestoneActions(project, milestones, load);

    const deleteSelected = (): void => {
        if (selected !== null) setPendingDelete({ id: selected.id, name: selected.name });
        setSelectedId(null);
    };

    const confirmDelete = (): void => {
        if (pendingDelete !== null) void actions.remove(pendingDelete.id);
        setPendingDelete(null);
    };

    const onSaved = (): void => { setCreating(false); load(); };

    return (
        <>
        <PlanningView projectId={projectId} milestones={milestones} stockItems={stockItems}
            selectedId={selectedId} creating={creating} canEdit={canEdit} editMode={editMode}
            projectStart={project.startDate} projectEnd={project.endDate}
            showDatesModal={datesModal.showDatesModal}
            onSelect={setSelectedId} onToggleEdit={() => setEditMode(!editMode)}
            onMove={actions.move} onResize={actions.resize}
            onToggleCreate={() => { setCreating(!creating); setSelectedId(null); }}
            onSaved={onSaved} onCancelCreate={() => setCreating(false)} onDelete={deleteSelected}
            onDatesSaved={() => { datesModal.closeDatesModal(); onUpdated(); load(); }}
            onCloseDatesModal={datesModal.closeDatesModal}
            onOpenDatesModal={datesModal.openDatesModal} />
        {pendingDelete !== null && (
            <ConfirmModal danger
                title={`${t("gantt.deleteConfirm")} "${pendingDelete.name}" ?`}
                message={t("common.irreversible")}
                onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
        )}
        </>
    );
}
