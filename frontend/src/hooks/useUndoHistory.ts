// Historique undo/redo pour l'éditeur de texte (snapshots groupés dans le temps, piles bornées) (Power of 10 R4)
import { useCallback, useRef, useState } from "react";

const HISTORY_MAX = 200; // borne des piles (R2)
const HISTORY_GROUP_MS = 800; // frappes rapprochées = un seul pas d'undo

export interface UndoHistory {
    noteChange: (prev: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export function useUndoHistory(content: string, setContent: (v: string) => void): UndoHistory {
    const pastRef = useRef<string[]>([]);
    const futureRef = useRef<string[]>([]);
    const lastPushRef = useRef(0);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const noteChange = useCallback((prev: string): void => {
        const now = Date.now();
        if (now - lastPushRef.current > HISTORY_GROUP_MS) {
            pastRef.current.push(prev);
            if (pastRef.current.length > HISTORY_MAX) pastRef.current.shift();
            lastPushRef.current = now;
            futureRef.current = [];
            setCanUndo(true);
            setCanRedo(false);
        }
    }, []);

    const undo = useCallback((): void => {
        const past = pastRef.current;
        if (past.length === 0) return;
        futureRef.current.push(content);
        setContent(past.pop() as string);
        setCanUndo(past.length > 0);
        setCanRedo(true);
    }, [content, setContent]);

    const redo = useCallback((): void => {
        const future = futureRef.current;
        if (future.length === 0) return;
        pastRef.current.push(content);
        setContent(future.pop() as string);
        setCanRedo(future.length > 0);
        setCanUndo(true);
    }, [content, setContent]);

    return { noteChange, undo, redo, canUndo, canRedo };
}
