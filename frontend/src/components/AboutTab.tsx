// Onglet À propos - description, version, équipe (chip + modal), section mises à jour (Power of 10 R4)
import { useState } from "react";
import { useTranslation } from "../i18n/I18nContext";
import UpdateSection from "./UpdateSection";

const VERSION = "0.1.0";

interface Member { name: string; github: string; role: string }

// Équipe ERProjects (à compléter) — nom + handle GitHub
const TEAM: Member[] = [
    { name: "Mat", github: "mateis", role: "Lead dev" },
    { name: "Mistral Vibe", github: "mistralai", role: "Assistant" },
];

function TeamModal({ onClose, label }: { onClose: () => void; label: (k: string) => string }): JSX.Element {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>
                    👥 {label("about.teamModalTitle")}
                </h3>
                {TEAM.map((m) => (
                    <div key={m.github} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "2px solid var(--ink)" }}>
                        <div>
                            <strong style={{ fontSize: "0.9rem" }}>{m.name}</strong>
                            <p className="mono" style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "var(--muted)" }}>{m.role}</p>
                        </div>
                        <a className="btn-ghost" style={{ textDecoration: "none", padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                            href={`https://github.com/${m.github}`} target="_blank" rel="noreferrer">
                            @{m.github} ↗
                        </a>
                    </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                    <button className="btn-ghost" onClick={onClose}>{label("common.close")}</button>
                </div>
            </div>
        </div>
    );
}

export default function AboutTab(): JSX.Element {
    const { t } = useTranslation();
    const [teamOpen, setTeamOpen] = useState(false);

    return (
        <div style={{ maxWidth: "640px" }}>
            <div className="card" style={{ marginBottom: "1rem" }}>
                <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.4rem", fontWeight: 700 }}>📐 ERProjects</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 0.75rem" }}>{t("about.description")}</p>
                <p className="mono" style={{ fontSize: "0.78rem", margin: "0.25rem 0" }}>{t("about.version")} : <strong>{VERSION}</strong></p>
                <p className="mono" style={{ fontSize: "0.78rem", margin: "0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {t("about.authors")} :
                    <button className="btn-ghost" style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }} onClick={() => setTeamOpen(true)}>
                        👥 {t("about.teamChip")}
                    </button>
                </p>
            </div>
            <UpdateSection />
            {teamOpen && <TeamModal onClose={() => setTeamOpen(false)} label={t} />}
        </div>
    );
}
