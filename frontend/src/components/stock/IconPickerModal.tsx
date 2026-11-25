// Sélecteur d'icône d'article (modal façon "parcourir" : grille + recherche par nom) (Power of 10 R4)
import { useState } from "react";
import { FiCheck, FiRotateCcw, FiSearch } from "react-icons/fi";
import { useTranslation } from "../../i18n/I18nContext";
import Modal from "../ui/Modal";
import { ALL_STOCK_ICONS } from "../../utils/stockIcon";

interface Props {
    current: string | null;
    onPick: (name: string | null) => void;
    onClose: () => void;
}

function IconCell(p: { name: string; icon: React.ComponentType<{ size?: number }>; selected: boolean; onPick: () => void }): JSX.Element {
    const Icon = p.icon as React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
    return (
        <button
            type="button"
            onClick={p.onPick}
            title={p.name}
            style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                padding: "0.5rem 0.25rem", cursor: "pointer",
                background: p.selected ? "var(--accent)" : "var(--surface)",
                color: p.selected ? "var(--accent-ink)" : "var(--text)",
                border: p.selected ? "2px solid var(--ink)" : "2px solid var(--ink)",
                boxShadow: p.selected ? "inset 3px 3px 0 rgba(0,0,0,0.25)" : "var(--shadow-btn)",
                position: "relative",
            }}
        >
            {p.selected && <FiCheck size={12} style={{ position: "absolute", top: "2px", right: "2px" }} />}
            <Icon size={24} />
            <span className="mono" style={{ fontSize: "0.58rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72px" }}>
                {p.name}
            </span>
        </button>
    );
}

export default function IconPickerModal({ current, onPick, onClose }: Props): JSX.Element {
    const { t } = useTranslation();
    const [filter, setFilter] = useState("");
    const q = filter.trim().toLowerCase();
    const icons = q === "" ? ALL_STOCK_ICONS : ALL_STOCK_ICONS.filter((i) => i.name.toLowerCase().includes(q));

    const pick = (name: string | null): void => {
        onPick(name);
        onClose();
    };

    return (
        <Modal title={t("stock.chooseIcon")} onClose={onClose} maxWidth="640px">
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                <FiSearch style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                <input className="input" style={{ paddingLeft: "2rem", height: "36px" }}
                    placeholder={t("stock.iconSearch")} value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: "0.5rem",
                maxHeight: "50vh", overflow: "auto", padding: "2px",
            }}>
                <IconCell name={t("stock.iconAuto")} icon={FiRotateCcw as unknown as React.ComponentType<{ size?: number }>}
                    selected={current === null} onPick={() => pick(null)} />
                {icons.map((i) => (
                    <IconCell key={i.name} name={i.name} icon={i.icon} selected={current === i.name} onPick={() => pick(i.name)} />
                ))}
            </div>
            {icons.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", textAlign: "center" }}>{t("stock.noSuggestion")}</p>
            )}
        </Modal>
    );
}
