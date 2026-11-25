// Éditeur de texte du drive (markdown / script / texte) - split view édition + aperçu, sauvegarde PUT (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { Attachment } from "../../types";
import { editorModeFor, EditorMode } from "../../utils/textFiles";
import { useTextContent } from "../../hooks/useTextContent";
import { useEditorInsert } from "../../hooks/useEditorInsert";
import Modal from "../ui/Modal";
import EditorToolbar from "./EditorToolbar";
import ScriptPreview from "./ScriptPreview";
import MarkdownPreview from "./MarkdownPreview";
import { FiSave, FiEye } from "react-icons/fi";

interface Props {
    attachment: Attachment;
    canEdit: boolean;
    onClose: () => void;
    onSaved: () => void;
}

function PreviewPane(p: { mode: EditorMode; src: string }): JSX.Element {
    const { t } = useTranslation();
    if (p.mode === "script") return <ScriptPreview src={p.src} />;
    if (p.mode === "markdown") return <MarkdownPreview src={p.src} />;
    return (
        <pre style={{ margin: 0, padding: "1rem 1.25rem", overflowY: "auto", height: "100%", boxSizing: "border-box", fontFamily: "var(--font-mono)", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
            {p.src || t("editor.emptyDoc")}
        </pre>
    );
}

function EditorFooter(p: {
    tc: ReturnType<typeof useTextContent>; canEdit: boolean; onSave: () => void;
}): JSX.Element {
    const { t } = useTranslation();
    const { tc, canEdit, onSave } = p;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
            {tc.error !== null && <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{tc.error}</span>}
            {!canEdit && <span className="badge" style={{ background: "var(--muted)", color: "#fff" }}>{t("editor.readOnly")}</span>}
            {tc.dirty && canEdit && <span className="mono" style={{ fontSize: "0.72rem", color: "var(--accent)" }}>{t("editor.dirty")}</span>}
            <span className="mono" style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--muted)" }}>
                {tc.content.length} {t("editor.chars")}
            </span>
            {canEdit && (
                <button className="btn" onClick={onSave} disabled={tc.saving || !tc.dirty || tc.loading}>
                    <FiSave /> {tc.saving ? "..." : t("editor.save")}
                </button>
            )}
        </div>
    );
}

export default function TextEditorModal({ attachment, canEdit, onClose, onSaved }: Props): JSX.Element {
    const { t } = useTranslation();
    const tc = useTextContent(attachment.id);
    const mode = editorModeFor(attachment.fileName);
    const ed = useEditorInsert(tc.content, tc.setContent);
    const save = (): void => { void tc.save().then((ok) => { if (ok) onSaved(); }); };

    return (
        <Modal title={`${t("editor.title")} — ${attachment.fileName}`} onClose={onClose} maxWidth="1100px">
            <EditorToolbar mode={mode} disabled={!canEdit || tc.loading}
                canUndo={tc.history.canUndo} canRedo={tc.history.canRedo}
                onInsert={ed.insert} onUndo={tc.history.undo} onRedo={tc.history.redo} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid var(--ink)", marginTop: "0.5rem", height: "55vh" }}>
                <textarea
                    ref={(el) => { ed.areaRef.current = el; }}
                    className="input"
                    readOnly={!canEdit || tc.loading}
                    value={tc.loading ? t("editor.loading") : tc.content}
                    onChange={(e) => { tc.history.noteChange(tc.content); tc.setContent(e.target.value); }}
                    onKeyDown={(e) => ed.onKeyDown(e, { canEdit, mode, dirty: tc.dirty, saving: tc.saving, save, history: tc.history })}
                    spellCheck={false}
                    style={{
                        border: "none", borderRadius: 0, boxShadow: "none", resize: "none",
                        fontFamily: "var(--font-mono)", fontSize: "0.85rem", lineHeight: 1.6,
                        height: "100%", borderRight: "2px solid var(--ink)", background: "var(--bg)",
                    }}
                />
                <div style={{ overflow: "hidden", background: "var(--surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.6rem", borderBottom: "1px solid var(--ink)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                        <FiEye size={12} /> {t("editor.preview")}
                    </div>
                    <div style={{ height: "calc(100% - 28px)" }}>
                        <PreviewPane mode={mode} src={tc.content} />
                    </div>
                </div>
            </div>
            <EditorFooter tc={tc} canEdit={canEdit} onSave={save} />
        </Modal>
    );
}
