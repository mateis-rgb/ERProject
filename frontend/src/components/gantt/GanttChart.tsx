// Diagramme de Gantt custom - vues semaine/mois/année, largeur px explicite, mode lecture/édition (Power of 10 R4)
import { useState } from "react";
import { Milestone } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
import GanttBar from "./GanttBar";
import GanttHeader from "./GanttHeader";
import GanttToolbar from "./GanttToolbar";
import { GanttView, buildTicks, orderMilestones, computeGanttRange, GanttRange, rootIds, childCounts, countDescendants } from "./ganttUtils";
import type { ResizeSide } from "../../hooks/useResizeDrag";

interface Props {
    milestones: Milestone[];
    selectedId: string | null;
    editMode: boolean; // true = drag/resize autorisés (déjà combiné avec canEdit)
    minDate?: string | null; // date de début du projet (borne le Gantt)
    maxDate?: string | null; // date de fin du projet (borne le Gantt)
    onSelect: (id: string) => void;
    onMove: (id: string, dayOffset: number) => void;
    onResize: (id: string, side: ResizeSide, dayOffset: number) => void;
}

const PAD_UNITS = 1; // marge d'une unité de vue avant le début
const MIN_WIDTH = 600;

type Range = GanttRange;

function computeRange(milestones: Milestone[], view: GanttView, minDate?: string | null, maxDate?: string | null): Range {
    const bounded = minDate != null && maxDate != null && minDate !== "" && maxDate !== "";
    const starts = bounded ? [new Date(minDate as string).getTime()] : milestones.map((m) => new Date(m.startDate).getTime());
    const ends = bounded ? [new Date(maxDate as string).getTime()] : milestones.map((m) => new Date(m.endDate).getTime());
    return computeGanttRange(Math.min(...starts), Math.max(...ends), view, PAD_UNITS, MIN_WIDTH);
}

export default function GanttChart(props: Props): JSX.Element {
    const { milestones, selectedId, editMode, minDate, maxDate, onSelect, onMove, onResize } = props;
    const { t } = useTranslation();
    const [view, setView] = useState<GanttView>("week");
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set()); // parents dont les sous-jalons sont repliés

    if (milestones.length === 0) {
        return (
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center", padding: "3rem" }}>
                {t("gantt.empty")}
            </p>
        );
    }

    const r = computeRange(milestones, view, minDate, maxDate);
    const rangeEnd = r.rangeStart + r.rangeMs;
    const ticks = buildTicks(r.rangeStart, rangeEnd, view);
    const todayPct = Math.min(100, Math.max(0, r.pct(Date.now())));

    return (
        <div>
            <GanttToolbar view={view} onView={setView} />
            <div style={{
                overflowX: "auto", border: "2px solid var(--ink)",
                background: "var(--surface)",
                boxShadow: "none",
            }}>
                <GanttHeader width={r.width} ticks={ticks} pct={r.pct} rangeEnd={rangeEnd} todayPct={todayPct} />
                <div style={{ position: "relative", width: `${r.width}px` }}>
                    {/* trait du jour courant sur toute la hauteur du planning (même style que le header) */}
                    <div style={{ position: "absolute", left: `${todayPct}%`, top: 0, bottom: 0, width: "2px", background: "var(--danger)", zIndex: 4, pointerEvents: "none" }} />
                    {(() => {
                        const flat = orderMilestones(milestones, collapsed);
                        const roots = rootIds(milestones);
                        const ccounts = childCounts(milestones);
                        return (
                            <>
                                {flat.map((fm, i, arr) => (
                                    <GanttBar key={fm.m.id} milestone={fm.m} depth={fm.depth} pct={r.pct} pctPerDay={r.pctPerDay}
                                        isSel={fm.m.id === selectedId}
                                        // pas de ligne de séparation à l'intérieur d'un groupe parent + sous-jalons (même racine)
                                        showBorder={i < arr.length - 1 && roots.get(fm.m.id) !== roots.get(arr[i + 1]?.m.id ?? "")}
                                        canEdit={editMode} onSelect={onSelect} onMove={onMove} onResize={onResize}
                                        childCount={ccounts.get(fm.m.id) ?? 0}
                                        isCollapsed={collapsed.has(fm.m.id)}
                                        hiddenCount={collapsed.has(fm.m.id) ? countDescendants(milestones, fm.m.id) : 0}
                                        onToggleCollapse={() => setCollapsed((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(fm.m.id)) next.delete(fm.m.id); else next.add(fm.m.id);
                                            return next;
                                        })}
                                    />
                                ))}
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
