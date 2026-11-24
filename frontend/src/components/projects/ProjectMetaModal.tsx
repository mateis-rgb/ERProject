import { FiArrowRight, FiTag } from "react-icons/fi";
// Modale de détail d'une "chip" de l'en-tête projet (collaborateurs, tags, jalons) (Power of 10 R4)
import { Milestone, Project, ProjectCollaborator } from "../../types";
import { useTranslation } from "../../i18n/I18nContext";

export type MetaKind = "collaborators" | "tags" | "milestones";

interface Props {
    kind: MetaKind;
    project: Project;
    collaborators: ProjectCollaborator[] | null;
    milestones: Milestone[];
    onClose: () => void;
}

const TITLES: Record<MetaKind, string> = {
    collaborators: "projectHeader.meta.collaborators",
    tags: "projectHeader.meta.tags",
    milestones: "projectHeader.meta.milestones",
};

const fmt = (d: string): string => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const rowStyle: React.CSSProperties = { border: "2px solid var(--ink)", padding: "0.35rem 0.6rem", display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center" };
const colStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem" };

function CollabList({ collaborators }: { collaborators: ProjectCollaborator[] | null }): JSX.Element {
    const { t } = useTranslation();
    if (collaborators === null) return <p style={{ color: "var(--muted)" }}>{t("common.loading")}</p>;
    if (collaborators.length === 0) return <p style={{ color: "var(--muted)" }}>{t("projectHeader.meta.empty")}</p>;
    return (
        <div style={colStyle}>
            {collaborators.map((c) => (
                <div key={c.id} style={rowStyle}>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{c.name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({c.email})</span></span>
                    <span className="badge">{t(`roles.${c.role.toLowerCase()}`)}</span>
                </div>
            ))}
        </div>
    );
}

function TagList({ project }: { project: Project }): JSX.Element {
    const { t } = useTranslation();
    if (project.tags.length === 0) return <p style={{ color: "var(--muted)" }}>{t("projectHeader.meta.empty")}</p>;
    return (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {project.tags.map((tg) => <span key={tg} className="badge" style={{ background: "var(--surface-2)" }}><FiTag /> {tg}</span>)}
        </div>
    );
}

function MilestoneList({ milestones }: { milestones: Milestone[] }): JSX.Element {
    const { t } = useTranslation();
    if (milestones.length === 0) return <p style={{ color: "var(--muted)" }}>{t("projectHeader.meta.empty")}</p>;
    return (
        <div style={colStyle}>
            {milestones.map((m) => (
                <div key={m.id} style={rowStyle}>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                        <span style={{ display: "inline-block", width: "10px", height: "10px", background: m.color, border: "1px solid var(--ink)", marginRight: "0.4rem" }} />
                        {m.name}
                    </span>
                    <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}><span className="ic">{fmt(m.startDate)} <FiArrowRight /> {fmt(m.endDate)}</span></span>
                </div>
            ))}
        </div>
    );
}

function ListBody(props: Props): JSX.Element {
    if (props.kind === "collaborators") return <CollabList collaborators={props.collaborators} />;
    if (props.kind === "tags") return <TagList project={props.project} />;
    return <MilestoneList milestones={props.milestones} />;
}

export default function ProjectMetaModal(props: Props): JSX.Element {
    const { kind, onClose } = props;
    const { t } = useTranslation();
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>
                    {t(TITLES[kind])}
                </h3>
                <ListBody {...props} />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                    <button className="btn-ghost" onClick={onClose}>{t("common.close")}</button>
                </div>
            </div>
        </div>
    );
}
