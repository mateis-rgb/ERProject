// Barre d'outils du Gantt - semaine en cours + sélecteur de vue (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { GanttView, isoWeek } from "./ganttUtils";

interface Props {
    view: GanttView;
    onView: (v: GanttView) => void;
}

const VIEWS: { v: GanttView; key: string }[] = [
    { v: "week", key: "gantt.viewWeek" },
    { v: "month", key: "gantt.viewMonth" },
    { v: "year", key: "gantt.viewYear" },
];

export default function GanttToolbar({ view, onView }: Props): JSX.Element {
    const { t } = useTranslation();
    const nowWeek = isoWeek(new Date());
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <span className="badge" style={{ background: "var(--accent)" }}>
                {t("gantt.currentWeek")} : S{nowWeek}
            </span>
			
            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: "0.68rem", color: "var(--muted)", textTransform: "uppercase" }}>
                    {t("gantt.view")}:
                </span>
                {VIEWS.map((x) => (
                    <button key={x.v} className={view === x.v ? "btn" : "btn-ghost"}
                        style={{ padding: "0.25rem 0.7rem", fontSize: "0.72rem" }}
                        onClick={() => onView(x.v)}>
                        {t(x.key)}
                    </button>
                ))}
            </div>
        </div>
    );
}
