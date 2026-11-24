// Formulaire de connexion (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState, FormEvent } from "react";

interface Props {
    busy: boolean;
    onSubmit: (email: string, password: string) => void;
}

export default function LoginForm({ busy, onSubmit }: Props): JSX.Element {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { t } = useTranslation();

    const handleSubmit = (e: FormEvent): void => {
        e.preventDefault();
        onSubmit(email, password);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
                <label className="label">{t("login.email")}</label>
                <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                />
            </div>
            <div>
                <label className="label">{t("login.password")}</label>
                <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
            </div>
            <button className="btn" type="submit" disabled={busy}>
                {busy ? t("login.submitting") : t("login.submit")}
            </button>
        </form>
    );
}
