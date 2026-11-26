// Page Planning global - timeline cross-projets + panneau des conflits de stock (Power of 10 R4)
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import { useTranslation } from "../i18n/I18nContext";
import { useModules } from "../context/ModulesContext";
import { api } from "../services/api";
import { Planning, PlanningMilestone, PlanningProject, StockConflict } from "../types";
import GanttHeader from "../components/gantt/GanttHeader";
import GanttToolbar from "../components/gantt/GanttToolbar";
import { ProgressBar } from "../components/ui/ProgressBar";
import { computeProgress } from "../utils/progress";
import { GanttView, DAY_MS, buildTicks, barGeom, computeGanttRange, GanttRange } from "../components/gantt/ganttUtils";

const MIN_WIDTH = 600;
const LABEL_W = "clamp(110px, 20vw, 190px)"; // colonne fluide selon la largeur de fenêtre

type Range = GanttRange;

interface ProjectGroup {
    projectId: string;
    projectName: string;
    projectStatus: string;
    items: PlanningMilestone[];
    start: number | null; // dates propres du projet, sinon min/max des jalons, sinon null (pas de barre)
    end: number | null;
    progress: number; // 0..100 : basé sur les dates du projet, sinon sur les jalons écoulés
}

// Un groupe par projet actif ; la barre couvre les dates du projet (fallback: span des jalons)
function groupByProject(projects: PlanningProject[], milestones: PlanningMilestone[]): ProjectGroup[] {
    return projects.map((p) => {
        const items = milestones.filter((m) => m.projectId === p.id);
        let start: number | null = p.startDate !== null ? new Date(p.startDate).getTime() : null;
        let end: number | null = p.endDate !== null ? new Date(p.endDate).getTime() : null;
        if (start === null || end === null) {
            for (const m of items) {
                const s = new Date(m.startDate).getTime();
                const e = new Date(m.endDate).getTime();
                if (start === null || s < start) start = s;
                if (end === null || e > end) end = e;
            }
        }
        const progress = computeProgress(p.startDate, p.endDate, items.map((m) => m.endDate)) ?? 0;
        return { projectId: p.id, projectName: p.name, projectStatus: p.status, items, start, end, progress };
    });
}

// Plage du planning : bornes des projets datés, sinon span des jalons, sinon fenêtre autour d'aujourd'hui
function computeRange(groups: ProjectGroup[], milestones: PlanningMilestone[], view: GanttView): Range {
    const dated = groups.filter((g) => g.start !== null && g.end !== null);
    if (dated.length > 0) {
        const starts = dated.map((g) => g.start as number);
        const ends = dated.map((g) => g.end as number);
        return computeGanttRange(Math.min(...starts), Math.max(...ends), view, 1, MIN_WIDTH);
    }
    if (milestones.length > 0) {
        const starts = milestones.map((m) => new Date(m.startDate).getTime());
        const ends = milestones.map((m) => new Date(m.endDate).getTime());
        return computeGanttRange(Math.min(...starts), Math.max(...ends), view, 1, MIN_WIDTH);
    }
    const now = Date.now();
    return computeGanttRange(now - 30 * DAY_MS, now + 90 * DAY_MS, view, 1, MIN_WIDTH);
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
    last: boolean;
}

// Bande "projet" : couvre toute la durée du projet, les jalons passent dans la ligne du dessous
const PROJECT_HATCH = "repeating-linear-gradient(45deg, var(--muted) 0px, var(--muted) 2px, transparent 2px, transparent 7px)";



const LABEL_STYLE: React.CSSProperties = {
    width: LABEL_W, flexShrink: 0, position: "sticky", left: 0, zIndex: 6,
    padding: "0.5rem 0.6rem", borderRight: "var(--border-w) solid var(--ink)", background: "var(--bg)",
    display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.15rem",
    overflow: "hidden", boxSizing: "border-box",
};

