// Bloc du drive façon Gantt : bordure 2px, partie header (colonnes) + partie content (lignes, drop) (Power of 10 R4)
import { Attachment } from "../../types";
import DriveHeader from "./DriveHeader";
import type { DriveSort, DriveSortKey } from "./DriveTab";
import DriveContent from "./DriveContent";

interface Props {
    current: Attachment[];
    folders: Attachment[];
    canEdit: boolean;
    parentId: string | null;
    sort: DriveSort;
    onSort: (k: DriveSortKey) => void;
    onOpen: (a: Attachment) => void;
    onEditFile: (a: Attachment) => void;
    onRename: (a: Attachment) => void;
    onMove: (a: Attachment, targetId: string | null) => void;
    onRemove: (a: Attachment) => void;
    onDropFiles: (files: File[], targetId: string | null) => void;
    onDropItem: (id: string, targetId: string | null) => void;
}

export default function DriveTable(props: Props): JSX.Element {
    const { current, folders, canEdit, parentId, sort, onSort, onOpen, onEditFile, onRename, onMove, onRemove, onDropFiles, onDropItem } = props;
    return (
        <div style={{ border: "2px solid var(--ink)", background: "var(--surface)", maxHeight: "70vh", overflow: "auto" }}>
            <DriveHeader canEdit={canEdit} sort={sort} onSort={onSort} />
            <DriveContent current={current} folders={folders} canEdit={canEdit} parentId={parentId}
                onOpen={onOpen} onEditFile={onEditFile} onRename={onRename} onMove={onMove} onRemove={onRemove}
                onDropFiles={onDropFiles} onDropItem={onDropItem} />
        </div>
    );
}
