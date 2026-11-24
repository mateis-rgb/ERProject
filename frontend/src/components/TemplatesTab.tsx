// Onglet Modèles (templates) des réglages - liste + formulaire de création/édition (Power of 10 R4)
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useTranslation } from "../i18n/I18nContext";
import { useAuth } from "../context/AppContext";
import { AuthUser, Project, ProjectTemplate } from "../types";
import TemplateForm from "./TemplateForm";
import TemplateCard from "./TemplateCard";

export default function TemplatesTab(): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [editing, setEditing] = useState<ProjectTemplate | null | "new">(null);

    const load = (): void => {
        api.get<ProjectTemplate[]>("/api/templates").then((r) => { if (r.success) setTemplates(r.data); });
        api.get<Project[]>("/api/projects?limit=200").then((r) => { if (r.success) setProjects(r.data); });
        if (user?.role === "ADMIN") {
            api.get<AuthUser[]>("/api/admin/users").then((r) => { if (r.success) setUsers(r.data); });
        }
    };
    useEffect(load, []);

    const save = (data: Omit<ProjectTemplate, "id" | "createdAt" | "updatedAt">): void => {
        const req = editing !== null && editing !== "new"
            ? api.patch<ProjectTemplate>(`/api/templates/${editing.id}`, data)
            : api.post<ProjectTemplate>("/api/templates", data);
        void req.then((r) => { if (r.success) { setEditing(null); load(); } });
    };

    const canEdit = user !== null && user.role !== "VIEWER";
    const initial = editing !== null && editing !== "new" ? editing : null;
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>{t("templates.title")}</h2>
                {canEdit && editing === null && (
                    <button className="btn" onClick={() => setEditing("new")}>+ {t("templates.new")}</button>
                )}
            </div>
            {editing !== null && (
                <div className="modal-backdrop" onClick={() => setEditing(null)}>
                    <div className="modal" style={{ maxWidth: "760px" }} onClick={(e) => e.stopPropagation()}>
                        <TemplateForm initial={initial} users={users} onSave={save} onCancel={() => setEditing(null)} />
                    </div>
                </div>
            )}
            {templates.map((tpl) => (
                <TemplateCard key={tpl.id} tpl={tpl} projects={projects} canEdit={canEdit}
                    isAdmin={user?.role === "ADMIN"} onEdit={setEditing} onChanged={load} />
            ))}
            {templates.length === 0 && <p style={{ color: "var(--muted)" }}>{t("templates.empty")}</p>}
        </div>
    );
}
