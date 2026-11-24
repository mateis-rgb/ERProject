// Barre de quota du drive - texte + barre de progression (Power of 10 R4)
import { DriveUsage } from "../../types";
import { formatSize } from "../drive/DriveTab";
import { useTranslation } from "../../i18n/I18nContext";

export default function QuotaBar({ usage }: { usage: DriveUsage }): JSX.Element {
    const { t } = useTranslation();
    const hasQuota = usage.quotaBytes !== null && usage.quotaBytes > 0;
    const pct = hasQuota ? Math.min(100, Math.round((usage.usedBytes / (usage.quotaBytes ?? 1)) * 100)) : 0;
    const color = pct >= 90 ? "var(--danger)" : pct >= 70 ? "var(--accent)" : "var(--green)";
    return (
        <div style={{ minWidth: "220px" }}>
            <div style={{ border: "2px solid var(--ink)", height: "16px", background: "var(--surface-2)" }}>
                <div style={{
                    width: hasQuota ? `${pct}%` : "100%",
                    height: "100%",
                    background: hasQuota ? color : "var(--surface-2)",
                    borderRight: hasQuota && pct < 100 ? "2px solid var(--ink)" : "none",
                    opacity: hasQuota ? 1 : 0.4,
                }} />
            </div>
            <p className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", margin: "0.25rem 0 0" }}>
                {formatSize(usage.usedBytes)}{hasQuota ? ` / ${formatSize(usage.quotaBytes ?? 0)} (${pct}%)` : " — " + t("drive.quotaUnlimited")}
            </p>
        </div>
    );
}
