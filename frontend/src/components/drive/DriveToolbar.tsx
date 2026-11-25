import { FiFilePlus, FiUpload } from "react-icons/fi";
// Barre d'outils du drive - le bouton Upload EST l'input file (caché, multiple, upload direct) (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";

interface Props {
    busy: boolean;
    onFiles: (files: File[]) => void;
    onNewFolder: () => void;
    onNewText: () => void;
}

export default function DriveToolbar({ busy, onFiles, onNewFolder, onNewText }: Props): JSX.Element {
    const { t } = useTranslation();
    const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length > 0) onFiles(files);
    };
    return (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <label className="btn" style={{ cursor: busy ? "wait" : "pointer", margin: 0, userSelect: "none" }}>
                {busy ? "..." : <><FiUpload /> {t("drive.upload")}</>}
                <input type="file" multiple disabled={busy}
                    style={{ display: "none" }} onChange={onChange} />
            </label>
            <button className="btn-ghost" onClick={onNewFolder}>{t("drive.newFolder")}</button>
            <button className="btn-ghost" onClick={onNewText}><FiFilePlus /> {t("editor.newText")}</button>
        </div>
    );
}
