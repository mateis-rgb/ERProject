// Partie "header" du bloc drive - ligne d'en-têtes des colonnes, style header de Gantt (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { driveCols, driveHeaderCell } from "./driveStyles";

export default function DriveHeader({ canEdit }: { canEdit: boolean }): JSX.Element {
    const { t } = useTranslation();
    const cols = [t("drive.name"), t("drive.size"), t("drive.by"), t("drive.modified")];
    if (canEdit) { cols.push(t("drive.moveTo"), t("drive.actions")); }
    return (
        <div style={{
            display: "grid", gridTemplateColumns: driveCols(canEdit),
            borderBottom: "2px solid var(--ink)", background: "var(--surface-2)",
        }}>
            {cols.map((c, i) => (
                <div key={i} style={driveHeaderCell}>{c}</div>
            ))}
        </div>
    );
}
