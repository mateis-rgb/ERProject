// Utilitaires Power of 10 : assertions, validation, boucles bornées
// Règle 5 : assertions pour pré/postconditions
// Règle 7 : vérification des retours et paramètres

/** Assertion simple (Power of 10 règle 5) */
export function assert(condition: boolean, message: string): asserts condition {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

/** Vérifie qu'une valeur n'est pas null/undefined (règle 7) */
export function requireDefined<T>(value: T | null | undefined, name: string): T {
    if (value === null || value === undefined) {
        throw new Error(`Required value missing: ${name}`);
    }
    return value;
}

/** Boucle bornée (règle 2) : exécute fn pour chaque item avec limite MAX_ITERATIONS */
export const MAX_ITERATIONS = 10000;

export function boundedForEach<T>(
    items: T[],
    fn: (item: T, index: number) => void
): void {
    assert(items.length <= MAX_ITERATIONS, `boundedForEach: ${items.length} > ${MAX_ITERATIONS}`);
    const limit = Math.min(items.length, MAX_ITERATIONS);
    for (let i = 0; i < limit; i++) {
        const item = items[i];
        if (item !== undefined) {
            fn(item, i);
        }
    }
}

/** Boucle bornée avec accumulateur (règle 2 + 3) */
export function boundedReduce<T, A>(
    items: T[],
    initial: A,
    fn: (acc: A, item: T, index: number) => A
): A {
    assert(items.length <= MAX_ITERATIONS, `boundedReduce: ${items.length} > ${MAX_ITERATIONS}`);
    let acc = initial;
    const limit = Math.min(items.length, MAX_ITERATIONS);
    for (let i = 0; i < limit; i++) {
        const item = items[i];
        if (item !== undefined) {
            acc = fn(acc, item, i);
        }
    }
    return acc;
}

/** Parse JSON sécurisé avec valeur par défaut (règle 7) */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        const parsed = JSON.parse(json) as T;
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

/** Génère une chaîne JSON pour ActivityLog.details */
export function toJsonString(value: unknown): string {
    const result = JSON.stringify(value);
    return result ?? "{}";
}
