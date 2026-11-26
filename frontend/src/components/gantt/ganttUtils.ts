// Utilitaires Gantt - vues semaine/mois/année, semaine ISO, ticks (Power of 10 R2: boucles bornées)
export type GanttView = "week" | "month" | "year";

export const DAY_MS = 24 * 3600 * 1000;
const MAX_TICKS = 600; // borne dure (R2)

// Numéro de semaine ISO 8601
export function isoWeek(d: Date): number {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (t.getUTCDay() + 6) % 7; // lundi = 0
    t.setUTCDate(t.getUTCDate() - dayNum + 3); // jeudi de la semaine
    const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    const fd = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - fd + 3);
    return 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
}

export function pxPerDay(view: GanttView): number {
    if (view === "week") return 14;   // ~98 px / semaine
    if (view === "month") return 5;   // ~150 px / mois
    return 1.2;                        // ~440 px / an
}

export interface GanttRange {
    rangeStart: number;
    rangeMs: number;
    width: number;
    pct: (ts: number) => number;
    pctPerDay: number;
}

// Plage = [début période(min) - padUnits, début de la période suivant fin(max)]
// => la dernière case affichée est la période contenant la fin (ex: fin 01/01/2027 -> case "janv. 2027")
export function computeGanttRange(minTs: number, maxTs: number, view: GanttView, padUnits: number, minWidth = 600): GanttRange {
    const rangeStart = addPeriod(floorPeriod(minTs, view), -padUnits, view);
    const rangeEnd = addPeriod(floorPeriod(maxTs, view), 1, view);
    const rangeMs = rangeEnd - rangeStart;
    return {
        rangeStart,
        rangeMs,
        width: Math.max(minWidth, Math.ceil((rangeMs / DAY_MS) * pxPerDay(view))),
        pct: (ts: number): number => ((ts - rangeStart) / rangeMs) * 100,
        pctPerDay: (100 / rangeMs) * DAY_MS,
    };
}

// Début de la période (lundi / 1er du mois / 1er janvier) contenant t
export function floorPeriod(t: number, view: GanttView): number {
    const d = new Date(t);
    if (view === "week") {
        const day = (d.getDay() + 6) % 7; // lundi = 0
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day).getTime();
    }
    if (view === "month") return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    return new Date(d.getFullYear(), 0, 1).getTime();
}

// Ajoute n périodes calendaires à partir du début de période t (mois/année gérés au calendrier)
export function addPeriod(t: number, n: number, view: GanttView): number {
    const d = new Date(t);
    if (view === "week") return t + n * 7 * DAY_MS;
    if (view === "month") return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
    return new Date(d.getFullYear() + n, 0, 1).getTime();
}

