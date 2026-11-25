import { useTranslation } from "../../i18n/I18nContext";

export function ProgressBar({ value, width = 120 }: { value: number | null; width?: number }) {
    const { t } = useTranslation();
    if (value === null) return <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>—</span>;
    const pct = Math.max(0, Math.min(100, value));
    return (
        <span title={`${t("common.progress")} : ${pct}%`} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span
                style={{
                    display: "inline-block",
                    width,
                    height: 10,
                    border: "2px solid var(--ink)",
                    borderRadius: 2,
                    backgroundColor: "var(--surface)",
                    overflow: "hidden",
                    flexShrink: 0,
                }}
            >
                <span
                    style={{
                        display: "block",
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: pct >= 100 ? "var(--accent)" : "var(--ok, #2f9e44)",
                    }}
                />
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--muted)" }}>{pct}%</span>
        </span>
    );
}
