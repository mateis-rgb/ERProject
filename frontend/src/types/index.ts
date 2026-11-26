// Types frontend - miroir des types backend
export type UserRole = "ADMIN" | "EDITOR" | "VIEWER";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    budget: number | null;
    client: string;
    tags: string[];
    type: string;
    quotaBytes: number | null;
    encrypted: boolean; // drive chiffré at-rest (fixé à la création)
    createdById: string;
    createdAt: string;
    updatedAt: string;
    collaboratorIds: string[];

}

export interface StockItem {
    id: string;
    name: string;
    reference: string;
    quantity: number;
    unit: string;
    category: string;
    supplier: string;
    purchasePrice: number | null;
    location: string;
    minThreshold: number;
    imagePath: string | null;
    icon: string | null;
    createdAt: string;
    updatedAt: string;
}

export type MovementType = "IN" | "OUT" | "RETURN";

export interface StockMovement {
    id: string;
    stockItemId: string;
    projectId: string | null;
    userId: string;
    type: MovementType;
    quantity: number;
    reason: string;
    date: string;
    createdAt: string;
}

export interface ProjectStockLink {
    projectId: string;
    stockItemId: string;
    allocatedQuantity: number;
    consumedQuantity: number;
    forecastQuantity: number;
    forecastDate: string | null;
    milestoneId: string | null;
}

export interface DashboardKPIs {
    totalProjects: number;
    activeProjects: number;
    archivedProjects: number;
    milestonesTotal: number;
    milestonesOverdue: number;
    milestonesUpcoming: number;
    lowStockItems: number;
    reservedItems: number;
    totalStockItems: number;
    totalStockValue: number;
    timeThisMonth: number;
    timeTotal: number;
    usersCount: number;
}

export interface TimeEntry {
    id: string;
    userId: string;
    userName: string;
    hours: number;
    description: string;
    date: string;
}

export interface ActivityLog {
    id: string;
    action: string;
    details: string;
    timestamp: string;
    userName: string;
}

export interface Attachment {
    id: string;
    projectId: string;
    parentId: string | null;
    isFolder: boolean;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    uploadedByName: string;
}

export interface Milestone {
    parentId: string | null;
    id: string;
    projectId: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    color: string;
}

export interface MilestoneStockLink {
    milestoneId: string;
    stockItemId: string;
    stockName: string;
    stockReference: string;
    quantity: number;
}

export interface Availability {
    stockItemId: string;
    from?: string;
    to?: string;
    totalQuantity: number;
    reserved: number;
    available: number;
    reservations: Array<{ milestoneId: string | null; projectId: string; label: string; quantity: number }>;
}

export interface AvailabilityEntry {
    stockItemId: string;
    totalQuantity: number;
    reserved: number;
    available: number;
}

export type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export interface DriveUsage {
    usedBytes: number;
    quotaBytes: number | null;
}

export interface ProjectCollaborator {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface TemplateMilestone {
    name: string;
    description: string;
    offsetStartDays: number;
    durationDays: number;
    color: string;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    milestones: TemplateMilestone[];
    folders: string[];
    collaboratorIds: string[];
    createdAt: string;
    updatedAt: string;
}

// Planning global cross-projets (GET /api/planning)
export interface PlanningProject {
    id: string;
    name: string;
    status: string;
    startDate: string | null; // dates propres du projet (source de vérité de la barre)
    endDate: string | null;
}

export interface PlanningMilestone {
    id: string;
    projectId: string;
    projectName: string;
    projectStatus: string;
    name: string;
    startDate: string;
    endDate: string;
    color: string;
    parentId: string | null;
}

export interface ConflictSide {
    projectId: string;
    projectName: string;
    milestoneId: string;
    milestoneName: string;
}

export interface StockConflict {
    stockItemId: string;
    stockItemName: string;
    reference: string;
    quantity: number;
    overlapStart: string;
    overlapEnd: string;
    a: ConflictSide;
    b: ConflictSide;
}

export interface Planning {
    projects: PlanningProject[];
    milestones: PlanningMilestone[];
    conflicts: StockConflict[];
}

// Page détail d'un article (GET /api/stock/:id/details)
export interface StockReservation {
    projectId: string;
    projectName: string;
    milestoneId: string | null;
    milestoneName: string | null;
    allocatedQuantity: number;
    consumedQuantity: number;
    forecastQuantity: number;
    forecastDate: string | null;
}

export interface StockMovementDetail extends StockMovement {
    userName: string;
    projectName: string | null;
}

export interface StockItemDetails {
    item: StockItem;
    movements: StockMovementDetail[];
    reservations: StockReservation[];
    availability: AvailabilityEntry;
}

// Commentaires (projet/jalon ou article stock)
export interface Comment {
    id: string;
    projectId: string | null;   // null si commentaire d'article stock
    stockItemId: string | null; // null si commentaire de projet/jalon
    milestoneId: string | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

// Candidats @mention pour l'autocomplétion (GET /api/mention-candidates/...)
export interface MentionCandidate {
    id: string;
    name: string;
    email: string;
}

export interface MentionCandidates {
    users: MentionCandidate[];
    allowAll: boolean;
}

// Contexte d'une section de commentaires
export type CommentScope =
    | { kind: "project"; projectId: string; milestoneId: string | null }
    | { kind: "stock"; stockItemId: string };
