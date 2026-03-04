// All shared TypeScript interfaces for P&L Simulation Tool

// ─── Auth / RBAC ─────────────────────────────────────────────────────────────

export type AppRole = "pm" | "sm" | "pmo" | "dcl";

/** Legacy single-role user (old system — backward compat) */
export interface AppUser {
  email: string;
  displayName: string;
  role: AppRole;
}

/** New multi-role user (system_users based) */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  accountType: "local" | "sso";
  roles: Array<"PM" | "SM" | "PMO" | "DCL">;
  isPMO: boolean;
  managedLineServiceIds?: string[];
  dclTitle?: "DCL" | "Vice DCL";
}

export interface ManagedUser {
  id: number;
  email: string;
  displayName: string;
  role: AppRole;
  active: boolean;
  createdAt: string;
  assignedProjectIds: number[];
  assignedLineIds: number[];
}

/** Legacy organizational line (integer PK) */
export interface Line {
  id: number;
  code: string;
  name: string;
}

// ─── Phase 2: Line Services ──────────────────────────────────────────────────

export interface LineServiceManager {
  userId:   string;
  userName: string;
  email:    string;
}

export interface LineService {
  id:       string;
  name:     string;
  managers: LineServiceManager[];
}

// ─── Phase 2: PM / DCL / PMO users ──────────────────────────────────────────

export interface PmoUser {
  id:          string;
  name:        string;
  email:       string;
  accountType: string;
  status:      string;
  createdAt:   string;
}

export interface PmUser {
  id:           string;
  name:         string;
  email:        string;
  accountType:  string;
  status:       string;
  createdAt:    string;
  pmAssignedAt: string | null;
}

export interface DclUser {
  id:            string;
  name:          string;
  email:         string;
  accountType:   string;
  status:        string;
  createdAt:     string;
  dclTitle:      "DCL" | "Vice DCL";
  dclAssignedAt: string | null;
}

// ─── Phase 2: Master Projects ────────────────────────────────────────────────

export interface MasterProject {
  id:                 string;
  projectCode:        string;
  projectName:        string;
  projectDescription: string | null;
  startDate:          string | null;
  endDate:            string | null;
  projectType:        string | null;
  contractType:       string | null;
  projectManager:     string | null;
  importedAt:         string;
  importedBy:         string | null;
  hasPlanning:        boolean;
}

// ─── Phase 2: Workflow ────────────────────────────────────────────────────────

export type VersionStatus =
  | "draft"
  | "pending_sm"
  | "pending_pmo"
  | "pending_dcl"
  | "approved"
  | "rejected";

export interface ApprovalHistoryEntry {
  step:      "SM" | "PMO" | "DCL";
  userId:    string;
  userName:  string;
  action:    "approved" | "rejected" | "skipped";
  comment?:  string;
  timestamp: string;
}

// ─── Phase 2: Actual Data (new table) ────────────────────────────────────────

export interface ActualDataEntry {
  id:          string;
  projectCode: string;
  month:       string;
  costData:    unknown;
  importedAt:  string;
  importedBy:  string | null;
}

export interface ProjectImportRow {
  code?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  status?: string;
  lineCode?: string;
}

export interface Location {
  code: string;
  name: { vi: string; en: string };
  active?: boolean;
}

export interface CostRefItem {
  table: Record<string, Record<string, string>>;
  unit: string;
  lastUpdated: string;
}

export interface CostRef {
  Primer: { salary: CostRefItem; insurance: CostRefItem };
  Supplier: { salary: CostRefItem; insurance: null };
}

export interface AdminConfig {
  targetGrossMargin: number;
  targetDirectMargin: number;
  projectIncomePct: number;
  roles: string[];
  contractTypes: string[];
  locations: Location[];
  costRef: CostRef;
  otherCostCats: string[];
  lastUpdatedRoles?: string;
  lastUpdatedContracts?: string;
  lastUpdatedLocations?: string;
  lastUpdatedOtherCats?: string;
}

export interface OtherCostItem {
  id: number;
  category: string;
  unitPrice: string;
  qty: string;
  months: string;
  note: string;
}

export interface VNSection {
  ceEMP: Record<string, Record<string, string>>;
  ceAPP: Record<string, Record<string, string>>;
  otCampaignPct: number;
  xjob: string;
  otherExp: string;
}

export interface PhaseData {
  offshore: { billableMM: string; wipRevenue: string };
  onsite: { billableMM: string; wipRevenue: string };
  currency: string;
  prime: VNSection;
  supplier: VNSection;
  onsiteCeEMP: string;
  onsiteCeAPP: string;
  onsiteUnitSalEMP: string;
  onsiteUnitSalAPP: string;
  onsiteOtherExp: string;
  otherCosts: OtherCostItem[];
}

export interface SimData {
  planning: PhaseData;
  forecast: PhaseData;
}

export interface Version {
  id: number;
  type: string;
  date: string;
  note: string;
  createdBy: string;
  data: SimData;
  // Workflow fields (present in Phase 4 PM projects)
  status?: VersionStatus;
  smSkipped?: boolean;
  approvalHistory?: ApprovalHistoryEntry[];
  currentRejectionComment?: string | null;
  submittedAt?: string | null;
}

export interface ActualEntry {
  id: number;
  month: string;
  importedAt: string;
  rows: Record<string, string>[];
  fileName: string;
  selectedCodes: string[];    // project codes imported
  offshoreActualMM: number;   // from Billable MM column
  onsiteActualMM: number;
  actualRevenue: number;      // from WIP Revenue / FSU Revenue
  actualDirectCost: number;   // from Direct Cost (total column)
  calendarEffort: number;     // from Calendar Effort column
}

// ─── Phase 5: Review Queue ────────────────────────────────────────────────────

export interface ReviewItem {
  versionId: number;
  projectId: number;
  projectCode: string;
  projectName: string;
  lineServiceId: string | null;
  lineServiceName: string | null;
  versionType: string;
  createdByName: string | null;
  submittedAt: string | null;
  status: string;
  smSkipped: boolean;
  approvalHistory: ApprovalHistoryEntry[];
  versionData: SimData;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  status: string;
  lineId?: number | null;
  versions: Version[];
  actualData: { prime: ActualEntry[]; supplier: ActualEntry[] };
  // Phase 4 PM fields (optional — only present in PM-created projects)
  lineServiceId?: string | null;
  lineServiceName?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  masterProjectId?: string | null;
  projectType?: string | null;
  contractType?: string | null;
  projectDescription?: string | null;
}

export interface PLResult {
  empCost: number;
  appCost: number;
  insCost: number;
  otCamp: number;
  xjob: number;
  other: number;
  personnel: number;
  total: number;
}

export interface PhasePLResult {
  primePL: PLResult;
  supplierPL: PLResult;
  onsiteTotal: number;
  oEMP: number;
  oAPP: number;
  oOther: number;
  otherCostsTotal: number;
  offRev: number;
  onsRev: number;
  totalRev: number;
  totalMM: number;          // tổng Calendar Effort (MM)
  totalCost: number;        // = directCost (backward compat)
  directCost: number;       // Direct delivery expense
  overheadCost: number;     // directCost / 0.9 * 10% = directCost / 9
  deliveryExpense: number;  // directCost + overheadCost
  directProfit: number;     // totalRev - directCost
  directMargin: number;     // directProfit / totalRev (%)
  grossProfit: number;      // totalRev - deliveryExpense
  grossMargin: number;      // grossProfit / totalRev (%)
}
