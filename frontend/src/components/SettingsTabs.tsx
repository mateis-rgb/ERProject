import { FiLock } from "react-icons/fi";
// Barre d'onglets de la page Réglages - routes /settings/:tab (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useModules } from "../context/ModulesContext";
export type TabId = "app" | "appearance" | "lists" | "templates" | "modules" | "access" | "security" | "status" | "about";

export const SETTINGS_TAB_IDS: TabId[] = ["app", "appearance", "lists", "templates", "modules", "access", "security", "status", "about"];

interface Tab {
    id: TabId;
    label?: string;
    adminOnly?: boolean;
}

const TABS: (Tab & { key: string })[] = [
    { id: "app", key: "settingsTabs.app" },
    { id: "appearance", key: "settingsTabs.appearance" },
    { id: "lists", key: "settingsTabs.lists" },
    { id: "templates", key: "settingsTabs.templates" },
    { id: "modules", key: "settingsTabs.modules", adminOnly: true },
    { id: "access", key: "settingsTabs.access", adminOnly: true },
    { id: "security", key: "settingsTabs.security" },
    { id: "status", key: "settingsTabs.status", adminOnly: true },
    { id: "about", key: "settingsTabs.about" },
];

interface Props {
    active: TabId;
    onChange: (t: TabId) => void;
    isAdmin: boolean;
}

export default function SettingsTabs({ active, onChange, isAdmin }: Props): JSX.Element {
    const { t: tt } = useTranslation();
    const { enabled } = useModules();
    const visible = TABS.filter((t) => (!t.adminOnly || isAdmin) && (t.id !== "templates" || enabled("templates")));

    return (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", width: "100%" }}>
            {visible.map((t) => (
                <button
                    key={t.id}
                    className={active === t.id ? "btn" : "btn-ghost"}
                    onClick={() => onChange(t.id)}
                    style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                >
                    {t.adminOnly === true && <span aria-label="admin"><FiLock /></span>}
                    {tt(t.key)}
                </button>
            ))}
        </div>
    );
}
