// Insertion de balises autour de la sélection dans le textarea de l'éditeur + raccourcis clavier (Power of 10 R4)
import { useCallback, useRef } from "react";
import { EditorMode } from "../utils/textFiles";

export interface EditorInsert {
    areaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
    insert: (before: string, after: string, ph: string) => void;
    onKeyDown: (e: React.KeyboardEvent, opts: { canEdit: boolean; mode: EditorMode; dirty: boolean; saving: boolean; save: () => void }) => void;
}

export function useEditorInsert(content: string, setContent: (v: string) => void): EditorInsert {
    const areaRef = useRef<HTMLTextAreaElement>(null);

    const insert = useCallback((before: string, after: string, ph: string): void => {
        const el = areaRef.current;
        if (el === null) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const sel = content.slice(start, end) || ph;
        setContent(content.slice(0, start) + before + sel + after + content.slice(end));
        requestAnimationFrame(() => {
            el.focus();
            el.selectionStart = start + before.length;
            el.selectionEnd = start + before.length + sel.length;
        });
    }, [content, setContent]);

    const onKeyDown = useCallback((e: React.KeyboardEvent, opts: { canEdit: boolean; mode: EditorMode; dirty: boolean; saving: boolean; save: () => void }): void => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            if (opts.canEdit && !opts.saving && opts.dirty) opts.save();
            return;
        }
        if (!opts.canEdit || opts.mode !== "markdown") return;
        if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); insert("**", "**", "gras"); }
        if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); insert("*", "*", "italique"); }
        if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); insert("[", "](https://)", "texte"); }
    }, [insert]);

    return { areaRef, insert, onKeyDown };
}
