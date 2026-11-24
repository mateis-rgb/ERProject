// Formulaire création utilisateur admin (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useState, FormEvent } from "react";
import { api } from "../../services/api";
import { AuthUser, UserRole } from "../../types";

interface Props {
    onCreated: () => void;
    onError: (msg: string) => void;
}

const ROLES: { id: UserRole; labelKey: string; descKey: string }[] = [
    { id: "ADMIN", labelKey: "roles.admin", descKey: "roles.adminDesc" },
    { id: "EDITOR", labelKey: "roles.editor", descKey: "roles.editorDesc" },
    { id: "VIEWER", labelKey: "roles.viewer", descKey: "roles.viewerDesc" },
];

export default function UserForm({ onCreated, onError }: Props): JSX.Element {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState<UserRole>("VIEWER");
    const [busy, setBusy] = useState(false);

    const submit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        const res = await api.post<AuthUser>("/api/admin/users", { email, password, name, role });
        setBusy(false);
        if (!res.success) { onError(res.error); return; }
        setEmail(""); setPassword(""); setName(""); setRole("VIEWER");
        onCreated();
    };

    return (
        <form className="card" onSubmit={submit} style={{ marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            <div>
                <label className="label">{t("drive.name")}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jean Dupont" />
            </div>
            <div>
                <label className="label">{t("login.email")}</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jean@studio.fr" />
            </div>
            <div>
                <label className="label">{t("login.password")}</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••" />
            </div>
            <div>
                <label className="label">{t("access.role")}</label>
                <select className="select" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{t(r.labelKey)} — {t(r.descKey)}</option>)}
                </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
                <button className="btn" type="submit" disabled={busy}>{busy ? "Création..." : "Créer l'utilisateur"}</button>
            </div>
        </form>
    );
}
