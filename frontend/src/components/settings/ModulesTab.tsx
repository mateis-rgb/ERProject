import { FiBarChart2, FiBell, FiFileText, FiFolder, FiGrid, FiList, FiPackage, FiLayers } from "react-icons/fi";
import { ReactNode } from "react";
// Onglet Modules des réglages (admin) - toggles de modules, persistés dans la config, vue liste ou tuiles (Power of 10 R4)
import { useState } from "react";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n/I18nContext";
import { useModules } from "../../context/ModulesContext";
import ConfirmModal from "../ui/ConfirmModal";

interface ModuleDef { id: string; nameKey: string; descKey: string; icon: ReactNode }

const MODULES: ModuleDef[] = [
    { id: "gantt", nameKey: "modules.gantt.name", descKey: "modules.gantt.desc", icon: <FiBarChart2 /> },
    { id: "drive", nameKey: "modules.drive.name", descKey: "modules.drive.desc", icon: <FiFolder /> },
    { id: "stock", nameKey: "modules.stock.name", descKey: "modules.stock.desc", icon: <FiPackage /> },
    { id: "notifications", nameKey: "modules.notifications.name", descKey: "modules.notifications.desc", icon: <FiBell /> },
    { id: "export_pdf", nameKey: "modules.export.name", descKey: "modules.export.desc", icon: <FiFileText /> },
    { id: "templates", nameKey: "modules.templates.name", descKey: "modules.templates.desc", icon: <FiLayers /> },
];

type ViewMode = "list" | "grid";

interface CardProps {
    m: ModuleDef;
    on: boolean;
    grid: boolean;
    onToggle: (id: string) => void;
    label: (k: string) => string;
}

function ModuleCard({ m, on, grid, onToggle, label }: CardProps): JSX.Element {
    return (
        <div className="card" style={grid
            ? { display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "0.75rem", minHeight: "130px" }
            : { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div>
                <strong style={{ fontSize: "0.95rem" }}>{m.icon} {label(m.nameKey)}</strong>
                <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.8rem" }}>{label(m.descKey)}</p>
            </div>
            <button className={on ? "btn" : "btn-ghost"} style={{ padding: "0.3rem 0.8rem", background: on ? "var(--accent)" : undefined, color: on ? "var(--accent-ink)" : undefined }}
                onClick={() => onToggle(m.id)}>
                {on ? label("modules.on") : label("modules.off")}
            </button>
        </div>
    );
}

export default function ModulesTab(): JSX.Element {
    const { t } = useTranslation();
    const { list, refresh } = useModules();
    const enabled = list as string[];
    const [view, setView] = useState<ViewMode>("list");
    const [pendingModule, setPendingModule] = useState<string | null>(null);

    const toggle = (id: string): void => {
        const next = enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id];
        void api.put("/api/config/enabled_modules", { values: next }).then(() => refresh());
        setPendingModule(null);
    };

    const grid = view === "grid";
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>{t("modules.title")}</h2>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button className={view === "list" ? "btn" : "btn-ghost"} style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
                        onClick={() => setView("list")}><FiList /> {t("modules.viewList")}</button>
                    <button className={view === "grid" ? "btn" : "btn-ghost"} style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
                        onClick={() => setView("grid")}><FiGrid /> {t("modules.viewGrid")}</button>
                </div>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 0, marginBottom: "1.25rem" }}>{t("modules.hint")}</p>
            <div style={grid
                ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }
                : { display: "flex", flexDirection: "column", gap: "1rem" }}>
                {MODULES.map((m) => (
                    <ModuleCard key={m.id} m={m} on={enabled.includes(m.id)} grid={grid} onToggle={setPendingModule} label={t} />
                ))}
            </div>
            {pendingModule !== null && (
                <ConfirmModal title={t("modals.toggleModuleTitle")}
                    message={t(MODULES.find((m) => m.id === pendingModule)?.nameKey ?? "")}
                    onConfirm={() => toggle(pendingModule)} onCancel={() => setPendingModule(null)} />
            )}
        </div>
    );
}
