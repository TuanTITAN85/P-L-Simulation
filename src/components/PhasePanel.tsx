import { useState, useMemo } from "react";
import type { PhaseData, PhasePLResult, ActualEntry, AdminConfig } from "../types";
import type { TranslationType } from "../i18n/translations";
import { DEFAULT_LOCS, DEFAULT_OTHER_COST_CATS } from "../constants/defaults";
import { fmt } from "../utils/helpers";
import { calcPhase } from "../utils/calculations";
import { Inp, AutoField } from "./ui";
import { VNCostSection } from "./VNCostSection";
import { OnsiteSection } from "./OnsiteSection";
import { OtherCostsTab } from "./OtherCostsTab";
import { PLSummary } from "./PLSummary";

interface PhasePanelProps {
  phaseKey: string;
  phaseData: PhaseData | undefined;
  pl: PhasePLResult;
  isForecast: boolean;
  planData: PhaseData | undefined;
  actualData: { prime: ActualEntry[]; supplier: ActualEntry[] };
  updSec: (phaseKey: string, sk: string, field: string, val: unknown) => void;
  updField: (phaseKey: string, field: string, val: unknown) => void;
  admin: AdminConfig;
  t: TranslationType;
}

export const PhasePanel = ({ phaseKey, phaseData, pl, isForecast, planData, actualData, updSec, updField, admin, t }: PhasePanelProps) => {
  const [tab, setTab] = useState("info");
  const locs = admin.locations || DEFAULT_LOCS;
  const tgt_g = admin.targetGrossMargin || 40;
  const tgt_d = admin.targetDirectMargin || 54;
  const cats = admin.otherCostCats || DEFAULT_OTHER_COST_CATS;
  const currency = phaseData?.currency || "USD";

  const fcInfo = useMemo(() => {
    if (!isForecast) return null;
    const planOff = parseFloat(planData?.offshore?.billableMM || "") || 0;
    const planOns = parseFloat(planData?.onsite?.billableMM || "") || 0;
    const planOffRev = parseFloat(planData?.offshore?.wipRevenue || "") || 0;
    const planOnsRev = parseFloat(planData?.onsite?.wipRevenue || "") || 0;
    const primeEntries = actualData?.prime || [];
    const actOffMM = primeEntries.reduce((s, e) => s + (e.offshoreActualMM || 0), 0);
    const actOnsMM = primeEntries.reduce((s, e) => s + (e.onsiteActualMM || 0), 0);
    const fcOff = Math.max(0, planOff - actOffMM);
    const fcOns = Math.max(0, planOns - actOnsMM);
    const upOff = planOff > 0 ? planOffRev / planOff : 0;
    const upOns = planOns > 0 ? planOnsRev / planOns : 0;
    const actRevFromEntries = primeEntries.reduce((s, e) => s + (e.actualRevenue || 0), 0);
    const actCostFromEntries = primeEntries.reduce((s, e) => s + (e.actualDirectCost || 0), 0);
    const actRevEstimate = actOffMM * upOff + actOnsMM * upOns;
    return {
      fcOff, fcOns, offRev: (fcOff * upOff).toFixed(0), onsRev: (fcOns * upOns).toFixed(0),
      actOffMM, actOnsMM, upOff, upOns,
      actRevActual: actRevFromEntries > 0 ? actRevFromEntries : actRevEstimate,
      actRevHasData: actRevFromEntries > 0,
      actCostActual: actCostFromEntries,
      actCostHasData: actCostFromEntries > 0,
    };
  }, [isForecast, planData, actualData]);

  const planPL = useMemo(() => isForecast ? calcPhase(planData, admin) : null, [isForecast, planData, admin]);

  const combinedMetrics = useMemo(() => {
    if (!isForecast || !fcInfo || !planPL) return null;
    const actRev = fcInfo.actRevActual;
    const planMM = (parseFloat(planData?.offshore?.billableMM || "") || 0) + (parseFloat(planData?.onsite?.billableMM || "") || 0);
    const actMM = fcInfo.actOffMM + fcInfo.actOnsMM;
    const actDirectCostEstimate = planMM > 0 ? planPL.directCost * (actMM / planMM) : 0;
    const actDirectCost = fcInfo.actCostHasData ? fcInfo.actCostActual : actDirectCostEstimate;
    const combinedRev = actRev + pl.totalRev;
    const combinedDirectCost = actDirectCost + pl.directCost;
    const combinedOverhead = combinedDirectCost / 9;
    const combinedDeliveryExpense = combinedDirectCost + combinedOverhead;
    const combinedDirectProfit = combinedRev - combinedDirectCost;
    const combinedDirectMargin = combinedRev > 0 ? (combinedDirectProfit / combinedRev) * 100 : 0;
    const combinedGP = combinedRev - combinedDeliveryExpense;
    const combinedGM = combinedRev > 0 ? (combinedGP / combinedRev) * 100 : 0;
    return {
      actRev, actDirectCost, actRevHasData: fcInfo.actRevHasData, actCostHasData: fcInfo.actCostHasData,
      fcRev: pl.totalRev, fcDirectCost: pl.directCost,
      combinedRev, combinedDirectCost, combinedOverhead, combinedDeliveryExpense,
      combinedDirectProfit, combinedDirectMargin, combinedGP, combinedGM,
    };
  }, [isForecast, fcInfo, planPL, planData, pl]);

  const tabs = [
    { key: "info", label: t.projectInfo },
    { key: "prime", label: "🏢 Prime" },
    { key: "supplier", label: "🤝 Supplier" },
    { key: "onsite", label: "🏙️ Onsite" },
    { key: "other", label: `💡 ${t.otherCosts}` },
    { key: "pl", label: "📊 P&L" },
  ];

  return (
    <div>
      {isForecast && <div className="mb-4 px-4 py-3 bg-blue-950 border border-blue-800 rounded-xl text-xs text-blue-300">ℹ️ {t.forecastNote}</div>}
      <div className="flex gap-1 mb-4 overflow-x-auto bg-gray-800 rounded-xl p-1">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${tab === tb.key ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {tb.label}
          </button>
        ))}
      </div>
      {tab === "info" && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-sm font-bold text-indigo-400 mb-3">🌐 {t.offshoreTeam}</p>
            <div className="grid grid-cols-2 gap-3">
              {isForecast ? (
                <>
                  <AutoField label={`${t.billableMM} (remaining)`} value={fcInfo?.fcOff?.toFixed(2) || "—"} note={t.autoCalc} />
                  <AutoField label={t.wipRevenue} value={fmt(parseFloat(fcInfo?.offRev || "0"))} note={t.autoCalc} />
                </>
              ) : (
                <>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.billableMM}</label><Inp type="number" value={phaseData?.offshore?.billableMM} onChange={v => updField(phaseKey, "offshore", { ...phaseData?.offshore, billableMM: v })} /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.wipRevenue}</label><Inp type="number" value={phaseData?.offshore?.wipRevenue} onChange={v => updField(phaseKey, "offshore", { ...phaseData?.offshore, wipRevenue: v })} /></div>
                </>
              )}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm font-bold text-purple-400 mb-3">🏢 {t.onsiteTeam}</p>
            <div className="grid grid-cols-2 gap-3">
              {isForecast ? (
                <>
                  <AutoField label={`${t.billableMM} (remaining)`} value={fcInfo?.fcOns?.toFixed(2) || "—"} note={t.autoCalc} />
                  <AutoField label={t.wipRevenue} value={fmt(parseFloat(fcInfo?.onsRev || "0"))} note={t.autoCalc} />
                </>
              ) : (
                <>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.billableMM}</label><Inp type="number" value={phaseData?.onsite?.billableMM} onChange={v => updField(phaseKey, "onsite", { ...phaseData?.onsite, billableMM: v })} /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.wipRevenue}</label><Inp type="number" value={phaseData?.onsite?.wipRevenue} onChange={v => updField(phaseKey, "onsite", { ...phaseData?.onsite, wipRevenue: v })} /></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {tab === "prime" && <VNCostSection label={`🏢 ${t.costPrime}`} color="indigo" sk="prime" phaseKey={phaseKey} data={phaseData?.prime} pl={pl?.primePL} updSec={updSec} locations={locs} t={t} />}
      {tab === "supplier" && <VNCostSection label={`🤝 ${t.costSupplier}`} color="purple" sk="supplier" phaseKey={phaseKey} data={phaseData?.supplier} pl={pl?.supplierPL} updSec={updSec} locations={locs} t={t} />}
      {tab === "onsite" && <OnsiteSection phaseKey={phaseKey} phaseData={phaseData} pl={pl} updField={updField} t={t} />}
      {tab === "other" && <OtherCostsTab items={phaseData?.otherCosts || []} onChange={items => updField(phaseKey, "otherCosts", items)} cats={cats} t={t} />}
      {tab === "pl" && <PLSummary pl={pl} combinedMetrics={combinedMetrics} isForecast={isForecast} tgt_g={tgt_g} tgt_d={tgt_d} currency={currency} t={t} />}
    </div>
  );
};
