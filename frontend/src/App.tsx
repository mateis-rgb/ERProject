// App - Router principal avec protection des routes
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AppContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Stock from "./pages/Stock";
import Movements from "./pages/Movements";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import ErrorPage from "./components/ErrorPage";

export default function App(): JSX.Element {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <p>Chargement...</p>
            </div>
        );
    }

    if (user === null) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/projects/:id/:tab" element={<ProjectDetail />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/movements" element={<Movements />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/:tab" element={<Settings />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="*" element={<ErrorPage code={404} titleKey="errors.404Title" bodyKey="errors.404Body" />} />
            </Routes>
        </Layout>
    );
}
