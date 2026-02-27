import type { VNSection, OtherCostItem, PhaseData, AdminConfig, PLResult, PhasePLResult, Location } from "../types";
import { PACKAGES } from "../constants/packages";
import { DEFAULT_LOCS } from "../constants/defaults";

export const calcSection = (
  sec: VNSection | undefined,
  salTable: Record<string, Record<string, string>> | undefined,
  insTable: Record<string, Record<string, string>> | undefined,
  ip: number,
  locs: Location[]
): PLResult => {
  const l = locs || DEFAULT_LOCS;
  let sEMP = 0, sAPP = 0, sIns = 0;
  l.forEach(loc => {
    PACKAGES.forEach(p => {
      const cE = parseFloat(sec?.ceEMP?.[loc.code]?.[p] || "") || 0;
      const cA = parseFloat(sec?.ceAPP?.[loc.code]?.[p] || "") || 0;
      const sal = parseFloat(salTable?.[loc.code]?.[p] || "") || 0;
      const ins = parseFloat(insTable?.[loc.code]?.[p] || "") || 0;
      sEMP += cE * sal; sAPP += cA * sal; sIns += cE * ins;
    });
  });
  const empCost = (1 + 0.08 + (ip / 100)) * sEMP;
  const appCost = sAPP;
  const insCost = sIns;
  const personnel = empCost + appCost;
  const otCamp = personnel * (parseFloat(String(sec?.otCampaignPct)) || 0) / 100;
  const xjob = parseFloat(sec?.xjob || "") || 0;
  const other = parseFloat(sec?.otherExp || "") || 0;
  const total = empCost + appCost + insCost + otCamp + xjob + other;
  return { empCost, appCost, insCost, otCamp, xjob, other, personnel, total };
};

export const calcOtherCosts = (items: OtherCostItem[]): number =>
  items.reduce((s, it) =>
    s + (parseFloat(it.unitPrice) || 0) * (parseFloat(it.qty) || 0) * (parseFloat(it.months) || 0), 0);

export const sumCE = (ce: Record<string, Record<string, string>> | undefined, locs: Location[]): number =>
  (locs || DEFAULT_LOCS).reduce((s, l) =>
    s + PACKAGES.reduce((ss, p) => ss + (parseFloat(ce?.[l.code]?.[p] || "") || 0), 0), 0);

export const calcPhase = (phase: PhaseData | undefined, admin: AdminConfig): PhasePLResult => {
  const locs = admin.locations || DEFAULT_LOCS;
  const ip = admin.projectIncomePct || 30;
  const pSal = admin.costRef?.Primer?.salary?.table || {};
  const sSal = admin.costRef?.Supplier?.salary?.table || {};
  const ins = admin.costRef?.Primer?.insurance?.table || {};
  const primePL = calcSection(phase?.prime, pSal, ins, ip, locs);
  const supplierPL = calcSection(phase?.supplier, sSal, ins, ip, locs);
  const oEMP = (parseFloat(phase?.onsiteCeEMP || "") || 0) * (parseFloat(phase?.onsiteUnitSalEMP || "") || 0);
  const oAPP = (parseFloat(phase?.onsiteCeAPP || "") || 0) * (parseFloat(phase?.onsiteUnitSalAPP || "") || 0);
  const oOther = parseFloat(phase?.onsiteOtherExp || "") || 0;
  const onsiteTotal = oEMP + oAPP + oOther;
  const otherCostsTotal = calcOtherCosts(phase?.otherCosts || []);
  const offRev = parseFloat(phase?.offshore?.wipRevenue || "") || 0;
  const onsRev = parseFloat(phase?.onsite?.wipRevenue || "") || 0;
  const totalRev = offRev + onsRev;
  const primeMM = sumCE(phase?.prime?.ceEMP, locs) + sumCE(phase?.prime?.ceAPP, locs);
  const supplierMM = sumCE(phase?.supplier?.ceEMP, locs) + sumCE(phase?.supplier?.ceAPP, locs);
  const onsiteMM = (parseFloat(phase?.onsiteCeEMP || "") || 0) + (parseFloat(phase?.onsiteCeAPP || "") || 0);
  const totalMM = primeMM + supplierMM + onsiteMM;
  const directCost = primePL.total + supplierPL.total + onsiteTotal + otherCostsTotal;
  const overheadCost = directCost / 9; // = directCost / 0.9 * 10%
  const deliveryExpense = directCost + overheadCost;
  const directProfit = totalRev - directCost;
  const directMargin = totalRev > 0 ? (directProfit / totalRev) * 100 : 0;
  const grossProfit = totalRev - deliveryExpense;
  const grossMargin = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;
  return {
    primePL, supplierPL, onsiteTotal, oEMP, oAPP, oOther, otherCostsTotal,
    offRev, onsRev, totalRev, totalMM,
    totalCost: directCost, directCost, overheadCost, deliveryExpense,
    directProfit, directMargin, grossProfit, grossMargin,
  };
};
