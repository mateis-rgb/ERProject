import { FiX } from "react-icons/fi";
// Ligne utilisateur avec actions (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useState } from "react";
import { api } from "../../services/api";
import { AuthUser, UserRole } from "../../types";
import UserAvatar from "../layout/UserAvatar";
import BrutalSelect from "../ui/BrutalSelect";
import ConfirmModal from "../ui/ConfirmModal";

interface Props {
    user: AuthUser;
    isSelf: boolean;
    onChanged: () => void;
}

const ROLE_COLORS: Record<UserRole, string> = {
    ADMIN: "var(--tally)",
    EDITOR: "var(--amber)",
    VIEWER: "var(--blue)",
};

export default function UserRow({ user, isSelf, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const changeRole = async (role: UserRole): Promise<void> => {
        setBusy(true);
        await api.patch(`/api/admin/users/${user.id}`, { role });
        setBusy(false);
        onChanged();
    };

    const doRemove = async (): Promise<void> => {
        setConfirming(false);
        setBusy(true);
        await api.delete(`/api/admin/users/${user.id}`);
        setBusy(false);
        onChanged();
    };

    return (
        <>
        <tr>
            <td className="table-cell">
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <UserAvatar name={user.name} color={ROLE_COLORS[user.role]} />
                    <span style={{ fontWeight: 600 }}>
                        {user.name}
                        {isSelf && <span className="mono" style={{ marginLeft: "0.5rem", fontSize: "0.62rem", color: "var(--text-dim)" }}>(toi)</span>}
                    </span>
                </div>
            </td>
            <td className="table-cell mono" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{user.email}</td>
            <td className="table-cell">
                <span className="badge" style={{ color: ROLE_COLORS[user.role], borderColor: ROLE_COLORS[user.role], background: "transparent" }}>
                    {user.role}
                </span>
            </td>
            <td className="table-cell">
                <BrutalSelect value={user.role} disabled={busy || isSelf} width="auto" minWidth="110px" height="32px"
                    onChange={(v) => changeRole(v as UserRole)}
                    options={[
                        { value: "ADMIN", label: t("roles.admin") },
                        { value: "EDITOR", label: t("roles.editor") },
                        { value: "VIEWER", label: t("roles.viewer") },
                    ]} />
            </td>
            <td className="table-cell">
                {!isSelf && <button className="btn-danger" onClick={() => setConfirming(true)} disabled={busy}><FiX /></button>}
            </td>
        </tr>
        {confirming && (
            <ConfirmModal danger busy={busy}
                title={`${t("common.delete")} ${user.name}`}
                message={t("common.irreversible")}
                onConfirm={() => void doRemove()} onCancel={() => setConfirming(false)} />
        )}
        </>
    );
}
