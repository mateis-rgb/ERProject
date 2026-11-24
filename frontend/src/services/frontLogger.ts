// Logger navigateur : capture console.warn/error + erreurs window dans un buffer borné (page Status/Logs) (Power of 10)
export interface FrontLog {
    at: string;
    level: "warn" | "error";
    msg: string;
}

const MAX_ENTRIES = 300; // borne dure (R2)
const buffer: FrontLog[] = [];
let installed = false;

function push(level: "warn" | "error", msg: unknown): void {
    buffer.push({ at: new Date().toISOString(), level, msg: String(msg).slice(0, 500) });
    if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
}

export function initFrontLogger(): void {
    if (installed) return;
    installed = true;
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    console.warn = (...args: unknown[]) => { push("warn", args.map(String).join(" ")); origWarn(...args); };
    console.error = (...args: unknown[]) => { push("error", args.map(String).join(" ")); origError(...args); };
    window.addEventListener("error", (e) => push("error", e.message));
    window.addEventListener("unhandledrejection", (e) => push("error", `unhandledrejection: ${String((e as PromiseRejectionEvent).reason)}`));
}

export function getFrontLogs(): FrontLog[] {
    return buffer.slice(-MAX_ENTRIES);
}

export function clearFrontLogs(): void {
    buffer.splice(0, buffer.length);
}
