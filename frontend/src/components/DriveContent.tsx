// Partie "content" du bloc drive - liste scrollable + zone de dépôt (fichiers externes ou pièce jointe) (Power of 10 R4)
import { useState } from "react";
import { Attachment } from "../types";
import { useTranslation } from "../i18n/I18nContext";
import DriveRow from "./DriveRow";
import { ATTACHMENT_MIME } from "./useRowDrag";

interface Props {
    current: Attachment[];
    folders: Attachment[];
    canEdit: boolean;
    parentId: string | null; // dossier courant (cible du dépôt sur le content)
    onOpen: (a: Attachment) => void;
    onRename: (a: Attachment) => void;
    onMove: (a: Attachment, targetId: string | null) => void;
    onRemove: (a: Attachment) => void;
    onDropFiles: (files: File[], targetId: string | null) => void;
    onDropItem: (id: string, targetId: string | null) => void;
}

export default function DriveContent(props: Props): JSX.Element {
    const { current, folders, canEdit, parentId, onOpen, onRename, onMove, onRemove, onDropFiles, onDropItem } = props;
    const { t } = useTranslation();
    const [over, setOver] = useState(false);

    const onDragOver = (e: React.DragEvent): void => {
        if (!canEdit) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = e.dataTransfer.types.includes("Files") ? "copy" : "move";
        setOver(true);
    };

    const onDrop = (e: React.DragEvent): void => {
        if (!canEdit) return;
        e.preventDefault(); setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) { onDropFiles(files, parentId); return; }
        const id = e.dataTransfer.getData(ATTACHMENT_MIME);
        if (id !== "") onDropItem(id, parentId);
    };

    return (
        <div onDragOver={onDragOver} onDragLeave={() => setOver(false)} onDrop={onDrop}
            style={{
                maxHeight: "70vh", overflowY: "auto",
                background: over ? "var(--surface-2)" : "transparent",
                outline: over ? "2px dashed var(--accent)" : "none", outlineOffset: "-2px",
            }}>
            {current.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 1rem", margin: 0 }}>
                    {canEdit ? t("drive.dropHere") : t("drive.empty")}
                </p>
            ) : (
                current.map((a) => (
                    <DriveRow key={a.id} item={a} folders={folders} canEdit={canEdit}
                        onOpen={onOpen} onRename={onRename} onMove={onMove} onRemove={onRemove}
                        onDropFiles={(f, t) => onDropFiles(f, t)} onDropItem={(id, t) => onDropItem(id, t)} />
                ))
            )}
        </div>
    );
}
