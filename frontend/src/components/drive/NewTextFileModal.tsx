// Modale de création d'un fichier texte éditable (.md / .txt / .fountain) dans le drive (Power of 10 R4)
import { useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import { Attachment } from "../../types";
import { TEXT_FILE_TYPES } from "../../utils/textFiles";
import Modal from "../ui/Modal";
import BrutalSelect from "../ui/BrutalSelect";

interface Props {
    projectId: string;
    parentId: string | null;
    onClose: () => void;
    onCreated: (att: Attachment) => void;
}

export default function NewTextFileModal({ projectId, parentId, onClose, onCreated }: Props): JSX.Element {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [typeIdx, setTypeIdx] = useState("0");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async (): Promise<void> => {
        const fallback = { ext: ".md", labelKey: "editor.typeMd", mime: "text/markdown" };
        const type = TEXT_FILE_TYPES.find((_, i) => String(i) === typeIdx) ?? fallback;
        const base = name.trim().replace(/\.[a-z0-9]+$/i, "") || "nouveau";
        const fileName = `${base}${type.ext}`;
        setBusy(true);
        setError(null);
        try {
            const form = new FormData();
            form.append("file", new File([""], fileName, { type: type.mime }));
            if (parentId !== null) form.append("parentId", parentId);
            const res = await fetch(`/api/attachments/project/${projectId}`, { method: "POST", credentials: "include", body: form });
            const r = await res.json() as { success: boolean; data?: Attachment; error?: string };
            if (r.success && r.data !== undefined) {
                onCreated(r.data);
                onClose();
            } else {
                setError(r.error ?? "Erreur");
            }
        } catch {
            setError("Erreur réseau");
        }
        setBusy(false);
    };

    return (
        <Modal title={t("editor.newText")} onClose={onClose} maxWidth="440px">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                    <label className="label">{t("editor.fileName")}</label>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="notes-reunion" autoFocus />
                </div>
                <div>
                    <label className="label">{t("editor.type")}</label>
                    <BrutalSelect value={typeIdx} onChange={setTypeIdx}
                        options={TEXT_FILE_TYPES.map((x, i) => ({ value: String(i), label: t(x.labelKey) }))} />
                </div>
                {error !== null && <p style={{ color: "var(--danger)", fontSize: "0.8rem", margin: 0 }}>{error}</p>}
                <button className="btn" onClick={() => void create()} disabled={busy || name.trim() === ""}>
                    {busy ? "..." : t("editor.create")}
                </button>
            </div>
        </Modal>
    );
}
