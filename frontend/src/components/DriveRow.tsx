// Ligne du drive en grid - draggable, et cible de dépôt si c'est un dossier (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { Attachment } from "../types";
import { formatSize } from "./DriveTab";
import { driveCols, driveRowCell } from "./driveStyles";
import { useRowDrag } from "./useRowDrag";

interface Props {
    item: Attachment;
    folders: Attachment[];
    canEdit: boolean;
    onOpen: (a: Attachment) => void;
    onRename: (a: Attachment) => void;
    onMove: (a: Attachment, targetId: string | null) => void;
    onRemove: (a: Attachment) => void;
    onDropFiles: (files: File[], targetId: string) => void;
    onDropItem: (id: string, targetId: string) => void;
}

export default function DriveRow(props: Props): JSX.Element {
    const { item, folders, canEdit, onOpen, onRename, onMove, onRemove, onDropFiles, onDropItem } = props;
    const { t } = useTranslation();
    const drag = useRowDrag(item, canEdit, onDropFiles, onDropItem);
    return (
        <div draggable={drag.draggable} onDragStart={drag.onDragStart}
            onDragOver={drag.onDragOver} onDragLeave={drag.onDragLeave} onDrop={drag.onDrop}
            title={item.isFolder && canEdit ? t("drive.dropInFolder") : undefined}
            style={{
                display: "grid", gridTemplateColumns: driveCols(canEdit), alignItems: "center",
                borderBottom: "1px solid var(--ink)", background: drag.over ? "var(--surface-2)" : "transparent",
                outline: drag.over ? "2px dashed var(--accent)" : "none", outlineOffset: "-2px",
                cursor: drag.draggable ? "grab" : "default",
            }}>
            <div style={driveRowCell}>
                {item.isFolder ? (
                    <button className="btn-ghost" style={{ padding: "0.15rem 0.5rem", fontSize: "0.78rem" }}
                        onClick={() => onOpen(item)}>
                        📁 {item.fileName}
                    </button>
                ) : (
                    <a href={`/api/attachments/download/${item.id}`} style={{ color: "var(--accent)", fontWeight: 700 }}>
                        📄 {item.fileName}
                    </a>
                )}
            </div>
            <div style={{ ...driveRowCell }} className="mono">{item.isFolder ? "—" : formatSize(item.fileSize)}</div>
            <div style={{ ...driveRowCell, fontSize: "0.8rem" }}>{item.uploadedByName}</div>
            <div style={{ ...driveRowCell }} className="mono">{new Date(item.uploadedAt).toLocaleDateString("fr-FR")}</div>
            {canEdit && (
                <div style={driveRowCell}>
                    <select className="select" style={{ width: "auto", fontSize: "0.72rem" }}
                        value={item.parentId ?? ""}
                        onChange={(e) => onMove(item, e.target.value === "" ? null : e.target.value)}>
                        <option value="">{t("drive.root")}</option>
                        {folders.filter((f) => f.id !== item.id).map((f) => (
                            <option key={f.id} value={f.id}>{f.fileName}</option>
                        ))}
                    </select>
                </div>
            )}
            {canEdit && (
                <div style={driveRowCell}>
                    <button className="btn-ghost" style={{ padding: "0.1rem 0.4rem", fontSize: "0.72rem", marginRight: "0.3rem" }}
                        onClick={() => onRename(item)}>✎</button>
                    <button className="btn-danger" style={{ padding: "0.1rem 0.4rem", boxShadow: "2px 2px 0 var(--danger)" }}
                        onClick={() => onRemove(item)}>✕</button>
                </div>
            )}
        </div>
    );
}
