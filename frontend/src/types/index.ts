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
    milestonesOverdue: number;
    milestonesUpcoming: number;
    lowStockItems: number;
    reservedItems: number;
    totalStockValue: number;
    timeThisMonth: number;
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
    totalQuantity: number;
    reserved: number;
    available: number;
    reservations: Array<{ milestoneId: string; projectId: string; milestoneName: string; quantity: number }>;
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
