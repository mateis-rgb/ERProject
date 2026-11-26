// Barre de jalon dans le Gantt - drag + tirettes + sous-jalons indentés (Power of 10 R4)
import { useRef } from "react";
import { FiCornerDownRight } from "react-icons/fi";
import { Milestone } from "../../types";
import ResizeHandle from "./ResizeHandle";
import { useMilestoneDrag } from "../../hooks/useMilestoneDrag";
import { useResizeDrag, ResizeSide } from "../../hooks/useResizeDrag";
import { barStyle } from "./ganttUtils";
import { usePreviewGeom } from "../../hooks/usePreviewGeom";

interface Props {
    milestone: Milestone;
    depth: number; // 0 = jalon racine, >0 = sous-jalon (indenté)
    pct: (t: number) => number;
    pctPerDay: number;
    isSel: boolean;
    showBorder: boolean;
    canEdit: boolean;
    onSelect: (id: string) => void;
    onMove: (id: string, dayOffset: number) => void;
    onResize: (id: string, side: ResizeSide, dayOffset: number) => void;
}

export default function GanttBar(props: Props): JSX.Element {
    const { milestone, depth, pct, pctPerDay, isSel, showBorder, canEdit, onSelect, onMove, onResize } = props;
    const laneRef = useRef<HTMLDivElement>(null);

    const pxPerDay = (): number => {
        const w = laneRef.current?.getBoundingClientRect().width ?? 600;
        return Math.max(1, (w * pctPerDay) / 100);
    };

    const drag = useMilestoneDrag(pxPerDay, (d) => onMove(milestone.id, d));
    const resize = useResizeDrag(pxPerDay, (side, d) => onResize(milestone.id, side, d));
    const geom = usePreviewGeom(milestone, drag, resize, pct);
    const busy = drag.dragging || resize.resizing !== null;

    const handleClick = (): void => {
        if (drag.consumeClick()) return;
        onSelect(milestone.id);
    };

    return (
        <div ref={laneRef} style={{
            position: "relative", height: depth > 0 ? "32px" : "44px", // sous-jalons plus compacts (lien visuel avec le parent)
            borderBottom: showBorder ? "1px solid var(--ink)" : "none",
            background: depth > 0 ? "var(--surface-2)" : "transparent",
        }}>
            <button
                onClick={handleClick}
                onMouseDown={canEdit ? drag.onMouseDown : undefined}
                style={barStyle(geom, milestone.color, isSel, busy, canEdit, depth)}
            >
                <span style={{ display: "flex", alignItems: "center", gap: "2px", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flex: 1 }}>
                    {depth > 0 && Array.from({ length: Math.min(depth, 4) }, (_, i) => <FiCornerDownRight key={i} style={{ flexShrink: 0 }} />)}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{milestone.name}</span>
                </span>
                {canEdit && (
                    <>
                        <ResizeHandle side="start" active={resize.resizing === "start"}
                            onMouseDown={(ev, sd) => resize.onMouseDown(ev, sd)} />
                        <ResizeHandle side="end" active={resize.resizing === "end"}
                            onMouseDown={(ev, sd) => resize.onMouseDown(ev, sd)} />
                    </>
                )}
            </button>
        </div>
    );
}