// Aplatit la hiérarchie des jalons : parents d'abord, enfants juste après (itératif - R1, boucle bornée - R2)
// Étape en cours : jalon couvrant "now" (le plus court = le plus spécifique),
// sinon le prochain jalon à démarrer
export function currentMilestone(milestones: import("../../types").Milestone[], now: Date): import("../../types").Milestone | null {
    const covering = milestones
        .filter((m) => new Date(m.startDate) <= now && new Date(m.endDate) >= now)
        .sort((a, b) => (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) - (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()));
    if (covering.length > 0) return covering[0] ?? null;
    const upcoming = milestones
        .filter((m) => new Date(m.startDate) > now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return upcoming[0] ?? null;
}

export interface FlatMilestone { m: import("../../types").Milestone; depth: number }
export function orderMilestones(milestones: import("../../types").Milestone[]): FlatMilestone[] {
    const MAX_DEPTH = 10;
    const byParent = new Map<string | null, import("../../types").Milestone[]>();
    for (const m of milestones.slice(0, MAX_TICKS)) {
        const key = m.parentId !== null && milestones.some((x) => x.id === m.parentId) ? m.parentId : null;
        const list = byParent.get(key) ?? [];
        list.push(m);
        byParent.set(key, list);
    }
    // tri par date de début DESC dans chaque niveau (le plus récent d'abord), hiérarchie parent > enfants conservée
    for (const list of byParent.values()) {
        list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }
    const out: FlatMilestone[] = [];
    const stack: { id: string | null; depth: number }[] = [{ id: null, depth: 0 }];
    while (out.length < MAX_TICKS && stack.length > 0) {
        const cur = stack.pop();
        if (cur === undefined) break;
        const children = byParent.get(cur.id) ?? [];
        for (let i = children.length - 1; i >= 0; i--) { // empilé à l'envers pour garder l'ordre
            const c = children[i];
            if (c === undefined) continue;
            out.push({ m: c, depth: cur.depth });
            if (cur.depth < MAX_DEPTH) stack.push({ id: c.id, depth: cur.depth + 1 });
        }
    }
    return out;
}

// Chemin hiérarchique racine -> jalon (breadcrumb du jalon courant), itératif borné (R1/R2)
export function milestonePath(milestones: import("../../types").Milestone[], m: import("../../types").Milestone): import("../../types").Milestone[] {
    const MAX_DEPTH = 10;
    const byId = new Map(milestones.slice(0, MAX_TICKS).map((x) => [x.id, x] as const));
    const path: import("../../types").Milestone[] = [];
    let cur: import("../../types").Milestone | undefined = m;
    for (let d = 0; d < MAX_DEPTH && cur !== undefined; d++) {
        path.unshift(cur);
        cur = cur.parentId !== null ? byId.get(cur.parentId) : undefined;
    }
    return path;
}

// Géométrie clampée d'une barre de jalon dans [0, 100%]
export function barGeom(s: number, e: number, pct: (t: number) => number): { left: number; width: number } {
    const left = Math.min(100, Math.max(0, pct(s)));
    const right = Math.min(100, Math.max(0, pct(e)));
    return { left, width: Math.max(2, right - left) };
}

// Hachures 45° noires posées sur la couleur du jalon en mode édition (constante, pas de macro - R8)
const HATCH = "repeating-linear-gradient(45deg, rgba(0,0,0,0.30) 0px, rgba(0,0,0,0.30) 2px, transparent 2px, transparent 8px)";

// Style néo-brutaliste de la barre de jalon - pleine couleur en lecture, couleur + hachures en édition
export function barStyle(geom: { left: number; width: number }, color: string, isSel: boolean, busy: boolean, canEdit: boolean, depth = 0): React.CSSProperties {
    return {
        position: "absolute", left: `${geom.left}%`, width: `${geom.width}%`, top: depth > 0 ? "12px" : "8px", height: depth > 0 ? "22px" : "28px",
        backgroundColor: color,
        backgroundImage: canEdit ? HATCH : "none",
        border: isSel ? "3px solid var(--ink)" : "2px solid var(--ink)",
        boxShadow: isSel ? "4px 4px 0 var(--ink)" : "2px 2px 0 var(--ink)",
        cursor: canEdit ? "grab" : "pointer",
        display: "flex", alignItems: "center",
        overflow: "visible", padding: "0 8px",
        fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "0.75rem",
        color: "#000", textAlign: "left", whiteSpace: "nowrap", textOverflow: "ellipsis",
        opacity: busy ? 0.75 : 1,
    };
}

export interface Tick {
    t: number;      // timestamp
    label: string;
    major: boolean;
}

function mondayOf(t: number): number {
    const d = new Date(t);
    const day = (d.getDay() + 6) % 7;
    return t - day * DAY_MS;
}

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// Ticks selon la granularité, bornés à MAX_TICKS, strictement avant rangeEnd (jamais de tick à 100%)
export function buildTicks(rangeStart: number, rangeEnd: number, view: GanttView): Tick[] {
    const ticks: Tick[] = [];
    if (view === "week") {
        let t = mondayOf(rangeStart);
        for (let i = 0; i < MAX_TICKS && t < rangeEnd; i++, t += 7 * DAY_MS) {
            const d = new Date(t);
            ticks.push({ t, label: `S${isoWeek(d)} · ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, major: true });
        }
    } else if (view === "month") {
        const d = new Date(rangeStart);
        let t = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        for (let i = 0; i < MAX_TICKS && t < rangeEnd; i++) {
            const dt = new Date(t);
            ticks.push({ t, label: `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`, major: true });
            t = new Date(dt.getFullYear(), dt.getMonth() + 1, 1).getTime();
        }
    } else {
        const d = new Date(rangeStart);
        let t = new Date(d.getFullYear(), 0, 1).getTime();
        for (let i = 0; i < MAX_TICKS && t < rangeEnd; i++) {
            const dt = new Date(t);
            ticks.push({ t, label: `${dt.getFullYear()}`, major: true });
            t = new Date(dt.getFullYear() + 1, 0, 1).getTime();
        }
    }
    return ticks;
}
