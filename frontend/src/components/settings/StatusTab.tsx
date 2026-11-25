// Onglet Status & logs (admin) - statut serveur + logs backend + logs navigateur de la session (Power of 10 R4)
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n/I18nContext";
import { getFrontLogs, clearFrontLogs, FrontLog } from "../../services/frontLogger";
import BrutalSelect from "../ui/BrutalSelect";

interface ServerStatus {
    version: string;
    uptimeSec: number;
    now: string;
    storageDir: string;
    modules: string[];
    counts: { users: number; projects: number; stockItems: number; attachments: number; unreadNotifs: number };
}

interface LogEntry {
    at: string;
    level: string;
    msg: string;
}

const LEVEL_COLORS: Record<string, string> = {
    info: "var(--blue)",
    warn: "var(--accent)",
    error: "var(--danger)",
};

function fmtUptime(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function StatusCard(): JSX.Element {
    const { t } = useTranslation();
    const [status, setStatus] = useState<ServerStatus | null>(null);

    useEffect(() => {
        const load = (): void => {
            api.get<ServerStatus>("/api/admin/status").then((r) => { if (r.success) setStatus(r.data); });
        };
        load();
        const iv = window.setInterval(load, 10000);
        return () => window.clearInterval(iv);
    }, []);

    if (status === null) return <div className="card">…</div>;
    return (
        <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>{t("status.serverTitle")}</h3>
            <p className="mono" style={{ fontSize: "0.78rem", margin: "0.25rem 0" }}>{t("status.version")} : <strong>{status.version}</strong></p>
            <p className="mono" style={{ fontSize: "0.78rem", margin: "0.25rem 0" }}>{t("status.uptime")} : {fmtUptime(status.uptimeSec)}</p>
            <p className="mono" style={{ fontSize: "0.78rem", margin: "0.25rem 0", wordBreak: "break-all" }}>{t("status.storage")} : {status.storageDir}</p>
            <p className="mono" style={{ fontSize: "0.78rem", margin: "0.25rem 0" }}>
                {t("status.counts")} : {status.counts.projects} projets · {status.counts.stockItems} stock · {status.counts.attachments} fichiers · {status.counts.users} users · {status.counts.unreadNotifs} notifs non lues
            </p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {status.modules.map((m) => <span key={m} className="badge" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>{m}</span>)}
            </div>
        </div>
    );
}

function LogList({ entries, emptyLabel }: { entries: LogEntry[]; emptyLabel: string }): JSX.Element {
    return (
        <div style={{
            maxHeight: "320px", overflow: "auto", border: "2px solid var(--ink)", background: "var(--bg)",
            padding: "0.5rem", fontSize: "0.72rem",
        }}>
            {entries.length === 0 && <p style={{ color: "var(--muted)", margin: 0 }}>{emptyLabel}</p>}
            {entries.map((l, i) => (
                <div key={i} className="mono" style={{ padding: "0.1rem 0", borderBottom: "1px solid var(--surface-2)", wordBreak: "break-all" }}>
                    <span style={{ color: "var(--muted)" }}>{new Date(l.at).toLocaleTimeString("fr-FR")}</span>{" "}
                    <span style={{ color: LEVEL_COLORS[l.level] ?? "var(--text)", fontWeight: 700 }}>{l.level.toUpperCase()}</span>{" "}
                    <span>{l.msg}</span>
                </div>
            ))}
        </div>
    );
}

function ServerLogs(): JSX.Element {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const load = (): void => {
            api.get<LogEntry[]>("/api/admin/logs?limit=300").then((r) => { if (r.success) setLogs(r.data); });
        };
        load();
        const iv = window.setInterval(load, 5000);
        return () => window.clearInterval(iv);
    }, []);

    const visible = filter === "all" ? logs : logs.filter((l) => l.level === filter);
    return (
        <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>{t("status.serverLogs")}</h3>
                <BrutalSelect value={filter} onChange={setFilter} width="auto" minWidth="120px"
                    ariaLabel={t("status.serverLogs")}
                    options={[
                        { value: "all", label: t("status.filterAll") },
                        { value: "info", label: "info" },
                        { value: "warn", label: "warn" },
                        { value: "error", label: "error" },
                    ]} />
            </div>
            <LogList entries={visible} emptyLabel={t("status.emptyLogs")} />
        </div>
    );
}

function BrowserLogs(): JSX.Element {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<FrontLog[]>([]);

    useEffect(() => {
        const load = (): void => setLogs(getFrontLogs());
        load();
        const iv = window.setInterval(load, 3000);
        return () => window.clearInterval(iv);
    }, []);

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>{t("status.browserLogs")}</h3>
                <button className="btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }} onClick={() => { clearFrontLogs(); setLogs([]); }}>
                    {t("status.clearLogs")}
                </button>
            </div>
            <LogList entries={logs} emptyLabel={t("status.emptyBrowserLogs")} />
        </div>
    );
}

export default function StatusTab(): JSX.Element {
    return (
        <div style={{ maxWidth: "900px" }}>
            <StatusCard />
            <ServerLogs />
            <BrowserLogs />
        </div>
    );
}
