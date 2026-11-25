// Section commentaires d'un projet ou d'un jalon, avec @mentions (Power of 10 R4)
import { useEffect, useState } from "react";
import { FiEdit2, FiSend, FiX } from "react-icons/fi";
import { useTranslation } from "../../i18n/I18nContext";
import { useAuth } from "../../context/AppContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/api";
import { Comment } from "../../types";

interface Props {
    projectId: string;
    milestoneId: string | null;
}

// Surligne les @mentions dans le contenu d'un commentaire
function renderContent(content: string): JSX.Element {
    const parts = content.split(/(@[\w.\-@]+)/g);
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

interface CommentItemProps {
    c: Comment;
    canModerate: boolean;
    onChanged: () => void;
}

function CommentItem({ c, canModerate, onChanged }: CommentItemProps): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(c.content);
    const isAuthor = user !== null && user.id === c.authorId;
    const canModify = isAuthor || canModerate;

    const save = (): void => {
        if (draft.trim().length === 0) return;
        api.patch(`/api/comments/${c.id}`, { content: draft.trim() }).then((r) => {
            if (r.success) { setEditing(false); onChanged(); }
        });
    };
    const remove = (): void => {
        api.delete(`/api/comments/${c.id}`).then(() => onChanged());
    };

    return (
        <div style={{ border: "2px solid var(--ink)", padding: "0.6rem 0.75rem", background: "var(--bg)", boxShadow: "3px 3px 0 var(--ink)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <strong style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>{c.authorName}</strong>
                <span className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
                    {new Date(c.createdAt).toLocaleString("fr-FR")}
                    {c.updatedAt !== c.createdAt && ` · ${t("comments.edited")}`}
                </span>
            </div>
            {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.4rem" }}>
                    <textarea className="input" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button className="btn" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }} onClick={save}>{t("comments.save")}</button>
                        <button className="btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }} onClick={() => { setEditing(false); setDraft(c.content); }}>
                            {t("comments.cancel")}
                        </button>
                    </div>
                </div>
            ) : (
                <p style={{ fontSize: "0.85rem", margin: "0.4rem 0 0", whiteSpace: "pre-wrap" }}>{renderContent(c.content)}</p>
            )}
            {canModify && !editing && (
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                    <button className="btn-ghost" style={{ padding: "0.2rem 0.55rem", fontSize: "0.7rem" }} onClick={() => setEditing(true)}>
                        <span className="ic"><FiEdit2 /> {t("comments.edit")}</span>
                    </button>
                    <button className="btn-danger" style={{ padding: "0.2rem 0.55rem", fontSize: "0.7rem" }} onClick={remove}>
                        <span className="ic"><FiX /> {t("comments.delete")}</span>
                    </button>
                </div>
            )}
        </div>
    );
}

interface ComposerProps {
    projectId: string;
    milestoneId: string | null;
    onSent: () => void;
}

function CommentComposer({ projectId, milestoneId, onSent }: ComposerProps): JSX.Element {
    const { t } = useTranslation();
    const [draft, setDraft] = useState("");
    const send = (): void => {
        const content = draft.trim();
        if (content.length === 0) return;
        api.post(`/api/projects/${projectId}/comments`, { content, milestoneId }).then((r) => {
            if (r.success) { setDraft(""); onSent(); }
        });
    };
    return (
        <div>
            <textarea className="input" rows={3} value={draft} placeholder={t("comments.placeholder")}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{t("comments.mentionHint")}</span>
                <button className="btn" onClick={send} disabled={draft.trim().length === 0}>
                    <span className="ic"><FiSend /> {t("comments.send")}</span>
                </button>
            </div>
        </div>
    );
}

export default function CommentsSection({ projectId, milestoneId }: Props): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { socket } = useNotifications();
    const [comments, setComments] = useState<Comment[]>([]);
    const canComment = user !== null && user.role !== "VIEWER";
    const canModerate = user !== null && user.role === "ADMIN";

    const load = (): void => {
        const q = milestoneId !== null ? `?milestoneId=${encodeURIComponent(milestoneId)}` : "";
        api.get<Comment[]>(`/api/projects/${projectId}/comments${q}`).then((r) => {
            if (r.success) setComments(r.data);
        });
    };

    useEffect(load, [projectId, milestoneId]);

    useEffect(() => {
        if (socket === null) return;
        const onEvent = (p: { projectId?: string }): void => {
            if (p.projectId === undefined || p.projectId === projectId) load();
        };
        socket.on("comment:new", onEvent);
        socket.on("comment:deleted", onEvent);
        return () => {
            socket.off("comment:new", onEvent);
            socket.off("comment:deleted", onEvent);
        };
    }, [socket, projectId]);

    return (
        <div className="card" style={{ marginTop: "1.25rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", margin: "0 0 0.75rem" }}>
                {t("comments.title")} ({comments.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.9rem" }}>
                {comments.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>{t("comments.none")}</p>}
                {comments.map((c) => <CommentItem key={c.id} c={c} canModerate={canModerate} onChanged={load} />)}
            </div>
            {canComment && <CommentComposer projectId={projectId} milestoneId={milestoneId} onSent={load} />}
        </div>
    );
}
