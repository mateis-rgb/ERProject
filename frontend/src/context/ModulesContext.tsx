// Contexte Modules : lit enabled_modules depuis la config pour activer/désactiver les features (Power of 10 R4)
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "../services/api";
import { useAuth } from "./AppContext";

export const MODULE_IDS = ["gantt", "drive", "stock", "notifications", "export_pdf", "templates"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

interface ModulesContextType {
    enabled: (id: ModuleId) => boolean;
    list: ModuleId[];
    refresh: () => Promise<void>;
}

const ModulesContext = createContext<ModulesContextType | null>(null);

export function ModulesProvider({ children }: { children: ReactNode }): JSX.Element {
    const { user } = useAuth();
    const [list, setList] = useState<ModuleId[]>([...MODULE_IDS]);

    const refresh = useCallback(async (): Promise<void> => {
        const res = await api.get<{ key: string; values: string[] }>("/api/config/enabled_modules");
        if (res.success) {
            const valid = res.data.values.filter((v): v is ModuleId => (MODULE_IDS as readonly string[]).includes(v));
            setList(valid);
        }
    }, []);

    useEffect(() => {
        if (user === null) return;
        void refresh();
    }, [user, refresh]);

    const enabled = useCallback((id: ModuleId): boolean => list.includes(id), [list]);

    return (
        <ModulesContext.Provider value={{ enabled, list, refresh }}>
            {children}
        </ModulesContext.Provider>
    );
}

export function useModules(): ModulesContextType {
    const ctx = useContext(ModulesContext);
    if (ctx === null) throw new Error("useModules hors provider");
    return ctx;
}
