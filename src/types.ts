// All shared TypeScript interfaces for P&L Simulation Tool

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

export interface Project {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  status: string;
  versions: Version[];
  actualData: { prime: ActualEntry[]; supplier: ActualEntry[] };
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
