// Header des dates du Gantt - une case par période, toutes identiques (dernière incluse) (Power of 10 R4)
import { Tick } from "./ganttUtils";

interface Props {
    width: number;
    ticks: Tick[];          // bornes des cases, strictement avant rangeEnd
    pct: (t: number) => number;
    rangeEnd: number;       // timestamp de fin de plage (= 100%)
    todayPct: number;
}

export default function GanttHeader(props: Props): JSX.Element {
    const { width, ticks, pct, rangeEnd, todayPct } = props;
    return (
        <div style={{
            position: "relative", height: "36px", width: `${width}px`,
            borderBottom: "2px solid var(--ink)",
            background: "transparent",
        }}>
            {ticks.map((tk, i) => {
                const nextTick = i + 1 < ticks.length ? ticks[i + 1] : undefined;
                const next = nextTick !== undefined ? nextTick.t : rangeEnd;
                const left = pct(tk.t);
                return (
                    <div key={i} style={{
                        position: "absolute", left: `${left}%`, width: `${pct(next) - left}%`,
                        top: 0, bottom: 0, borderLeft: "1px solid var(--ink)",
                        padding: "4px 0 0 6px", whiteSpace: "nowrap", overflow: "hidden",
                        fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                        color: "var(--muted)",
                    }}>
                        {tk.label}
                    </div>
                );
            })}
            <div style={{ position: "absolute", left: `${todayPct}%`, top: 0, bottom: 0, width: "2px", background: "var(--danger)", zIndex: 5 }} />
        </div>
    );
}
