// Moteur de recherche stock : filtres serveur (search/catégorie/emplacement/stock bas),
// filtre dispo + tri côté client (Power of 10 R4)
import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { AvailabilityEntry, StockItem } from "../types";

export type StockSortKey = "name" | "reference" | "quantity" | "available" | "category" | "location" | "minThreshold" | "purchasePrice";
export interface StockSort { key: StockSortKey; dir: "asc" | "desc"; }
export type DispoFilter = "all" | "available" | "unavailable";

export interface StockQuery {
    items: StockItem[];
    allItems: StockItem[];
    query: string; setQuery: (v: string) => void;
    category: string; setCategory: (v: string) => void;
    location: string; setLocation: (v: string) => void;
    lowOnly: boolean; setLowOnly: (v: boolean) => void;
    dispo: DispoFilter; setDispo: (v: DispoFilter) => void;
    sort: StockSort; toggleSort: (k: StockSortKey) => void;
    reload: () => void;
}

function isUnavailable(item: StockItem, avail: Record<string, AvailabilityEntry>): boolean {
    const a = avail[item.id];
    return a !== undefined && a.reserved > 0 && a.available <= 0;
}

function sortValue(item: StockItem, key: StockSortKey, avail: Record<string, AvailabilityEntry>): string | number {
    switch (key) {
        case "reference": return item.reference.toLowerCase();
        case "quantity": return item.quantity;
        case "available": return avail[item.id]?.available ?? item.quantity;
        case "category": return item.category.toLowerCase();
        case "location": return item.location.toLowerCase();
        case "minThreshold": return item.minThreshold;
        case "purchasePrice": return item.purchasePrice ?? -1;
        default: return item.name.toLowerCase();
    }
}

function applyClient(list: StockItem[], dispo: DispoFilter, sort: StockSort, avail: Record<string, AvailabilityEntry>): StockItem[] {
    const filtered = dispo === "all" ? list : list.filter((it) => isUnavailable(it, avail) === (dispo === "unavailable"));
    return [...filtered].sort((a, b) => {
        const va = sortValue(a, sort.key, avail);
        const vb = sortValue(b, sort.key, avail);
        const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sort.dir === "asc" ? cmp : -cmp;
    });
}

export function useStockQuery(avail: Record<string, AvailabilityEntry>): StockQuery {
    const [allItems, setAllItems] = useState<StockItem[]>([]);
    const [items, setItems] = useState<StockItem[]>([]);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [lowOnly, setLowOnly] = useState(false);
    const [dispo, setDispo] = useState<DispoFilter>("all");
    const [sort, setSort] = useState<StockSort>({ key: "name", dir: "asc" });

    useEffect(() => {
        api.get<StockItem[]>("/api/stock?limit=500").then((r) => { if (r.success) setAllItems(r.data); });
    }, []);

    const load = useCallback((): void => {
        const params = new URLSearchParams({ limit: "500" });
        if (query) params.set("search", query);
        if (category) params.set("category", category);
        if (location) params.set("location", location);
        if (lowOnly) params.set("lowStock", "true");
        api.get<StockItem[]>(`/api/stock?${params.toString()}`).then((r) => {
            if (r.success) setItems(applyClient(r.data, dispo, sort, avail));
        });
    }, [query, category, location, lowOnly, dispo, sort, avail]);

    useEffect(load, [load]);

    const toggleSort = (key: StockSortKey): void => {
        setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
    };

    return { items, allItems, query, setQuery, category, setCategory, location, setLocation,
        lowOnly, setLowOnly, dispo, setDispo, sort, toggleSort, reload: load };
}
