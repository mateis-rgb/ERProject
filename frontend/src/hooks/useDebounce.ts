// Valeur debouncée (pour l'aperçu temps réel de l'éditeur) (Power of 10 R4)
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(id);
    }, [value, delayMs]);
    return debounced;
}
