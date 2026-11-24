import { FiEdit3 } from "react-icons/fi";
// Section listes modifiables (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useModules } from "../context/ModulesContext";
const CONFIG_KEYS: Record<string, string> = {
    project_statuses: "settings.lists.projectStatuses",
    project_types: "settings.lists.projectTypes",
    stock_units: "settings.lists.units",
    stock_locations: "settings.lists.locations",
    stock_categories: "settings.lists.stockCategories",
};

interface Props {
    configs: Record<string, string[]>;
    editKey: string;
    editValue: string;
    onEdit: (key: string, value: string) => void;
    onSave: () => void;
}

export default function ConfigListsSection({ configs, editKey, editValue, onEdit, onSave }: Props): JSX.Element {
    const { t } = useTranslation();
    const { enabled } = useModules();
    const entries = Object.entries(CONFIG_KEYS).filter(([key]) => !key.startsWith("stock_") || enabled("stock"));
    return (
        <div className="card">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}><FiEdit3 /> Listes modifiables</h2>
            {entries.map(([key, labelKey]) => (
                <div key={key} style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--surface-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{t(labelKey)}</strong>
                        <button className="btn-secondary" onClick={() => onEdit(key, (configs[key] ?? []).join(", "))}>
                            Modifier
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                        {(configs[key] ?? []).map((v) => (
                            <span key={v} className="badge" style={{ backgroundColor: "var(--surface-2)", color: "var(--text)" }}>{v}</span>
                        ))}
                    </div>
                    {editKey === key && (
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <input className="input" value={editValue} onChange={(e) => onEdit(key, e.target.value)} placeholder={t("project.tagsHint")} />
                            <button className="btn" onClick={onSave}>Sauvegarder</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
