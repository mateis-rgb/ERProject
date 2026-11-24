// Autocomplétion article de stock (Power of 10 R4)
import { useState, useRef, useEffect } from "react";
import { StockItem } from "../../types";
import AutocompleteList from "../ui/AutocompleteList";

interface Props {
    items: StockItem[];
    onSelect: (item: StockItem) => void;
    placeholder?: string;
}

const MAX_SUGGESTIONS = 8;

export default function StockAutocomplete({ items, onSelect, placeholder }: Props): JSX.Element {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = items
        .filter((i) =>
            i.name.toLowerCase().includes(query.toLowerCase()) ||
            i.reference.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, MAX_SUGGESTIONS);

    useEffect(() => {
        const onClick = (e: MouseEvent): void => {
            if (ref.current !== null && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const pick = (item: StockItem): void => {
        onSelect(item);
        setQuery(`${item.name} (${item.reference})`);
        setOpen(false);
    };

    const onKey = (e: React.KeyboardEvent): void => {
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
        if (e.key === "Enter" && filtered[highlight] !== undefined) { e.preventDefault(); pick(filtered[highlight]); }
        if (e.key === "Escape") setOpen(false);
    };

    return (
        <div ref={ref} style={{ position: "relative", flex: 1, minWidth: "180px" }}>
            <input
                className="input"
                placeholder={placeholder ?? "Rechercher un article..."}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKey}
            />
            {open && filtered.length > 0 && (
                <AutocompleteList items={filtered} highlight={highlight} onPick={pick} onHover={setHighlight} />
            )}
        </div>
    );
}
