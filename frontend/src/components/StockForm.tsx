// Formulaire création/édition article de stock (dans modale) - labels au-dessus des champs (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useState, FormEvent, ReactNode } from "react";
import { api } from "../services/api";
import { StockItem } from "../types";

interface Props {
    initial?: StockItem | null; // null/undefined = création, sinon édition (PATCH)
    onSaved: () => void;
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

function initialForm(initial: StockItem | null): FormState {
    return {
        name: initial?.name ?? "",
        reference: initial?.reference ?? "",
        quantity: initial !== null ? String(initial.quantity) : "0",
        unit: initial?.unit ?? "pièces",
        category: initial?.category ?? "",
        supplier: initial?.supplier ?? "",
        purchasePrice: initial?.purchasePrice != null ? String(initial.purchasePrice) : "",
        location: initial?.location ?? "",
        minThreshold: initial !== null ? String(initial.minThreshold) : "0",
    };
}

function FormFields({ form, busy, editing, onSet, onSubmit }: {
    form: FormState; busy: boolean; editing: boolean;
    onSet: (k: string, v: string) => void; onSubmit: (e: FormEvent) => void;
}): JSX.Element {
    const { t } = useTranslation();
    return (
        <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
            <Field label={t("common.nameRequired")}>
                <input className="input" value={form.name} onChange={(e) => onSet("name", e.target.value)} required />
            </Field>
            <Field label={t("stock.referenceRequired")}>
                <input className="input" value={form.reference} onChange={(e) => onSet("reference", e.target.value)} required />
            </Field>
            <Field label={t("stock.quantity")}>
                <input className="input" type="number" step="0.01" value={form.quantity} onChange={(e) => onSet("quantity", e.target.value)} />
            </Field>
            <Field label={t("stock.unit")}>
                <select className="select" value={form.unit} onChange={(e) => onSet("unit", e.target.value)}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
            </Field>
            <Field label={t("stock.category")}>
                <input className="input" value={form.category} onChange={(e) => onSet("category", e.target.value)} />
            </Field>
            <Field label={t("stock.supplier")}>
                <input className="input" value={form.supplier} onChange={(e) => onSet("supplier", e.target.value)} />
            </Field>
            <Field label={t("stock.purchasePrice")}>
                <input className="input" type="number" step="0.01" value={form.purchasePrice} onChange={(e) => onSet("purchasePrice", e.target.value)} />
            </Field>
            <Field label={t("stock.location")}>
                <input className="input" value={form.location} onChange={(e) => onSet("location", e.target.value)} />
            </Field>
            <Field label={t("stock.minThreshold")}>
                <input className="input" type="number" step="0.01" value={form.minThreshold} onChange={(e) => onSet("minThreshold", e.target.value)} />
            </Field>
            <button className="btn" type="submit" disabled={busy} style={{ gridColumn: "1 / -1" }}>
                {busy ? (editing ? t("common.saving") : t("common.creating")) : (editing ? t("common.save") : t("stock.createArticle"))}
            </button>
        </form>
    );
}

export default function StockForm({ initial = null, onSaved }: Props): JSX.Element {
    const [form, setForm] = useState<FormState>(() => initialForm(initial));
    const [busy, setBusy] = useState(false);

    const set = (k: string, v: string): void => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        const res = initial !== null
            ? await api.patch(`/api/stock/${initial.id}`, buildPayload(form))
            : await api.post("/api/stock", buildPayload(form));
        setBusy(false);
        if (res.success) onSaved();
    };

    return (
        <FormFields form={form} busy={busy} editing={initial !== null} onSet={set} onSubmit={submit} />
    );
}
