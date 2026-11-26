import { FiEdit2, FiFileText, FiFolder, FiX } from "react-icons/fi";
// Ligne du drive en grid - draggable, et cible de dépôt si c'est un dossier (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { Attachment } from "../../types";
import { formatSize } from "./DriveTab";
import { driveCols, driveRowCell } from "./driveStyles";
import { useRowDrag } from "../../hooks/useRowDrag";
import BrutalSelect from "../ui/BrutalSelect";
import { isEditableFile } from "../../utils/textFiles";

// Cibles de déplacement proposées : uniquement les dossiers du scope actuel,
// en excluant l'élément lui-même et ses descendants (évite les cycles) — boucle bornée (R2)
function moveTargets(item: Attachment, folders: Attachment[], scopeId: string | null): Attachment[] {
    const MAX_DEPTH = 20;
    const desc = new Set<string>([item.id]);
    for (let d = 0; d < MAX_DEPTH && desc.size < folders.length + 1; d++) {
        for (const f of folders) {
            if (!desc.has(f.id) && f.parentId !== null && desc.has(f.parentId)) desc.add(f.id);
        }
    }
    return folders.filter((f) => f.parentId === scopeId && !desc.has(f.id));
}

// Boutons d'action : carrés, même taille fixe pour tous (Power of 10 R4)
const ACTION_BTN: React.CSSProperties = {
    width: "26px", height: "26px", padding: 0, flexShrink: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
};

interface Props {
    item: Attachment;
    folders: Attachment[];
    scopeId: string | null; // dossier courant : seules ses sous-dossiers sont proposées comme cible
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
    const { item, folders, scopeId, canEdit, onOpen, onEditFile, onRename, onMove, onRemove, onDropFiles, onDropItem } = props;
    const { t } = useTranslation();
    const drag = useRowDrag(item, canEdit, onDropFiles, onDropItem);
    const rowClick = (): void => {
        if (item.isFolder) { onOpen(item); return; }
        if (isEditableFile(item.fileName, item.mimeType)) { onEditFile(item); return; }
        window.location.href = "/api/attachments/download/" + item.id;
    };
    return (
        <div draggable={drag.draggable} onDragStart={drag.onDragStart} onClick={rowClick}
            onDragOver={drag.onDragOver} onDragLeave={drag.onDragLeave} onDrop={drag.onDrop}
            title={item.isFolder && canEdit ? t("drive.dropInFolder") : undefined}
            style={{
                display: "grid", gridTemplateColumns: driveCols(canEdit), alignItems: "center",
                minWidth: "550px", // force le scroll horizontal du bloc si l'écran est plus étroit que les colonnes fixes
                borderBottom: "1px solid var(--ink)", background: drag.over ? "var(--surface-2)" : "transparent",
                outline: drag.over ? "2px dashed var(--accent)" : "none", outlineOffset: "-2px",
                cursor: "pointer",
            }}>
            <div style={driveRowCell}>
                <span className="ic" style={{ fontWeight: 700, fontSize: "0.85rem" }} title={item.fileName}>
                    {item.isFolder ? <FiFolder /> : <FiFileText />} {item.fileName}
                </span>
            </div>
            <div style={{ ...driveRowCell }} className="mono">{item.isFolder ? "—" : formatSize(item.fileSize)}</div>
            <div style={{ ...driveRowCell, fontSize: "0.8rem" }}>{item.uploadedByName}</div>
            <div style={{ ...driveRowCell }} className="mono">{new Date(item.uploadedAt).toLocaleDateString("fr-FR")}</div>
            {canEdit && (
                <div style={{ ...driveRowCell, paddingRight: "0.8rem" }} onClick={(e) => e.stopPropagation()}> {/* gap pour l'ombre du select */}
                    <BrutalSelect value={item.parentId ?? ""} width="auto" minWidth="128px" height="30px"
                        onChange={(v) => onMove(item, v === "" ? null : v)}
                        options={[
                            { value: "", label: t("drive.root") }, // toujours proposée, valeur par défaut si rien n'est choisi
                            ...moveTargets(item, folders, scopeId).map((f) => ({ value: f.id, label: f.fileName })),
                        ]} />
                </div>
            )}
            {canEdit && (
                <div style={{ ...driveRowCell, display: "flex", gap: "0.3rem", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
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
