import { FiAlertTriangle, FiCheckCircle, FiClipboard, FiExternalLink, FiSettings, FiUpload, FiXCircle } from "react-icons/fi";
// Section Mises à jour (settings/about) - check GitHub releases + procédure guidée (rien n'est exécuté auto) (Power of 10 R4)
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useTranslation } from "../i18n/I18nContext";
import Toast, { ToastData } from "./Toast";

export interface UpdateInfo {
    enabled: boolean;
    current: string;
    latest: string | null;
    available: boolean;
    changelog: string;
    url: string | null;
    publishedAt: string | null;
    error: string | null;
}

export interface RepoInfo {
    configured: string;
    ok: boolean;
    fullName: string | null;
    description: string | null;
    defaultBranch: string | null;
    private: boolean;
    url: string | null;
    error: string | null;
}

interface Step {
    title: string;
    desc: string;
    cmds: { label: string; cmd: string }[];
}

function StepRow({ n, step }: { n: number; step: Step }): JSX.Element {
    const [copied, setCopied] = useState<string | null>(null);
    const copy = (cmd: string): void => {
        void navigator.clipboard.writeText(cmd).then(() => {
            setCopied(cmd);
            setTimeout(() => setCopied(null), 1500);
        });
    };
    return (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{
                flexShrink: 0, width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--accent)", color: "var(--accent-ink)", border: "2px solid var(--ink)",
                fontWeight: 700, fontSize: "0.85rem", boxShadow: "2px 2px 0 var(--ink)",
            }}>{n}</span>
            <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "0.9rem" }}>{step.title}</strong>
                <p style={{ margin: "0.2rem 0 0.4rem", fontSize: "0.8rem", color: "var(--muted)" }}>{step.desc}</p>
                {step.cmds.map((c) => (
                    <div key={c.cmd} style={{ marginBottom: "0.35rem" }}>
                        {c.label !== "" && (
                            <div className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.15rem" }}>{c.label}</div>
                        )}
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <code className="mono" style={{
                                flex: 1, fontSize: "0.72rem", background: "var(--bg)", border: "2px solid var(--ink)",
                                padding: "0.35rem 0.5rem", overflowX: "auto", whiteSpace: "nowrap",
                            }}>{c.cmd}</code>
                            <button className="btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", flexShrink: 0 }}
                                onClick={() => copy(c.cmd)}>
                                {copied === c.cmd ? <FiCheckCircle /> : <FiClipboard />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UpdateModal({ info, steps, onClose }: { info: UpdateInfo; steps: Step[]; onClose: () => void }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: "560px", maxHeight: "80vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>
                    <span className="ic"><FiUpload /> {t("update.modalTitle")} {info.latest ?? ""}</span>
                </h3>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "var(--muted)" }}>{t("update.modalHint")}</p>
                {info.changelog !== "" && (
                    <div style={{ marginBottom: "1rem" }}>
                        <strong style={{ fontSize: "0.85rem" }}>{t("update.changelog")}</strong>
                        <pre className="mono" style={{
                            fontSize: "0.72rem", whiteSpace: "pre-wrap", background: "var(--bg)",
                            border: "2px solid var(--ink)", padding: "0.5rem", maxHeight: "120px", overflow: "auto",
                        }}>{info.changelog}</pre>
                    </div>
                )}
                {steps.map((s, i) => <StepRow key={s.title} n={i + 1} step={s} />)}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                    <button className="btn-ghost" onClick={onClose}>{t("common.close")}</button>
                </div>
            </div>
        </div>
    );
}

