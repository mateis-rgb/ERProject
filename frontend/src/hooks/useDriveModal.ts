// Gestion de la modale du drive + dépôts (fichiers / éléments déplacés) - extrait de DriveTab (Power of 10 R4)
import { useState } from "react";
import { Attachment } from "../types";
import { DriveModal } from "../components/drive/DriveModal";
import { DriveActions } from "../components/drive/driveActions";

export interface DriveModalState {
    modal: DriveModal | null;
    value: string;
    setValue: (v: string) => void;
    openModal: (m: DriveModal, v?: string) => void;
    closeModal: () => void;
    confirmModal: () => void;
    onDropFiles: (files: File[], targetId: string | null) => void;
    onDropItem: (id: string, targetId: string | null) => void;
}

export function useDriveModal(projectId: string, parentId: string | null,
    attachments: Attachment[], actions: DriveActions, onChanged: () => void): DriveModalState {
    const [modal, setModal] = useState<DriveModal | null>(null);
    const [value, setValue] = useState("");

    const openModal = (m: DriveModal, v = ""): void => { setValue(v); setModal(m); };
    const closeModal = (): void => setModal(null);

    const confirmModal = (): void => {
        if (modal === null) return;
        const m = modal;
        setModal(null);
        if (m.kind === "folder") void actions.createFolder(projectId, parentId, value).then(onChanged);
        else if (m.kind === "rename") void actions.renameTo(m.item, value).then(onChanged);
        else if (m.kind === "delete") void actions.remove(m.item).then(onChanged);
    };

    const onDropFiles = (files: File[], targetId: string | null): void => {
        void actions.uploadFiles(projectId, targetId, files).then((err) => {
            if (err !== null) openModal({ kind: "error", message: err });
            onChanged();
        });
    };

    const onDropItem = (id: string, targetId: string | null): void => {
        const a = attachments.find((x) => x.id === id);
        if (a !== undefined) void actions.moveTo(a, targetId).then(onChanged);
    };

    return { modal, value, setValue, openModal, closeModal, confirmModal, onDropFiles, onDropItem };
}
