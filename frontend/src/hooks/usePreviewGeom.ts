// Aperçu local (drag/resize) de la géométrie d'une barre de jalon (Power of 10 R4)
import { Milestone } from "../types";
import { barGeom } from "../components/gantt/ganttUtils";
import type { useMilestoneDrag } from "./useMilestoneDrag";
import type { useResizeDrag } from "./useResizeDrag";

const DAY_MS = 24 * 3600 * 1000;

type Drag = ReturnType<typeof useMilestoneDrag>;
type Resize = ReturnType<typeof useResizeDrag>;

export function usePreviewGeom(milestone: Milestone, drag: Drag, resize: Resize,
    pct: (t: number) => number): { left: number; width: number } {
    let s = new Date(milestone.startDate).getTime() + drag.dayOffset * DAY_MS;
    let e = new Date(milestone.endDate).getTime() + drag.dayOffset * DAY_MS;
    if (resize.resizing === "start") s += resize.dayOffset * DAY_MS;
    if (resize.resizing === "end") e += resize.dayOffset * DAY_MS;
    if (e < s) { const tmp = s; s = e; e = tmp; }
    return barGeom(s, e, pct);
}
