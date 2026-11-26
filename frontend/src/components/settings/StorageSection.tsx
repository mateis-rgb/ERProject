// Section stockage des fichiers (settings/app, admin) - changement de chemin + migration avec progression (Power of 10 R4)
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import { AppNotification } from "../../context/NotificationContext";
import ConfirmModal from "../ui/ConfirmModal";
import Toast, { ToastData } from "../ui/Toast";
import { useLocalToast } from "../../hooks/useLocalToast";

interface StorageInfo {
    configured: string;
    effective: string;
    default: string;
}

function ProgressModal({ progress, title }: { progress: number; title: string }): JSX.Element {
    return (
        <div className="modal-backdrop">
            <div className="modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>{title}</h3>
                <div style={{ height: "16px", border: "3px solid var(--ink)", background: "var(--surface)" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", transition: "width 0.3s ease" }} />
                </div>
                <p className="mono" style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--muted)", textAlign: "right" }}>{progress}%</p>
            </div>
        </div>
    );
}

function useStorageInfo(): [StorageInfo | null, string, (p: string) => void, () => void] {
    const [info, setInfo] = useState<StorageInfo | null>(null);
    const [path, setPath] = useState("");
    const load = useCallback((): void => {
        api.get<StorageInfo>("/api/storage").then((r) => {
            if (r.success) {
                setInfo(r.data);
                setPath(r.data.configured);
            }
        });
    }, []);
    useEffect(load, [load]);
    return [info, path, setPath, load];
}

function useMigrationPoll(notifId: string | null, onDone: (n: AppNotification) => void): number {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        if (notifId === null) return;
        const iv = window.setInterval(() => {
            api.get<{ notifications: AppNotification[] }>("/api/notifications").then((r) => {
                const n = r.success ? r.data.notifications.find((x) => x.id === notifId) : undefined;
                if (n === undefined) return;
                setProgress(n.progress ?? 0);
                if (n.progress === 100) {
                    window.clearInterval(iv);
                    onDone(n);
                }
            });
        }, 700);
        return () => window.clearInterval(iv);
    }, [notifId, onDone]);
    return progress;
}

interface ViewProps {
    info: StorageInfo | null;
    path: string;
    busy: boolean;
    confirmOpen: boolean;
    notifId: string | null;
    progress: number;
    toast: ToastData | null;
    target: string;
    onToastDismiss: () => void;
    onPath: (p: string) => void;
    onSaveClick: () => void;
    onConfirm: () => void;
    onCancelConfirm: () => void;
}

function StorageView(p: ViewProps): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "0.5rem" }}>
                {t("app.storage")}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 0 }}>{t("app.storageHint")}</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input className="input" style={{ flex: 1, minWidth: "260px" }} value={p.path}
                    onChange={(e) => p.onPath(e.target.value)} placeholder={p.info?.default ?? ""} />
                <button className="btn" onClick={p.onSaveClick} disabled={p.busy || p.notifId !== null}>
                    {t("app.storageSave")}
                </button>
            </div>
            {p.info !== null && (
                <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 0 }}>
                    {t("app.storageEffective")} : {p.info.effective}
                    {p.info.configured.trim() === "" ? ` (${t("app.storageDefault")})` : ""}
                </p>
            )}
            {p.confirmOpen && p.info !== null && (
                <ConfirmModal
                    title={t("app.migrateTitle")}
                    message={`${t("app.migrateBody")} ${t("app.migrateFrom")} : ${p.info.effective} -> ${t("app.migrateTo")} : ${p.target}`}
                    confirmLabel={t("app.migrateConfirm")}
                    busy={p.busy}
                    onConfirm={p.onConfirm}
                    onCancel={p.onCancelConfirm}
                />
            )}
            {p.notifId !== null && <ProgressModal progress={p.progress} title={t("app.migratingTitle")} />}
            <Toast toast={p.toast} onDismiss={p.onToastDismiss} />
        </div>
    );
}

export default function StorageSection(): JSX.Element {
    const [info, path, setPath, load] = useStorageInfo();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [notifId, setNotifId] = useState<string | null>(null);
    const { toast, showToast, dismissToast } = useLocalToast();

    const onDone = useCallback((n: AppNotification): void => {
        setNotifId(null);
        showToast({ kind: n.type === "success" ? "success" : "error", msg: `${n.title} — ${n.message}` });
        load();
    }, [load, showToast]);

    const progress = useMigrationPoll(notifId, onDone);

    const target = path.trim() === "" ? (info?.default ?? "") : path.trim();

    const startMigration = (): void => {
        setBusy(true);
        void api.post<{ notifId: string }>("/api/storage/migrate", { to: target }).then((r) => {
            setBusy(false);
            if (!r.success) {
                showToast({ kind: "error", msg: r.error });
                return;
            }
            setConfirmOpen(false);
            setNotifId(r.data.notifId);
        });
    };

    return (
        <StorageView
            info={info} path={path} busy={busy} confirmOpen={confirmOpen}
            notifId={notifId} progress={progress} toast={toast} target={target}
            onToastDismiss={dismissToast}
            onPath={setPath}
            onSaveClick={() => setConfirmOpen(true)}
            onConfirm={startMigration}
            onCancelConfirm={() => setConfirmOpen(false)}
        />
    );
}
