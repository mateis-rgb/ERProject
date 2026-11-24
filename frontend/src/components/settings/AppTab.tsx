// Onglet Application des réglages - langue + stockage des fichiers (Power of 10 R4)
import { useTranslation } from "../../i18n/I18nContext";
import { useAuth } from "../../context/AppContext";
import LanguagePicker from "../layout/LanguagePicker";
import StorageSection from "./StorageSection";

export default function AppTab(): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user !== null && user.role === "ADMIN";

    return (
        <div>
            <div className="card" style={{ marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginTop: 0, marginBottom: "1rem" }}>
                    {t("app.title")}
                </h2>
                <LanguagePicker />
            </div>
            {isAdmin && <StorageSection />}
        </div>
    );
}
