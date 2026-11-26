// Section commentaires (projet/jalon ou article stock) - autocomplétion @ + @all (Power of 10 R4)
import { useEffect, useRef, useState } from "react";
import { FiEdit2, FiSend, FiX } from "react-icons/fi";
import { useTranslation } from "../../i18n/I18nContext";
import { useAuth } from "../../context/AppContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/api";
import Modal from "../ui/Modal";
import ConfirmModal from "../ui/ConfirmModal";
import { Comment, CommentScope, MentionCandidates } from "../../types";

const MAX_SUGGESTIONS = 8;
const SECTION_H2: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", margin: "0 0 1rem" };

function listUrl(scope: CommentScope): string {
    if (scope.kind === "stock") return `/api/stock/${scope.stockItemId}/comments`;
    const q = scope.milestoneId !== null ? `?milestoneId=${encodeURIComponent(scope.milestoneId)}` : "";
    return `/api/projects/${scope.projectId}/comments${q}`;
}

function candidatesUrl(scope: CommentScope): string {
    return scope.kind === "stock"
        ? `/api/mention-candidates/stock/${scope.stockItemId}`
        : `/api/mention-candidates/project/${scope.projectId}`;
}

function matchesScope(scope: CommentScope, p: { projectId?: string | null; stockItemId?: string | null }): boolean {
    if (scope.kind === "stock") return p.stockItemId === scope.stockItemId;
    return p.projectId === scope.projectId;
}

// Surligne les @mentions dans le contenu d'un commentaire
function renderContent(content: string): JSX.Element {
    const parts = content.split(/(@[^\s@.,;:!?]+)/g);
    return (
        <>
            {parts.map((p, i) =>
                p.startsWith("@") ? (
                    <strong key={i} style={{ color: "var(--accent)" }}>{p}</strong>
                ) : (
                    <span key={i}>{p}</span>
                ),
            )}
        </>
    );
}

interface ItemProps {
    c: Comment;
    canModerate: boolean;
    onChanged: () => void;
    onEdit: () => void;
}

function CommentItem({ c, canModerate, onChanged, onEdit }: ItemProps): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [confirming, setConfirming] = useState(false);
    const isAuthor = user !== null && user.id === c.authorId;
    const canModify = isAuthor || canModerate;

    const remove = (): void => {
        setConfirming(false);
        api.delete(`/api/comments/${c.id}`).then(() => onChanged());
    };

    return (
        <div style={{ border: "var(--border-w) solid var(--ink)", padding: "0.6rem 0.75rem", background: "var(--bg)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <strong style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>{c.authorName}</strong>
                <span className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
                    {new Date(c.createdAt).toLocaleString("fr-FR")}
                    {c.updatedAt !== c.createdAt && ` · ${t("comments.edited")}`}
                </span>
            </div>
            <p style={{ fontSize: "0.85rem", margin: "0.4rem 0 0", whiteSpace: "pre-wrap" }}>{renderContent(c.content)}</p>
            {canModify && (
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                    <button className="btn-ghost" style={{ padding: "0.2rem 0.55rem", fontSize: "0.7rem" }} onClick={onEdit}>
                        <span className="ic"><FiEdit2 /> {t("comments.edit")}</span>
                    </button>
                    <button className="btn-danger" style={{ padding: "0.2rem 0.55rem", fontSize: "0.7rem" }} onClick={() => setConfirming(true)}>
                        <span className="ic"><FiX /> {t("comments.delete")}</span>
                    </button>
                </div>
            )}
            {confirming && (
                <ConfirmModal danger title={t("modals.deleteCommentTitle")} message={t("common.irreversible")}
                    onConfirm={remove} onCancel={() => setConfirming(false)} />
            )}
        </div>
    );
}

interface Suggestion {
    label: string; // texte inséré après @
    sub: string;
}

interface ComposerProps {
    scope: CommentScope;
    candidates: MentionCandidates | null;
    onSent: () => void;
}

// Détecte un "@query" en cours de saisie juste avant le curseur
function activeMention(value: string, cursor: number): { start: number; query: string } | null {
    const before = value.slice(0, cursor);
    const m = before.match(/@([^\s@]*)$/);
    if (m === null || m.index === undefined) return null;
    return { start: m.index, query: m[1] ?? "" };
}

function filterSuggestions(candidates: MentionCandidates | null, query: string): Suggestion[] {
    if (candidates === null) return [];
    const q = query.toLowerCase();
    const out: Suggestion[] = [];
    if (candidates.allowAll && "all".startsWith(q)) out.push({ label: "all", sub: "all" });
    for (const u of candidates.users) {
        if (out.length >= MAX_SUGGESTIONS) break;
        if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
            out.push({ label: u.name, sub: u.email });
        }
    }
    return out;
}

