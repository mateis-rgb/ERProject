// Modale d'engagement de stock sur un projet (ou directement sur un jalon) (Power of 10 R4)
import { useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import { api } from "../../services/api";
import { Milestone, StockItem } from "../../types";
import Modal from "../ui/Modal";
import BrutalSelect from "../ui/BrutalSelect";
import StockAutocomplete from "./StockAutocomplete";

interface Props {
    projectId: string;
    stockItems: StockItem[];
    milestones?: Milestone[]; // si fourni : select d'affectation projet/jalon
    fixedMilestoneId?: string; // si fourni : lien direct sur ce jalon (pas de select)
    onClose: () => void;
    onSaved: () => void;
}

interface FormProps extends Props {
    selectedItem: StockItem | null;
    onSelect: (i: StockItem | null) => void;
}

function LinkForm(p: FormProps): JSX.Element {
    const { t } = useTranslation();
    const [allocated, setAllocated] = useState("1");
    const [forecast, setForecast] = useState("0");
    const [milestoneId, setMilestoneId] = useState("");
    const [busy, setBusy] = useState(false);
    const onMilestone = p.fixedMilestoneId !== undefined;

    const submit = async (): Promise<void> => {
        if (p.selectedItem === null) return;
        setBusy(true);
        const res = onMilestone
            ? await api.post(`/api/milestones/${p.fixedMilestoneId ?? ""}/stock`, { stockItemId: p.selectedItem.id, quantity: parseFloat(allocated) || 0 })
            : await api.post(`/api/projects/${p.projectId}/stock`, {
                stockItemId: p.selectedItem.id,
                allocatedQuantity: parseFloat(allocated) || 0,
                forecastQuantity: parseFloat(forecast) || 0,
                milestoneId: milestoneId === "" ? null : milestoneId,
            });
        setBusy(false);
        if (res.success) { p.onSaved(); p.onClose(); }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <div style={{ marginBottom: "0.9rem" }}>
                <label className="label">{t("stock.article")}</label>
                <StockAutocomplete items={p.stockItems} onSelect={p.onSelect} placeholder={t("stock.searchArticle")} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <QtyField label={onMilestone ? t("stock.quantity") : t("stock.allocated")} value={allocated} onChange={setAllocated} />
                {!onMilestone && <QtyField label={t("stock.forecast")} value={forecast} onChange={setForecast} />}
                {!onMilestone && p.milestones !== undefined && p.milestones.length > 0 && (
                    <div style={{ width: "180px" }}>
                        <label className="label">{t("stock.affectation")}</label>
                        <BrutalSelect value={milestoneId} onChange={setMilestoneId} width="100%" minWidth="100%"
                            options={[
                                { value: "", label: t("stock.affectProject") },
                                ...p.milestones.map((m) => ({ value: m.id, label: m.name })),
                            ]} />
                    </div>
                )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
                <button type="button" className="btn-ghost" onClick={p.onClose}>{t("common.cancel")}</button>
                <button type="submit" className="btn" disabled={busy || p.selectedItem === null}>{t("common.confirm")}</button>
            </div>
        </form>
    );
}

function QtyField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }): JSX.Element {
    return (
        <div style={{ width: "110px" }}>
            <label className="label">{label}</label>
            <input className="input" type="number" step="0.5" min="0" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

export default function LinkStockModal(props: Props): JSX.Element {
    const { t } = useTranslation();
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    return (
        <Modal title={t("modals.addStockLinkTitle")} onClose={props.onClose}>
            <LinkForm {...props} selectedItem={selectedItem} onSelect={setSelectedItem} />
        </Modal>
    );
}
