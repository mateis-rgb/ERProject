// Actions API du drive - pures, sans alert/confirm/prompt (les modals sont gérées par DriveTab) (Power of 10 R2/R4)
import { useState } from "react";
import { api } from "../../services/api";
import { Attachment } from "../../types";

export interface DriveActions {
    busy: boolean;
    uploadFiles: (projectId: string, parentId: string | null, files: File[]) => Promise<string | null>; // null = OK, sinon message d'erreur
    createFolder: (projectId: string, parentId: string | null, name: string) => Promise<void>;
    renameTo: (a: Attachment, name: string) => Promise<void>;
    moveTo: (a: Attachment, targetId: string | null) => Promise<void>;
    remove: (a: Attachment) => Promise<void>;
}

const MAX_DROP_FILES = 50; // borne dure par dépôt (R2)

// Upload d'un fichier vers le dossier parentId (null = racine du projet)
async function uploadOne(projectId: string, parentId: string | null, file: File): Promise<Response | null> {
    const form = new FormData();
    form.append("file", file);
    if (parentId !== null) form.append("parentId", parentId);
    return fetch(`/api/attachments/project/${projectId}`, { method: "POST", credentials: "include", body: form })
        .catch(() => null);
}

export function useDriveActions(): DriveActions {
    const [busy, setBusy] = useState(false);

    const uploadFiles = async (projectId: string, parentId: string | null, files: File[]): Promise<string | null> => {
        const list = files.slice(0, MAX_DROP_FILES); // boucle bornée (R2)
        if (list.length === 0) return null;
        setBusy(true);
        let error: string | null = null;
        for (const f of list) {
            const res = await uploadOne(projectId, parentId, f);
            if (res === null || !res.ok) error = `${f.name}`;
        }
        setBusy(false);
        return error;
    };

    const createFolder = async (projectId: string, parentId: string | null, name: string): Promise<void> => {
        if (name.trim() === "") return;
        await api.post(`/api/attachments/project/${projectId}/folder`, { name: name.trim(), parentId });
    };

    const renameTo = async (a: Attachment, name: string): Promise<void> => {
        if (name.trim() === "" || name === a.fileName) return;
        await api.patch(`/api/attachments/${a.id}`, { fileName: name.trim() });
    };

    const moveTo = async (a: Attachment, targetId: string | null): Promise<void> => {
        if ((a.parentId ?? null) === targetId) return;
        await api.patch(`/api/attachments/${a.id}`, { parentId: targetId });
    };

    const remove = async (a: Attachment): Promise<void> => {
        await api.delete(`/api/attachments/${a.id}`);
    };

    return { busy, uploadFiles, createFolder, renameTo, moveTo, remove };
}
