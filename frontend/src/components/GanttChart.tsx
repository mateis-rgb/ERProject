// Diagramme de Gantt custom - vues semaine/mois/année, largeur px explicite, mode lecture/édition (Power of 10 R4)
import { useState } from "react";
import { Milestone } from "../types";
import { useTranslation } from "../i18n/I18nContext";
import GanttBar from "./GanttBar";
import GanttHeader from "./GanttHeader";
import GanttToolbar from "./GanttToolbar";
import { GanttView, DAY_MS, pxPerDay, buildTicks, floorPeriod, addPeriod, orderMilestones } from "./ganttUtils";
import type { ResizeSide } from "./useResizeDrag";

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

interface Range {
    rangeStart: number;
    rangeMs: number;
    width: number;
    pct: (ts: number) => number;
    pctPerDay: number;
}

// Plage = [début période(min) - 1 unité, début période suivante après fin(max)]
// => la dernière case affichée est la période contenant la fin (ex: fin 01/01/2027 -> case "janv. 2027")
function computeRange(milestones: Milestone[], view: GanttView, minDate?: string | null, maxDate?: string | null): Range {
    const bounded = minDate != null && maxDate != null && minDate !== "" && maxDate !== "";
    const starts = bounded ? [new Date(minDate as string).getTime()] : milestones.map((m) => new Date(m.startDate).getTime());
    const ends = bounded ? [new Date(maxDate as string).getTime()] : milestones.map((m) => new Date(m.endDate).getTime());
    const rangeStart = addPeriod(floorPeriod(Math.min(...starts), view), -PAD_UNITS, view);
    const rangeEnd = addPeriod(floorPeriod(Math.max(...ends), view), 1, view);
    const rangeMs = rangeEnd - rangeStart;
    const width = Math.max(MIN_WIDTH, Math.ceil((rangeMs / DAY_MS) * pxPerDay(view)));
    return {
        rangeStart,
        rangeMs,
        width,
        pct: (ts: number): number => ((ts - rangeStart) / rangeMs) * 100,
        pctPerDay: (100 / rangeMs) * DAY_MS,
    };
}

export default function GanttChart(props: Props): JSX.Element {
    const { milestones, selectedId, editMode, minDate, maxDate, onSelect, onMove, onResize } = props;
    const { t } = useTranslation();
    const [view, setView] = useState<GanttView>("week");

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
                    {orderMilestones(milestones).map((fm, i, arr) => (
                        <GanttBar key={fm.m.id} milestone={fm.m} depth={fm.depth} pct={r.pct} pctPerDay={r.pctPerDay}
                            isSel={fm.m.id === selectedId} showBorder={i < arr.length - 1}
                            canEdit={editMode} onSelect={onSelect} onMove={onMove} onResize={onResize} />
                    ))}
                </div>
            </div>
        </div>
    );
}
