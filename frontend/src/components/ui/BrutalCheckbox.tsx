// Checkbox custom néo-brutaliste : carré bordé + ombre, fond accent et coche quand cochée (Power of 10 R4)
import { FiCheck } from "react-icons/fi";

interface Props {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
}

export default function BrutalCheckbox({ checked, onChange, label }: Props): JSX.Element {
    return (
        <label style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase",
            cursor: "pointer", paddingBottom: "0.45rem", userSelect: "none",
        }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            <span
                aria-hidden="true"
                style={{
                    width: "20px", height: "20px", flexShrink: 0,
                    border: "2px solid var(--ink)",
                    background: checked ? "var(--accent)" : "var(--surface)",
                    boxShadow: checked ? "none" : "var(--shadow-btn)",
                    transform: checked ? "translate(2px, 2px)" : undefined,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "var(--accent-ink)",
                }}
            >
                {checked && <FiCheck size={14} strokeWidth={3.5} />}
            </span>
            {label}
        </label>
    );
}
