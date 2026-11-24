import { FiArrowRight } from "react-icons/fi";
// Onglet Apparence - palettes + thème clair/sombre/système (Power of 10 R4)
import { useTheme } from "../../context/AppContext";
import { useTranslation } from "../../i18n/I18nContext";

const PALETTES = [
    { id: "yellow", label: "Jaune", color: "#ffd600" },
    { id: "pink", label: "Rose", color: "#ff6b9d" },
    { id: "blue", label: "Bleu", color: "#4d9fff" },
    { id: "green", label: "Vert", color: "#3ddc68" },
    { id: "violet", label: "Violet", color: "#b967ff" },
    { id: "orange", label: "Orange", color: "#ff8c1a" },
] as const;

const THEME_KEYS: Record<string, string> = {
    light: "appearance.themeLight",
    dark: "appearance.themeDark",
    system: "appearance.themeSystem",
};

export default function AppearanceSection(): JSX.Element {
    const { palette, setPalette, theme, setTheme, resolvedTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                {t("appearance.title")}
            </h2>

            <p className="label">{t("appearance.palette")}</p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                {PALETTES.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setPalette(p.id)}
                        style={{
                            width: "44px", height: "44px", background: p.color,
                            border: "3px solid var(--ink)",
                            boxShadow: palette === p.id ? "4px 4px 0 var(--ink)" : "none",
                            transform: palette === p.id ? "translate(-2px,-2px)" : "none",
                            cursor: "pointer",
                        }}
                        title={p.label}
                    />
                ))}
            </div>

            <p className="label">{t("appearance.theme")}</p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                {(Object.keys(THEME_KEYS) as Array<keyof typeof THEME_KEYS>).map((id) => (
                    <button
                        key={id}
                        className={theme === id ? "btn" : "btn-ghost"}
                        onClick={() => setTheme(id as "dark" | "light" | "system")}
                    >
                        {t(THEME_KEYS[id] ?? "")}
                    </button>
                ))}
            </div>
            {theme === "system" && (
                <p className="mono" style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--muted)" }}>
                    <span className="ic"><FiArrowRight /> {resolvedTheme === "dark" ? "sombre" : "clair"}</span>
                </p>
            )}
        </div>
    );
}
