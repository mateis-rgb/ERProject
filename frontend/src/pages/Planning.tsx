// Page Planning global - timeline cross-projets + panneau des conflits de stock (Power of 10 R4)
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import { useTranslation } from "../i18n/I18nContext";
import { useModules } from "../context/ModulesContext";
import { api } from "../services/api";
import { Planning, PlanningMilestone, StockConflict } from "../types";
import GanttHeader from "../components/gantt/GanttHeader";
import GanttToolbar from "../components/gantt/GanttToolbar";
import { GanttView, DAY_MS, pxPerDay, buildTicks, floorPeriod, addPeriod, barGeom } from "../components/gantt/ganttUtils";

const MIN_WIDTH = 600;
const LABEL_W = 190;

interface Range {
    rangeStart: number;
    rangeMs: number;
    width: number;
    pct: (ts: number) => number;
}

function computeRange(milestones: PlanningMilestone[], view: GanttView): Range {
    const starts = milestones.map((m) => new Date(m.startDate).getTime());
    const ends = milestones.map((m) => new Date(m.endDate).getTime());
    const rangeStart = addPeriod(floorPeriod(Math.min(...starts), view), -1, view);
    const rangeEnd = addPeriod(floorPeriod(Math.max(...ends), view), 1, view);
    const rangeMs = rangeEnd - rangeStart;
    return {
        rangeStart,
        rangeMs,
        width: Math.max(MIN_WIDTH, Math.ceil((rangeMs / DAY_MS) * pxPerDay(view))),
        pct: (ts: number): number => ((ts - rangeStart) / rangeMs) * 100,
    };
}

interface ProjectGroup {
    projectId: string;
    projectName: string;
    projectStatus: string;
    items: PlanningMilestone[];
}

function groupByProject(milestones: PlanningMilestone[]): ProjectGroup[] {
    const groups: ProjectGroup[] = [];
    const byId = new Map<string, ProjectGroup>();
    for (const m of milestones) {
        let g = byId.get(m.projectId);
        if (g === undefined) {
            g = { projectId: m.projectId, projectName: m.projectName, projectStatus: m.projectStatus, items: [] };
            byId.set(m.projectId, g);
            groups.push(g);
        }
        g.items.push(m);
    }
    return groups;
}

function conflictMilestoneIds(conflicts: StockConflict[]): Set<string> {
    const ids = new Set<string>();
    for (const c of conflicts) {
        ids.add(c.a.milestoneId);
        ids.add(c.b.milestoneId);
    }
    return ids;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR");
}

interface RowProps {
    g: ProjectGroup;
    r: Range;
    conflicted: Set<string>;
}

const LABEL_STYLE: React.CSSProperties = {
    width: `${LABEL_W}px`, flexShrink: 0, position: "sticky", left: 0, zIndex: 6,
    padding: "0.5rem 0.6rem", borderRight: "2px solid var(--ink)", background: "var(--bg)",
    display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.15rem",
};

function ProjectLabel({ g }: { g: ProjectGroup }): JSX.Element {
    return (
        <div style={LABEL_STYLE}>
            <Link to={`/projects/${g.projectId}`} style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--ink)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {g.projectName}
            </Link>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase" }}>{g.projectStatus}</span>
                <span className="badge" style={{ fontSize: "0.62rem" }}>{g.items.length}</span>
            </span>
        </div>
    );
}

