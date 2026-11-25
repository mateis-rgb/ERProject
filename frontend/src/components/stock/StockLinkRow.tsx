import { FiX } from "react-icons/fi";
// Ligne du tableau des liaisons stock (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { ProjectStockLink, Milestone } from "../../types";
import BrutalSelect from "../ui/BrutalSelect";

interface Props {
    link: ProjectStockLink;
    label: string;
    milestones: Milestone[];
    canEdit: boolean;
    onAffectation: (l: ProjectStockLink, milestoneId: string | null) => void;
    onRemove: (stockItemId: string) => void;
}

function milestoneLabel(t: (k: string) => string, milestones: Milestone[], id: string | null): string {
    if (id === null) return t("stock.wholeProject");
    const m = milestones.find((x) => x.id === id);
    return m !== undefined ? m.name : t("stock.deletedMilestone");
}

export default function StockLinkRow({ link, label, milestones, canEdit, onAffectation, onRemove }: Props): JSX.Element {
    const { t } = useTranslation();
    return (
        <tr>
            <td className="table-cell"><strong>{label}</strong></td>
            <td className="table-cell mono">{link.allocatedQuantity}</td>
            <td className="table-cell mono">{link.consumedQuantity}</td>
            <td className="table-cell mono">{link.forecastQuantity}</td>
            <td className="table-cell">
                {canEdit ? (
                    <BrutalSelect value={link.milestoneId ?? ""} width="auto" minWidth="130px" height="30px"
                        onChange={(v) => onAffectation(link, v === "" ? null : v)}
                        options={[
                            { value: "", label: t("stock.wholeProject") },
                            ...milestones.map((m) => ({ value: m.id, label: m.name })),
                        ]} />
                ) : (
                    <span className="mono" style={{ fontSize: "0.78rem" }}>{milestoneLabel(t, milestones, link.milestoneId)}</span>
                )}
            </td>
            <td className="table-cell">
                {canEdit && (
                    <button className="btn-danger" style={{ padding: "0.1rem 0.4rem", boxShadow: "2px 2px 0 var(--danger)" }}
                        onClick={() => onRemove(link.stockItemId)}><FiX /></button>
                )}
            </td>
        </tr>
    );
}