function MentionDropdown(props: {
    suggestions: Suggestion[];
    active: number;
    onPick: (s: Suggestion) => void;
}): JSX.Element {
    const { t } = useTranslation();
    if (props.suggestions.length === 0) return <></>;
    return (
        <div style={{
            position: "absolute", left: 0, right: 0, bottom: "100%", marginBottom: "4px", zIndex: 30,
            border: "var(--border-w) solid var(--ink)", background: "var(--surface)", boxShadow: "var(--shadow-sm)",
            maxHeight: "180px", overflowY: "auto",
        }}>
            {props.suggestions.map((s, i) => (
                <div key={s.label} onMouseDown={(e) => { e.preventDefault(); props.onPick(s); }}
                    style={{
                        padding: "0.4rem 0.6rem", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: "0.5rem",
                        background: i === props.active ? "var(--accent)" : "transparent", fontSize: "0.8rem",
                    }}>
                    <strong>@{s.label}</strong>
                    <span className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
                        {s.label === "all" ? t("comments.allUsers") : s.sub}
                    </span>
                </div>
            ))}
        </div>
    );
}

// Navigation clavier du dropdown de mentions (retourne true si la touche est consommée)
function mentionKeyNav(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    open: boolean,
    suggestions: Suggestion[],
    active: number,
    setActive: (n: number) => void,
    pick: (s: Suggestion) => void,
    close: () => void
): boolean {
    if (!open) return false;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % suggestions.length); return true; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + suggestions.length) % suggestions.length); return true; }
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const s = suggestions[active];
        if (s !== undefined) pick(s);
        return true;
    }
    if (e.key === "Escape") { e.preventDefault(); close(); return true; }
    return false;
}

// État du composer : brouillon + autocomplétion @ + envoi
function useComposer(scope: CommentScope, candidates: MentionCandidates | null, onSent: () => void, initial: string, editId: string | null): {
    draft: string; taRef: React.RefObject<HTMLTextAreaElement | null>; open: boolean;
    suggestions: Suggestion[]; active: number;
    updateDraft: (v: string, cursor: number) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    pick: (s: Suggestion) => void;
    send: () => void;
} {
    const [draft, setDraft] = useState(initial);
    const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
    const [active, setActive] = useState(0);
    const taRef = useRef<HTMLTextAreaElement>(null);

    const suggestions = mention !== null ? filterSuggestions(candidates, mention.query) : [];
    const open = mention !== null && suggestions.length > 0;

    const updateDraft = (value: string, cursor: number): void => {
        setDraft(value);
        setMention(activeMention(value, cursor));
        setActive(0);
    };

    const pick = (s: Suggestion): void => {
        if (mention === null) return;
        const cursor = taRef.current?.selectionStart ?? draft.length;
        const next = `${draft.slice(0, mention.start)}@${s.label} ${draft.slice(cursor)}`;
        setDraft(next);
        setMention(null);
        const pos = mention.start + s.label.length + 2;
        requestAnimationFrame(() => {
            taRef.current?.focus();
            taRef.current?.setSelectionRange(pos, pos);
        });
    };

    const send = (): void => {
        const content = draft.trim();
        if (content.length === 0) return;
        if (editId !== null) {
            api.patch(`/api/comments/${editId}`, { content }).then((r) => { if (r.success) onSent(); });
            return;
        }
        const body = scope.kind === "stock" ? { content } : { content, milestoneId: scope.milestoneId };
        api.post(listUrl(scope), body).then((r) => {
            if (r.success) { setDraft(""); setMention(null); onSent(); }
        });
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (mentionKeyNav(e, open, suggestions, active, setActive, pick, () => setMention(null))) return;
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            send();
        }
    };

    return { draft, taRef, open, suggestions, active, updateDraft, onKeyDown, pick, send };
}

