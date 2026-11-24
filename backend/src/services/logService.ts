// Service de logs applicatifs en mémoire (ring buffer borné) - alimentent la page Status/Logs (Power of 10)
export interface LogEntry {
    at: string;
    level: "info" | "warn" | "error";
    msg: string;
}

const MAX_ENTRIES = 500; // borne dure (R2)
const MAX_MSG = 500;

const buffer: LogEntry[] = [];

export function log(level: "info" | "warn" | "error", msg: string): void {
    buffer.push({ at: new Date().toISOString(), level, msg: msg.slice(0, MAX_MSG) });
    if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
}

export function getLogs(limit: number): LogEntry[] {
    const n = Math.max(1, Math.min(limit, MAX_ENTRIES));
    return buffer.slice(-n);
}
