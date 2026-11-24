// Layout - sidebar FIXE (ne dépend pas du scroll de la page) + command palette
import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AppContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CommandPalette from "./CommandPalette";

const SIDEBAR_W = 240;

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [paletteOpen, setPaletteOpen] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setPaletteOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleLogout = async (): Promise<void> => {
        await logout();
        navigate("/login");
    };

    if (user === null) return <>{children}</>;

    return (
        <div style={{ minHeight: "100vh" }}>
            {/* Sidebar fixe : toujours visible, ne scrolle pas avec la page */}
            <div style={{
                position: "fixed", left: 0, top: 0, bottom: 0,
                width: `${SIDEBAR_W}px`, height: "100vh", zIndex: 50,
            }}>
                <Sidebar user={user} onLogout={handleLogout} />
            </div>
            {/* Contenu décalé à droite de la sidebar */}
            <div style={{ marginLeft: `${SIDEBAR_W}px`, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <TopBar onOpenPalette={() => setPaletteOpen(true)} />
                <main className="fade-up" style={{ flex: 1, padding: "1.75rem 2rem" }}>
                    {children}
                </main>
            </div>
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
    );
}
