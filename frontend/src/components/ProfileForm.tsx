import { FiAlertTriangle } from "react-icons/fi";
// Formulaire changement de nom / mot de passe (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState, FormEvent } from "react";
import { api } from "../services/api";
import { AuthUser } from "../types";

interface Props {
    onSaved: () => void;
}

export default function ProfileForm({ onSaved }: Props): JSX.Element {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const body: Record<string, string> = {};
        if (name.trim().length > 0) body.name = name.trim();
        if (newPw.length > 0) {
            body.currentPassword = currentPw;
            body.newPassword = newPw;
        }
        if (Object.keys(body).length === 0) {
            setError(t("security.nothingToChange"));
            setBusy(false);
            return;
        }
        const res = await api.patch<AuthUser>("/api/auth/me", body);
        setBusy(false);
        if (!res.success) { setError(res.error); return; }
        setName(""); setCurrentPw(""); setNewPw("");
        onSaved();
    };

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {error !== null && (
                <p style={{ color: "var(--danger)", border: "2px solid var(--danger)", padding: "0.4rem 0.6rem",
                    fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, margin: 0 }}>
                    <FiAlertTriangle /> {error}
                </p>
            )}
            <div>
                <label className="label">Nouveau nom</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("security.passwordLeaveEmpty")} />
            </div>
            <div>
                <label className="label">Mot de passe actuel</label>
                <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder={t("security.passwordRequired")} />
            </div>
            <div>
                <label className="label">Nouveau mot de passe</label>
                <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                    minLength={6} placeholder={t("security.passwordMin")} />
            </div>
            <button className="btn" type="submit" disabled={busy} style={{ alignSelf: "flex-start" }}>
                {busy ? "Enregistrement..." : "Enregistrer"}
            </button>
        </form>
    );
}
