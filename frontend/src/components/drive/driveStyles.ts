// Styles partagés du bloc drive (header/content façon Gantt) - constantes, pas de macros (Power of 10 R8)
export function driveCols(canEdit: boolean): string {
    // nom en 1fr = complète le reste de la ligne ; autres colonnes au minimum (actions = 2 boutons de 26px)
    const base = "minmax(0,1fr) 70px 110px 110px"; // date JJ/MM/AAAA en mono à l'aise
    return canEdit ? `${base} 150px 96px` : base; // tailles optimales avec gap ; le nom (1fr) absorbe le reste
}

export const driveHeaderCell: React.CSSProperties = {
    padding: "0.45rem 0.6rem",
    fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase",
    color: "var(--muted)", borderLeft: "1px solid var(--ink)",
    whiteSpace: "nowrap", overflow: "hidden",
};

export const driveRowCell: React.CSSProperties = {
    padding: "0.28rem 0.6rem", fontSize: "0.8rem", borderLeft: "1px solid var(--ink)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};
