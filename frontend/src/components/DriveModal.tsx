// Modale néo-brutaliste du drive - remplace alert/confirm/prompt (dossier, renommage, suppression, erreur) (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { Attachment } from "../types";

export type DriveModal =
    | { kind: "folder" }
    | { kind: "rename"; item: Attachment }
    | { kind: "delete"; item: Attachment }
    | { kind: "error"; message: string };

interface Props {
    modal: DriveModal;
    value: string;
    busy: boolean;
    onValue: (v: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DriveModal(props: Props): JSX.Element {
    const { modal, value, busy, onValue, onCancel, onConfirm } = props;
    const { t } = useTranslation();

    const titles: Record<DriveModal["kind"], string> = {
        folder: t("drive.modalNewFolder"),
        rename: t("drive.modalRename"),
        delete: t("drive.modalDelete"),
        error: t("drive.modalError"),
    };

    const withInput = modal.kind === "folder" || modal.kind === "rename";
    const confirmLabel = modal.kind === "delete" ? t("common.delete") : t("common.confirm");
    const danger = modal.kind === "delete" || modal.kind === "error";

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>
                    {titles[modal.kind]}
                </h3>
                {modal.kind === "delete" && (
                    <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 1.25rem" }}>
                        {modal.item.isFolder ? t("drive.deleteFolder") : t("drive.deleteFile")} « {modal.item.fileName} » ?
                    </p>
                )}
                {modal.kind === "error" && (
                    <p style={{ fontSize: "0.85rem", color: "var(--danger)", margin: "0 0 1.25rem" }}>
                        {t("drive.uploadFailed")} : {modal.message}
                    </p>
                )}
                {withInput && (
                    <div>
                        <label className="label">{t("drive.modalName")}</label>
                        <input className="input" autoFocus value={value}
                            placeholder={modal.kind === "folder" ? "" : modal.item.fileName}
                            onChange={(e) => onValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); }} />
                    </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
                    <button className="btn-ghost" onClick={onCancel}>{t("common.cancel")}</button>
                    <button className={danger ? "btn-danger" : "btn"} disabled={busy || (withInput && value.trim() === "")} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
