// Parser Fountain minimal -> blocs de script typés pour l'aperçu scénarisé (Power of 10 R4)
export type ScriptBlockType = "slug" | "character" | "parenthetical" | "dialogue" | "action" | "transition" | "note" | "empty";

export interface ScriptBlock {
    type: ScriptBlockType;
    text: string;
}

const MAX_CHARACTER_LEN = 60; // heuristique : un "personnage" en majuscules reste court

function isSlugline(line: string): boolean {
    return /^(INT|EXT|INT\.|EXT\.|EST)[\.\s]/i.test(line.trim()) || line.trim().startsWith(".");
}

function isCharacterLine(line: string): boolean {
    const t = line.trim();
    if (t.length === 0 || t.length > MAX_CHARACTER_LEN) return false;
    if (!/[A-ZÀ-ÖØ-Þ]/.test(t)) return false; // au moins une majuscule
    return t === t.toUpperCase();
}

// Une passe sur les lignes ; l'état "inDialogue" suit un bloc personnage
export function parseFountain(src: string): ScriptBlock[] {
    const lines = src.split(/\r?\n/);
    const blocks: ScriptBlock[] = [];
    let inDialogue = false;
    for (const raw of lines) {
        const line = raw.trimEnd();
        const t = line.trim();
        if (t === "") {
            blocks.push({ type: "empty", text: "" });
            inDialogue = false;
            continue;
        }
        if (isSlugline(t)) {
            blocks.push({ type: "slug", text: t.replace(/^\./, "") });
            inDialogue = false;
        } else if (t.startsWith(">")) {
            blocks.push({ type: "transition", text: t.slice(1).trim() });
            inDialogue = false;
        } else if (t.startsWith("[[") && t.endsWith("]]")) {
            blocks.push({ type: "note", text: t.slice(2, -2) });
        } else if (t.startsWith("@")) {
            blocks.push({ type: "character", text: t.slice(1).trim() });
            inDialogue = true;
        } else if (isCharacterLine(t) && !inDialogue) {
            blocks.push({ type: "character", text: t });
            inDialogue = true;
        } else if (t.startsWith("(") && t.endsWith(")") && inDialogue) {
            blocks.push({ type: "parenthetical", text: t });
        } else if (inDialogue) {
            blocks.push({ type: "dialogue", text: t });
        } else {
            blocks.push({ type: "action", text: t });
        }
    }
    return blocks;
}
