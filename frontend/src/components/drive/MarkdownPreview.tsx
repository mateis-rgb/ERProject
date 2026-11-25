// Aperçu Markdown : rendu sécurisé + coloration syntaxique (highlight.js) + maths LaTeX (KaTeX) (Power of 10 R4)
import { useEffect, useMemo, useRef } from "react";
import hljs from "highlight.js/lib/common";
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";
import { renderMarkdown } from "../../utils/markdown";

const MATH_DELIMITERS = [
    { left: "$$", right: "$$", display: true },
    { left: "\\(", right: "\\)", display: false },
    { left: "$", right: "$", display: false },
];

export default function MarkdownPreview({ src }: { src: string }): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);
    const html = useMemo(() => renderMarkdown(src), [src]);

    useEffect(() => {
        const el = ref.current;
        if (el === null) return;
        el.querySelectorAll("pre code").forEach((block) => {
            hljs.highlightElement(block as HTMLElement);
        });
        renderMathInElement(el, {
            delimiters: MATH_DELIMITERS,
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
            throwOnError: false,
            errorColor: "#ef4444",
        });
    }, [html]);

    return (
        <div
            ref={ref}
            className="markdown-body"
            style={{ padding: "1rem 1.25rem", overflowY: "auto", height: "100%", boxSizing: "border-box" }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
