// Bouton-toggle façon site : carré + coche, fond accent quand actif, effet enfoncé (Power of 10 R4)
import { FiCheck } from "react-icons/fi";

interface Props {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
}

export default function CheckToggle({ checked, onChange, label }: Props): JSX.Element {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
            style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.45rem 0.7rem", cursor: "pointer",
                background: checked ? "var(--accent)" : "var(--surface)",
                color: checked ? "var(--accent-ink)" : "var(--text)",
                border: "2px solid var(--ink)",
                boxShadow: checked ? "none" : "var(--shadow-btn)",
                transform: checked ? "translate(2px, 2px)" : undefined,
                fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase",
                fontFamily: "inherit",
            }}
        >
            <span
                style={{
                    width: "16px", height: "16px", flexShrink: 0,
                    border: "2px solid var(--ink)",
                    background: checked ? "var(--accent-ink)" : "transparent",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "var(--accent)",
                }}
            >
                {checked && <FiCheck size={12} strokeWidth={3.5} />}
            </span>
            {label}
        </button>
    );
}
