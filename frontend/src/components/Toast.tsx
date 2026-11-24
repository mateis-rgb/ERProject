import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
// Toast néo-brutaliste partagé (auto-dismiss 5s) (Power of 10 R4)
import { useEffect } from "react";

export interface ToastData {
    kind: "success" | "error";
    msg: string;
}

interface Props {
    toast: ToastData | null;
    onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: Props): JSX.Element | null {
    useEffect(() => {
        if (toast === null) return;
        const timer = window.setTimeout(onDismiss, 5000);
        return () => window.clearTimeout(timer);
    }, [toast, onDismiss]);

    if (toast === null) return null;
    return (
        <div style={{
            position: "fixed", bottom: "1.25rem", right: "1.25rem", zIndex: 300,
            background: toast.kind === "success" ? "var(--green)" : "var(--danger)", color: "#fff",
            border: "3px solid var(--ink)", boxShadow: "6px 6px 0 var(--ink)",
            padding: "0.7rem 1rem", fontWeight: 700, fontSize: "0.85rem", maxWidth: "360px",
        }}>
            <span className="ic">{toast.kind === "success" ? <FiCheckCircle /> : <FiAlertTriangle />} {toast.msg}</span>
        </div>
    );
}
