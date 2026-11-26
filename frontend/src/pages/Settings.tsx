// Page Réglages avec onglets en routes /settings/:tab (Power of 10 R4)
import { useTranslation } from "../i18n/I18nContext";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AppContext";
import { useModules } from "../context/ModulesContext";
import { api } from "../services/api";
import SettingsTabs, { TabId, SETTINGS_TAB_IDS } from "../components/settings/SettingsTabs";
import AppTab from "../components/settings/AppTab";
import AppearanceSection from "../components/settings/AppearanceSection";
import ConfigListsSection from "../components/settings/ConfigListsSection";
import Modal from "../components/ui/Modal";
import { refreshConfigLists } from "../hooks/useConfigLists";
import AccessTab from "../components/settings/AccessTab";
import SecurityTab from "../components/settings/SecurityTab";
import TemplatesTab from "../components/settings/TemplatesTab";
import ModulesTab from "../components/settings/ModulesTab";
import AboutTab from "../components/settings/AboutTab";
import StatusTab from "../components/settings/StatusTab";

export default function Settings(): JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { tab: tabParam } = useParams<{ tab?: string }>();
    const navigate = useNavigate();
    const { enabled } = useModules();
    const tab: TabId = SETTINGS_TAB_IDS.includes(tabParam as TabId) ? (tabParam as TabId) : "appearance";

    useEffect(() => {
        const valid = tabParam !== undefined && SETTINGS_TAB_IDS.includes(tabParam as TabId);
        const isAdmin = user?.role === "ADMIN";
        if (!valid || (tabParam === "templates" && !enabled("templates")) || (tabParam === "status" && !isAdmin)) {
            navigate(`/settings/appearance`, { replace: true });
        }
    }, [tabParam, navigate, enabled, user]);

    return (
        <div>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 className="page-title">{t("nav.settings")}</h1>
                <p className="page-subtitle">{t("settings.subtitle2")}</p>
            </div>
            <SettingsTabs active={tab} onChange={(t2) => navigate(`/settings/${t2}`)} isAdmin={user?.role === "ADMIN"} />
            <div style={{ maxWidth: "900px" }}>
                {tab === "app" && <AppTab />}
                {tab === "appearance" && <AppearanceSection />}
                {tab === "lists" && <ListsTab />}
                {tab === "templates" && <TemplatesTab />}
                {tab === "modules" && user?.role === "ADMIN" && <ModulesTab />}
                {tab === "access" && user?.role === "ADMIN" && <AccessTab />}
                {tab === "security" && <SecurityTab />}
                {tab === "status" && user?.role === "ADMIN" && <StatusTab />}
                {tab === "about" && <AboutTab />}
            </div>
        </div>
    );
}

function ListsTab(): JSX.Element {
    const { t } = useTranslation();
    const [configs, setConfigs] = useState<Record<string, string[]>>({});
    const [editKey, setEditKey] = useState("");
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        api.get<Record<string, string[]>>("/api/config").then((r) => { if (r.success) setConfigs(r.data); });
    }, []);

    const saveConfig = async (): Promise<void> => {
        const values = editValue.split(",").map((v) => v.trim()).filter((v) => v.length > 0);
        await api.put(`/api/config/${editKey}`, { values });
        refreshConfigLists(); // invalide le cache partagé -> prochaine ouverture de modale = liste à jour
        const r = await api.get<Record<string, string[]>>("/api/config");
        if (r.success) setConfigs(r.data);
        setEditKey("");
    };

    return (
        <>
        <ConfigListsSection
            configs={configs}
            editKey=""
            editValue={editValue}
            onEdit={(k, v) => { setEditKey(k); setEditValue(v); }}
            onSave={saveConfig}
        />
        {editKey !== "" && (
            <Modal title={t("modals.editListTitle")} onClose={() => setEditKey("")}>
                <form onSubmit={(e) => { e.preventDefault(); void saveConfig(); }}>
                    <label className="label">{t("project.tagsHint")}</label>
                    <input className="input" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                        <button type="button" className="btn-ghost" onClick={() => setEditKey("")}>{t("common.cancel")}</button>
                        <button type="submit" className="btn">{t("common.save")}</button>
                    </div>
                </form>
            </Modal>
        )}
        </>
    );
}
