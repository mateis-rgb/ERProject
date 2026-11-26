// Contenu des onglets de la page projet (Power of 10 R4)
import { Project, ProjectStockLink, StockItem, TimeEntry, ActivityLog, Attachment, Milestone } from "../../types";
import DashboardTab from "../dashboard/DashboardTab";
import StockTab from "../stock/StockTab";
import PlanningTab from "../gantt/PlanningTab";
import DriveTab from "../drive/DriveTab";
import ProjectSettingsTab from "./ProjectSettingsTab";
import CommentsSection from "./CommentsSection";
import type { ProjectTabId } from "./ProjectTabs";

interface Props {
    tab: ProjectTabId;
    pid: string;
    project: Project;
    links: ProjectStockLink[];
    stockItems: StockItem[];
    stockNames: Record<string, string>;
    milestones: Milestone[];
    timeEntries: TimeEntry[];
    totalHours: number;
    logs: ActivityLog[];
    attachments: Attachment[];
    canEdit: boolean;
    isAdmin: boolean;
    onChanged: () => void;
}

export default function ProjectTabsContent(props: Props): JSX.Element {
    const { tab, pid, project, links, stockItems, stockNames, milestones,
        timeEntries, totalHours, logs, attachments, canEdit, isAdmin, onChanged } = props;
    if (tab === "dashboard") {
        return <DashboardTab project={project} links={links} milestones={milestones}
            attachments={attachments} timeEntries={timeEntries} totalHours={totalHours}
            logs={logs} onChanged={onChanged} />;
    }
    if (tab === "stock") {
        return <StockTab projectId={pid} links={links} stockItems={stockItems} stockNames={stockNames}
            milestones={milestones} canEdit={canEdit} onChanged={onChanged} />;
    }
    if (tab === "planning") {
        return <PlanningTab projectId={pid} project={project} canEdit={canEdit} onUpdated={onChanged} />;
    }
    if (tab === "drive") {
        return <DriveTab projectId={pid} attachments={attachments} canEdit={canEdit} onChanged={onChanged} />;
    }
    if (tab === "comments") {
        return (
            <div style={{ marginTop: "1.25rem", maxWidth: "760px" }}>
                <CommentsSection scope={{ kind: "project", projectId: pid, milestoneId: null }} />
            </div>
        );
    }
    return <ProjectSettingsTab project={project} canEdit={canEdit} isAdmin={isAdmin} onSaved={onChanged} />;
}
