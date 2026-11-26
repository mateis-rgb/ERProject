// Partie "header" du bloc drive - ligne d'en-têtes des colonnes, triables au clic (flèche haut = croissant, bas = décroissant) (Power of 10 R4)
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useTranslation } from "../../i18n/I18nContext";
import { driveCols, driveHeaderCell } from "./driveStyles";
import type { DriveSort, DriveSortKey } from "./DriveTab";

interface Props {
    canEdit: boolean;
    sort: DriveSort;
    onSort: (k: DriveSortKey) => void;
}

function SortCell({ label, k, sort, onSort }: { label: string; k: DriveSortKey; sort: DriveSort; onSort: (k: DriveSortKey) => void }): JSX.Element {
    const active = sort.key === k;
    return (
        <div style={{ ...driveHeaderCell, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
            onClick={() => onSort(k)} title={label}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                {label}
                {active && (sort.dir === "asc" ? <FiChevronUp /> : <FiChevronDown />)}
            </span>
        </div>
    );
}

export default function DriveHeader({ canEdit, sort, onSort }: Props): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{
            display: "grid", gridTemplateColumns: driveCols(canEdit),
            minWidth: "550px", // même largeur mini que les lignes : header et contenu scrollent ensemble en horizontal
            borderBottom: "2px solid var(--ink)", background: "var(--surface-2)",
        }}>
            <SortCell label={t("drive.name")} k="fileName" sort={sort} onSort={onSort} />
            <SortCell label={t("drive.size")} k="fileSize" sort={sort} onSort={onSort} />
            <SortCell label={t("drive.by")} k="uploadedByName" sort={sort} onSort={onSort} />
            <SortCell label={t("drive.modified")} k="uploadedAt" sort={sort} onSort={onSort} />
            {canEdit && <><div style={driveHeaderCell}>{t("drive.moveTo")}</div><div style={driveHeaderCell}>{t("drive.actions")}</div></>}
        </div>
    );
}
