// Détection des fichiers éditables en ligne dans le drive + mode d'éditeur (Power of 10 R4)
export type EditorMode = "markdown" | "script" | "text";

const MD_EXT = [".md", ".markdown"];
const SCRIPT_EXT = [".fountain", ".script"];
const TEXT_EXT = [
    ".txt", ".json", ".csv", ".tsv", ".log", ".xml", ".yml", ".yaml", ".html", ".htm",
    ".css", ".js", ".ts", ".jsx", ".tsx", ".py", ".sh", ".env", ".ini", ".toml", ".sql",
];

function extOf(fileName: string): string {
    const i = fileName.lastIndexOf(".");
    return i >= 0 ? fileName.slice(i).toLowerCase() : "";
}

export function isEditableFile(fileName: string, mimeType: string): boolean {
    const ext = extOf(fileName);
    if (MD_EXT.includes(ext) || SCRIPT_EXT.includes(ext) || TEXT_EXT.includes(ext)) return true;
    return mimeType.startsWith("text/");
}

export function editorModeFor(fileName: string): EditorMode {
    const ext = extOf(fileName);
    if (MD_EXT.includes(ext)) return "markdown";
    if (SCRIPT_EXT.includes(ext)) return "script";
    return "text";
}

export const TEXT_FILE_TYPES: { ext: string; labelKey: string; mime: string }[] = [
    { ext: ".md", labelKey: "editor.typeMd", mime: "text/markdown" },
    { ext: ".txt", labelKey: "editor.typeTxt", mime: "text/plain" },
    { ext: ".fountain", labelKey: "editor.typeScript", mime: "text/plain" },
];
