// Onglet Dashboard d'un projet - KPIs + temps + activité (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { Project, ProjectStockLink, Milestone, Attachment, TimeEntry, ActivityLog } from "../types";
import TimeSection from "./TimeSection";
import ActivitySection from "./ActivitySection";

interface Props {
    project: Project;
    links: ProjectStockLink[];
    milestones: Milestone[];
    attachments: Attachment[];
    timeEntries: TimeEntry[];
    totalHours: number;
    logs: ActivityLog[];
    onChanged: () => void;
}

function fmtBytes(n: number): string {
    if (n < 1024) return `${n} o`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

function nextMilestone(milestones: Milestone[]): Milestone | null {
    const now = Date.now();
    const future = milestones.filter((m) => new Date(m.endDate).getTime() >= now);
    if (future.length === 0) return null;
    return future.reduce((a, b) => (new Date(a.endDate).getTime() <= new Date(b.endDate).getTime() ? a : b));
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }): JSX.Element {
    return (
        <div className="bento-item" style={{ padding: "1rem" }}>
            <div className="mono" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                {label}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>{value}</div>
            {sub !== undefined && (
                <div className="mono" style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "0.15rem" }}>{sub}</div>
            )}
        </div>
    );
}

export default function DashboardTab(props: Props): JSX.Element {
    const { t } = useTranslation();
    const { project, links, milestones, attachments, timeEntries, totalHours, logs, onChanged } = props;
    const allocatedTotal = links.reduce((sum, l) => sum + l.allocatedQuantity, 0);
    const files = attachments.filter((a) => !a.isFolder);
    const usedBytes = files.reduce((sum, a) => sum + a.fileSize, 0);
    const next = nextMilestone(milestones);
    const quotaTxt = project.quotaBytes !== null ? ` / ${fmtBytes(project.quotaBytes)}` : " / " + t("drive.quotaUnlimited");

    return (
        <div style={{ marginTop: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                <Kpi label={t("project.status")} value={project.status} sub={project.client !== "" ? `${t("project.client")}: ${project.client}` : undefined} />
                <Kpi label={t("projectTabs.stock")} value={`${links.length} ${t("project.articles")}`} sub={`${allocatedTotal} ${t("project.unitsAllocated")}`} />
                <Kpi label={t("project.kpiMilestones")} value={`${milestones.length}`} sub={next !== null ? `${t("project.next")}: ${next.name} (${new Date(next.endDate).toLocaleDateString("fr-FR")})` : t("dashboard.noUpcoming")} />
                <Kpi label={t("project.kpiTime")} value={`${totalHours} h`} sub={`${timeEntries.length} ${t("project.entries")}`} />
                <Kpi label={t("projectTabs.drive")} value={`${files.length} ${t("project.files")}`} sub={`${fmtBytes(usedBytes)}${quotaTxt}`} />
                <Kpi label={t("project.budget")} value={project.budget !== null ? `${project.budget} €` : "—"} sub={project.type !== "" ? `${t("project.type")}: ${project.type}` : undefined} />
            </div>
            {project.tags.length > 0 && (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    {project.tags.map((t) => (
                        <span key={t} className="mono" style={{
                            border: "2px solid var(--ink)", padding: "0.15rem 0.5rem",
                            fontSize: "0.7rem", background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 700,
                        }}>{t}</span>
                    ))}
                </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "1.25rem" }}>
                <TimeSection projectId={project.id} entries={timeEntries} totalHours={totalHours} onChanged={onChanged} />
                <ActivitySection logs={logs} />
            </div>
        </div>
    );
}
