// Bloc du drive façon Gantt : bordure 2px, partie header (colonnes) + partie content (lignes, drop) (Power of 10 R4)
import { Attachment } from "../../types";
import DriveHeader from "./DriveHeader";
import DriveContent from "./DriveContent";

interface Props {
    current: Attachment[];
    folders: Attachment[];
    canEdit: boolean;
    parentId: string | null;
    onOpen: (a: Attachment) => void;
    onEditFile: (a: Attachment) => void;
    onRename: (a: Attachment) => void;
    onMove: (a: Attachment, targetId: string | null) => void;
    onRemove: (a: Attachment) => void;
    onDropFiles: (files: File[], targetId: string | null) => void;
    onDropItem: (id: string, targetId: string | null) => void;
}

export default function DriveTable(props: Props): JSX.Element {
    const { current, folders, canEdit, parentId, onOpen, onEditFile, onRename, onMove, onRemove, onDropFiles, onDropItem } = props;
    return (
        <div style={{ border: "2px solid var(--ink)", background: "var(--surface)" }}>
            <DriveHeader canEdit={canEdit} />
            <DriveContent current={current} folders={folders} canEdit={canEdit} parentId={parentId}
                onOpen={onOpen} onEditFile={onEditFile} onRename={onRename} onMove={onMove} onRemove={onRemove}
                onDropFiles={onDropFiles} onDropItem={onDropItem} />
        </div>
    );
}
