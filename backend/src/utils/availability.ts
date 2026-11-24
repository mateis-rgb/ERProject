// Règle de disponibilité du stock (Power of 10 : fonctions courtes, boucles bornées)
// Un article pris sur un projet est indisponible pendant la période de réservation :
//  - réservation sur jalon = [milestone.startDate, milestone.endDate]
//  - réservation sur le projet entier = [project.startDate, project.endDate] (bornes ouvertes si dates null)
//  - si un mouvement RETURN du même projet a lieu avant la fin de période, la réservation s'arrête à cette date
export interface ReservationLink {
    projectId: string;
    milestoneId: string | null;
    label: string; // nom du jalon ou du projet
    quantity: number;
    start: Date | null;
    end: Date | null;
}

export interface ReservationResult {
    reserved: number;
    blocking: ReservationLink[];
}

// Fin effective d'une réservation : tronquée à la date de retour si elle est avant la fin
export function effectiveEnd(link: ReservationLink, returnDate: Date | null): Date | null {
    if (returnDate !== null && (link.end === null || returnDate < link.end)) return returnDate;
    return link.end;
}

// Chevauchement entre une période [aStart, aEnd] (null = infini) et la plage [bStart, bEnd]
export function overlaps(aStart: Date | null, aEnd: Date | null, bStart: Date, bEnd: Date): boolean {
    if (aStart !== null && aStart > bEnd) return false;
    if (aEnd !== null && aEnd < bStart) return false;
    return true;
}

// Somme des quantités réservées bloquant la plage [from, to] (boucle bornée R2)
export function sumReserved(
    links: ReservationLink[],
    returnByProject: Map<string, Date>,
    from: Date,
    to: Date,
    max: number
): ReservationResult {
    let reserved = 0;
    const blocking: ReservationLink[] = [];
    const batch = links.slice(0, Math.min(links.length, max));
    for (const l of batch) {
        const end = effectiveEnd(l, returnByProject.get(l.projectId) ?? null);
        if (overlaps(l.start, end, from, to)) {
            reserved += l.quantity;
            blocking.push(l);
        }
    }
    return { reserved, blocking };
}

// Construit un ReservationLink depuis une ligne ProjectStock (avec milestone et project chargés)
export function toReservationLink(l: {
    projectId: string;
    milestoneId: string | null;
    allocatedQuantity: number;
    milestone: { name: string; startDate: Date; endDate: Date } | null;
    project: { name: string; startDate: Date | null; endDate: Date | null };
}): ReservationLink {
    if (l.milestone !== null) {
        return {
            projectId: l.projectId, milestoneId: l.milestoneId,
            label: l.milestone.name, quantity: l.allocatedQuantity,
            start: l.milestone.startDate, end: l.milestone.endDate,
        };
    }
    return {
        projectId: l.projectId, milestoneId: null,
        label: l.project.name, quantity: l.allocatedQuantity,
        start: l.project.startDate, end: l.project.endDate,
    };
}

// Construit la map projet -> date de retour la plus précoce par article
export function earliestReturnsByProject(
    returns: Array<{ projectId: string | null; date: Date }>,
    max: number
): Map<string, Date> {
    const out = new Map<string, Date>();
    const batch = returns.slice(0, Math.min(returns.length, max));
    for (const r of batch) {
        if (r.projectId === null) continue;
        const prev = out.get(r.projectId);
        if (prev === undefined || r.date < prev) out.set(r.projectId, r.date);
    }
    return out;
}
