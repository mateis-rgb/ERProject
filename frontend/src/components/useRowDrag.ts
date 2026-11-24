// Drag d'une ligne du drive + dépôt sur un dossier (fichiers externes ou autre pièce jointe) (Power of 10 R2/R4)
import { useState } from "react";
import { Attachment } from "../types";

export const ATTACHMENT_MIME = "application/x-attachment-id";

interface RowDrag {
    draggable: boolean;
    over: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
}

export function useRowDrag(item: Attachment, canEdit: boolean,
    onDropFiles: (files: File[], targetId: string) => void,
    onDropItem: (id: string, targetId: string) => void): RowDrag {
    const [over, setOver] = useState(false);
    const target = canEdit && item.isFolder; // seuls les dossiers sont des cibles de dépôt

    const onDragStart = (e: React.DragEvent): void => {
        if (!canEdit) return;
        e.dataTransfer.setData(ATTACHMENT_MIME, item.id);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: React.DragEvent): void => {
        if (!target) return;
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = e.dataTransfer.types.includes("Files") ? "copy" : "move";
        setOver(true);
    };

    const onDrop = (e: React.DragEvent): void => {
        if (!target) return;
        e.preventDefault(); e.stopPropagation(); setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) { onDropFiles(files, item.id); return; }
        const id = e.dataTransfer.getData(ATTACHMENT_MIME);
        if (id !== "" && id !== item.id) onDropItem(id, item.id);
    };

    return { draggable: canEdit, over, onDragStart, onDragOver, onDragLeave: () => setOver(false), onDrop };
}
