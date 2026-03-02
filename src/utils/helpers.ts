import type { Location, VNSection, PhaseData, SimData, OtherCostItem, CostRef, AdminConfig } from "../types";
import { PACKAGES } from "../constants/packages";
import { DEFAULT_LOCS, DEFAULT_ROLES, DEFAULT_CONTRACTS, DEFAULT_OTHER_COST_CATS } from "../constants/defaults";
import { buildTable, PRIMER_SAL, SUPPLIER_SAL, SHARED_INS } from "../constants/salaryTables";

export const fmt = (n: number | undefined | null): string =>
  new Intl.NumberFormat("en-US").format(Math.round(n || 0));

export const fmtN = (n: number | string | undefined | null): string => {
  if (!n && n !== 0) return "";
  const v = Number(n);
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
  if (v >= 1000) return (v / 1000).toFixed(0) + "K";
  return v.toString();
};

export const pct = (n: number | undefined | null): string =>
  isNaN(n as number) || !isFinite(n as number) ? "0.0" : Number(n).toFixed(1);

export const uid = (): number => Date.now() + Math.random();

export const today = (): string => new Date().toISOString().split("T")[0];

export const mColor = (m: number, tgt: number): string =>
  m >= tgt ? "text-green-400" : m >= tgt * 0.8 ? "text-yellow-400" : "text-red-400";

export const mBg = (m: number, tgt: number): string =>
  m >= tgt ? "bg-green-500" : m >= tgt * 0.8 ? "bg-yellow-500" : "bg-red-500";

// P9 = highest level (senior), P1 = lowest (junior). Pyramid: base(P1-P3) > belly(P4-P6) > top(P7-P9)
// Accepts both EMP and APP matrices and combines them for a complete team-level view.
export const analyzePyramid = (
  ceEMP: Record<string, Record<string, string>> | undefined,
  ceAPP: Record<string, Record<string, string>> | undefined,
  locs: Location[]
): { status: "ok" | "warning" | "info"; message: string } => {
  const totByPkg = PACKAGES.map(p =>
    (locs || DEFAULT_LOCS).reduce((s, l) =>
      s +
      (parseFloat(ceEMP?.[l.code]?.[p] || "") || 0) +
      (parseFloat(ceAPP?.[l.code]?.[p] || "") || 0), 0)
  );
  const grand = totByPkg.reduce((s, v) => s + v, 0);
  if (grand === 0) return { status: "info", message: "Chưa có dữ liệu effort để phân tích cơ cấu nguồn lực." };
  const base = totByPkg[0] + totByPkg[1] + totByPkg[2];
  const belly = totByPkg[3] + totByPkg[4] + totByPkg[5];
  const top = totByPkg[6] + totByPkg[7] + totByPkg[8];
  const topPct = grand > 0 ? (top / grand) * 100 : 0;
  const bellyPct = grand > 0 ? (belly / grand) * 100 : 0;
  const basePct = grand > 0 ? (base / grand) * 100 : 0;
  const warnings: string[] = [];
  if (top > belly) warnings.push(`Đỉnh tháp (P7-P9: ${top.toFixed(1)} MM) lớn hơn thân tháp (P4-P6: ${belly.toFixed(1)} MM)`);
  if (top > base) warnings.push(`Đỉnh tháp (P7-P9: ${top.toFixed(1)} MM) lớn hơn chân tháp (P1-P3: ${base.toFixed(1)} MM)`);
  if (topPct > 40) warnings.push(`Level cao (P7-P9) chiếm ${topPct.toFixed(0)}% tổng effort — quá cao`);
  if (warnings.length > 0) return {
    status: "warning",
    message: `⚠️ Cơ cấu nguồn lực chưa hợp lý: ${warnings.join("; ")}. Tỷ trọng hiện tại — Chân (P1-P3): ${basePct.toFixed(0)}% | Thân (P4-P6): ${bellyPct.toFixed(0)}% | Đỉnh (P7-P9): ${topPct.toFixed(0)}%. Cần điều chỉnh để đỉnh tháp < thân < chân tháp.`,
  };
  return {
    status: "ok",
    message: `✅ Cơ cấu nguồn lực hình tháp hợp lý — Chân (P1-P3): ${basePct.toFixed(0)}% | Thân (P4-P6): ${bellyPct.toFixed(0)}% | Đỉnh (P7-P9): ${topPct.toFixed(0)}%.`,
  };
};

export const defCE = (locs?: Location[]): Record<string, Record<string, string>> => {
  const m: Record<string, Record<string, string>> = {};
  (locs || DEFAULT_LOCS).forEach(l => {
    m[l.code] = {};
    PACKAGES.forEach(p => { m[l.code][p] = ""; });
  });
  return m;
};

export const defVN = (locs?: Location[]): VNSection => ({
  ceEMP: defCE(locs), ceAPP: defCE(locs), otCampaignPct: 10, xjob: "", otherExp: "",
});

export const defOtherCosts = (): OtherCostItem[] => [];

export const defPhase = (locs?: Location[]): PhaseData => ({
  offshore: { billableMM: "", wipRevenue: "" },
  onsite: { billableMM: "", wipRevenue: "" },
  currency: "USD",
  prime: defVN(locs), supplier: defVN(locs),
  onsiteCeEMP: "", onsiteCeAPP: "", onsiteUnitSalEMP: "", onsiteUnitSalAPP: "", onsiteOtherExp: "",
  otherCosts: defOtherCosts(),
});

export const defSimData = (locs?: Location[]): SimData => ({
  planning: defPhase(locs), forecast: defPhase(locs),
});

export const defProject = () => ({
  id: uid(), code: "", name: "", startDate: "", endDate: "", currency: "USD",
  status: "active", versions: [], actualData: { prime: [], supplier: [] },
});

export const defVersion = (type = "bidding") => ({
  id: uid(), type, date: today(), note: "", createdBy: "PM", data: defSimData(),
});

export const defCostRef = (): CostRef => ({
  Primer: {
    salary: { table: buildTable(PRIMER_SAL), unit: "USD", lastUpdated: today() },
    insurance: { table: buildTable(SHARED_INS), unit: "USD", lastUpdated: today() },
  },
  Supplier: {
    salary: { table: buildTable(SUPPLIER_SAL), unit: "USD", lastUpdated: today() },
    insurance: null,
  },
});

export const defAdmin = (): AdminConfig => ({
  targetGrossMargin: 40, targetDirectMargin: 54, projectIncomePct: 30,
  roles: [...DEFAULT_ROLES],
  contractTypes: [...DEFAULT_CONTRACTS],
  locations: DEFAULT_LOCS.map(l => ({ ...l, active: true })),
  costRef: defCostRef(),
  otherCostCats: [...DEFAULT_OTHER_COST_CATS],
});
