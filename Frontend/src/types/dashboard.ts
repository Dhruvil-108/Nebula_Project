// ─────────────────────────────────────────────────────────
// Dashboard data types — strictly typed by role view
// ─────────────────────────────────────────────────────────

export interface KpiCardData {
  id: string;
  title: string;
  value: string | number;
  /** Positive = growth, negative = decline, null = no trend */
  trendPercent: number | null;
  trendLabel: string;
  /** Icon name from lucide-react — used to look up the component */
  iconName: string;
  /** Tailwind color classes for the icon background and text */
  colorClasses: string;
  /** Optional sparkline data points */
  sparkline?: number[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface EmptyStateConfig {
  heading: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  iconName: string;
}

// ── Role-based dashboard view shapes ──

export interface ExecutiveDashboardData {
  viewType: 'executive';
  kpis: KpiCardData[];
  revenueChart: ChartDataPoint[];
  headcountChart: ChartDataPoint[];
}

export interface SalesDashboardData {
  viewType: 'sales';
  kpis: KpiCardData[];
  pipelineChart: ChartDataPoint[];
}

export interface HrDashboardData {
  viewType: 'hr';
  kpis: KpiCardData[];
  attendanceChart: ChartDataPoint[];
}

export interface FinanceDashboardData {
  viewType: 'finance';
  kpis: KpiCardData[];
  spendChart: ChartDataPoint[];
}

export interface InventoryDashboardData {
  viewType: 'inventory';
  kpis: KpiCardData[];
  stockChart: ChartDataPoint[];
}

export interface EmployeeDashboardData {
  viewType: 'employee';
  kpis: KpiCardData[];
}

export type DashboardData =
  | ExecutiveDashboardData
  | SalesDashboardData
  | HrDashboardData
  | FinanceDashboardData
  | InventoryDashboardData
  | EmployeeDashboardData;
