// Sélecteur de langue (Power of 10 R4)
import { useTranslation, LANGS, Lang } from "../../i18n/I18nContext";

export default function LanguagePicker(): JSX.Element {
    const { t, lang, setLang } = useTranslation();
    return (
        <>
            <p className="label" style={{ marginTop: "1.5rem" }}>{t("app.language")}</p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                {LANGS.map((l) => (
                    <button
                        key={l.code}
                        className={lang === l.code ? "btn" : "btn-ghost"}
                        onClick={() => setLang(l.code as Lang)}
                    >
                        {l.label}
                    </button>
                ))}
            </div>
        </>
    );
}
