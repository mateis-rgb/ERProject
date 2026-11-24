// Onglet Sécurité - profil + sessions (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState } from "react";
import { useAuth } from "../context/AppContext";
import ProfileForm from "./ProfileForm";
import SessionCard from "./SessionCard";

export default function SecurityTab(): JSX.Element {
    const { t } = useTranslation();
    const { user, refresh } = useAuth();
    const [msg, setMsg] = useState<string | null>(null);

    if (user === null) return <></>;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start" }}>
            <div className="card">
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                    Mon profil
                </h2>
                <ProfileForm onSaved={() => { refresh(); setMsg(t("security.profileUpdated")); }} />
                {msg !== null && (
                    <p className="mono" style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--accent)" }}>{msg}</p>
                )}
            </div>
            <SessionCard user={user} onRevoked={() => setMsg("Toutes les autres sessions ont été révoquées.")} />
        </div>
    );
}
