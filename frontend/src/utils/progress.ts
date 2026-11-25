export function computeProgress(
    startDate: string | null,
    endDate: string | null,
    milestoneEnds: string[],
    now: Date = new Date(),
): number | null {
    if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
        const t = now.getTime();
        const pct = ((t - start) / (end - start)) * 100;
        return Math.max(0, Math.min(100, Math.round(pct)));
    }
    if (milestoneEnds.length > 0) {
        const ends = milestoneEnds.map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t));
        if (ends.length === 0) return null;
        const done = ends.filter((t) => t <= now.getTime()).length;
        return Math.round((done / ends.length) * 100);
    }
    return null;
}
