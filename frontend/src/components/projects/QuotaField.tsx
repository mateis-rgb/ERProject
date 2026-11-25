// Champ quota du drive (admin uniquement) - saisie en notation user-friendly (Go/Mo/Ko), octets affiché dessous (Power of 10 R4)
import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
interface Props {
    value: string; // octets en string
    canEdit: boolean;
    onChange: (v: string) => void;
}

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

// "5 Go", "500 Mo", "1024 Ko", "2048" (octets) -> octets
export function parseFriendly(input: string): number | null {
    const m = input.trim().match(/^(\d+(?:[.,]\d+)?)\s*(ko|mo|go|o|kb|mb|gb)?$/i);
    if (m === null) return null;
    const n = parseFloat((m[1] ?? "0").replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return null;
    const unit = (m[2] ?? "o").toLowerCase();
    if (unit === "go" || unit === "gb") return Math.round(n * GB);
    if (unit === "mo" || unit === "mb") return Math.round(n * MB);
    if (unit === "ko" || unit === "kb") return Math.round(n * KB);
    return Math.round(n);
}

// octets -> "5 Go" / "500 Mo" / "1024 Ko" / "512 o"
export function formatFriendly(bytes: number): string {
    if (bytes >= GB) return `${Math.round(bytes / GB * 10) / 10} Go`;
    if (bytes >= MB) return `${Math.round(bytes / MB * 10) / 10} Mo`;
    if (bytes >= KB) return `${Math.round(bytes / KB)} Ko`;
    return `${bytes} o`;
}

export default function QuotaField({ value, canEdit, onChange }: Props): JSX.Element {
    const { t } = useTranslation();
    const bytes = value === "" ? null : parseFloat(value);
    const [text, setText] = useState(bytes !== null && Number.isFinite(bytes) ? formatFriendly(bytes) : "");

    useEffect(() => {
        const b = value === "" ? null : parseFloat(value);
        if (b !== null && Number.isFinite(b)) setText(formatFriendly(b));
    }, [value]);

    const onText = (v: string): void => {
        setText(v);
        const parsed = parseFriendly(v);
        if (parsed !== null) onChange(String(parsed));
    };

    return (
        <div className="card">
            <h2 style={{ margin: 0, marginBottom: "0.75rem", fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase" }}>
                Quota du drive
            </h2>
            <label className="label">{t("quota.label")}</label>
            <input className="input" type="text" value={text} disabled={!canEdit}
                placeholder="Ex: 5 Go" onChange={(e) => onText(e.target.value)} />
            <p className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.4rem" }}>
                {bytes !== null && Number.isFinite(bytes) ? `= ${Math.round(bytes)} octets` : "—"}
            </p>
            <p className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.4rem" }}>
                Notation libre : 5 Go, 500 Mo, 1024 Ko, ou octets brut. Le quota bloque les uploads au-delà de la limite. Réglable uniquement par un administrateur.
            </p>
        </div>
    );
}
