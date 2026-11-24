import { FiX } from "react-icons/fi";
// Modale générique néo-brutaliste (Power of 10 R4)
import { ReactNode } from "react";
import { useTranslation } from "../i18n/I18nContext";

interface Props {
    title: string;
    onClose: () => void;
    maxWidth?: string;
    children: ReactNode;
}

export default function Modal({ title, onClose, maxWidth = "560px", children }: Props): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>{title}</h3>
                    <button className="btn-ghost" onClick={onClose} aria-label={t("common.close")}><FiX /></button>
                </div>
                {children}
            </div>
        </div>
    );
}
