// Actions sur les jalons du planning (move / resize / delete) avec bornes projet (Power of 10 R4)
import { api } from "../services/api";
import { Milestone, Project } from "../types";
import type { ResizeSide } from "./useResizeDrag";

const DAY_MS = 24 * 3600 * 1000;

// Borne un intervalle aux dates limites du projet
function clampToProject(start: Date, end: Date, project: Project): { start: Date; end: Date } {
    let s = start;
    let e = end;
    if (project.startDate !== null) {
        const min = new Date(project.startDate);
        if (s < min) { const d = min.getTime() - s.getTime(); s = min; e = new Date(e.getTime() + d); }
    }
    if (project.endDate !== null) {
        const max = new Date(project.endDate);
        if (e > max) { const d = e.getTime() - max.getTime(); e = max; s = new Date(s.getTime() - d); }
    }
    return { start: s, end: e };
}

function patchDates(id: string, start: Date, end: Date): Promise<void> {
    return api.patch(`/api/milestones/${id}`, {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
    }).then(() => undefined);
}

export function useMilestoneActions(project: Project, milestones: Milestone[], reload: () => void, confirmDelete: (name: string) => boolean) {
    const find = (id: string): Milestone | undefined => milestones.find((x) => x.id === id);

    const move = async (id: string, dayOffset: number): Promise<void> => {
        const m = find(id);
        if (m === undefined || dayOffset === 0) return;
        const c = clampToProject(
            new Date(new Date(m.startDate).getTime() + dayOffset * DAY_MS),
            new Date(new Date(m.endDate).getTime() + dayOffset * DAY_MS),
            project
        );
        await patchDates(id, c.start, c.end);
        reload();
    };

    const resize = async (id: string, side: ResizeSide, dayOffset: number): Promise<void> => {
        const m = find(id);
        if (m === undefined || dayOffset === 0) return;
        let start = new Date(m.startDate);
        let end = new Date(m.endDate);
        if (side === "start") start = new Date(start.getTime() + dayOffset * DAY_MS);
        else end = new Date(end.getTime() + dayOffset * DAY_MS);
        if (start >= end) { // durée minimale d'un jour
            if (side === "start") start = new Date(end.getTime() - DAY_MS);
            else end = new Date(start.getTime() + DAY_MS);
        }
        const c = clampToProject(start, end, project);
        await patchDates(id, c.start, c.end);
        reload();
    };

    const remove = async (id: string, name: string): Promise<void> => {
        if (!confirmDelete(name)) return;
        await api.delete(`/api/milestones/${id}`);
        reload();
    };

    return { move, resize, remove };
}
