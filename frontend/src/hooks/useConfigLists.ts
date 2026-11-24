// Hook : listes modifiables (GET /api/config) avec cache module-level (une seule requête)
import { useEffect, useState } from "react";
import { api } from "../services/api";

let cache: Record<string, string[]> | null = null;
let pending: Promise<void> | null = null;

function loadCache(): Promise<void> {
    if (pending === null) {
        pending = api.get<Record<string, string[]>>("/api/config").then((r) => {
            if (r.success) cache = r.data;
        });
    }
    return pending;
}

export function useConfigLists(): Record<string, string[]> {
    const [configs, setConfigs] = useState<Record<string, string[]>>(cache ?? {});
    useEffect(() => {
        if (cache !== null) { setConfigs(cache); return; }
        void loadCache().then(() => {
            if (cache !== null) setConfigs(cache);
        });
    }, []);
    return configs;
}
