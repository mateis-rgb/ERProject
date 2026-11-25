// Chargement / sauvegarde du contenu texte d'une pièce jointe (Power of 10 R4)
import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export interface TextContentState {
    content: string;
    setContent: (v: string) => void;
    loading: boolean;
    saving: boolean;
    error: string | null;
    dirty: boolean;
    save: () => Promise<boolean>;
}

export function useTextContent(attachmentId: string): TextContentState {
    const [content, setContent] = useState("");
    const [original, setOriginal] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.get<{ content: string; fileName: string }>(`/api/attachments/content/${attachmentId}`).then((r) => {
            setLoading(false);
            if (r.success) {
                setContent(r.data.content);
                setOriginal(r.data.content);
            } else {
                setError(r.error);
            }
        });
    }, [attachmentId]);

    const save = useCallback(async (): Promise<boolean> => {
        setSaving(true);
        const r = await api.put(`/api/attachments/content/${attachmentId}`, { content });
        setSaving(false);
        if (!r.success) {
            setError(r.error);
            return false;
        }
        setOriginal(content);
        return true;
    }, [attachmentId, content]);

    return { content, setContent, loading, saving, error, dirty: content !== original, save };
}
