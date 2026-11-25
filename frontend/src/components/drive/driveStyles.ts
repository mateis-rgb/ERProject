// Styles partagés du bloc drive (header/content façon Gantt) - constantes, pas de macros (Power of 10 R8)
export function driveCols(canEdit: boolean): string {
    const base = "minmax(140px, 240px) 80px 120px 100px";
    return canEdit ? `${base} 130px 110px` : base;
}

export const driveHeaderCell: React.CSSProperties = {
    padding: "0.45rem 0.6rem",
    fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase",
    color: "var(--muted)", borderLeft: "1px solid var(--ink)",
    whiteSpace: "nowrap", overflow: "hidden",
};

export const driveRowCell: React.CSSProperties = {
    padding: "0.4rem 0.6rem", fontSize: "0.8rem", borderLeft: "1px solid var(--ink)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};
