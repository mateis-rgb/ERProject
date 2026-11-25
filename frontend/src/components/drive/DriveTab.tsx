// Onglet Drive d'un projet - header (titre/quota/breadcrumb/toolbar) + bloc header/content façon Gantt + modales (Power of 10 R4)
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Attachment, DriveUsage } from "../../types";
import QuotaBar from "../projects/QuotaBar";
import DriveBreadcrumb from "./DriveBreadcrumb";
import DriveToolbar from "./DriveToolbar";
import DriveTable from "./DriveTable";
import DriveModal from "./DriveModal";
import TextEditorModal from "./TextEditorModal";
import NewTextFileModal from "./NewTextFileModal";
import { useDriveActions } from "./driveActions";
import { useDriveModal } from "../../hooks/useDriveModal";

interface Props {
    projectId: string;
    attachments: Attachment[];
    canEdit: boolean;
    onChanged: () => void;
}

const MAX_CRUMB = 50; // borne du fil d'Ariane (R2)

interface Crumb { id: string | null; name: string }

export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    if (bytes < 1024 * 1048576) return `${(bytes / 1048576).toFixed(1)} Mo`;
    return `${(bytes / (1024 * 1048576)).toFixed(2)} Go`;
}

export default function DriveTab({ projectId, attachments, canEdit, onChanged }: Props): JSX.Element {
    const [path, setPath] = useState<Crumb[]>([{ id: null, name: "Racine" }]);
    const [usage, setUsage] = useState<DriveUsage | null>(null);
    const [editing, setEditing] = useState<Attachment | null>(null);
    const [newTextOpen, setNewTextOpen] = useState(false);
    const actions = useDriveActions();

    const parentId = path[path.length - 1]?.id ?? null;
    const current = attachments.filter((a) => a.parentId === parentId);
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
            <DriveTable current={current} folders={folders} canEdit={canEdit} parentId={parentId}
                onOpen={openFolder}
                onEditFile={(a) => setEditing(a)}
                onRename={(a) => dm.openModal({ kind: "rename", item: a }, a.fileName)}
                onMove={(a, t) => actions.moveTo(a, t).then(onChanged)}
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
            {newTextOpen && (
                <NewTextFileModal projectId={projectId} parentId={parentId}
                    onClose={() => setNewTextOpen(false)}
                    onCreated={(att) => { setNewTextOpen(false); onChanged(); setEditing(att); }} />
            )}
        </div>
    );
}
