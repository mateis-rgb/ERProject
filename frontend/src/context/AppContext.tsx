// Context d'authentification + thème (palette / dark mode)
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser } from "../types";
import { api } from "../services/api";

type Palette = "yellow" | "pink" | "blue" | "green" | "violet" | "orange";
type Theme = "dark" | "light" | "system";

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<string | null>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = async (): Promise<void> => {
        const res = await api.get<AuthUser>("/api/auth/me");
        if (res.success) setUser(res.data);
        else setUser(null);
        setLoading(false);
    };

    useEffect(() => { refresh(); }, []);

    const login = async (email: string, password: string): Promise<string | null> => {
        const res = await api.post<AuthUser>("/api/auth/login", { email, password });
        if (!res.success) return res.error;
        setUser(res.data);
        return null;
    };

    const logout = async (): Promise<void> => {
        await api.post("/api/auth/logout", {});
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (ctx === null) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

interface ThemeContextType {
    palette: Palette;
    theme: Theme;
    resolvedTheme: "dark" | "light";
    setPalette: (p: Palette) => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemTheme(): "dark" | "light" {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
    }
    return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [palette, setPaletteState] = useState<Palette>(() => {
        const saved = localStorage.getItem("erProjects_palette");
        return (saved as Palette) || "yellow";
    });
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem("erProjects_theme");
        return (saved as Theme) || "system";
    });
    const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() =>
        theme === "system" ? getSystemTheme() : theme
    );

    useEffect(() => {
        const apply = theme === "system" ? getSystemTheme() : theme;
        setResolvedTheme(apply);
        document.documentElement.setAttribute("data-palette", palette);
        document.documentElement.setAttribute("data-theme", apply);
        localStorage.setItem("erProjects_palette", palette);
        localStorage.setItem("erProjects_theme", theme);
    }, [palette, theme]);

    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: light)");
        const onChange = (): void => {
            const apply = getSystemTheme();
            setResolvedTheme(apply);
            document.documentElement.setAttribute("data-theme", apply);
        };
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, [theme]);

    const setPalette = (p: Palette): void => setPaletteState(p);
    const setTheme = (t: Theme): void => setThemeState(t);

    return (
        <ThemeContext.Provider value={{ palette, theme, resolvedTheme, setPalette, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const ctx = useContext(ThemeContext);
    if (ctx === null) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}
