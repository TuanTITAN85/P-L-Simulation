import type { PhasePLResult } from "../types";
import type { TranslationType } from "../i18n/translations";
import { fmt, pct, mColor } from "../utils/helpers";
import { SummaryRow } from "./ui";
import { MarginCard } from "./MarginCard";

interface CombinedMetrics {
  actRev: number;
  actDirectCost: number;
  actRevHasData: boolean;
  actCostHasData: boolean;
  fcRev: number;
  fcDirectCost: number;
  combinedRev: number;
  combinedDirectCost: number;
  combinedOverhead: number;
  combinedDeliveryExpense: number;
  combinedDirectProfit: number;
  combinedDirectMargin: number;
  combinedGP: number;
  combinedGM: number;
}

interface PLSummaryProps {
  pl: PhasePLResult;
  combinedMetrics: CombinedMetrics | null;
  isForecast: boolean;
  tgt_g: number;
  tgt_d: number;
  currency: string;
  t: TranslationType;
}

export const PLSummary = ({ pl, combinedMetrics, isForecast, tgt_g, tgt_d, currency, t }: PLSummaryProps) => (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {isForecast ? "📋 Forecast Remaining — P&L Summary" : "📋 P&L Summary"}
      </span>
      <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">{currency}</span>
    </div>

    {/* Revenue */}
    <div className="bg-gray-800/60 rounded-xl p-4">
      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">💰 Revenue</p>
      <div className="grid grid-cols-3 gap-3 mb-2">
        {([["Offshore", pl?.offRev, "blue"], ["Onsite", pl?.onsRev, "purple"], [t.totalRevenue, pl?.totalRev, "white"]] as const).map(([lb, v, c]) => (
          <div key={lb} className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{lb}</p>
            <p className={`text-base font-bold text-${c}-400`}>${fmt(v)}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Calendar Effort */}
    <div className="bg-gray-800/60 rounded-xl p-4">
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">📅 Calendar Effort</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Total Calendar Effort</span>
        <span className="text-lg font-bold text-indigo-300">{pl?.totalMM?.toFixed(2) || "0.00"} MM</span>
      </div>
    </div>

    {/* Direct Delivery Expense */}
    <div className="bg-gray-800/60 rounded-xl p-4">
      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">📦 Direct Delivery Expense</p>
      <div className="space-y-1 divide-y divide-gray-700/60 mb-3">
        <SummaryRow label={t.primeTotalCost} value={pl?.primePL?.total} />
        <SummaryRow label={t.supplierTotalCost} value={pl?.supplierPL?.total} />
        <SummaryRow label={t.onsiteTotalCost} value={pl?.onsiteTotal} />
        <SummaryRow label={t.otherTotalCost} value={pl?.otherCostsTotal} />
        <SummaryRow label="Direct Delivery Expense" value={pl?.directCost} bold />
      </div>
      {/* Direct P&L */}
      <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
        {[
          { lb: t.totalRevenue,            val: pl?.totalRev,    cls: "text-blue-400" },
          { lb: "Direct Delivery Expense", val: pl?.directCost,  cls: "text-orange-400" },
          { lb: "Direct Profit",           val: pl?.directProfit, cls: (pl?.directProfit || 0) >= 0 ? "text-green-400" : "text-red-400" },
        ].map(r => (
          <div key={r.lb} className="flex justify-between pb-1.5 border-b border-gray-700/50">
            <span className="text-sm text-gray-400">{r.lb}</span>
            <span className={`font-bold ${r.cls}`}>${fmt(r.val)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-1">
          <span className="text-sm font-semibold text-gray-300">Direct Margin</span>
          <span className={`text-xl font-black ${mColor(pl?.directMargin || 0, tgt_d)}`}>{pct(pl?.directMargin)}%</span>
        </div>
      </div>
    </div>

    {/* Overhead & Delivery Expense */}
    <div className="bg-gray-800/60 rounded-xl p-4">
      <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-3">🏗️ Overhead & Delivery Expense</p>
      <div className="space-y-2">
        {[
          { lb: "Direct Delivery Expense",  val: pl?.directCost,      cls: "text-orange-400" },
          { lb: "Overhead Cost (÷0.9×10%)", val: pl?.overheadCost,   cls: "text-yellow-400" },
          { lb: "Delivery Expense (Total)",  val: pl?.deliveryExpense, cls: "text-white" },
        ].map(r => (
          <div key={r.lb} className="flex justify-between pb-1.5 border-b border-gray-700/50">
            <span className="text-sm text-gray-400">{r.lb}</span>
            <span className={`font-bold ${r.cls}`}>${fmt(r.val)}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Gross P&L */}
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
      <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">📊 Gross P&L</p>
      <div className="space-y-2">
        {[
          { lb: t.totalRevenue,    val: pl?.totalRev,       cls: "text-blue-400" },
          { lb: "Delivery Expense", val: pl?.deliveryExpense, cls: "text-orange-400" },
          { lb: t.grossProfit,     val: pl?.grossProfit,    cls: (pl?.grossProfit || 0) >= 0 ? "text-green-400" : "text-red-400" },
        ].map(r => (
          <div key={r.lb} className="flex justify-between pb-2 border-b border-gray-700/60">
            <span className="text-sm text-gray-400">{r.lb}</span>
            <span className={`font-bold ${r.cls}`}>${fmt(r.val)}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <MarginCard label={t.grossMargin} value={pl?.grossMargin || 0} target={tgt_g} t={t} />
      <MarginCard label={t.directMargin} value={pl?.directMargin || 0} target={tgt_d} t={t} />
    </div>

    {/* Combined Actual + Forecast Section (only in forecast phase) */}
    {isForecast && combinedMetrics && (
      <div className="mt-2 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">🔀 Tổng dự kiến (Actual + Forecast)</span>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">{currency}</span>
        </div>
        {/* Revenue breakdown */}
        <div className="bg-gray-900 rounded-xl border border-teal-800/50 overflow-hidden">
          <div className="px-4 py-2 bg-teal-950/40 border-b border-teal-800/40">
            <p className="text-xs font-semibold text-teal-400">Doanh thu ({currency})</p>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[
                { label: combinedMetrics.actRevHasData ? "Actual Revenue" : "Actual Revenue (est.)", val: combinedMetrics.actRev, cls: "text-emerald-400" },
                { label: "Forecast Revenue", val: combinedMetrics.fcRev, cls: "text-blue-400" },
                { label: "Tổng Revenue", val: combinedMetrics.combinedRev, cls: "text-white" },
              ].map(item => (
                <div key={item.label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${item.cls}`}>${fmt(item.val)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Direct Cost breakdown */}
        <div className="bg-gray-900 rounded-xl border border-orange-800/50 overflow-hidden">
          <div className="px-4 py-2 bg-orange-950/40 border-b border-orange-800/40">
            <p className="text-xs font-semibold text-orange-400">Direct Delivery Expense ({currency})</p>
          </div>
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: combinedMetrics.actCostHasData ? "Actual Cost" : "Actual Cost (est.)", val: combinedMetrics.actDirectCost, cls: "text-orange-400" },
                { label: "Forecast Cost", val: combinedMetrics.fcDirectCost, cls: "text-yellow-400" },
                { label: "Tổng Direct Cost", val: combinedMetrics.combinedDirectCost, cls: "text-white" },
              ].map(item => (
                <div key={item.label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${item.cls}`}>${fmt(item.val)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="text-xs text-gray-500">Overhead (÷0.9×10%)</span>
              <span className="text-sm font-semibold text-yellow-400">${fmt(combinedMetrics.combinedOverhead)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400 font-semibold">Delivery Expense (Total)</span>
              <span className="text-sm font-bold text-white">${fmt(combinedMetrics.combinedDeliveryExpense)}</span>
            </div>
            <p className="text-xs text-gray-600 pt-1">* Actual cost ước tính theo tỷ lệ Actual MM / Planning MM × Planning Direct Cost</p>
          </div>
        </div>
        {/* Combined P&L */}
        <div className="bg-gray-900 rounded-xl border border-teal-700/60 p-4 space-y-2">
          <p className="text-xs font-semibold text-teal-300 mb-3">Kết quả tổng hợp (Actual + Forecast)</p>
          {[
            { lb: "Tổng Revenue",                       val: combinedMetrics.combinedRev,             cls: "text-blue-400" },
            { lb: "Direct Delivery Expense",             val: combinedMetrics.combinedDirectCost,      cls: "text-orange-400" },
            { lb: "Direct Profit",                       val: combinedMetrics.combinedDirectProfit,    cls: combinedMetrics.combinedDirectProfit >= 0 ? "text-green-300" : "text-red-400" },
            { lb: "Delivery Expense (incl. overhead)",   val: combinedMetrics.combinedDeliveryExpense, cls: "text-yellow-400" },
            { lb: "Gross Profit",                        val: combinedMetrics.combinedGP,              cls: combinedMetrics.combinedGP >= 0 ? "text-green-400" : "text-red-400" },
          ].map(row => (
            <div key={row.lb} className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-sm text-gray-400">{row.lb}</span>
              <span className={`font-bold ${row.cls}`}>${fmt(row.val)}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="text-center">
              <p className="text-xs text-gray-500">Direct Margin</p>
              <p className={`text-lg font-black ${mColor(combinedMetrics.combinedDirectMargin, tgt_d)}`}>{pct(combinedMetrics.combinedDirectMargin)}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Gross Margin</p>
              <p className={`text-lg font-black ${mColor(combinedMetrics.combinedGM, tgt_g)}`}>{pct(combinedMetrics.combinedGM)}%</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MarginCard label="Combined Gross Margin" value={combinedMetrics.combinedGM} target={tgt_g} t={t} />
          <MarginCard label="Combined Direct Margin" value={combinedMetrics.combinedDirectMargin} target={tgt_d} t={t} />
        </div>
      </div>
    )}
  </div>
);
