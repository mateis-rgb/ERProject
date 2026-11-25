import { FiCommand, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
// TopBar néo-brutaliste + cloche notifications (sans chrono) + bouton rétracter la sidebar (à gauche)
import { useTranslation } from "../../i18n/I18nContext";
import { useModules } from "../../context/ModulesContext";
import NotificationBell from "../notifications/NotificationBell";

interface Props {
    onOpenPalette: () => void;
    collapsed: boolean;
    onToggleSidebar: () => void;
}

export default function TopBar({ onOpenPalette, collapsed, onToggleSidebar }: Props): JSX.Element {
    const { t } = useTranslation();
    const { enabled } = useModules();
    return (
        <header style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0.75rem 2rem", borderBottom: "3px solid var(--ink)",
            background: "var(--surface)", position: "sticky", top: 0, zIndex: 100,
        }}>
            <button className="btn-ghost" onClick={onToggleSidebar}
                title={collapsed ? t("nav.expand") : t("nav.collapse")}
                aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
                style={{ padding: "0.4rem", flexShrink: 0 }}>
                {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
            </button>
            <div style={{ flex: 1 }} />
            {enabled("notifications") && <NotificationBell />}
            <button className="btn-ghost" onClick={onOpenPalette}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "220px", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{t("common.search")}</span>
                <span className="kbd"><FiCommand />K</span>
            </button>
        </header>
    );
}
