// Types partagés backend - évite les déréférencements profonds (règle 9)
import { UserRole, MovementType } from "@prisma/client";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

export interface ProjectDTO {
    id: string;
    name: string;
    description: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    budget: number | null;
    client: string;
    tags: string[];
    type: string;
    quotaBytes: number | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    collaboratorIds: string[];
}

export interface StockItemDTO {
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
    createdAt: Date;
    updatedAt: Date;
}

export interface StockMovementDTO {
    id: string;
    stockItemId: string;
    projectId: string | null;
    userId: string;
    type: MovementType;
    quantity: number;
    reason: string;
    date: Date;
    createdAt: Date;
}

export interface ProjectStockDTO {
    projectId: string;
    stockItemId: string;
    allocatedQuantity: number;
    consumedQuantity: number;
    forecastQuantity: number;
    forecastDate: Date | null;
    milestoneId: string | null;
}

export interface AvailabilityEntry {
    stockItemId: string;
    totalQuantity: number;
    reserved: number;
    available: number;
}

export interface StockReservationDTO {
    projectId: string;
    projectName: string;
    milestoneId: string | null;
    milestoneName: string | null;
    allocatedQuantity: number;
    consumedQuantity: number;
    forecastQuantity: number;
    forecastDate: Date | null;
}

export interface StockItemDetailsDTO {
    item: StockItemDTO;
    movements: Array<StockMovementDTO & { userName: string; projectName: string | null }>;
    reservations: StockReservationDTO[];
    availability: AvailabilityEntry;
}

export interface PlanningMilestoneDTO {
    id: string;
    projectId: string;
    projectName: string;
    projectStatus: string;
    name: string;
    startDate: Date;
    endDate: Date;
    color: string;
    parentId: string | null;
}

export interface ConflictSideDTO {
    projectId: string;
    projectName: string;
    milestoneId: string;
    milestoneName: string;
}

export interface StockConflictDTO {
    stockItemId: string;
    stockItemName: string;
    reference: string;
    quantity: number;
    overlapStart: Date;
    overlapEnd: Date;
    a: ConflictSideDTO;
    b: ConflictSideDTO;
}

// Infos du projet lui-même (pour la ligne projet du planning global)
export interface PlanningProjectDTO {
    id: string;
    name: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
}

export interface PlanningDTO {
    projects: PlanningProjectDTO[];
    milestones: PlanningMilestoneDTO[];
    conflicts: StockConflictDTO[];
}

export interface CommentDTO {
    id: string;
    projectId: string | null;   // null si commentaire d'article stock
    stockItemId: string | null; // null si commentaire de projet/jalon
    milestoneId: string | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

// Candidats @mention pour l'autocomplétion (scope appliqué côté serveur)
export interface MentionCandidate {
    id: string;
    name: string;
    email: string;
}

export interface MentionCandidatesDTO {
    users: MentionCandidate[];
    allowAll: boolean; // @all autorisé dans ce contexte
}

export interface DashboardKPIs {
    totalProjects: number;
    activeProjects: number;
    milestonesOverdue: number;
    milestonesUpcoming: number;
    lowStockItems: number;
    reservedItems: number;
    totalStockValue: number;
    timeThisMonth: number;
}

export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string };
