// Tuile admin : scope des @mentions par contexte (projet vs article stock) (Power of 10 R4)
import { useState } from "react";
import { FiLock } from "react-icons/fi";
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import { useConfigLists } from "../../hooks/useConfigLists";

const PROJECT_KEY = "mention_scope_project";
const STOCK_KEY = "mention_scope_stock";

interface ScopeSelectProps {
    label: string;
    value: string;
    options: { v: string; key: string }[];
    onChange: (v: string) => void;
}

function ScopeSelect({ label, value, options, onChange }: ScopeSelectProps): JSX.Element {
    const { t } = useTranslation();
    return (
        <div style={{ marginBottom: "0.9rem" }}>
            <p className="label">{label}</p>
            <select className="select" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", maxWidth: "420px" }}>
                {options.map((o) => <option key={o.v} value={o.v}>{t(o.key)}</option>)}
            </select>
        </div>
    );
}

export default function MentionScopeSection(): JSX.Element {
    const { t } = useTranslation();
    const configs = useConfigLists();
    const [projectScope, setProjectScope] = useState<string | null>(null);
    const [stockScope, setStockScope] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const curProject = projectScope ?? (configs[PROJECT_KEY]?.[0] ?? "collaborators");
    const curStock = stockScope ?? (configs[STOCK_KEY]?.[0] ?? "all");

    const save = (): void => {
        Promise.all([
            api.put(`/api/config/${PROJECT_KEY}`, { values: [curProject] }),
            api.put(`/api/config/${STOCK_KEY}`, { values: [curStock] }),
        ]).then(() => setSaved(true));
    };

    return (
        <div className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FiLock /> {t("app.mentionsTitle")}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 1rem" }}>{t("app.mentionsDesc")}</p>
            <ScopeSelect label={t("app.mentionProject")} value={curProject} onChange={(v) => { setProjectScope(v); setSaved(false); }}
                options={[
                    { v: "collaborators", key: "app.mentionCollaborators" },
                    { v: "all", key: "app.mentionAll" },
                ]} />
            <ScopeSelect label={t("app.mentionStock")} value={curStock} onChange={(v) => { setStockScope(v); setSaved(false); }}
                options={[
                    { v: "all", key: "app.mentionAll" },
                    { v: "none", key: "app.mentionNone" },
                ]} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <button className="btn" onClick={save}>{t("common.save")}</button>
                {saved && <span style={{ color: "var(--green)", fontSize: "0.8rem", fontWeight: 700 }}>{t("app.mentionsSaved")}</span>}
            </div>
        </div>
    );
}
