// Page détail d'un article de stock - photo, infos, mouvements, réservations (Power of 10 R4)
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiEdit2, FiTrash2, FiUpload } from "react-icons/fi";
import { useTranslation } from "../i18n/I18nContext";
import { useAuth } from "../context/AppContext";
import { api } from "../services/api";
import { StockItemDetails, StockMovementDetail, StockReservation } from "../types";
import Modal from "../components/ui/Modal";
import StockForm from "../components/stock/StockForm";
import StockIcon from "../components/stock/StockIcon";
import CommentsSection from "../components/projects/CommentsSection";

const TYPE_COLORS: Record<string, string> = {
    IN: "var(--green)",
    OUT: "var(--danger)",
    RETURN: "var(--accent)",
};

function typeLabel(t: (k: string) => string, type: string): string {
    if (type === "IN") return t("movement.in");
    if (type === "OUT") return t("movement.out");
    return t("movement.return");
}

function useDetails(id: string): { details: StockItemDetails | null; notFound: boolean; reload: () => void } {
    const [details, setDetails] = useState<StockItemDetails | null>(null);
    const [notFound, setNotFound] = useState(false);
    const load = (): void => {
        api.get<StockItemDetails>(`/api/stock/${id}/details`).then((r) => {
            if (r.success) setDetails(r.data);
            else setNotFound(true);
        });
    };
    useEffect(load, [id]);
    return { details, notFound, reload: load };
}

interface PhotoProps {
    itemId: string;
    imagePath: string | null;
    category: string;
    name: string;
    reference: string;
    icon: string | null;
    canEdit: boolean;
    onChanged: () => void;
}

function PhotoCard({ itemId, imagePath, category, name, reference, icon, canEdit, onChanged }: PhotoProps): JSX.Element {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const upload = (file: File): void => {
        const fd = new FormData();
        fd.append("image", file);
        api.postForm<{ imagePath: string }>(`/api/stock/${itemId}/image`, fd).then((r) => {
            if (r.success) { setError(null); onChanged(); }
            else setError(r.error);
        });
    };

    const remove = (): void => {
        api.delete(`/api/stock/${itemId}/image`).then(() => onChanged());
    };

    return (
        <div className="card">
            <h2 style={SECTION_H2}>
                {t("stockDetail.photo")}
            </h2>
            {imagePath !== null ? (
                <img src={`/uploads/${imagePath}`} alt=""
                    style={{ width: "100%", maxHeight: "260px", objectFit: "cover", border: "var(--border-w) solid var(--ink)" }} />
            ) : (
                <div style={{
                    height: "160px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.6rem",
                    border: "var(--border-w) solid var(--ink)", color: "var(--muted)", fontSize: "0.85rem",
                }}>
                    <StockIcon category={category} name={name} reference={reference} iconName={icon} imagePath={null} size={64} />
                    {t("stockDetail.noPhoto")}
                </div>
            )}
            {canEdit && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f !== undefined) upload(f);
                            e.target.value = "";
                        }} />
                    <button className="btn" onClick={() => inputRef.current?.click()}>
                        <span className="ic"><FiUpload /> {t("stockDetail.uploadPhoto")}</span>
                    </button>
                    {imagePath !== null && (
                        <button className="btn-danger" onClick={remove}>
                            <span className="ic"><FiTrash2 /> {t("stockDetail.removePhoto")}</span>
                        </button>
                    )}
                </div>
            )}
            {error !== null && <p style={{ color: "var(--danger)", fontSize: "0.78rem", margin: "0.5rem 0 0" }}>{error}</p>}
        </div>
    );
}

function InfoCard({ details }: { details: StockItemDetails }): JSX.Element {
    const { t } = useTranslation();
    const it = details.item;
    const a = details.availability;
    const rows: [string, string][] = [
        ["reference", it.reference],
        [t("stock.category"), it.category || "—"],
        [t("stock.location"), it.location || "—"],
        [t("stock.supplier"), it.supplier || "—"],
        [t("stock.quantity"), `${it.quantity} ${it.unit}`],
        [t("stock.minThreshold"), String(it.minThreshold)],
        [t("stock.purchasePrice"), it.purchasePrice !== null ? `${it.purchasePrice} €` : "—"],
    ];
    return (
        <div className="card">
            <h2 style={SECTION_H2}>
                {t("stockDetail.infos")}
            </h2>
            {rows.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.3rem 0", borderBottom: "1px solid var(--ink)", fontSize: "0.85rem" }}>
                    <span className="mono" style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: "0.7rem" }}>{k}</span>
                    <strong>{v}</strong>
                </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.5rem 0 0", fontSize: "0.9rem" }}>
                <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>{t("stockDetail.availability")}</span>
                <strong style={a.available <= 0 && a.reserved > 0 ? { color: "var(--danger)" } : undefined}>
                    {a.available}/{a.totalQuantity} {t("stockDetail.available")} · {a.reserved} {t("stockDetail.reserved")}
                    {a.available <= 0 && a.reserved > 0 && ` · ${t("stockDetail.unavailable")}`}
                </strong>
            </div>
        </div>
    );
}

const SECTION_H2: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", margin: "0 0 1rem" };

