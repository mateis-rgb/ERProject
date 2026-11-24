// Contexte i18n - chargement dynamique des traductions JSON par langue (Power of 10 R4)
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "fr" | "en";
export const LANGS: { code: Lang; label: string }[] = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
];

type Dict = Record<string, unknown>;

interface I18nContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: string) => string;
    ready: boolean;
}

const I18nContext = createContext<I18nContextType>({
    lang: "fr",
    setLang: () => undefined,
    t: (k) => k,
    ready: false,
});

const STORAGE_KEY = "erProjects_lang";

function detectLang(): Lang {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "fr" || saved === "en") return saved;
    const nav = navigator.language.slice(0, 2).toLowerCase();
    return nav === "en" ? "en" : "fr";
}

async function loadDict(lang: Lang): Promise<Dict> {
    if (lang === "fr") return (await import("./locales/fr.json")).default as Dict;
    return (await import("./locales/en.json")).default as Dict;
}

function lookup(dict: Dict, key: string): string | null {
    const parts = key.split(".");
    let cur: unknown = dict;
    for (let i = 0; i < parts.length; i++) {
        if (typeof cur !== "object" || cur === null) return null;
        cur = (cur as Dict)[parts[i] ?? ""];
    }
    return typeof cur === "string" ? cur : null;
}

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
    const [lang, setLangState] = useState<Lang>(detectLang);
    const [dicts, setDicts] = useState<Record<Lang, Dict>>({ fr: {}, en: {} });
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async (): Promise<void> => {
            const fr = await loadDict("fr");
            const en = await loadDict("en");
            if (cancelled) return;
            setDicts({ fr, en });
            setReady(true);
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const setLang = (l: Lang): void => {
        localStorage.setItem(STORAGE_KEY, l);
        setLangState(l);
    };

    const t = (key: string): string => {
        const hit = lookup(dicts[lang], key) ?? lookup(dicts.fr, key);
        return hit ?? key;
    };

    return (
        <I18nContext.Provider value={{ lang, setLang, t, ready }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation(): I18nContextType {
    return useContext(I18nContext);
}
