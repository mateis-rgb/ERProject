// Insertion de balises autour de la sélection + raccourcis clavier usuels (undo/redo, mise en forme) (Power of 10 R4)
import { useCallback, useRef } from "react";
import { EditorMode } from "../utils/textFiles";
import { UndoHistory } from "./useUndoHistory";

export interface KeyOpts {
    canEdit: boolean;
    mode: EditorMode;
    dirty: boolean;
    saving: boolean;
    save: () => void;
    history: UndoHistory;
}

export interface EditorInsert {
    areaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
    insert: (before: string, after: string, ph: string) => void;
    onKeyDown: (e: React.KeyboardEvent, opts: KeyOpts) => void;
}

// Raccourcis de mise en forme markdown : mod = Ctrl (Windows/Linux) ou Cmd (mac)
const MD_SHORTCUTS: Record<string, [string, string, string]> = {
    b: ["**", "**", "gras"],
    i: ["*", "*", "italique"],
    u: ["<u>", "</u>", "souligné"],
    k: ["[", "](https://)", "texte"],
    e: ["`", "`", "code"],
};

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

    const onKeyDown = useCallback((e: React.KeyboardEvent, opts: KeyOpts): void => {
        const mod = e.ctrlKey || e.metaKey;
        if (!mod) return;
        const key = e.key.toLowerCase();
        if (key === "s") {
            e.preventDefault();
            if (opts.canEdit && !opts.saving && opts.dirty) opts.save();
            return;
        }
        if (key === "z" && !e.shiftKey) { e.preventDefault(); opts.history.undo(); return; }
        if ((key === "z" && e.shiftKey) || key === "y") { e.preventDefault(); opts.history.redo(); return; }
        if (!opts.canEdit) return;
        if (key === "enter") { e.preventDefault(); insert("\n\n", "", ""); return; }
        const md = MD_SHORTCUTS[key];
        if (md !== undefined && opts.mode === "markdown") {
            e.preventDefault();
            insert(md[0], md[1], md[2]);
        }
    }, [insert]);

    return { areaRef, insert, onKeyDown };
}
