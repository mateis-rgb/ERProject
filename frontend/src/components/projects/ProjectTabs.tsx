// Onglets de la page projet - pilotés par l'URL /projects/:id/:tab (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useModules, ModuleId } from "../../context/ModulesContext";
export type ProjectTabId = "dashboard" | "stock" | "planning" | "drive" | "settings" | "comments";

export const PROJECT_TAB_IDS: ProjectTabId[] = ["dashboard", "stock", "planning", "drive", "settings", "comments"];

const TAB_MODULES: Partial<Record<ProjectTabId, ModuleId>> = {
    stock: "stock",
    planning: "gantt",
    drive: "drive",
};

export function tabModule(tab: ProjectTabId): ModuleId | null {
    return TAB_MODULES[tab] ?? null;
}

interface Props {
    active: ProjectTabId;
    onChange: (t: ProjectTabId) => void;
    showComments: boolean; // onglet commentaires visible seulement si projet partage (>1 collaborateur)
}

const TABS: { id: ProjectTabId; key: string }[] = [
    { id: "dashboard", key: "projectTabs.dashboard" },
    { id: "stock", key: "projectTabs.stock" },
    { id: "planning", key: "projectTabs.planning" },
    { id: "drive", key: "projectTabs.drive" },
    { id: "comments", key: "projectTabs.comments" },
    { id: "settings", key: "projectTabs.settings" },
];

export default function ProjectTabs({ active, onChange, showComments }: Props): JSX.Element {
    const { t: tt } = useTranslation();
    const { enabled } = useModules();
    const visible = TABS.filter((tab) => {
        if (tab.id === "comments" && !showComments) return false;
        const mod = tabModule(tab.id);
        return mod === null || enabled(mod);
    });
    return (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {visible.map((t) => (
                <button key={t.id} className={active === t.id ? "btn" : "btn-ghost"} onClick={() => onChange(t.id)}>
                    {tt(t.key)}
                </button>
            ))}
        </div>
    );
}
