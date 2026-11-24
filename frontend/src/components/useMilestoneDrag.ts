// Hook de drag horizontal d'un jalon dans le Gantt (Power of 10 R4)
import { useRef, useState, useCallback } from "react";

interface UseMilestoneDragResult {
    dragging: boolean;
    dayOffset: number; // décalage en jours (aperçu local pendant le drag)
    onMouseDown: (e: React.MouseEvent) => void;
    consumeClick: () => boolean; // true si le clic doit être ignoré (vient d'un drag)
}

export function useMilestoneDrag(pxPerDay: () => number, onCommit: (dayOffset: number) => void): UseMilestoneDragResult {
    const [dragging, setDragging] = useState(false);
    const [dayOffset, setDayOffset] = useState(0);
    const startX = useRef(0);
    const offset = useRef(0);
    const suppressClick = useRef(false);

    const onMove = useCallback((e: MouseEvent): void => {
        const days = Math.round((e.clientX - startX.current) / Math.max(1, pxPerDay()));
        offset.current = days;
        setDayOffset(days);
    }, [pxPerDay]);

    const onUp = useCallback((): void => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setDragging(false);
        if (offset.current !== 0) {
            suppressClick.current = true; // le clic qui suit le drag ne doit pas ouvrir la modale
            onCommit(offset.current);
        }
        offset.current = 0;
        setDayOffset(0);
    }, [onMove, onCommit]);

    const onMouseDown = (e: React.MouseEvent): void => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation(); // ne pas sélectionner le jalon au clic simple
        startX.current = e.clientX;
        offset.current = 0;
        setDragging(true);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const consumeClick = (): boolean => {
        if (suppressClick.current) {
            suppressClick.current = false;
            return true;
        }
        return false;
    };

    return { dragging, dayOffset, onMouseDown, consumeClick };
}
