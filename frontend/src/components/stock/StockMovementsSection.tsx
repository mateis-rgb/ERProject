// Section mouvements intégrée dans la page Stock (Power of 10 R4)
import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import { StockItem, StockMovement } from "../../types";
import MovementForm from "./MovementForm";
import Modal from "../ui/Modal";
import MovementTable from "./MovementTable";

interface Props {
    items: StockItem[];
}

export default function StockMovementsSection({ items }: Props): JSX.Element {
    const { t } = useTranslation();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [formOpen, setFormOpen] = useState(false);

    const load = (): void => {
        api.get<StockMovement[]>("/api/stock/movements/list?limit=50").then((r) => {
            if (r.success) setMovements(r.data);
        });
    };

    useEffect(load, []);

    return (
        <div style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "1rem" }}>
                {t("stock.movementsTitle")}
            </h2>
            <button className="btn" onClick={() => setFormOpen(true)}>+ {t("modals.addMovementTitle")}</button>
            {formOpen && (
                <Modal title={t("modals.addMovementTitle")} onClose={() => setFormOpen(false)}>
                    <MovementForm items={items} onCreated={() => { load(); setFormOpen(false); }} />
                </Modal>
            )}
            <div style={{ marginTop: "1rem" }}>
                <MovementTable movements={movements} items={items} />
            </div>
        </div>
    );
}
