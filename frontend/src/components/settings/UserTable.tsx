// Table des utilisateurs - liste (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { AuthUser, UserRole } from "../../types";
import UserRow from "./UserRow";
import { useAuth } from "../../context/AppContext";

interface Props {
    users: AuthUser[];
    onChanged: () => void;
}

export default function UserTable({ users, onChanged }: Props): JSX.Element {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th className="table-header">Utilisateur</th>
                        <th className="table-header">{t("login.email")}</th>
                        <th className="table-header">{t("access.role")}</th>
                        <th className="table-header">{t("access.changeRole")}</th>
                        <th className="table-header"></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <UserRow
                            key={u.id}
                            user={u}
                            isSelf={u.id === currentUser?.id}
                            onChanged={onChanged}
                        />
                    ))}
                    {users.length === 0 && (
                        <tr><td className="table-cell" colSpan={5} style={{ textAlign: "center", color: "var(--text-dim)", padding: "2rem" }}>
                            Aucun utilisateur
                        </td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export type { UserRole };
