// Modale de confirmation néo-brutaliste générique (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";

interface Props {
    title: string;
    message: string;
    danger?: boolean;
    busy?: boolean;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal(props: Props): JSX.Element {
    const { title, message, danger = false, busy = false, confirmLabel, onConfirm, onCancel } = props;
    const { t } = useTranslation();
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>{title}</h3>
                <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: danger ? "var(--danger)" : "var(--muted)" }}>{message}</p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button className="btn-ghost" onClick={onCancel} disabled={busy}>{t("common.cancel")}</button>
                    <button className={danger ? "btn-danger" : "btn"} onClick={onConfirm} disabled={busy}>
                        {confirmLabel ?? (danger ? t("common.delete") : t("common.confirm"))}
                    </button>
                </div>
            </div>
        </div>
    );
}
