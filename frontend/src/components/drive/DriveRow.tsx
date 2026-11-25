import { FiEdit2, FiFileText, FiFolder, FiX } from "react-icons/fi";
// Ligne du drive en grid - draggable, et cible de dépôt si c'est un dossier (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { Attachment } from "../../types";
import { formatSize } from "./DriveTab";
import { driveCols, driveRowCell } from "./driveStyles";
import { useRowDrag } from "../../hooks/useRowDrag";
import BrutalSelect from "../ui/BrutalSelect";
import { isEditableFile } from "../../utils/textFiles";

// Boutons d'action : carrés, même taille fixe pour tous (Power of 10 R4)
const ACTION_BTN: React.CSSProperties = {
    width: "26px", height: "26px", padding: 0, flexShrink: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
};

interface Props {
    item: Attachment;
    folders: Attachment[];
    canEdit: boolean;
    onOpen: (a: Attachment) => void;
    onEditFile: (a: Attachment) => void;
    onRename: (a: Attachment) => void;
    onMove: (a: Attachment, targetId: string | null) => void;
    onRemove: (a: Attachment) => void;
    onDropFiles: (files: File[], targetId: string) => void;
    onDropItem: (id: string, targetId: string) => void;
}

export default function DriveRow(props: Props): JSX.Element {
    const { item, folders, canEdit, onOpen, onEditFile, onRename, onMove, onRemove, onDropFiles, onDropItem } = props;
    const { t } = useTranslation();
    const drag = useRowDrag(item, canEdit, onDropFiles, onDropItem);
    return (
        <div draggable={drag.draggable} onDragStart={drag.onDragStart}
            onDragOver={drag.onDragOver} onDragLeave={drag.onDragLeave} onDrop={drag.onDrop}
            title={item.isFolder && canEdit ? t("drive.dropInFolder") : undefined}
            style={{
                display: "grid", gridTemplateColumns: driveCols(canEdit), alignItems: "center",
                minWidth: "660px", // force le scroll horizontal du bloc plutôt que l'écrasement de la colonne actions
                borderBottom: "1px solid var(--ink)", background: drag.over ? "var(--surface-2)" : "transparent",
                outline: drag.over ? "2px dashed var(--accent)" : "none", outlineOffset: "-2px",
                cursor: drag.draggable ? "grab" : "default",
            }}>
            <div style={driveRowCell}>
                {item.isFolder ? (
                    <button className="btn-ghost" style={{ padding: "0.15rem 0.5rem", fontSize: "0.78rem" }}
                        onClick={() => onOpen(item)}>
                        <span className="ic"><FiFolder /> {item.fileName}</span>
                    </button>
                ) : isEditableFile(item.fileName, item.mimeType) ? (
                    <button className="btn-ghost" style={{ padding: "0.15rem 0.5rem", fontSize: "0.78rem", color: "var(--accent)", fontWeight: 700 }}
                        onClick={() => onEditFile(item)} title={item.fileName}>
                        <span className="ic"><FiFileText /> {item.fileName}</span>
                    </button>
                ) : (
                    <a href={`/api/attachments/download/${item.id}`} style={{ color: "var(--accent)", fontWeight: 700 }}>
                        <span className="ic"><FiFileText /> {item.fileName}</span>
                    </a>
                )}
            </div>
            <div style={{ ...driveRowCell }} className="mono">{item.isFolder ? "—" : formatSize(item.fileSize)}</div>
            <div style={{ ...driveRowCell, fontSize: "0.8rem" }}>{item.uploadedByName}</div>
            <div style={{ ...driveRowCell }} className="mono">{new Date(item.uploadedAt).toLocaleDateString("fr-FR")}</div>
            {canEdit && (
                <div style={driveRowCell}>
                    <BrutalSelect value={item.parentId ?? ""} width="auto" minWidth="130px" height="30px"
                        onChange={(v) => onMove(item, v === "" ? null : v)}
                        options={[
                            { value: "", label: t("drive.root") },
                            ...folders.filter((f) => f.id !== item.id).map((f) => ({ value: f.id, label: f.fileName })),
                        ]} />
                </div>
            )}
            {canEdit && (
                <div style={{ ...driveRowCell, display: "flex", gap: "0.3rem", alignItems: "center" }}>
                    <button className="btn-ghost" style={ACTION_BTN} title={t("drive.modalRename")} onClick={() => onRename(item)}>
                        <FiEdit2 size={14} />
                    </button>
                    <button className="btn-danger" style={{ ...ACTION_BTN, boxShadow: "2px 2px 0 var(--danger)" }} title={t("drive.modalDelete")}
                        onClick={() => onRemove(item)}>
                        <FiX size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
