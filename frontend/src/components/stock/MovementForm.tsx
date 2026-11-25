// Formulaire de mouvement (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useState, FormEvent } from "react";
import { api } from "../../services/api";
import { StockItem } from "../../types";
import BrutalSelect from "../ui/BrutalSelect";

interface Props {
    items: StockItem[];
    onCreated: () => void;
}

export default function MovementForm({ items, onCreated }: Props): JSX.Element {
    const { t } = useTranslation();
    const [stockItemId, setStockItemId] = useState("");
    const [type, setType] = useState<"IN" | "OUT" | "RETURN">("OUT");
    const [quantity, setQuantity] = useState("1");
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        const res = await api.post("/api/stock/movements", {
            stockItemId: stockItemId,
            type,
            quantity: parseFloat(quantity),
            reason,
        });
        setBusy(false);
        if (res.success) { setQuantity("1"); setReason(""); onCreated(); }
    };

    return (
        <form className="card" onSubmit={submit} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
                <label className="label">{t("stock.article")}</label>
                <BrutalSelect value={stockItemId} onChange={setStockItemId} width="100%" minWidth="100%"
                    options={[
                        { value: "", label: t("movement.choose") },
                        ...items.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit})` })),
                    ]} />
            </div>
            <div style={{ width: "120px" }}>
                <label className="label">{t("project.type")}</label>
                <BrutalSelect value={type} onChange={(v) => setType(v as "IN" | "OUT" | "RETURN")} width="100%" minWidth="100%"
                    options={[
                        { value: "IN", label: t("movement.in") },
                        { value: "OUT", label: t("movement.out") },
                        { value: "RETURN", label: t("movement.return") },
                    ]} />
            </div>
            <div style={{ width: "100px" }}>
                <label className="label">{t("stock.quantity")}</label>
                <input className="input" type="number" step="0.01" min="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
                <label className="label">{t("movement.reason")}</label>
                <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("movement.reasonPlaceholder")} />
            </div>
            <button className="btn" type="submit" disabled={busy}>{busy ? "..." : t("common.save")}</button>
        </form>
    );
}
