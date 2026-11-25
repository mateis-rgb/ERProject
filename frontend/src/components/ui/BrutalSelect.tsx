// Select custom néo-brutaliste : bouton façon .select + liste déroulante bordée/ombrée (Power of 10 R4)
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

export interface SelectOption { value: string; label: string; }

interface Props {
    value: string;
    onChange: (v: string) => void;
    options: SelectOption[];
    ariaLabel?: string;
    minWidth?: string;
    height?: string;
}

function OptionRow(p: { opt: SelectOption; active: boolean; selected: boolean; onPick: () => void; onHover: () => void }): JSX.Element {
    return (
        <div
            onClick={p.onPick}
            onMouseEnter={p.onHover}
            style={{
                padding: "0.5rem 0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
                background: p.active ? "var(--accent)" : "transparent",
                color: p.active ? "var(--accent-ink)" : "var(--text)",
                borderBottom: "1px solid var(--ink)", fontSize: "0.85rem", fontWeight: 600,
            }}
        >
            <span style={{ width: "16px", flexShrink: 0, display: "inline-flex" }}>
                {p.selected && <FiCheck size={14} strokeWidth={3} />}
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.opt.label}</span>
        </div>
    );
}

function OptionDropdown(p: {
    options: SelectOption[]; value: string; highlight: number;
    onPick: (v: string) => void; onHover: (i: number) => void;
}): JSX.Element {
    return (
        <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300,
            background: "var(--surface)", border: "2px solid var(--ink)", boxShadow: "5px 5px 0 var(--ink)",
            maxHeight: "240px", overflow: "auto",
        }}>
            {p.options.map((o, i) => (
                <OptionRow key={o.value} opt={o} active={i === p.highlight} selected={o.value === p.value}
                    onPick={() => p.onPick(o.value)} onHover={() => p.onHover(i)} />
            ))}
        </div>
    );
}

export default function BrutalSelect({ value, onChange, options, ariaLabel, minWidth = "150px", height = "40px" }: Props): JSX.Element {
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const current = options.find((o) => o.value === value);

    useEffect(() => {
        const onClick = (e: MouseEvent): void => {
            if (ref.current !== null && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    useEffect(() => {
        const i = options.findIndex((o) => o.value === value);
        setHighlight(i >= 0 ? i : 0);
    }, [value, options]);

    const pick = (v: string): void => {
        onChange(v);
        setOpen(false);
    };

    const onKey = (e: React.KeyboardEvent): void => {
        if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, options.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setHighlight((h) => Math.max(h - 1, 0)); }
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (open && options[highlight] !== undefined) pick(options[highlight].value);
            else setOpen(!open);
        }
        if (e.key === "Escape") setOpen(false);
    };

    return (
        <div ref={ref} style={{ position: "relative", minWidth }}>
            <button
                type="button"
                aria-label={ariaLabel}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                onKeyDown={onKey}
                className="select"
                style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", cursor: "pointer", textTransform: "none", letterSpacing: 0 }}
            >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {current !== undefined ? current.label : value}
                </span>
                <FiChevronDown style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s ease" }} />
            </button>
            {open && (
                <OptionDropdown options={options} value={value} highlight={highlight} onPick={pick} onHover={setHighlight} />
            )}
        </div>
    );
}
