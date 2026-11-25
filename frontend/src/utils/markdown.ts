// Rendu Markdown sécurisé (marked + DOMPurify) pour l'aperçu de l'éditeur (Power of 10 R4)
import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(src: string): string {
    const html = marked.parse(src, { async: false });
    return DOMPurify.sanitize(typeof html === "string" ? html : "", { USE_PROFILES: { html: true } });
}
