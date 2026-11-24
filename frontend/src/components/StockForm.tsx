// Formulaire création article de stock (dans modale) - labels au-dessus des champs (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState, FormEvent, ReactNode } from "react";
import { api } from "../services/api";

interface Props {
    onCreated: () => void;
}

const UNITS = ["kg", "pièces", "m", "L"];

type FormState = { name: string; reference: string; quantity: string; unit: string; category: string; supplier: string; purchasePrice: string; location: string; minThreshold: string };

function buildPayload(form: FormState): Record<string, unknown> {
    return {
        name: form.name,
        reference: form.reference,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        category: form.category,
        supplier: form.supplier,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
        location: form.location,
        minThreshold: parseFloat(form.minThreshold),
    };
}

function Field({ label, children }: { label: string; children: ReactNode }): JSX.Element {
    return (
        <div>
            <label className="label">{label}</label>
            {children}
        </div>
    );
}

export default function StockForm({ onCreated }: Props): JSX.Element {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: "", reference: "", quantity: "0", unit: "pièces", category: "", supplier: "", purchasePrice: "", location: "", minThreshold: "0" });
    const [busy, setBusy] = useState(false);

    const set = (k: string, v: string): void => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        const res = await api.post("/api/stock", buildPayload(form));
        setBusy(false);
        if (res.success) onCreated();
    };

    return (
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
            <Field label={t("common.nameRequired")}>
                <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label={t("stock.referenceRequired")}>
                <input className="input" value={form.reference} onChange={(e) => set("reference", e.target.value)} required />
            </Field>
            <Field label={t("stock.quantity")}>
                <input className="input" type="number" step="0.01" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </Field>
            <Field label={t("stock.unit")}>
                <select className="select" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
            </Field>
            <Field label={t("stock.category")}>
                <input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} />
            </Field>
            <Field label={t("stock.supplier")}>
                <input className="input" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
            </Field>
            <Field label={t("stock.purchasePrice")}>
                <input className="input" type="number" step="0.01" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} />
            </Field>
            <Field label={t("stock.location")}>
                <input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </Field>
            <Field label={t("stock.minThreshold")}>
                <input className="input" type="number" step="0.01" value={form.minThreshold} onChange={(e) => set("minThreshold", e.target.value)} />
            </Field>
            <button className="btn" type="submit" disabled={busy} style={{ gridColumn: "1 / -1" }}>
                {busy ? t("common.creating") : t("stock.createArticle")}
            </button>
        </form>
    );
}
