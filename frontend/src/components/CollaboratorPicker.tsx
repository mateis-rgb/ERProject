// Sélecteur de collaborateurs d'un projet - recherche, max 5 affichés, créateur masqué (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState } from "react";
import { AuthUser } from "../types";

interface Props {
    users: AuthUser[];
    selected: string[];
    excludeId: string | null; // créateur du projet, non affiché
    canEdit: boolean;
    onToggle: (uid: string) => void;
}

const MAX_SHOWN = 5;

export default function CollaboratorPicker({ users, selected, excludeId, canEdit, onToggle }: Props): JSX.Element {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");

    const q = query.trim().toLowerCase();
    const visible = users
        .filter((u) => u.id !== excludeId)
        .filter((u) => q === "" || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    const shown = visible.slice(0, MAX_SHOWN);
    const hiddenCount = visible.length - shown.length;

    return (
        <div className="card">
            <h2 style={{ margin: 0, marginBottom: "0.75rem", fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>
                Collaborateurs ({selected.length})
            </h2>
            <input className="input" style={{ marginBottom: "0.6rem" }} placeholder={t("project.searchCollaborator")}
                value={query} onChange={(e) => setQuery(e.target.value)} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "320px", overflowY: "auto" }}>
                {shown.map((u) => (
                    <label key={u.id} style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        border: "2px solid var(--ink)", padding: "0.4rem 0.6rem",
                        background: selected.includes(u.id) ? "var(--accent)" : "var(--surface-2)",
                        color: selected.includes(u.id) ? "var(--accent-ink)" : "var(--text)",
                        cursor: canEdit ? "pointer" : "default", fontWeight: 600, fontSize: "0.85rem",
                    }}>
                        <input type="checkbox" checked={selected.includes(u.id)} disabled={!canEdit}
                            onChange={() => onToggle(u.id)} />
                        {u.name}
                        <span className="mono" style={{ fontSize: "0.68rem", opacity: 0.7 }}>({u.email} · {u.role})</span>
                    </label>
                ))}
                {hiddenCount > 0 && (
                    <p className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0 }}>
                        + {hiddenCount} autre{hiddenCount > 1 ? "s" : ""} — affinez la recherche
                    </p>
                )}
                {visible.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{t("common.noResult")}</p>}
            </div>
        </div>
    );
}
