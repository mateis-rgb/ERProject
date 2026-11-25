// Barre d'outils de l'éditeur de texte (markdown / script) - insère des balises autour de la sélection (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { EditorMode } from "../../utils/textFiles";
import {
    FiBold, FiItalic, FiUnderline, FiCode, FiLink, FiImage, FiList, FiType,
    FiMinus, FiGrid, FiMessageSquare, FiFileText, FiCornerDownRight, FiEdit3, FiZap, FiTag,
} from "react-icons/fi";

interface Props {
    mode: EditorMode;
    disabled: boolean;
    onInsert: (before: string, after: string, placeholder: string) => void;
}

interface Tool { icon: React.ComponentType<{ size?: number }>; labelKey: string; before: string; after: string; ph: string; mode: EditorMode | "all" }

const MD_TOOLS: Tool[] = [
    { icon: FiBold, labelKey: "editor.bold", before: "**", after: "**", ph: "gras", mode: "markdown" },
    { icon: FiItalic, labelKey: "editor.italic", before: "*", after: "*", ph: "italique", mode: "markdown" },
    { icon: FiUnderline, labelKey: "editor.strike", before: "~~", after: "~~", ph: "barré", mode: "markdown" },
    { icon: FiType, labelKey: "editor.h1", before: "# ", after: "", ph: "Titre 1", mode: "markdown" },
    { icon: FiType, labelKey: "editor.h2", before: "## ", after: "", ph: "Titre 2", mode: "markdown" },
    { icon: FiType, labelKey: "editor.h3", before: "### ", after: "", ph: "Titre 3", mode: "markdown" },
    { icon: FiList, labelKey: "editor.ul", before: "- ", after: "", ph: "élément", mode: "markdown" },
    { icon: FiList, labelKey: "editor.ol", before: "1. ", after: "", ph: "élément", mode: "markdown" },
    { icon: FiLink, labelKey: "editor.link", before: "[", after: "](https://)", ph: "texte", mode: "markdown" },
    { icon: FiImage, labelKey: "editor.image", before: "![", after: "](https://)", ph: "alt", mode: "markdown" },
    { icon: FiCode, labelKey: "editor.code", before: "`", after: "`", ph: "code", mode: "markdown" },
    { icon: FiMessageSquare, labelKey: "editor.quote", before: "> ", after: "", ph: "citation", mode: "markdown" },
    { icon: FiGrid, labelKey: "editor.table", before: "| Col | Col |\n|---|---|\n| ", after: " |  |", ph: "cellule", mode: "markdown" },
    { icon: FiMinus, labelKey: "editor.hr", before: "\n---\n", after: "", ph: "", mode: "markdown" },
];

const SCRIPT_TOOLS: Tool[] = [
    { icon: FiZap, labelKey: "editor.slug", before: "INT. ", after: " - JOUR", ph: "LIEU", mode: "script" },
    { icon: FiEdit3, labelKey: "editor.character", before: "", after: "\n", ph: "PERSONNAGE", mode: "script" },
    { icon: FiCornerDownRight, labelKey: "editor.parenthetical", before: "(", after: ")", ph: "didascalie", mode: "script" },
    { icon: FiMessageSquare, labelKey: "editor.dialogue", before: "", after: "", ph: "dialogue", mode: "script" },
    { icon: FiFileText, labelKey: "editor.action", before: "", after: "", ph: "action", mode: "script" },
    { icon: FiCornerDownRight, labelKey: "editor.transition", before: "> ", after: "", ph: "CUT TO:", mode: "script" },
    { icon: FiTag, labelKey: "editor.note", before: "[[", after: "]]", ph: "note", mode: "script" },
];

export default function EditorToolbar({ mode, disabled, onInsert }: Props): JSX.Element {
    const { t } = useTranslation();
    const tools = mode === "script" ? SCRIPT_TOOLS : MD_TOOLS;
    return (
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", padding: "0.5rem", borderBottom: "2px solid var(--ink)", background: "var(--surface-2)" }}>
            {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                    <button key={tool.labelKey} type="button" className="btn-ghost" disabled={disabled}
                        title={t(tool.labelKey)}
                        style={{ padding: "0.3rem 0.45rem", display: "inline-flex", alignItems: "center" }}
                        onClick={() => onInsert(tool.before, tool.after, tool.ph)}>
                        <Icon size={15} />
                    </button>
                );
            })}
        </div>
    );
}
