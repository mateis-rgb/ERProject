// Barre d'outils de l'éditeur - chaque bouton a son label au-dessus et le raccourci en dessous (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { EditorMode } from "../../utils/textFiles";
import {
    FiBold, FiItalic, FiUnderline, FiCode, FiLink, FiImage, FiList, FiType,
    FiMinus, FiGrid, FiMessageSquare, FiFileText, FiCornerDownRight, FiEdit3, FiZap, FiTag,
    FiRotateCcw, FiRepeat, FiSlash, FiCornerUpLeft,
} from "react-icons/fi";

interface Props {
    mode: EditorMode;
    disabled: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onInsert: (before: string, after: string, placeholder: string) => void;
    onTab: () => void;
    onUndo: () => void;
    onRedo: () => void;
}

interface Tool {
    icon: React.ComponentType<{ size?: number }>;
    nameKey: string;
    shortcut: string; // "" = pas de raccourci
    before: string;
    after: string;
    ph: string;
}

const mod = (): string => (typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform)) ? "Cmd" : "Ctrl";

const MD_TOOLS: Tool[] = [
    { icon: FiBold, nameKey: "editor.nBold", shortcut: `${mod()}+B`, before: "**", after: "**", ph: "gras" },
    { icon: FiItalic, nameKey: "editor.nItalic", shortcut: `${mod()}+I`, before: "*", after: "*", ph: "italique" },
    { icon: FiUnderline, nameKey: "editor.nUnderline", shortcut: `${mod()}+U`, before: "<u>", after: "</u>", ph: "souligné" },
    { icon: FiSlash, nameKey: "editor.nStrike", shortcut: "", before: "~~", after: "~~", ph: "barré" },
    { icon: FiType, nameKey: "editor.nH1", shortcut: "", before: "# ", after: "", ph: "Titre 1" },
    { icon: FiType, nameKey: "editor.nH2", shortcut: "", before: "## ", after: "", ph: "Titre 2" },
    { icon: FiType, nameKey: "editor.nH3", shortcut: "", before: "### ", after: "", ph: "Titre 3" },
    { icon: FiList, nameKey: "editor.nUl", shortcut: "", before: "- ", after: "", ph: "élément" },
    { icon: FiList, nameKey: "editor.nOl", shortcut: "", before: "1. ", after: "", ph: "élément" },
    { icon: FiLink, nameKey: "editor.nLink", shortcut: `${mod()}+K`, before: "[", after: "](https://)", ph: "texte" },
    { icon: FiImage, nameKey: "editor.nImage", shortcut: "", before: "![", after: "](https://)", ph: "alt" },
    { icon: FiCode, nameKey: "editor.nCode", shortcut: `${mod()}+E`, before: "`", after: "`", ph: "code" },
    { icon: FiCode, nameKey: "editor.nCodeBlock", shortcut: "", before: "```\n", after: "\n```", ph: "code" },
    { icon: FiMessageSquare, nameKey: "editor.nQuote", shortcut: "", before: "> ", after: "", ph: "citation" },
    { icon: FiGrid, nameKey: "editor.nTable", shortcut: "", before: "| Col | Col |\n|---|---|\n| ", after: " |  |", ph: "cellule" },
    { icon: FiMinus, nameKey: "editor.nHr", shortcut: "", before: "\n---\n", after: "", ph: "" },
];

const SCRIPT_TOOLS: Tool[] = [
    { icon: FiZap, nameKey: "editor.nSlug", shortcut: "", before: "INT. ", after: " - JOUR", ph: "LIEU" },
    { icon: FiEdit3, nameKey: "editor.nCharacter", shortcut: "", before: "", after: "\n", ph: "PERSONNAGE" },
    { icon: FiCornerDownRight, nameKey: "editor.nParenthetical", shortcut: "", before: "(", after: ")", ph: "didascalie" },
    { icon: FiMessageSquare, nameKey: "editor.nDialogue", shortcut: "", before: "", after: "", ph: "dialogue" },
    { icon: FiFileText, nameKey: "editor.nAction", shortcut: "", before: "", after: "", ph: "action" },
    { icon: FiCornerDownRight, nameKey: "editor.nTransition", shortcut: "", before: "> ", after: "", ph: "CUT TO:" },
    { icon: FiTag, nameKey: "editor.nNote", shortcut: "", before: "[[", after: "]]", ph: "note" },
];

function ToolButton(p: { tool: Tool; disabled: boolean; onClick: () => void }): JSX.Element {
    const { t } = useTranslation();
    const Icon = p.tool.icon;
    return (
        <button type="button" className="btn-ghost" disabled={p.disabled} title={t(p.tool.nameKey)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", padding: "0.25rem 0.5rem", minWidth: "46px" }}
            onClick={p.onClick}>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1 }}>
                {t(p.tool.nameKey)}
            </span>
            <Icon size={15} />
            <span className="mono" style={{ fontSize: "0.52rem", color: "var(--muted)", lineHeight: 1, minHeight: "0.6em" }}>
                {p.tool.shortcut}
            </span>
        </button>
    );
}

export default function EditorToolbar({ mode, disabled, canUndo, canRedo, onInsert, onTab, onUndo, onRedo }: Props): JSX.Element {
    const tools = mode === "script" ? SCRIPT_TOOLS : MD_TOOLS;
    const historyTools: Tool[] = [
        { icon: FiRotateCcw, nameKey: "editor.nUndo", shortcut: `${mod()}+Z`, before: "", after: "", ph: "" },
        { icon: FiRepeat, nameKey: "editor.nRedo", shortcut: `${mod()}+Shift+Z`, before: "", after: "", ph: "" },
        { icon: FiCornerUpLeft, nameKey: "editor.nTab", shortcut: "Tab", before: "\t", after: "", ph: "" },
    ];
    return (
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", padding: "0.4rem 0.5rem", borderBottom: "2px solid var(--ink)", background: "var(--surface-2)" }}>
            {historyTools.map((tool) => (
                <ToolButton key={tool.nameKey} tool={tool}
                    disabled={disabled || (tool.nameKey === "editor.nUndo" && !canUndo) || (tool.nameKey === "editor.nRedo" && !canRedo)}
                    onClick={() => {
                        if (tool.nameKey === "editor.nUndo") onUndo();
                        else if (tool.nameKey === "editor.nRedo") onRedo();
                        else onTab();
                    }} />
            ))}
            <span style={{ width: "2px", background: "var(--ink)", margin: "0 0.25rem" }} />
            {tools.map((tool) => (
                <ToolButton key={tool.nameKey} tool={tool} disabled={disabled}
                    onClick={() => onInsert(tool.before, tool.after, tool.ph)} />
            ))}
        </div>
    );
}
