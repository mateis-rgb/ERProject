// ErrorBoundary - affiche une page 500 en cas d'erreur de rendu React (Power of 10 R4)
import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    render(): ReactNode {
        if (this.state.error !== null) {
            return (
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    minHeight: "100vh", gap: "1rem", background: "var(--bg)", color: "var(--text)",
                    fontFamily: "var(--font-ui)", textAlign: "center", padding: "1rem",
                }}>
                    <div style={{
                        border: "3px solid var(--ink)", background: "var(--surface)",
                        boxShadow: "6px 6px 0 var(--ink)", padding: "1.5rem 2rem",
                        display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", maxWidth: "480px",
                    }}>
                        <div className="mono" style={{
                            fontSize: "3.5rem", fontWeight: 700,
                            border: "3px solid var(--ink)", padding: "0.4rem 1.2rem",
                            background: "var(--danger)", color: "#fff",
                        }}>
                            500
                        </div>
                        <h1 style={{ margin: 0, textTransform: "uppercase" }}>Erreur interne</h1>
                        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                            Une erreur est survenue. Recharge la page ou réessaie plus tard.
                        </p>
                        <button className="btn" onClick={() => window.location.assign("/")}>Retour à l'accueil</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
