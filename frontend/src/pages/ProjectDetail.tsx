// Page détail projet - onglets en routes /projects/:id/:tab (dashboard|stock|planning|drive|settings) (Power of 10 R4)
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Project, ProjectStockLink, StockItem, TimeEntry, ActivityLog, Attachment, Milestone } from "../types";
import { useAuth } from "../context/AppContext";
import ProjectTabs, { ProjectTabId, PROJECT_TAB_IDS, tabModule } from "../components/ProjectTabs";
import { useModules } from "../context/ModulesContext";
import ProjectTabsContent from "../components/ProjectTabsContent";
import ProjectHeader from "../components/ProjectHeader";

export default function ProjectDetail(): JSX.Element {
    const { id, tab: tabParam } = useParams<{ id: string; tab?: string }>();
    const pid = id ?? "";
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [links, setLinks] = useState<ProjectStockLink[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [totalHours, setTotalHours] = useState(0);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadAll = (): void => {
        api.get<Project>(`/api/projects/${pid}`).then((r) => r.success ? setProject(r.data) : setError(r.error));
        api.get<ProjectStockLink[]>(`/api/projects/${pid}/stock`).then((r) => { if (r.success) setLinks(r.data); });
        api.get<{ entries: TimeEntry[]; totalHours: number }>(`/api/projects/${pid}/time`).then((r) => {
            if (r.success) { setTimeEntries(r.data.entries); setTotalHours(r.data.totalHours); }
        });
        api.get<ActivityLog[]>(`/api/projects/${pid}/activity`).then((r) => { if (r.success) setLogs(r.data); });
        api.get<Attachment[]>(`/api/attachments/project/${pid}`).then((r) => { if (r.success) setAttachments(r.data); });
        api.get<StockItem[]>("/api/stock?limit=500").then((r) => { if (r.success) setStockItems(r.data); });
        api.get<Milestone[]>(`/api/projects/${pid}/milestones`).then((r) => { if (r.success) setMilestones(r.data); });
    };

    useEffect(loadAll, [pid]);

    // Onglet actif lu depuis l'URL ; URL sans onglet -> redirection canonique vers /dashboard
    const { enabled } = useModules();
    const tab: ProjectTabId = PROJECT_TAB_IDS.includes(tabParam as ProjectTabId) ? (tabParam as ProjectTabId) : "dashboard";
    useEffect(() => {
        const valid = tabParam !== undefined && PROJECT_TAB_IDS.includes(tabParam as ProjectTabId);
        const mod = valid ? tabModule(tabParam as ProjectTabId) : null;
        if (!valid || (mod !== null && !enabled(mod))) {
            navigate(`/projects/${pid}/dashboard`, { replace: true });
        }
    }, [tabParam, pid, navigate, enabled]);

    if (error !== null) return <p style={{ color: "var(--danger)" }}>{error}</p>;
    if (project === null) return <p>Chargement...</p>;

    const stockNames: Record<string, string> = {};
    stockItems.forEach((s) => { stockNames[s.id] = `${s.name} (${s.reference})`; });

    return (
        <div>
            <ProjectHeader project={project} milestones={milestones}
                canEdit={user !== null && user.role !== "VIEWER"} onUpdated={loadAll} />
            <div style={{ marginTop: "1.25rem" }}>
                <ProjectTabs active={tab} onChange={(t) => navigate(`/projects/${pid}/${t}`)} />
            </div>
            <ProjectTabsContent tab={tab} pid={pid} project={project} links={links} stockItems={stockItems}
                stockNames={stockNames} milestones={milestones} timeEntries={timeEntries} totalHours={totalHours}
                logs={logs} attachments={attachments} canEdit={user !== null && user.role !== "VIEWER"}
                isAdmin={user?.role === "ADMIN"} onChanged={loadAll} />
        </div>
    );
}
