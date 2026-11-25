// Insertion de balises autour de la sélection + raccourcis clavier usuels + Tab (Power of 10 R4)
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
    tab: (shift: boolean) => void;
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

// Insère before+selection+after à la place de la sélection ; retourne le nouveau texte + la nouvelle sélection
function insertAt(content: string, start: number, end: number, before: string, after: string, ph: string): { text: string; selStart: number; selEnd: number } {
    const sel = content.slice(start, end) || ph;
    return {
        text: content.slice(0, start) + before + sel + after + content.slice(end),
        selStart: start + before.length,
        selEnd: start + before.length + sel.length,
    };
}

// Tab : insère "\t" ; Shift+Tab : retire une tabulation (ou 4 espaces) avant le curseur
function tabEdit(content: string, pos: number, shift: boolean): { text: string; pos: number } | null {
    if (!shift) return { text: content.slice(0, pos) + "\t" + content.slice(pos), pos: pos + 1 };
    const before = content.slice(0, pos);
    const strip = before.endsWith("\t") ? "\t" : before.endsWith("    ") ? "    " : "";
    if (strip === "") return null;
    return { text: content.slice(0, pos - strip.length) + content.slice(pos), pos: pos - strip.length };
}

function focusSelection(areaRef: React.MutableRefObject<HTMLTextAreaElement | null>, selStart: number, selEnd: number): void {
    requestAnimationFrame(() => {
        const el = areaRef.current;
        if (el === null) return;
        el.focus();
        el.selectionStart = selStart;
        el.selectionEnd = selEnd;
    });
}

export function useEditorInsert(content: string, setContent: (v: string) => void): EditorInsert {
    const areaRef = useRef<HTMLTextAreaElement>(null);

    const insert = useCallback((before: string, after: string, ph: string): void => {
        const el = areaRef.current;
        if (el === null) return;
        const r = insertAt(content, el.selectionStart, el.selectionEnd, before, after, ph);
        setContent(r.text);
        focusSelection(areaRef, r.selStart, r.selEnd);
    }, [content, setContent]);

    const tab = useCallback((shift: boolean): void => {
        const el = areaRef.current;
        if (el === null) return;
        const r = tabEdit(content, el.selectionStart, shift);
        if (r === null) return;
        setContent(r.text);
        focusSelection(areaRef, r.pos, r.pos);
    }, [content, setContent]);

    const onKeyDown = useCallback((e: React.KeyboardEvent, opts: KeyOpts): void => {
        if (e.key === "Tab") {
            e.preventDefault();
            if (opts.canEdit) tab(e.shiftKey);
            return;
        }
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
    }, [insert, tab]);

    return { areaRef, insert, tab, onKeyDown };
}