function UpdateStatus({ info, onUpdateNow }: { info: UpdateInfo; onUpdateNow: () => void }): JSX.Element {
    const { t } = useTranslation();
    if (!info.enabled) return <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{t("update.disabled")}</p>;
    if (info.error !== null) return <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}><span className="ic"><FiAlertTriangle /> {t("update.error")} : {info.error}</span></p>;
    if (!info.available) return <p style={{ color: "var(--green)", fontSize: "0.85rem", fontWeight: 700 }}><span className="ic"><FiCheckCircle /> {t("update.upToDate")} (v{info.current})</span></p>;
    return (
        <div>
            <p style={{ color: "var(--accent)", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
                <span className="ic"><FiUpload /> {t("update.available")} : {info.latest} (v{info.current} locale)</span>
            </p>
            <button className="btn" onClick={onUpdateNow}>{t("update.updateNow")}</button>
            {info.url !== null && (
                <a href={info.url} target="_blank" rel="noreferrer" style={{ marginLeft: "0.75rem", fontSize: "0.8rem", color: "var(--accent)" }}>
                    <span className="ic">{t("update.releaseNotes")} <FiExternalLink /></span>
                </a>
            )}
        </div>
    );
}

interface RepoModalProps {
    initial: string;
    onSaved: (r: RepoInfo) => void;
    onClose: () => void;
    label: (k: string) => string;
}

function RepoModal({ initial, onSaved, onClose, label }: RepoModalProps): JSX.Element {
    const [val, setVal] = useState(initial);
    const [verify, setVerify] = useState<RepoInfo | null>(null);
    const [busy, setBusy] = useState(false);

    const save = (): void => {
        setBusy(true);
        void api.put("/api/config/update_repo", { values: [val.trim()] })
            .then(() => api.get<RepoInfo>("/api/update/repo?force=true"))
            .then((r) => {
                setBusy(false);
                if (r.success) {
                    onSaved(r.data);
                    setVerify(r.data);
                }
            });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase" }}>
                    {label("update.repoModalTitle")}
                </h3>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "var(--muted)" }}>{label("update.repoModalHint")}</p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input className="input" style={{ flex: 1 }} value={val}
                        onChange={(e) => setVal(e.target.value)} placeholder="owner/repo" />
                    <button className="btn" disabled={busy} onClick={save}>{label("update.repoSave")}</button>
                </div>
                {verify !== null && (
                    <p style={{ margin: "0.75rem 0 0", fontSize: "0.82rem", fontWeight: 700, color: verify.ok ? "var(--green)" : "var(--danger)" }}>
                        {verify.ok
                            ? <span className="ic"><FiCheckCircle /> {verify.fullName ?? ""} — branche {verify.defaultBranch ?? "?"}</span>
                            : <span className="ic"><FiXCircle /> {verify.error ?? "?"}</span>}
                        {verify.ok && verify.url !== null && (
                            <> · <a href={verify.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}><span className="ic">GitHub <FiExternalLink /></span></a></>
                        )}
                    </p>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                    <button className="btn-ghost" onClick={onClose}>{label("common.close")}</button>
                </div>
            </div>
        </div>
    );
}

function RepoChip({ onChanged }: { onChanged: () => void }): JSX.Element {
    const { t } = useTranslation();
    const [info, setInfo] = useState<RepoInfo | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        api.get<RepoInfo>("/api/update/repo").then((r) => {
            if (r.success) setInfo(r.data);
        });
    }, []);

    const handleSaved = (r: RepoInfo): void => {
        setInfo(r);
        onChanged(); // relance un check de mises à jour après changement de dépôt
    };

    return (
        <>
            <button className="btn-ghost" title={t("update.repoChipHint")}
                style={{ position: "absolute", top: "0.75rem", right: "0.75rem", padding: "0.2rem 0.6rem", fontSize: "0.72rem" }}
                onClick={() => setOpen(true)}>
                <span className="ic"><FiSettings /> {info !== null && info.configured !== "" ? info.configured : t("update.repoChip")}</span>
            </button>
            {open && <RepoModal initial={info?.configured ?? ""} onSaved={handleSaved} onClose={() => setOpen(false)} label={t} />}
        </>
    );
}

export default function UpdateSection(): JSX.Element {
    const { t } = useTranslation();
    const [info, setInfo] = useState<UpdateInfo | null>(null);
    const [checking, setChecking] = useState(false);
    const [toast, setToast] = useState<ToastData | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const check = (): void => {
        setChecking(true);
        api.get<UpdateInfo>("/api/update/check?force=true").then((r) => {
            setChecking(false);
            if (!r.success) { setToast({ kind: "error", msg: r.error }); return; }
            setInfo(r.data);
            if (r.data.available && r.data.latest !== null) {
                setToast({ kind: "success", msg: `${t("update.toastAvailable")} : ${r.data.latest}` });
            }
        });
    };

    const steps: Step[] = [
        { title: t("update.step1Title"), desc: t("update.step1Desc"), cmds: [{ label: "backup", cmd: t("update.step1Cmd") }] },
        { title: t("update.step2Title"), desc: t("update.step2Desc"), cmds: [
            { label: t("update.step2DockerLabel"), cmd: t("update.step2CmdDocker") },
            { label: t("update.step2GitLabel"), cmd: t("update.step2CmdGit") },
        ] },
        { title: t("update.step3Title"), desc: t("update.step3Desc"), cmds: [{ label: "health", cmd: t("update.step3Cmd") }] },
        { title: t("update.step4Title"), desc: t("update.step4Desc"), cmds: [] },
    ];

    return (
        <div className="card" style={{ position: "relative" }}>
            <RepoChip onChanged={check} />
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", paddingRight: "7rem" }}>{t("update.title")}</h3>
            <button className="btn" disabled={checking} onClick={check}>
                {checking ? t("update.checking") : t("update.check")}
            </button>
            {info !== null && (
                <div style={{ marginTop: "0.75rem" }}>
                    <UpdateStatus info={info} onUpdateNow={() => setModalOpen(true)} />
                </div>
            )}
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.6rem", marginBottom: 0 }}>{t("update.hint")}</p>
            <Toast toast={toast} onDismiss={() => setToast(null)} />
            {modalOpen && info !== null && <UpdateModal info={info} steps={steps} onClose={() => setModalOpen(false)} />}
        </div>
    );
}