function ProjectLabel({ g }: { g: ProjectGroup }): JSX.Element {
    const dates = g.start !== null && g.end !== null
        ? `${fmtDate(new Date(g.start).toISOString())} - ${fmtDate(new Date(g.end).toISOString())}`
        : null;
    return (
        <div style={LABEL_STYLE}>
            <span style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", minWidth: 0 }}>
                <Link to={`/projects/${g.projectId}`} style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--ink)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {g.projectName}
                </Link>
                <span className="mono" style={{ fontSize: "0.6rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, fontWeight: 700 }}>
                    {g.projectStatus}
                </span>
            </span>
            <ProgressBar value={g.progress} width={64} />
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.35rem" }}>
                <span className="mono" style={{ fontSize: "0.6rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dates ?? "—"}
                </span>
                <span className="badge" style={{ fontSize: "0.62rem", flexShrink: 0 }}>{g.items.length}</span>
            </span>
        </div>
    );
}

// Titre du projet dans la barre : sticky (scroll horizontal) mais contraint par la barre
// => il suit le scroll tant que la barre est visible, et reste dans la barre sinon
interface BarProps {
    g: ProjectGroup;
    r: Range;
    hasConflict: boolean;
}

function ProjectBar({ g, r, hasConflict }: BarProps): JSX.Element | null {
    if (g.start === null || g.end === null) return null;
    const geom = barGeom(g.start, g.end, r.pct);
    const title = `${g.projectName} - ${fmtDate(new Date(g.start).toISOString())} - ${fmtDate(new Date(g.end).toISOString())}`;
    return (
        <div title={title}
            style={{
                position: "absolute", left: `${geom.left}%`, width: `${geom.width}%`, top: "18px", height: "28px",
                boxSizing: "border-box",
                backgroundColor: "var(--surface-2)", backgroundImage: PROJECT_HATCH,
                border: hasConflict ? "3px solid var(--danger)" : "var(--border-w) solid var(--ink)",
                boxShadow: hasConflict ? "3px 3px 0 var(--danger)" : "var(--shadow-btn)",
            }} />
    );
}

function ProjectRow({ g, r, conflicted, last }: RowProps): JSX.Element {
    const hasConflict = g.items.some((m) => conflicted.has(m.id));
    return (
        <div style={{ display: "flex", borderBottom: last ? "none" : "var(--border-w) solid var(--ink)", height: "64px" }}>
            <ProjectLabel g={g} />
            <div style={{ position: "relative", width: `${r.width}px`, flexShrink: 0 }}>
                <ProjectBar g={g} r={r} hasConflict={hasConflict} />
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
    const groups = groupByProject(data.projects, data.milestones);
    const conflicted = conflictMilestoneIds(data.conflicts);
    const r = computeRange(groups, data.milestones, view);
    const rangeEnd = r.rangeStart + r.rangeMs;
    const ticks = buildTicks(r.rangeStart, rangeEnd, view);
    const todayPct = Math.min(100, Math.max(0, r.pct(Date.now())));
    return (
        <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <GanttToolbar view={view} onView={onView} />
            <div style={{ overflow: "auto", border: "var(--border-w) solid var(--ink)", background: "var(--surface)" }}>
                <div style={{ display: "inline-block", minWidth: "100%" }}>
                    <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 10 }}>
                        <div style={{ ...LABEL_STYLE, height: "36px", borderBottom: "var(--border-w) solid var(--ink)", zIndex: 11 }} />
                        <GanttHeader width={r.width} ticks={ticks} pct={r.pct} rangeEnd={rangeEnd} todayPct={todayPct} />
					</div>
                    
                    {groups.map((g, i) => <ProjectRow key={g.projectId} g={g} r={r} conflicted={conflicted} last={i === groups.length - 1} />)}
                </div>
            </div>
        </div>
    );
}

function ConflictsPanel({ conflicts }: { conflicts: StockConflict[] }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{ flex: "1 1 300px", minWidth: 260, maxWidth: "360px" }}>
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
    if (data.projects.length === 0) {
        return (
            <div>
                <h1 className="page-title">{t("planning.title")}</h1>
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "3rem" }}>{t("planning.empty")}</p>
            </div>
        );
    }
    const groups = groupByProject(data.projects, data.milestones);
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                    <h1 className="page-title">{t("planning.title")}</h1>
                    <p className="page-subtitle">{t("planning.subtitle")} · {groups.length} {t("planning.rows")}</p>
                </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "flex-start" }}>
                <PlanningTimeline data={data} view={view} onView={setView} />
                <ConflictsPanel conflicts={data.conflicts} />
            </div>
        </div>
    );
}