function CommentComposer({ scope, candidates, onSent, onClose, title, initial, editId }: ComposerProps & { onClose: () => void; title: string; initial?: string; editId?: string | null }): JSX.Element {
    const { t } = useTranslation();
    const c = useComposer(scope, candidates, onSent, initial ?? "", editId ?? null);

    return (
        <Modal title={title} onClose={onClose}>
            <div style={{ position: "relative" }}>
                <MentionDropdown suggestions={c.open ? c.suggestions : []} active={c.active} onPick={c.pick} />
                <textarea ref={c.taRef as React.RefObject<HTMLTextAreaElement>} className="input" rows={5} value={c.draft} placeholder={t("comments.placeholder")}
                    onChange={(e) => c.updateDraft(e.target.value, e.target.selectionStart)}
                    onKeyDown={c.onKeyDown} autoFocus />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{t("comments.mentionHint")}</span>
                    <button className="btn" onClick={c.send} disabled={c.draft.trim().length === 0}>
                        <span className="ic"><FiSend /> {t("comments.send")}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default function CommentsSection({ scope, embedded = false }: { scope: CommentScope; embedded?: boolean }): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { socket } = useNotifications();
    const [comments, setComments] = useState<Comment[]>([]);
    const [candidates, setCandidates] = useState<MentionCandidates | null>(null);
    const [composer, setComposer] = useState<{ mode: "new" } | { mode: "edit"; c: Comment } | null>(null);
    const canComment = user !== null && user.role !== "VIEWER";
    const canModerate = user !== null && user.role === "ADMIN";

    const load = (): void => {
        api.get<Comment[]>(listUrl(scope)).then((r) => { if (r.success) setComments(r.data); });
    };

    useEffect(load, [scope.kind, JSON.stringify(scope)]);

    useEffect(() => {
        api.get<MentionCandidates>(candidatesUrl(scope)).then((r) => { if (r.success) setCandidates(r.data); });
    }, [scope.kind, JSON.stringify(scope)]);

    useEffect(() => {
        if (socket === null) return;
        const onEvent = (p: { projectId?: string | null; stockItemId?: string | null }): void => {
            if (matchesScope(scope, p)) load();
        };
        socket.on("comment:new", onEvent);
        socket.on("comment:deleted", onEvent);
        return () => {
            socket.off("comment:new", onEvent);
            socket.off("comment:deleted", onEvent);
        };
    }, [socket, scope.kind, JSON.stringify(scope)]);

    const wrap = embedded
        ? { style: { marginTop: "1.25rem", borderTop: "2px solid var(--ink)", paddingTop: "1rem" } as React.CSSProperties, cls: "" }
        : { style: { marginTop: "1.25rem" } as React.CSSProperties, cls: "card" };
    return (
        <div className={wrap.cls} style={wrap.style}>
            <h2 style={SECTION_H2}>
                {t("comments.title")} ({comments.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.9rem" }}>
                {comments.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>{t("comments.none")}</p>}
                {comments.map((c) => <CommentItem key={c.id} c={c} canModerate={canModerate} onChanged={load}
                    onEdit={() => setComposer({ mode: "edit", c })} />)}
            </div>
            {canComment && (
                <button className="btn" onClick={() => setComposer({ mode: "new" })}>+ {t("modals.addCommentTitle")}</button>
            )}
            {composer !== null && (
                <CommentComposer scope={scope} candidates={candidates} onClose={() => setComposer(null)}
                    onSent={() => { load(); setComposer(null); }}
                    title={composer.mode === "new" ? t("modals.addCommentTitle") : t("modals.editCommentTitle")}
                    initial={composer.mode === "edit" ? composer.c.content : ""}
                    editId={composer.mode === "edit" ? composer.c.id : null} />
            )}
        </div>
    );
}
