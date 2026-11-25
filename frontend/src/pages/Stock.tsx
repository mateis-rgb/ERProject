// Page Stock avec onglets Inventaire / Mouvements (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { StockItem, AvailabilityEntry } from "../types";
import { useAuth } from "../context/AppContext";
import { useModules } from "../context/ModulesContext";
import StockTabs, { StockTabId } from "../components/stock/StockTabs";
import StockForm from "../components/stock/StockForm";
import Modal from "../components/ui/Modal";
import StockTable from "../components/stock/StockTable";
import StockSearchBar from "../components/stock/StockSearchBar";
import StockFilters from "../components/stock/StockFilters";
import StockMovementsSection from "../components/stock/StockMovementsSection";
import { useStockQuery } from "../hooks/useStockQuery";

interface HeaderProps {
    count: number;
    canEdit: boolean;
    tab: StockTabId;
    onOpenForm: () => void;
    label: (k: string) => string;
}

function StockHeader(p: HeaderProps): JSX.Element {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div>
                <h1 className="page-title">Stock</h1>
                <p className="page-subtitle">{p.count} ARTICLE{p.count > 1 ? "S" : ""}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <a className="btn-ghost" href="/api/stock/export/csv" style={{ textDecoration: "none" }}>{p.label("common.exportCsv")}</a>
                <a className="btn-ghost" href="/api/stock/export/json" style={{ textDecoration: "none" }}>{p.label("common.exportJson")}</a>
                {p.canEdit && p.tab === "inventory" && (
                    <button className="btn" onClick={p.onOpenForm}>
                        {p.label("stock.newArticle")}
                    </button>
                )}
            </div>
        </div>
    );
}

// Dispo de tous les articles à aujourd'hui (pris sur un projet = indisponible)
function useAvailability(): Record<string, AvailabilityEntry> {
    const [avail, setAvail] = useState<Record<string, AvailabilityEntry>>({});
    useEffect(() => {
        api.get<AvailabilityEntry[]>("/api/stock/availability").then((r) => {
            if (r.success) {
                const map: Record<string, AvailabilityEntry> = {};
                for (const a of r.data) map[a.stockItemId] = a;
                setAvail(map);
            }
        });
    }, []);
    return avail;
}

// Modales de création / édition d'article
function StockModals(p: {
    showForm: boolean; editing: StockItem | null; canEdit: boolean;
    onCloseForm: () => void; onCloseEdit: () => void; onSaved: () => void;
}): JSX.Element | null {
    const { t } = useTranslation();
    if (p.showForm && p.canEdit) {
        return (
            <Modal title={t("stock.newArticle")} onClose={p.onCloseForm} maxWidth="640px">
                <StockForm onSaved={p.onSaved} />
            </Modal>
        );
    }
    if (p.editing !== null) {
        return (
            <Modal title={t("stock.editArticle")} onClose={p.onCloseEdit} maxWidth="640px">
                <StockForm initial={p.editing} onSaved={p.onSaved} />
            </Modal>
        );
    }
    return null;
}

export default function Stock(): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [tab, setTab] = useState<StockTabId>("inventory");
    const avail = useAvailability();
    const q = useStockQuery(avail);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<StockItem | null>(null);
    const canEdit = user !== null && user.role !== "VIEWER";
    const navigate = useNavigate();
    const { enabled } = useModules();

    useEffect(() => {
        if (!enabled("stock")) navigate("/", { replace: true });
    }, [enabled, navigate]);

    const categories = [...new Set(q.allItems.map((i) => i.category).filter((c) => c !== ""))].sort();
    const locations = [...new Set(q.allItems.map((i) => i.location).filter((l) => l !== ""))].sort();
    const resetFilters = (): void => {
        q.setQuery(""); q.setCategory(""); q.setLocation(""); q.setDispo("all"); q.setLowOnly(false);
    };

    return (
        <div>
            <StockHeader count={q.items.length} canEdit={canEdit} tab={tab}
                onOpenForm={() => setShowForm(true)} label={t} />

            <StockTabs active={tab} onChange={setTab} />

            {tab === "inventory" && (
                <>
                    <StockModals showForm={showForm} editing={editing} canEdit={canEdit}
                        onCloseForm={() => setShowForm(false)} onCloseEdit={() => setEditing(null)}
                        onSaved={() => { setShowForm(false); setEditing(null); q.reload(); }} />
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                        <StockSearchBar query={q.query} onQuery={q.setQuery} allItems={q.allItems}
                            onPickItem={(item) => navigate(`/stock/${item.id}`)}
                            onPickCategory={q.setCategory} onPickLocation={q.setLocation} />
                    </div>
                    <StockFilters categories={categories} locations={locations}
                        category={q.category} onCategory={q.setCategory}
                        location={q.location} onLocation={q.setLocation}
                        dispo={q.dispo} onDispo={q.setDispo}
                        lowOnly={q.lowOnly} onLowOnly={q.setLowOnly}
                        onReset={resetFilters} resultCount={q.items.length} totalCount={q.allItems.length} />
                    <StockTable items={q.items} avail={avail} canEdit={canEdit}
                        sort={q.sort} onSort={q.toggleSort} onChanged={q.reload} onEdit={setEditing} />
                </>
            )}
            {tab === "movements" && <StockMovementsSection items={q.allItems} />}
        </div>
    );
}
