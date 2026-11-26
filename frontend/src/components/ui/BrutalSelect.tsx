// Select custom néo-brutaliste : bouton façon .select + liste déroulante en PORTAL (fixed, z-index haut)
// pour ne pas être clippée par les conteneurs scrollables (tableaux, cards overflow hidden) (Power of 10 R4)
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown } from "react-icons/fi";

export interface SelectOption { value: string; label: string; }

interface Props {
    value: string;
    onChange: (v: string) => void;
    options: SelectOption[];
    ariaLabel?: string;
    minWidth?: string;
    height?: string;
    width?: string;
    disabled?: boolean;
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

interface DropdownPos { top: number; bottom: number; left: number; width: number; up: boolean; }

function OptionDropdown(p: {
    options: SelectOption[]; value: string; highlight: number; pos: DropdownPos;
    onPick: (v: string) => void; onHover: (i: number) => void;
}): JSX.Element {
    return createPortal(
        <div
            data-brutal-select-dropdown="true"
            style={{
                position: "fixed",
                ...(p.pos.up
                    ? { bottom: p.pos.bottom, top: "auto" }
                    : { top: p.pos.top, bottom: "auto" }),
                left: p.pos.left, width: p.pos.width, zIndex: 1000,
                background: "var(--surface)", border: "2px solid var(--ink)", boxShadow: "5px 5px 0 var(--ink)",
                // shortcut: dropdown capé à 240px, tronqué si ni haut ni bas dispo — upgrader vers popover scrollable externe si besoin
                maxHeight: "240px", overflow: "auto",
            }}
        >
            {p.options.map((o, i) => (
                <OptionRow key={o.value} opt={o} active={i === p.highlight} selected={o.value === p.value}
                    onPick={() => p.onPick(o.value)} onHover={() => p.onHover(i)} />
            ))}
        </div>,
        document.body
    );
}

function SelectButton(p: {
    label: string; open: boolean; disabled: boolean; height: string; ariaLabel?: string;
    onClick: () => void; onKey: (e: React.KeyboardEvent) => void;
}): JSX.Element {
    return (
        <button
            type="button"
            aria-label={p.ariaLabel}
            aria-expanded={p.open}
            disabled={p.disabled}
            onClick={p.onClick}
            onKeyDown={p.onKey}
            className="select"
            style={{
                width: "100%", height: p.height, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem",
                cursor: p.disabled ? "not-allowed" : "pointer", textTransform: "none", letterSpacing: 0,
                backgroundImage: "none", paddingRight: "0.7rem", opacity: p.disabled ? 0.6 : 1,
            }}
        >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</span>
            <FiChevronDown size={18} style={{ flexShrink: 0, transform: p.open ? "rotate(180deg)" : undefined, transition: "transform var(--dur-old) var(--ease-old)" }} />
        </button>
    );
}

function useOutsideClose(ref: React.RefObject<HTMLDivElement | null>, disabled: boolean, setOpen: (v: boolean) => void): void {
    useEffect(() => {
        if (disabled) return;
        const onClick = (e: MouseEvent): void => {
            const target = e.target as Element | null;
            // Le dropdown est rendu en portal (hors de ref) : ne pas le confondre avec un clic extérieur
            if (target !== null && target.closest("[data-brutal-select-dropdown]") !== null) return;
            if (ref.current !== null && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [disabled, ref, setOpen]);
}

// Le dropdown est en portal fixed : on le ferme au scroll/resize extérieur (pas au scroll de sa propre liste)
function useScrollClose(open: boolean, setOpen: (v: boolean) => void): void {
    useEffect(() => {
        if (!open) return;
        const close = (e: Event): void => {
            const target = e.target as Element | null;
            if (target !== null && target.closest !== undefined && target.closest("[data-brutal-select-dropdown]") !== null) return;
            setOpen(false);
        };
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [open, setOpen]);
}

interface SelectState {
    ref: React.MutableRefObject<HTMLDivElement | null>;
    open: boolean; highlight: number; pos: DropdownPos;
    toggle: () => void; setOpen: (v: boolean) => void; setHighlight: (v: number) => void;
    pick: (v: string) => void; onKey: (e: React.KeyboardEvent) => void;
}

// Position du dropdown : vers le bas, ou vers le HAUT si pas assez de place en dessous de l'écran
function computePos(rect: DOMRect, optionCount: number): DropdownPos {
    const estHeight = Math.min(240, optionCount * 38 + 4);
    const below = window.innerHeight - rect.bottom - 8;
    const up = below < estHeight && rect.top - 8 > below;
    return {
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        up,
    };
}

function useSelectState(value: string, onChange: (v: string) => void, options: SelectOption[], disabled: boolean): SelectState {
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [pos, setPos] = useState<DropdownPos>({ top: 0, bottom: 0, left: 0, width: 0, up: false });
    const ref = useRef<HTMLDivElement>(null);
    useOutsideClose(ref, disabled, setOpen);
    useScrollClose(open, setOpen);

    useEffect(() => {
        const i = options.findIndex((o) => o.value === value);
        setHighlight(i >= 0 ? i : 0);
    }, [value, options]);

    const toggle = (): void => {
        if (disabled) return;
        if (!open && ref.current !== null) {
            setPos(computePos(ref.current.getBoundingClientRect(), options.length));
        }
        setOpen(!open);
    };

    const pick = (v: string): void => {
        onChange(v);
        setOpen(false);
    };

    const onKey = (e: React.KeyboardEvent): void => {
        if (e.key === "ArrowDown") { e.preventDefault(); toggle(); setHighlight((h) => Math.min(h + 1, options.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); toggle(); setHighlight((h) => Math.max(h - 1, 0)); }
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (open && options[highlight] !== undefined) pick(options[highlight].value);
            else toggle();
        }
        if (e.key === "Escape") setOpen(false);
    };

    return { ref, open, highlight, pos, toggle, setOpen, setHighlight, pick, onKey };
}

export default function BrutalSelect({ value, onChange, options, ariaLabel, minWidth = "150px", height = "40px", width, disabled = false }: Props): JSX.Element {
    const s = useSelectState(value, onChange, options, disabled);
    const current = options.find((o) => o.value === value);
    return (
        <div ref={(el) => { s.ref.current = el; }} style={{ minWidth, width }}>
            <SelectButton
                label={current !== undefined ? current.label : value}
                open={s.open} disabled={disabled} height={height} ariaLabel={ariaLabel}
                onClick={s.toggle}
                onKey={s.onKey}
            />
            {s.open && !disabled && (
                <OptionDropdown options={options} value={value} highlight={s.highlight} pos={s.pos}
                    onPick={s.pick} onHover={s.setHighlight} />
            )}
        </div>
    );
}
