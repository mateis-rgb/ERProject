import { FiFileText } from "react-icons/fi";
// Bloc d'export PDF de l'en-tête projet - mode complet / prévisionnel / définitif (Power of 10 R4)
import { useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";

type ExportMode = "complet" | "previsionnel" | "definitif";

const MODES: { v: ExportMode; key: string }[] = [
    { v: "complet", key: "projectHeader.export.complet" },
    { v: "previsionnel", key: "projectHeader.export.previsionnel" },
    { v: "definitif", key: "projectHeader.export.definitif" },
];

export default function ProjectExport({ projectId }: { projectId: string }): JSX.Element {
    const { t } = useTranslation();
    const [mode, setMode] = useState<ExportMode>("complet");
    const doExport = (): void => {
        window.location.href = `/api/projects/${projectId}/export?mode=${mode}`;
    };
    return (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
            <select className="select" value={mode} style={{ width: "auto" }}
                onChange={(e) => setMode(e.target.value as ExportMode)}>
                {MODES.map((m) => <option key={m.v} value={m.v}>{t(m.key)}</option>)}
            </select>
            <button className="btn-ghost" style={{ whiteSpace: "nowrap" }} onClick={doExport} title={t("projectHeader.export.title")}>
                <FiFileText /> {t("projectHeader.export.button")}
            </button>
        </div>
    );
}
