// Onglet Drive d'un projet - header (titre/quota/breadcrumb/toolbar) + bloc header/content façon Gantt + modales (Power of 10 R4)
import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import { Attachment, DriveUsage } from "../../types";
import QuotaBar from "../projects/QuotaBar";
import DriveBreadcrumb from "./DriveBreadcrumb";
import DriveToolbar from "./DriveToolbar";
import DriveTable from "./DriveTable";
import DriveModal from "./DriveModal";
import TextEditorModal from "./TextEditorModal";
import NewTextFileModal from "./NewTextFileModal";
import ConfirmModal from "../ui/ConfirmModal";
import { useDriveActions } from "./driveActions";
import { useDriveModal } from "../../hooks/useDriveModal";

interface Props {
    projectId: string;
    attachments: Attachment[];
    canEdit: boolean;
    onChanged: () => void;
}

const MAX_CRUMB = 50;

export type DriveSortKey = "fileName" | "fileSize" | "uploadedByName" | "uploadedAt";
export interface DriveSort { key: DriveSortKey; dir: "asc" | "desc" }

function cmpAttachments(a: Attachment, b: Attachment, key: DriveSortKey): number {
    if (key === "fileName") return a.fileName.localeCompare(b.fileName);
    if (key === "fileSize") return a.fileSize - b.fileSize;
    if (key === "uploadedByName") return a.uploadedByName.localeCompare(b.uploadedByName);
    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
}

// Tri par défaut (colonne "nom") : répertoires d'abord, puis nom A->Z.
// Sur les autres colonnes (modifié, taille, par) : tri pur, dossiers et fichiers mélangés.
export function sortAttachments(list: Attachment[], sort: DriveSort): Attachment[] {
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) =>
        (sort.key === "fileName" ? (Number(b.isFolder) - Number(a.isFolder)) : 0) || sign * cmpAttachments(a, b, sort.key));
}

interface Crumb { id: string | null; name: string }

export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    if (bytes < 1024 * 1048576) return `${(bytes / 1048576).toFixed(1)} Mo`;
    return `${(bytes / (1024 * 1048576)).toFixed(2)} Go`;
}

export default function DriveTab({ projectId, attachments, canEdit, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const [path, setPath] = useState<Crumb[]>([{ id: null, name: "Racine" }]);
    const [usage, setUsage] = useState<DriveUsage | null>(null);
    const [editing, setEditing] = useState<Attachment | null>(null);
    const [pendingMove, setPendingMove] = useState<{ item: Attachment; targetId: string | null } | null>(null);
    const [sort, setSort] = useState<DriveSort>({ key: "fileName", dir: "asc" }); // défaut: dossiers d’abord, nom A->Z
    const [newTextOpen, setNewTextOpen] = useState(false);
    const actions = useDriveActions();

    const parentId = path[path.length - 1]?.id ?? null;
    const current = sortAttachments(attachments.filter((a) => a.parentId === parentId), sort);
    const folders = attachments.filter((a) => a.isFolder);
    const dm = useDriveModal(projectId, parentId, attachments, actions, onChanged);

    useEffect(() => {
        api.get<DriveUsage>(`/api/attachments/project/${projectId}/usage`).then((r) => { if (r.success) setUsage(r.data); });
    }, [projectId, attachments]);

    const openFolder = (f: Attachment): void => {
        setPath((p) => [...p.slice(0, MAX_CRUMB), { id: f.id, name: f.fileName }]);
    };

    return (
        <div className="card" style={{ marginTop: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Drive</h2>
                {usage !== null && <QuotaBar usage={usage} />}
            </div>
            <DriveBreadcrumb path={path} onGo={(i) => setPath((p) => p.slice(0, i + 1))} />
            {canEdit && (
                <DriveToolbar busy={actions.busy} onFiles={(f) => dm.onDropFiles(f, parentId)}
                    onNewFolder={() => dm.openModal({ kind: "folder" })}
                    onNewText={() => setNewTextOpen(true)} />
            )}
            <DriveTable current={current} folders={folders} canEdit={canEdit} parentId={parentId} sort={sort}
                onSort={(k) => setSort((prev) => prev.key === k ? { key: k, dir: prev.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" })}
                onOpen={openFolder}
                onEditFile={(a) => setEditing(a)}
                onRename={(a) => dm.openModal({ kind: "rename", item: a }, a.fileName)}
                onMove={(a, t) => setPendingMove({ item: a, targetId: t })}
                onRemove={(a) => dm.openModal({ kind: "delete", item: a })}
                onDropFiles={dm.onDropFiles} onDropItem={dm.onDropItem} />
            {dm.modal !== null && (
                <DriveModal modal={dm.modal} value={dm.value} busy={actions.busy}
                    onValue={dm.setValue} onCancel={dm.closeModal} onConfirm={dm.confirmModal} />
            )}
            {editing !== null && (
                <TextEditorModal attachment={editing} canEdit={canEdit}
                    onClose={() => setEditing(null)} onSaved={onChanged} />
            )}
            {pendingMove !== null && (
                <ConfirmModal title={t("modals.affectTitle")}
                    message={`${pendingMove.item.fileName} - ${pendingMove.targetId === null ? t("drive.root") : (attachments.find((a) => a.id === pendingMove.targetId)?.fileName ?? "")}`}
                    onConfirm={() => { void actions.moveTo(pendingMove.item, pendingMove.targetId).then(() => { setPendingMove(null); onChanged(); }); }}
                    onCancel={() => setPendingMove(null)} />
            )}
            {newTextOpen && (
                <NewTextFileModal projectId={projectId} parentId={parentId}
                    onClose={() => setNewTextOpen(false)}
                    onCreated={(att) => { setNewTextOpen(false); onChanged(); setEditing(att); }} />
            )}
        </div>
    );
}
