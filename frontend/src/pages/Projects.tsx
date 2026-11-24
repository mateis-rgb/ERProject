// Page liste des projets - décomposée (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Project } from "../types";
import { useAuth } from "../context/AppContext";
import ProjectForm from "../components/ProjectForm";
import ProjectTable from "../components/ProjectTable";

export default function Projects(): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canEdit = user !== null && user.role !== "VIEWER";

    const load = (): void => {
        const params = search ? `?search=${encodeURIComponent(search)}` : "";
        api.get<Project[]>(`/api/projects${params}`).then((res) => {
            if (res.success) setProjects(res.data);
        });
    };

    useEffect(load, [search]);

    const handleCreated = (): void => {
        setShowForm(false);
        setError(null);
        load();
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                    <h1 className="page-title">Projets</h1>
                    <p className="page-subtitle">{projects.length} PROJET{projects.length > 1 ? "S" : ""} · PRODUCTION</p>
                </div>
                {canEdit && (
                    <button className="btn" onClick={() => setShowForm(!showForm)}>
                        {showForm ? "Annuler" : "+ Nouveau projet"}
                    </button>
                )}
            </div>
            {error !== null && <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>}
            {showForm && canEdit && <ProjectForm onCreated={handleCreated} onError={setError} />}
            <input
                className="input"
                placeholder={t("projects.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: "1rem", maxWidth: "400px" }}
            />
            <ProjectTable projects={projects} />
        </div>
    );
}
