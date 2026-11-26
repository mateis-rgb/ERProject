// Formulaire création/édition article de stock (dans modale) - labels au-dessus des champs (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useEffect, useState, FormEvent, ReactNode } from "react";
import { api } from "../../services/api";
import { StockItem } from "../../types";
import BrutalSelect from "../ui/BrutalSelect";
import StockIcon from "./StockIcon";
import IconPickerModal from "./IconPickerModal";
import { iconNameOf, stockIconFor } from "../../utils/stockIcon";

interface Props {
    initial?: StockItem | null; // null/undefined = création, sinon édition (PATCH)
    onSaved: () => void;
}

type FormState = { name: string; reference: string; quantity: string; unit: string; category: string; supplier: string; purchasePrice: string; location: string; minThreshold: string };

function buildPayload(form: FormState, icon: string | null): Record<string, unknown> {
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
        icon,
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

// Select alimenté par une liste modifiable (config) ; la valeur courante est toujours proposée (édition)
function ConfigSelect({ label, value, options, allowEmpty, onChange }: {
    label: string; value: string; options: string[]; allowEmpty: boolean; onChange: (v: string) => void;
}): JSX.Element {
    const opts = value !== "" && !options.includes(value) ? [value, ...options] : options;
    return (
        <Field label={label}>
            <BrutalSelect value={value} onChange={onChange}
                options={[
                    ...(allowEmpty ? [{ value: "", label: "—" }] : []),
                    ...opts.map((o) => ({ value: o, label: o })),
                ]} />
        </Field>
    );
}

// Aperçu live de l'icône résolue (manuelle > ref > catégorie/nom) + bouton pour choisir manuellement
function IconPreview({ form, icon, onOpenPicker }: { form: FormState; icon: string | null; onOpenPicker: () => void }): JSX.Element {
    const { t } = useTranslation();
    const auto = stockIconFor(form.category, form.name, form.reference);
    const label = icon !== null ? icon : `${iconNameOf(auto)} (${t("stock.iconAuto")})`;
    return (
        <Field label={t("stock.iconPreview")}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <StockIcon category={form.category} name={form.name} reference={form.reference} iconName={icon} imagePath={null} size={44} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" }}>
                    <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{label}</span>
                    <button type="button" className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }} onClick={onOpenPicker}>
                        {t("stock.chooseIcon")}
                    </button>
                </div>
            </div>
        </Field>
    );
}

function FormFields({ form, busy, editing, configs, icon, onOpenPicker, onSet, onSubmit }: {
    form: FormState; busy: boolean; editing: boolean;
    configs: Record<string, string[]>;
    icon: string | null; onOpenPicker: () => void;
    onSet: (k: string, v: string) => void; onSubmit: (e: FormEvent) => void;
}): JSX.Element {
    const { t } = useTranslation();
    return (
        <form onSubmit={onSubmit}>
            <Field label={t("common.nameRequired")}>
                <input className="input" value={form.name} onChange={(e) => onSet("name", e.target.value)} required />
            </Field>
            <Field label={t("stock.referenceRequired")}>
                <input className="input" value={form.reference} onChange={(e) => onSet("reference", e.target.value)} required />
            </Field>
            <IconPreview form={form} icon={icon} onOpenPicker={onOpenPicker} />
            <Field label={t("stock.quantity")}>
                <input className="input" type="number" step="0.01" value={form.quantity} onChange={(e) => onSet("quantity", e.target.value)} />
            </Field>
            <ConfigSelect label={t("stock.unit")} value={form.unit} options={configs["stock_units"] ?? []}
                allowEmpty={false} onChange={(v) => onSet("unit", v)} />
            <ConfigSelect label={t("stock.category")} value={form.category} options={configs["stock_categories"] ?? []}
                allowEmpty onChange={(v) => onSet("category", v)} />
            <Field label={t("stock.supplier")}>
                <input className="input" value={form.supplier} onChange={(e) => onSet("supplier", e.target.value)} />
            </Field>
            <Field label={t("stock.purchasePrice")}>
                <input className="input" type="number" step="0.01" value={form.purchasePrice} onChange={(e) => onSet("purchasePrice", e.target.value)} />
            </Field>
            <ConfigSelect label={t("stock.location")} value={form.location} options={configs["stock_locations"] ?? []}
                allowEmpty onChange={(v) => onSet("location", v)} />
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
    const [icon, setIcon] = useState<string | null>(initial?.icon ?? null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    // Listes rechargées à chaque ouverture de la modale (reliées à settings/listes, pas de cache)
    const [configs, setConfigs] = useState<Record<string, string[]>>({});
    useEffect(() => {
        api.get<Record<string, string[]>>("/api/config").then((r) => { if (r.success) setConfigs(r.data); });
    }, []);

    const set = (k: string, v: string): void => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setBusy(true);
        const res = initial !== null
            ? await api.patch(`/api/stock/${initial.id}`, buildPayload(form, icon))
            : await api.post("/api/stock", buildPayload(form, icon));
        setBusy(false);
        if (res.success) onSaved();
    };

    return (
        <>
            <FormFields form={form} busy={busy} editing={initial !== null} configs={configs}
                icon={icon} onOpenPicker={() => setPickerOpen(true)} onSet={set} onSubmit={submit} />
            {pickerOpen && (
                <IconPickerModal current={icon} onPick={setIcon} onClose={() => setPickerOpen(false)} />
            )}
        </>
    );
}
