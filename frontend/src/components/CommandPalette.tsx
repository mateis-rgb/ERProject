// Command palette ⌘K/Ctrl+K avec recherche globale live (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useModules } from "../context/ModulesContext";
import CommandList, { CmdItem } from "./CommandList";

interface SearchHit {
    type: "project" | "stock" | "user";
    id: string;
    title: string;
    subtitle: string;
    link: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

const NAV_ITEMS: (CmdItem & { module?: "stock" })[] = [
    { label: "Dashboard", hint: "Vue d'ensemble", kbd: "G D", action: "/__nav__/" },
    { label: "Projets", hint: "Tous les projets", kbd: "G P", action: "/__nav__/projects" },
    { label: "Stock & mouvements", hint: "Inventaire + entrées/sorties", kbd: "G S", action: "/__nav__/stock", module: "stock" },
    { label: "Réglages", hint: "Apparence, listes, accès, sécurité", kbd: "G C", action: "/__nav__/settings" },
];

function usePaletteKeys(open: boolean, items: CmdItem[], active: number, setActive: (a: number) => void, onClose: () => void, runAction: (a: string) => void): void {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(active + 1, items.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
            if (e.key === "Enter" && items[active] !== undefined) runAction(items[active].action);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, items, active, setActive, onClose, runAction]);
}

export default function CommandPalette({ open, onClose }: Props): JSX.Element | null {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { enabled } = useModules();
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const [hits, setHits] = useState<SearchHit[]>([]);
    const debounceRef = useRef<number>(0);

    const runAction = useCallback((action: string): void => {
        onClose();
        setQuery("");
        if (action.startsWith("/__nav__/")) navigate(action.replace("/__nav__", "") || "/");
        else navigate(action);
    }, [navigate, onClose]);

    const navItems = NAV_ITEMS.filter((n) => n.module === undefined || enabled(n.module));
    const visibleHits = hits.filter((h) => h.type !== "stock" || enabled("stock"));
    const items: CmdItem[] = query.trim().length === 0
        ? navItems
        : visibleHits.map((h) => ({ label: h.title, hint: `${h.type} — ${h.subtitle}`, action: h.link }));

    useEffect(() => {
        if (!open) return;
        window.clearTimeout(debounceRef.current);
        if (query.trim().length < 2) { setHits([]); return; }
        debounceRef.current = window.setTimeout(() => {
            api.get<SearchHit[]>(`/api/search?q=${encodeURIComponent(query.trim())}`).then((r) => {
                if (r.success) setHits(r.data);
            });
        }, 200);
        return () => window.clearTimeout(debounceRef.current);
    }, [query, open]);

    useEffect(() => {
        if (!open) { setQuery(""); setHits([]); setActive(0); }
    }, [open]);

    usePaletteKeys(open, items, active, setActive, onClose, runAction);

    if (!open) return null;

    return (
        <div className="cmd-overlay" onClick={onClose}>
            <div className="cmd-box fade-up" onClick={(e) => e.stopPropagation()}>
                <input
                    className="input"
                    placeholder={t("cmd.placeholder")}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                    autoFocus
                    style={{ border: "none", borderBottom: "3px solid var(--ink)", boxShadow: "none", fontSize: "1rem", padding: "0.9rem 1rem" }}
                />
                <CommandList items={items} active={active} onHover={setActive} onRun={(i) => runAction(i.action)} />
            </div>
        </div>
    );
}
