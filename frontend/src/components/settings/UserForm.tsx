// Formulaire création utilisateur admin (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useState, FormEvent } from "react";
import { api } from "../../services/api";
import { AuthUser, UserRole } from "../../types";
import BrutalSelect from "../ui/BrutalSelect";

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
        <form className="form-grid" onSubmit={submit}>
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
                <BrutalSelect value={role} onChange={(v) => setRole(v as UserRole)}
                    options={ROLES.map((r) => ({ value: r.id, label: `${t(r.labelKey)} — ${t(r.descKey)}` }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
                <button className="btn" type="submit" disabled={busy}>{busy ? "Création..." : "Créer l'utilisateur"}</button>
            </div>
        </form>
    );
}
