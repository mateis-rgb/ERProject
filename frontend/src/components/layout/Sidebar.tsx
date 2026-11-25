// Sidebar néo-brutaliste (Power of 10 R4)
import { NavLink } from "react-router-dom";
import { AuthUser } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";
import { useModules, ModuleId } from "../../context/ModulesContext";
import UserCard from "./UserCard";

const NAV: { to: string; key: string; end?: boolean; module?: ModuleId }[] = [
    { to: "/", key: "nav.dashboard", end: true },
    { to: "/projects", key: "nav.projects" },
    { to: "/stock", key: "nav.stock", module: "stock" },
    { to: "/planning", key: "nav.planning", module: "gantt" },
    { to: "/settings", key: "nav.settings" },
];

interface Props {
    user: AuthUser;
    onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: Props): JSX.Element {
    const { t } = useTranslation();
    const { enabled } = useModules();
    const nav = NAV.filter((item) => item.module === undefined || enabled(item.module));
    return (
        <aside style={{
            width: "100%", height: "100%", background: "var(--surface)",
            borderRight: "3px solid var(--ink)", display: "flex", flexDirection: "column",
            padding: "1.25rem 1rem", overflow: "hidden",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.5rem",
                border: "2px solid var(--ink)", padding: "0.6rem 0.75rem", background: "var(--bg)", boxShadow: "4px 4px 0 var(--ink)" }}>
                <span className="rec-dot" />
                <span style={{ fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                    ER<span style={{ color: "var(--accent)" }}>Project</span>
                </span>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {nav.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.end}
                        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                        {t(item.key)}
                    </NavLink>
                ))}
            </nav>
            <UserCard user={user} onLogout={onLogout} />
        </aside>
    );
}
