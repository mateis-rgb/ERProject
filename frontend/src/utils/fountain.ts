// Parser Fountain (règles du format scénario cinéma) -> blocs typés pour l'aperçu (Power of 10 R4)
// Règles : slugline/perso ont besoin d'une ligne vide avant (sauf début de fichier),
// forçages : "." = slugline, "@" = personnage, "!" = action, ">" = transition, "===" = saut de page,
// notes [[...]] multi-lignes, parenthèses après un personnage, pas de ":" dans un nom de perso.
export type ScriptBlockType = "slug" | "character" | "parenthetical" | "dialogue" | "action" | "transition" | "note" | "pagebreak" | "empty";

export interface ScriptBlock {
    type: ScriptBlockType;
    text: string;
}

const MAX_CHARACTER_LEN = 60;

interface ParseState {
    inDialogue: boolean;
    prevBlank: boolean;
}

// INT. / INT / EXT / EST. / INT./EXT. / INT/EXT — point optionnel
function isSlugline(t: string): boolean {
    return /^(INT|EXT|EST)(\.|\/| |$)/i.test(t) && t.length > 3;
}

function isCharacterLine(t: string): boolean {
    if (t.length === 0 || t.length > MAX_CHARACTER_LEN) return false;
    if (t.includes(":")) return false;
    if (!/[A-ZÀ-ÖØ-Þ]/.test(t)) return false;
    return t === t.toUpperCase();
}

// Classe une ligne non vide (hors note) ; met à jour l'état
function classifyLine(t: string, st: ParseState): ScriptBlock {
    if (t.startsWith(">")) {
        st.inDialogue = false; st.prevBlank = false;
        return { type: "transition", text: t.slice(1).trim() };
    }
    if (t.startsWith("!")) {
        st.inDialogue = false; st.prevBlank = false;
        return { type: "action", text: t.slice(1).trimStart() };
    }
    if (t.startsWith(".") && t.length > 1) {
        st.inDialogue = false; st.prevBlank = false;
        return { type: "slug", text: t.slice(1).trimStart() };
    }
    if (t.startsWith("@")) {
        st.inDialogue = true; st.prevBlank = false;
        return { type: "character", text: t.slice(1).trim() };
    }
    if (st.prevBlank && isSlugline(t)) {
        st.inDialogue = false; st.prevBlank = false;
        return { type: "slug", text: t };
    }
    // Transition spéciale type "FADE IN:" / "CUT TO:" (ligne entière en majuscules finissant par ":")
    if (st.prevBlank && /^[A-Z0-9 .'’-]+:$/.test(t) && /[A-Z]/.test(t)) {
        st.inDialogue = false; st.prevBlank = false;
        return { type: "transition", text: t.slice(0, -1) };
    }
    if (st.prevBlank && isCharacterLine(t)) {
        st.inDialogue = true; st.prevBlank = false;
        return { type: "character", text: t };
    }
    if (st.inDialogue && t.startsWith("(")) {
        st.prevBlank = false;
        return { type: "parenthetical", text: t };
    }
    st.prevBlank = false;
    return { type: st.inDialogue ? "dialogue" : "action", text: t };
}

// Gère les notes [[...]] (potentiellement multi-lignes) ; retourne le bloc note ou null
function parseNoteStart(t: string, blocks: ScriptBlock[]): { inNote: boolean; rest: string } {
    const close = t.indexOf("]]", 2);
    if (close >= 0) {
        blocks.push({ type: "note", text: t.slice(2, close) });
        return { inNote: false, rest: "" };
    }
    return { inNote: true, rest: t.slice(2) + "\n" };
}

export function parseFountain(src: string): ScriptBlock[] {
    const lines = src.split(/\r?\n/);
    const blocks: ScriptBlock[] = [];
    const st: ParseState = { inDialogue: false, prevBlank: true };
    let inNote = false;
    let noteText = "";

    const flushNote = (): void => {
        if (inNote) {
            blocks.push({ type: "note", text: noteText.trim() });
            inNote = false;
            noteText = "";
        }
    };

    for (const raw of lines) {
        const t = raw.trim();
        if (inNote) {
            const close = t.indexOf("]]");
            if (close >= 0) {
                noteText += t.slice(0, close);
                flushNote();
            } else {
                noteText += raw.trimEnd() + "\n";
            }
            continue;
        }
        if (t === "") {
            flushNote();
            blocks.push({ type: "empty", text: "" });
            st.inDialogue = false;
            st.prevBlank = true;
            continue;
        }
        if (t === "===") {
            blocks.push({ type: "pagebreak", text: "" });
            st.inDialogue = false;
            st.prevBlank = false;
            continue;
        }
        if (t.startsWith("[[")) {
            const r = parseNoteStart(t, blocks);
            inNote = r.inNote;
            noteText = r.rest;
            st.inDialogue = false;
            st.prevBlank = false;
            continue;
        }
        blocks.push(classifyLine(t, st));
    }
    flushNote();
    return blocks;
}
