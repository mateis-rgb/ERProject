import { FiCommand } from "react-icons/fi";
// TopBar néo-brutaliste + cloche notifications (sans chrono)
import { useTranslation } from "../i18n/I18nContext";
import { useModules } from "../context/ModulesContext";
import NotificationBell from "./NotificationBell";

interface Props {
    onOpenPalette: () => void;
}

export default function TopBar({ onOpenPalette }: Props): JSX.Element {
    const { t } = useTranslation();
    const { enabled } = useModules();
    return (
        <header style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0.75rem 2rem", borderBottom: "3px solid var(--ink)",
            background: "var(--surface)", position: "sticky", top: 0, zIndex: 100,
        }}>
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
