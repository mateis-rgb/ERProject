// Section pièces jointes (upload + liste) (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState, useRef } from "react";
import { api } from "../services/api";
import { Attachment } from "../types";

interface Props {
    projectId: string;
    attachments: Attachment[];
    onChanged: () => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1048576).toFixed(1)} Mo`;
}

export default function AttachmentsSection({ projectId, attachments, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const upload = async (): Promise<void> => {
        const file = fileRef.current?.files?.[0];
        if (file === undefined) return;
        setBusy(true);
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/attachments/project/${projectId}`, {
            method: "POST",
            credentials: "include",
            body: form,
        });
        setBusy(false);
        if (res.ok) onChanged();
    };

    const remove = async (id: string): Promise<void> => {
        await api.delete(`/api/attachments/${id}`);
        onChanged();
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>{t("drive.attachments")}</h2>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input ref={fileRef} type="file" style={{ color: "var(--text)", fontSize: "0.875rem", flex: 1 }} />
                <button className="btn" onClick={upload} disabled={busy}>{busy ? "..." : "Upload"}</button>
            </div>
            {attachments.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{t("drive.noFiles")}</p>
            ) : (
                <div style={{ maxHeight: "300px", overflow: "auto" }}>
                    {attachments.map((a) => (
                        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem", padding: "0.375rem 0", borderBottom: "1px solid var(--surface-2)" }}>
                            <a href={`/api/attachments/download/${a.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                                📄 {a.fileName} <span style={{ color: "var(--muted)" }}>({formatSize(a.fileSize)})</span>
                            </a>
                            <button className="btn-danger" style={{ padding: "0.125rem 0.5rem", fontSize: "0.75rem" }} onClick={() => remove(a.id)}>✕</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
