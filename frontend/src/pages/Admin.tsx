// /admin redirige vers l'onglet Accès de Réglages
import { Navigate } from "react-router-dom";

export default function Admin(): JSX.Element {
    return <Navigate to="/settings/access" replace />;
}
