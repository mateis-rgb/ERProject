// Catalogue des KPI du dashboard global - id, icône, libellé i18n, formatage (Power of 10 R4)
import { ReactNode } from "react";
import {
    FiActivity, FiAlertCircle, FiAlertTriangle, FiArchive, FiBox, FiBriefcase,
    FiClock, FiDollarSign, FiLayers, FiPackage, FiPlayCircle, FiUsers,
} from "react-icons/fi";
import { DashboardKPIs } from "../../types";

export interface KpiDef {
    id: string;
    labelKey: string;
    icon: ReactNode;
    accent: string;
    format: (k: DashboardKPIs) => string;
    warn?: (k: DashboardKPIs) => boolean;
    live?: (k: DashboardKPIs) => boolean;
    needsStockModule?: boolean;
}

export const KPI_CATALOG: KpiDef[] = [
    { id: "totalProjects", labelKey: "dashboard.kpiProjects", icon: <FiBriefcase />, accent: "var(--tally)", format: (k) => `${k.totalProjects}` },
    { id: "activeProjects", labelKey: "dashboard.kpiActive", icon: <FiActivity />, accent: "var(--green)", live: (k) => k.activeProjects > 0, format: (k) => `${k.activeProjects}` },
    { id: "archivedProjects", labelKey: "dashboard.kpiArchived", icon: <FiArchive />, accent: "var(--muted)", format: (k) => `${k.archivedProjects}` },
    { id: "milestonesTotal", labelKey: "dashboard.kpiMilestonesTotal", icon: <FiLayers />, accent: "var(--violet)", format: (k) => `${k.milestonesTotal}` },
    { id: "milestonesOverdue", labelKey: "dashboard.kpiOverdue", icon: <FiAlertCircle />, accent: "var(--danger)", warn: (k) => k.milestonesOverdue > 0, format: (k) => `${k.milestonesOverdue}` },
    { id: "milestonesUpcoming", labelKey: "dashboard.kpiUpcoming", icon: <FiPlayCircle />, accent: "var(--blue)", format: (k) => `${k.milestonesUpcoming}` },
    { id: "lowStockItems", labelKey: "stock.low", icon: <FiAlertTriangle />, accent: "var(--amber)", warn: (k) => k.lowStockItems > 0, needsStockModule: true, format: (k) => `${k.lowStockItems}` },
    { id: "reservedItems", labelKey: "dashboard.kpiReserved", icon: <FiPackage />, accent: "var(--blue)", needsStockModule: true, format: (k) => `${k.reservedItems}` },
    { id: "totalStockItems", labelKey: "dashboard.kpiStockItems", icon: <FiBox />, accent: "var(--pink)", needsStockModule: true, format: (k) => `${k.totalStockItems}` },
    { id: "totalStockValue", labelKey: "dashboard.kpiValue", icon: <FiDollarSign />, accent: "var(--green)", needsStockModule: true, format: (k) => `${k.totalStockValue.toFixed(0)} €` },
    { id: "timeThisMonth", labelKey: "dashboard.kpiTimeMonth", icon: <FiClock />, accent: "var(--violet)", format: (k) => `${k.timeThisMonth}h` },
    { id: "timeTotal", labelKey: "dashboard.kpiTimeTotal", icon: <FiClock />, accent: "var(--blue)", format: (k) => `${k.timeTotal}h` },
    { id: "usersCount", labelKey: "dashboard.kpiUsers", icon: <FiUsers />, accent: "var(--green)", format: (k) => `${k.usersCount}` },
];

export const ALL_KPI_IDS: string[] = KPI_CATALOG.map((k) => k.id);