function MovementsCard({ movements }: { movements: StockMovementDetail[] }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div>
            <h2 style={SECTION_H2}>{t("stockDetail.movements")}</h2>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th className="table-header">{t("stockDetail.date")}</th>
                        <th className="table-header">{t("stockDetail.type")}</th>
                        <th className="table-header">{t("stockDetail.qty")}</th>
                        <th className="table-header">{t("stockDetail.reason")}</th>
                        <th className="table-header">{t("stockDetail.projectCol")}</th>
                        <th className="table-header">{t("stockDetail.user")}</th>
                    </tr>
                </thead>
                <tbody>
                    {movements.map((m) => (
                        <tr key={m.id}>
                            <td className="table-cell">{new Date(m.date).toLocaleString("fr-FR")}</td>
                            <td className="table-cell">
                                <span className="badge" style={{ backgroundColor: TYPE_COLORS[m.type] ?? "var(--muted)" }}>
                                    {typeLabel(t, m.type)}
                                </span>
                            </td>
                            <td className="table-cell">{m.quantity}</td>
                            <td className="table-cell">{m.reason || "—"}</td>
                            <td className="table-cell">
                                {m.projectName !== null ? <Link to={`/projects/${m.projectId ?? ""}`} style={{ color: "var(--ink)" }}>{m.projectName}</Link> : "—"}
                            </td>
                            <td className="table-cell">{m.userName}</td>
                        </tr>
                    ))}
                    {movements.length === 0 && (
                        <tr><td className="table-cell" colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>{t("stockDetail.noMovements")}</td></tr>
                    )}
                </tbody>
            </table>
            </div>
        </div>
    );
}

function ReservationsCard({ reservations }: { reservations: StockReservation[] }): JSX.Element {
    const { t } = useTranslation();
    return (
        <div>
            <h2 style={SECTION_H2}>{t("stockDetail.reservations")}</h2>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th className="table-header">{t("stockDetail.projectCol")}</th>
                        <th className="table-header">{t("planning.milestone")}</th>
                        <th className="table-header">{t("stockDetail.allocated")}</th>
                        <th className="table-header">{t("stockDetail.consumed")}</th>
                        <th className="table-header">{t("stockDetail.forecast")}</th>
                        <th className="table-header">{t("stockDetail.forecastDate")}</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.map((r) => (
                        <tr key={`${r.projectId}-${r.milestoneId ?? "none"}`}>
                            <td className="table-cell">
                                <Link to={`/projects/${r.projectId}`} style={{ color: "var(--ink)" }}>{r.projectName}</Link>
                            </td>
                            <td className="table-cell">{r.milestoneName ?? t("stockDetail.milestoneNone")}</td>
                            <td className="table-cell">{r.allocatedQuantity}</td>
                            <td className="table-cell">{r.consumedQuantity}</td>
                            <td className="table-cell">{r.forecastQuantity}</td>
                            <td className="table-cell">{r.forecastDate !== null ? new Date(r.forecastDate).toLocaleDateString("fr-FR") : "—"}</td>
                        </tr>
                    ))}
                    {reservations.length === 0 && (
                        <tr><td className="table-cell" colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>{t("stockDetail.noReservations")}</td></tr>
                    )}
                </tbody>
            </table>
            </div>
        </div>
    );
}

export default function StockItemPage(): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const itemId = id ?? "";
    const { details, notFound, reload } = useDetails(itemId);
    const [editing, setEditing] = useState(false);
    const canEdit = user !== null && user.role !== "VIEWER";

    if (notFound) {
        return (
            <div style={{ textAlign: "center", padding: "3rem" }}>
                <p>{t("stockDetail.notFound")}</p>
                <Link className="btn-ghost" to="/stock" style={{ textDecoration: "none", display: "inline-flex", marginTop: "1rem" }}>
                    <span className="ic"><FiArrowLeft /> {t("stockDetail.back")}</span>
                </Link>
            </div>
        );
    }
    if (details === null) return <div />;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                    <Link to="/stock" style={{ color: "var(--muted)", fontSize: "0.8rem", textDecoration: "none" }}>
                        <span className="ic"><FiArrowLeft /> {t("stockDetail.back")}</span>
                    </Link>
                    <h1 className="page-title" style={{ marginTop: "0.25rem" }}>{details.item.name}</h1>
                    <p className="page-subtitle">{details.item.reference}</p>
                </div>
                {canEdit && (
                    <button className="btn" onClick={() => setEditing(true)}>
                        <span className="ic"><FiEdit2 /> {t("stockDetail.edit")}</span>
                    </button>
                )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem", alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <PhotoCard itemId={itemId} imagePath={details.item.imagePath} category={details.item.category}
                        name={details.item.name} reference={details.item.reference} icon={details.item.icon}
                        canEdit={canEdit} onChanged={reload} />
                    <InfoCard details={details} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <ReservationsCard reservations={details.reservations} />
                    <MovementsCard movements={details.movements} />
                    <CommentsSection scope={{ kind: "stock", stockItemId: itemId }} />
                </div>
            </div>
            {editing && (
                <Modal title={t("stockDetail.editTitle")} onClose={() => setEditing(false)} maxWidth="640px">
                    <StockForm initial={details.item} onSaved={() => { setEditing(false); reload(); }} />
                </Modal>
            )}
        </div>
    );
}
