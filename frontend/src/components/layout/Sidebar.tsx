// Sidebar néo-brutaliste rétractable - mode icônes seules quand rétractée (Power of 10 R4)
import { NavLink } from "react-router-dom";
import { FiHome, FiFolder, FiPackage, FiCalendar, FiSettings, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { IconType } from "react-icons";
import { AuthUser } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
import { useModules, ModuleId } from "../../context/ModulesContext";
import UserCard from "./UserCard";

const NAV: { to: string; key: string; icon: IconType; end?: boolean; module?: ModuleId }[] = [
    { to: "/", key: "nav.dashboard", icon: FiHome, end: true },
    { to: "/projects", key: "nav.projects", icon: FiFolder },
    { to: "/stock", key: "nav.stock", icon: FiPackage, module: "stock" },
    { to: "/planning", key: "nav.planning", icon: FiCalendar, module: "gantt" },
    { to: "/settings", key: "nav.settings", icon: FiSettings },
];

interface Props {
    user: AuthUser;
    collapsed: boolean;
    onToggle: () => void;
    onLogout: () => void;
}

export default function Sidebar({ user, collapsed, onToggle, onLogout }: Props): JSX.Element {
    const { t } = useTranslation();
    const { enabled } = useModules();
    const nav = NAV.filter((item) => item.module === undefined || enabled(item.module));
    return (
        <aside style={{
            width: "100%", height: "100%", background: "var(--surface)",
            borderRight: "3px solid var(--ink)", display: "flex", flexDirection: "column",
            padding: collapsed ? "1rem 0.5rem" : "1.25rem 1rem", overflow: "hidden",
            transition: "padding 0.15s",
        }}>
            <div style={{
                display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem",
                justifyContent: collapsed ? "center" : "flex-start",
                border: "2px solid var(--ink)", padding: collapsed ? "0.5rem" : "0.6rem 0.75rem",
                background: "var(--bg)", boxShadow: "4px 4px 0 var(--ink)",
            }}>
                <span className="rec-dot" />
                {!collapsed && (
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                        L’<span style={{ color: "var(--accent)" }}>Entrepôt</span>
                    </span>
                )}
            </div>
            <button className="btn-ghost" onClick={onToggle} title={collapsed ? t("nav.expand") : t("nav.collapse")}
                aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
                style={{ alignSelf: collapsed ? "center" : "flex-end", padding: "0.35rem 0.55rem", marginBottom: "0.75rem" }}>
                {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
            </button>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {nav.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.end} title={t(item.key)}
                        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                        style={{
                            display: "flex", alignItems: "center", gap: "0.6rem",
                            justifyContent: collapsed ? "center" : "flex-start",
                            padding: collapsed ? "0.65rem 0" : undefined,
                        }}>
                        <item.icon style={{ flexShrink: 0, fontSize: "1.05rem" }} />
                        {!collapsed && t(item.key)}
                    </NavLink>
                ))}
            </nav>
            <UserCard user={user} collapsed={collapsed} onLogout={onLogout} />
        </aside>
    );
}
