// Formulaire création article de stock (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState, FormEvent } from "react";
import { api } from "../services/api";

interface Props {
    onCreated: () => void;
}

const UNITS = ["kg", "pièces", "m", "L"];

export default function StockForm({ onCreated }: Props): JSX.Element {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: "", reference: "", quantity: "0", unit: "pièces", category: "", supplier: "", purchasePrice: "", location: "", minThreshold: "0" });
    const [busy, setBusy] = useState(false);

    const set = (k: string, v: string): void => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        const res = await api.post("/api/stock", {
            name: form.name,
            reference: form.reference,
            quantity: parseFloat(form.quantity),
            unit: form.unit,
            category: form.category,
            supplier: form.supplier,
            purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
            location: form.location,
            minThreshold: parseFloat(form.minThreshold),
        });
        setBusy(false);
        if (res.success) onCreated();
    };

    return (
        <form className="card" onSubmit={submit} style={{ marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
            <input className="input" placeholder={t("common.nameRequired")} value={form.name} onChange={(e) => set("name", e.target.value)} required />
            <input className="input" placeholder={t("stock.referenceRequired")} value={form.reference} onChange={(e) => set("reference", e.target.value)} required />
            <input className="input" type="number" step="0.01" placeholder={t("stock.quantity")} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            <select className="select" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <input className="input" placeholder={t("stock.category")} value={form.category} onChange={(e) => set("category", e.target.value)} />
            <input className="input" placeholder={t("stock.supplier")} value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
            <input className="input" type="number" step="0.01" placeholder={t("stock.purchasePrice")} value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} />
            <input className="input" placeholder={t("stock.location")} value={form.location} onChange={(e) => set("location", e.target.value)} />
            <input className="input" type="number" step="0.01" placeholder={t("stock.minThreshold")} value={form.minThreshold} onChange={(e) => set("minThreshold", e.target.value)} />
            <button className="btn" type="submit" disabled={busy} style={{ gridColumn: "1 / -1" }}>
                {busy ? "Création..." : "Créer l'article"}
            </button>
        </form>
    );
}
