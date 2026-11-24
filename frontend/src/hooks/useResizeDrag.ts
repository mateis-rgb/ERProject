// Hook de redimensionnement horizontal d'un jalon (tirettes gauche/droite) (Power of 10 R4)
import { useRef, useState, useCallback } from "react";

export type ResizeSide = "start" | "end";

interface UseResizeDragResult {
    resizing: ResizeSide | null;
    dayOffset: number;
    onMouseDown: (e: React.MouseEvent, side: ResizeSide) => void;
}

export function useResizeDrag(
    pxPerDay: () => number,
    onCommit: (side: ResizeSide, dayOffset: number) => void
): UseResizeDragResult {
    const [resizing, setResizing] = useState<ResizeSide | null>(null);
    const [dayOffset, setDayOffset] = useState(0);
    const startX = useRef(0);
    const offset = useRef(0);
    const side = useRef<ResizeSide>("end");

    const onMove = useCallback((e: MouseEvent): void => {
        const days = Math.round((e.clientX - startX.current) / Math.max(1, pxPerDay()));
        offset.current = days;
        setDayOffset(days);
    }, [pxPerDay]);

    const onUp = useCallback((): void => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setResizing(null);
        if (offset.current !== 0) onCommit(side.current, offset.current);
        offset.current = 0;
        setDayOffset(0);
    }, [onMove, onCommit]);

    const onMouseDown = (e: React.MouseEvent, s: ResizeSide): void => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation(); // ne pas déclencher le drag de la barre ni la sélection
        startX.current = e.clientX;
        offset.current = 0;
        side.current = s;
        setResizing(s);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    return { resizing, dayOffset, onMouseDown };
}
