// Header de la card Planning - titre, badge mode édition, switch lecture/édition, bouton + jalon (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import EditModeSwitch from "./EditModeSwitch";

interface Props {
    count: number;
    canEdit: boolean;
    editMode: boolean;
    creating: boolean;
    onToggleEdit: () => void;
    onToggleCreate: () => void;
}

export default function PlanningHeader(props: Props): JSX.Element {
    const { count, canEdit, editMode, creating, onToggleEdit, onToggleCreate } = props;
    const { t } = useTranslation();
    const editing = canEdit && editMode;
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>
                    {t("gantt.title")} ({count})
                </h2>
                {editing ? (
					<span className="badge" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                        {t("gantt.mode.edit")}
                    </span>
                ) : (
					<span className="badge" style={{ background: "var(--surface)", color: "var(--text)" }}>
						{t("gantt.mode.read")}
                    </span> ) }
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {editing && (
                    <button className="btn" style={{ padding: "0.4rem 0.8rem" }} onClick={onToggleCreate}>
                        {creating ? t("gantt.cancel") : t("gantt.addMilestone")}
                    </button>
                )}
                {canEdit && <EditModeSwitch edit={editMode} onToggle={onToggleEdit} />}
            </div>
        </div>
    );
}
