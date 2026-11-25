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

export interface PlanningDTO {
    milestones: PlanningMilestoneDTO[];
    conflicts: StockConflictDTO[];
}

export interface CommentDTO {
    id: string;
    projectId: string;
    milestoneId: string | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
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
