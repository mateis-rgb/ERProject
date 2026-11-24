import { FiX } from "react-icons/fi";
// Ligne du tableau des liaisons stock (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { ProjectStockLink, Milestone } from "../../types";

interface Props {
    link: ProjectStockLink;
    label: string;
    milestones: Milestone[];
    canEdit: boolean;
    onAffectation: (l: ProjectStockLink, milestoneId: string | null) => void;
    onRemove: (stockItemId: string) => void;
}

function milestoneLabel(milestones: Milestone[], id: string | null): string {
    if (id === null) return "Projet entier";
    const m = milestones.find((x) => x.id === id);
    return m !== undefined ? m.name : "Jalon supprimé";
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
                    <select className="select" style={{ width: "auto", fontSize: "0.78rem" }}
                        value={link.milestoneId ?? ""}
                        onChange={(e) => onAffectation(link, e.target.value === "" ? null : e.target.value)}>
                        <option value="">{t("stock.wholeProject")}</option>
                        {milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                ) : (
                    <span className="mono" style={{ fontSize: "0.78rem" }}>{milestoneLabel(milestones, link.milestoneId)}</span>
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