function ProjectRow({ g, r, conflicted }: RowProps): JSX.Element {
    return (
        <div style={{ display: "flex", borderBottom: "2px solid var(--ink)", height: "48px" }}>
            <ProjectLabel g={g} />
            <div style={{ position: "relative", width: `${r.width}px`, flexShrink: 0 }}>
                {g.items.map((m) => {
                    const geom = barGeom(new Date(m.startDate).getTime(), new Date(m.endDate).getTime(), r.pct);
                    const isConflict = conflicted.has(m.id);
                    return (
                        <div key={m.id} title={`${m.name} - ${fmtDate(m.startDate)} - ${fmtDate(m.endDate)}`}
                            style={{
                                position: "absolute", left: `${geom.left}%`, width: `${geom.width}%`, top: "10px", height: "28px",
                                backgroundColor: m.color, border: isConflict ? "3px solid var(--danger)" : "2px solid var(--ink)",
                                boxShadow: isConflict ? "3px 3px 0 var(--danger)" : "2px 2px 0 var(--ink)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                            {isConflict && <FiAlertTriangle style={{ color: "#000", flexShrink: 0 }} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ConflictCard({ c }: { c: StockConflict }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="card" style={{ borderColor: "var(--danger)", boxShadow: "4px 4px 0 var(--danger)", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: "0.85rem" }}>
                <FiAlertTriangle style={{ color: "var(--danger)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.68rem", color: "var(--muted)", textTransform: "uppercase" }}>{t("planning.conflictItem")}:</span>
                <Link to={`/stock/${c.stockItemId}`} style={{ color: "var(--ink)" }}>{c.stockItemName}</Link>
            </div>
            <p className="mono" style={{ fontSize: "0.68rem", color: "var(--muted)", margin: "0.3rem 0" }}>
                {c.reference} · {t("planning.quantity")}: {c.quantity}
            </p>
            <p className="mono" style={{ fontSize: "0.72rem", margin: "0.3rem 0" }}>
                {t("planning.conflictOverlap")}: {fmtDate(c.overlapStart)} <FiArrowRight style={{ verticalAlign: "middle" }} /> {fmtDate(c.overlapEnd)}
            </p>
            <p style={{ fontSize: "0.75rem", margin: "0.2rem 0" }}>
                {t("planning.project")} <strong>{c.a.projectName}</strong> — {t("planning.milestone")} {c.a.milestoneName}
            </p>
            <p style={{ fontSize: "0.75rem", margin: "0.2rem 0" }}>
                {t("planning.vs")} {t("planning.project")} <strong>{c.b.projectName}</strong> — {t("planning.milestone")} {c.b.milestoneName}
            </p>
        </div>
    );
}

interface TimelineProps {
    data: Planning;
    view: GanttView;
    onView: (v: GanttView) => void;
}

function PlanningTimeline({ data, view, onView }: TimelineProps): JSX.Element {
    const groups = groupByProject(data.milestones);
    const conflicted = conflictMilestoneIds(data.conflicts);
    const r = computeRange(data.milestones, view);
    const rangeEnd = r.rangeStart + r.rangeMs;
    const ticks = buildTicks(r.rangeStart, rangeEnd, view);
    const todayPct = Math.min(100, Math.max(0, r.pct(Date.now())));
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <GanttToolbar view={view} onView={onView} />
            <div style={{ overflow: "auto", border: "2px solid var(--ink)", background: "var(--surface)" }}>
                <div style={{ display: "inline-block", minWidth: "100%" }}>
                    <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 10 }}>
                        <div style={{ ...LABEL_STYLE, height: "36px", borderBottom: "2px solid var(--ink)", zIndex: 11 }} />
                        <GanttHeader width={r.width} ticks={ticks} pct={r.pct} rangeEnd={rangeEnd} todayPct={todayPct} />
                    </div>
                    {groups.map((g) => <ProjectRow key={g.projectId} g={g} r={r} conflicted={conflicted} />)}
                </div>
            </div>
        </div>
    );
}

function ConflictsPanel({ conflicts }: { conflicts: StockConflict[] }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{ width: "320px", flexShrink: 0 }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", margin: "0 0 0.75rem" }}>
                {t("planning.conflictsTitle")} ({conflicts.length})
            </h2>
            {conflicts.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{t("planning.noConflicts")}</p>
            ) : (
                conflicts.map((c) => <ConflictCard key={`${c.stockItemId}-${c.a.milestoneId}-${c.b.milestoneId}`} c={c} />)
            )}
        </div>
    );
}

export default function PlanningPage(): JSX.Element {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { enabled } = useModules();
    const [data, setData] = useState<Planning | null>(null);
    const [view, setView] = useState<GanttView>("week");

    useEffect(() => {
        if (!enabled("gantt")) navigate("/", { replace: true });
    }, [enabled, navigate]);

    useEffect(() => {
        api.get<Planning>("/api/planning").then((r) => { if (r.success) setData(r.data); });
    }, []);

    if (data === null) return <div />;
    if (data.milestones.length === 0) {
        return (
            <div>
                <h1 className="page-title">{t("planning.title")}</h1>
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "3rem" }}>{t("planning.empty")}</p>
            </div>
        );
    }
    const groups = groupByProject(data.milestones);
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                    <h1 className="page-title">{t("planning.title")}</h1>
                    <p className="page-subtitle">{t("planning.subtitle")} · {groups.length} {t("planning.rows")}</p>
                </div>
            </div>
            <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                <PlanningTimeline data={data} view={view} onView={setView} />
                <ConflictsPanel conflicts={data.conflicts} />
            </div>
        </div>
    );
}
