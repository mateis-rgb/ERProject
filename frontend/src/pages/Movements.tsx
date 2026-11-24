// /movements redirige vers la page Stock (mouvements intégrés)
import { Navigate } from "react-router-dom";

export default function Movements(): JSX.Element {
    return <Navigate to="/stock" replace />;
}
