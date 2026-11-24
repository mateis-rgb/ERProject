import { FiAlertTriangle } from "react-icons/fi";
// Onglet Accès (admin) - gestion users + audit (Power of 10 R4)
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { AuthUser } from "../types";
import UserForm from "./UserForm";
import UserTable from "./UserTable";
import AuditLog from "./AuditLog";

export default function AccessTab(): JSX.Element {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = (): void => {
        api.get<AuthUser[]>("/api/admin/users").then((r) => {
            if (r.success) setUsers(r.data);
            else setError(r.error);
        });
    };

    useEffect(load, []);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <p className="page-subtitle" style={{ margin: 0 }}>
                    {users.length} UTILISATEUR{users.length > 1 ? "S" : ""} · RÔLES & PERMISSIONS
                </p>
                <button className="btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Annuler" : "+ Nouvel utilisateur"}
                </button>
            </div>
            {error !== null && (
                <p style={{ color: "var(--danger)", border: "2px solid var(--danger)", padding: "0.5rem 0.75rem",
                    fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem" }}>
                    <span className="ic"><FiAlertTriangle /> {error}</span>
                </p>
            )}
            {showForm && <UserForm onCreated={() => { setShowForm(false); load(); }} onError={setError} />}
            <UserTable users={users} onChanged={load} />
            <AuditLog />
        </div>
    );
}
