// Barre de recherche stock avec autocomplétion (articles, catégories, emplacements) (Power of 10 R4)
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import { StockItem } from "../../types";
import { FiTag, FiMapPin, FiSearch } from "react-icons/fi";
import StockIcon from "./StockIcon";

export interface Suggestion {
    kind: "item" | "category" | "location";
    label: string;
    sub: string;
    item?: StockItem;
}

interface Props {
    query: string;
    onQuery: (v: string) => void;
    allItems: StockItem[];
    categories: string[];
    locations: string[];
    onPickItem: (item: StockItem) => void;
    onPickCategory: (c: string) => void;
    onPickLocation: (l: string) => void;
}

const MAX_ITEMS = 5;
const MAX_TERMS = 3;

function matches(text: string, q: string): boolean {
    return text.toLowerCase().includes(q);
}

export function buildSuggestions(query: string, allItems: StockItem[], categories: string[], locations: string[]): Suggestion[] {
    const q = query.trim().toLowerCase();
    if (q === "") return [];
    const items: Suggestion[] = allItems
        .filter((i) => matches(i.name, q) || matches(i.reference, q))
        .slice(0, MAX_ITEMS)
        .map((i): Suggestion => ({ kind: "item", label: i.name, sub: i.reference, item: i }));
    const cats = categories.filter((c) => matches(c, q))
        .slice(0, MAX_TERMS)
        .map((c): Suggestion => ({ kind: "category", label: c, sub: "" }));
    const locs = locations.filter((l) => matches(l, q))
        .slice(0, MAX_TERMS)
        .map((l): Suggestion => ({ kind: "location", label: l, sub: "" }));
    return [...items, ...cats, ...locs];
}

function SuggestionIcon(p: { s: Suggestion; active: boolean }): JSX.Element {
    if (p.s.kind === "item" && p.s.item !== undefined) {
        return <StockIcon category={p.s.item.category} name={p.s.item.name} imagePath={p.s.item.imagePath} size={24} />;
    }
    const Icon = p.s.kind === "category" ? FiTag : FiMapPin;
    return <Icon style={{ flexShrink: 0, color: p.active ? "var(--accent-ink)" : "var(--accent)" }} />;
}

function SuggestionRow(p: { s: Suggestion; active: boolean; onPick: () => void; onHover: () => void; label: string }): JSX.Element {
    return (
        <div
            onClick={p.onPick}
            onMouseEnter={p.onHover}
            style={{
                padding: "0.5rem 0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                background: p.active ? "var(--accent)" : "transparent",
                color: p.active ? "var(--accent-ink)" : "var(--text)",
                borderBottom: "1px solid var(--ink)", fontSize: "0.85rem",
            }}
        >
            <SuggestionIcon s={p.s} active={p.active} />
            <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.s.label}</strong>
            {p.s.sub !== "" && (
                <span className="mono" style={{ fontSize: "0.72rem", opacity: 0.7, flexShrink: 0 }}>{p.s.sub}</span>
            )}
            <span className="mono" style={{ marginLeft: "auto", fontSize: "0.62rem", opacity: 0.6, flexShrink: 0, textTransform: "uppercase" }}>
                {p.label}
            </span>
        </div>
    );
}

function SuggestionDropdown(p: {
    suggestions: Suggestion[]; highlight: number; noResult: string;
    onPick: (s: Suggestion) => void; onHover: (i: number) => void; kindLabel: (k: Suggestion["kind"]) => string;
}): JSX.Element {
    return (
        <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300,
            background: "var(--surface)", border: "2px solid var(--ink)", boxShadow: "5px 5px 0 var(--ink)",
            maxHeight: "280px", overflow: "auto",
        }}>
            {p.suggestions.length === 0 && (
                <div style={{ padding: "0.6rem 0.75rem", color: "var(--muted)", fontSize: "0.85rem" }}>{p.noResult}</div>
            )}
            {p.suggestions.map((s, i) => (
                <SuggestionRow key={`${s.kind}:${s.label}`} s={s} active={i === p.highlight}
                    onPick={() => p.onPick(s)} onHover={() => p.onHover(i)} label={p.kindLabel(s.kind)} />
            ))}
        </div>
    );
}

export default function StockSearchBar({ query, onQuery, allItems, categories, locations, onPickItem, onPickCategory, onPickLocation }: Props): JSX.Element {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const suggestions = buildSuggestions(query, allItems, categories, locations);

    useEffect(() => {
        const onClick = (e: MouseEvent): void => {
            if (ref.current !== null && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const pick = (s: Suggestion): void => {
        if (s.kind === "item" && s.item !== undefined) onPickItem(s.item);
        else if (s.kind === "category") { onPickCategory(s.label); onQuery(""); }
        else onPickLocation(s.label);
        setOpen(false);
    };

    const onKey = (e: React.KeyboardEvent): void => {
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
        if (e.key === "Enter" && suggestions[highlight] !== undefined) { e.preventDefault(); pick(suggestions[highlight]); }
        if (e.key === "Escape") setOpen(false);
    };

    const kindLabel = (k: Suggestion["kind"]): string =>
        k === "item" ? t("stock.suggestArticle") : k === "category" ? t("stock.suggestCategory") : t("stock.suggestLocation");

    return (
        <div ref={ref} style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "440px" }}>
            <div style={{ position: "relative" }}>
                <FiSearch style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                <input
                    className="input"
                    style={{ paddingLeft: "2rem", height: "40px", boxSizing: "border-box" }}
                    placeholder={t("stock.searchArticle")}
                    value={query}
                    onChange={(e) => { onQuery(e.target.value); setOpen(true); setHighlight(0); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKey}
                />
            </div>
            {open && query.trim() !== "" && (
                <SuggestionDropdown suggestions={suggestions} highlight={highlight} noResult={t("stock.noSuggestion")}
                    onPick={pick} onHover={setHighlight} kindLabel={kindLabel} />
            )}
        </div>
    );
}
