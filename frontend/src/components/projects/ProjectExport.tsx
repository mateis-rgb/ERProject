import { FiFileText } from "react-icons/fi";
// Bloc d'export PDF de l'en-tête projet - mode complet / prévisionnel / définitif (Power of 10 R4)
import { useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import BrutalSelect from "../ui/BrutalSelect";

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
            <BrutalSelect value={mode} onChange={(v) => setMode(v as ExportMode)} width="auto" minWidth="150px"
                options={MODES.map((m) => ({ value: m.v, label: t(m.key) }))} />
            <button className="btn-ghost" style={{ whiteSpace: "nowrap" }} onClick={doExport} title={t("projectHeader.export.title")}>
                <FiFileText /> {t("projectHeader.export.button")}
            </button>
        </div>
    );
}
