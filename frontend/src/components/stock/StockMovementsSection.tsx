// Section mouvements intégrée dans la page Stock (Power of 10 R4)
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { StockItem, StockMovement } from "../../types";
import MovementForm from "./MovementForm";
import MovementTable from "./MovementTable";

interface Props {
    items: StockItem[];
}

export default function StockMovementsSection({ items }: Props): JSX.Element {
    const [movements, setMovements] = useState<StockMovement[]>([]);

    const load = (): void => {
        api.get<StockMovement[]>("/api/stock/movements/list?limit=50").then((r) => {
            if (r.success) setMovements(r.data);
        });
    };

    useEffect(load, []);

    return (
        <div style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "1rem" }}>
                Mouvements récents
            </h2>
            <MovementForm items={items} onCreated={load} />
            <div style={{ marginTop: "1rem" }}>
                <MovementTable movements={movements} items={items} />
            </div>
        </div>
    );
}
