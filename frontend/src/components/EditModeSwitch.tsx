// Switch Lecture / Édition du Gantt - padding interne, carré à gauche (lecture) / droite (édition), transitions douces (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";

interface Props {
    edit: boolean;
    onToggle: () => void;
}

export default function EditModeSwitch({ edit, onToggle }: Props): JSX.Element {
    const { t } = useTranslation();
    return (
        <button type="button" onClick={onToggle} className="btn-ghost" title={edit ? t("gantt.mode.edit") : t("gantt.mode.read")}
            style={{
                display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 0.8rem",
                background: edit ? "var(--accent)" : "var(--surface)",
                color: edit ? "var(--accent-ink)" : "var(--text)",
                transition: "background 0.15s ease, color 0.15s ease",
            }}>
            <span style={{
                width: "36px", height: "20px", border: "2px solid var(--ink)", position: "relative",
                display: "inline-block", flexShrink: 0, borderRadius: 0,
                background: edit ? "var(--accent)" : "var(--surface)", transition: "background 0.15s ease",
            }}>
                <span style={{
                    position: "absolute", top: "1px", left: edit ? "17px" : "1px",
                    width: "14px", height: "14px", background: "var(--ink)", borderRadius: 0,
                    transition: "left 0.15s ease",
                }} />
            </span>
            <span className="mono" style={{ fontSize: "0.68rem", textTransform: "uppercase", fontWeight: 700 }}>
                {edit ? t("gantt.mode.edit") : t("gantt.mode.read")}
            </span>
        </button>
    );
}
