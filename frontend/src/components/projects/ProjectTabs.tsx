// Onglets de la page projet - pilotés par l'URL /projects/:id/:tab (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useModules, ModuleId } from "../../context/ModulesContext";
export type ProjectTabId = "dashboard" | "stock" | "planning" | "drive" | "settings";

export const PROJECT_TAB_IDS: ProjectTabId[] = ["dashboard", "stock", "planning", "drive", "settings"];

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
}

const TABS: { id: ProjectTabId; key: string }[] = [
    { id: "dashboard", key: "projectTabs.dashboard" },
    { id: "stock", key: "projectTabs.stock" },
    { id: "planning", key: "projectTabs.planning" },
    { id: "drive", key: "projectTabs.drive" },
    { id: "settings", key: "projectTabs.settings" },
];

export default function ProjectTabs({ active, onChange }: Props): JSX.Element {
    const { t: tt } = useTranslation();
    const { enabled } = useModules();
    const visible = TABS.filter((tab) => {
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
