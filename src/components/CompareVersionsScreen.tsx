import { useState, useMemo } from "react";
import type { Project, AdminConfig } from "../types";
import type { TranslationType } from "../i18n/translations";
import { SIM_TYPES } from "../constants/packages";
import { fmt, pct, mColor } from "../utils/helpers";
import { calcPhase } from "../utils/calculations";
import { Sel, Card } from "./ui";

interface CompareVersionsScreenProps {
  project: Project;
  admin: AdminConfig;
  onBack: () => void;
  t: TranslationType;
  initialBaseId?: string;
  initialCompareId?: string;
}

export const CompareVersionsScreen = ({ project, admin, onBack, t, initialBaseId, initialCompareId }: CompareVersionsScreenProps) => {
  const [baseId, setBaseId] = useState(initialBaseId ?? "");
  const [compareId, setCompareId] = useState(initialCompareId ?? "");
  const [phaseType, setPhaseType] = useState<"planning" | "forecast">("planning");

  const versions = project.versions || [];
  const baseVer = versions.find(v => v.id.toString() === baseId);
  const compareVer = versions.find(v => v.id.toString() === compareId);

  const basePL    = useMemo(() => baseVer    ? calcPhase(baseVer.data?.[phaseType],    admin) : null, [baseVer,    phaseType, admin]);
  const comparePL = useMemo(() => compareVer ? calcPhase(compareVer.data?.[phaseType], admin) : null, [compareVer, phaseType, admin]);

  const stl = (key: string): string => SIM_TYPES.find(s => s.key === key)?.vi || key;

  const DiffCell = ({ base, compare, isPercent = false, inverse = false }: { base: number | undefined | null; compare: number | undefined | null; isPercent?: boolean; inverse?: boolean }) => {
    if (base == null || compare == null) return <span className="text-gray-600">—</span>;
    const diff = compare - base;
    const pctChange = base !== 0 ? ((diff / Math.abs(base)) * 100) : (diff !== 0 ? 100 : 0);
    const isPositive = inverse ? diff < 0 : diff > 0;
    const color = diff === 0 ? "text-gray-400" : isPositive ? "text-green-400" : "text-red-400";
    const arrow = diff === 0 ? "" : isPositive ? "↑" : "↓";
    return (
      <div className={`${color} font-medium`}>
        <span>{arrow} {isPercent ? pct(Math.abs(diff)) + "pp" : fmt(Math.abs(diff))}</span>
        <span className="text-xs ml-1 opacity-70">({pct(Math.abs(pctChange))}%)</span>
      </div>
    );
  };

  const metrics = basePL && comparePL ? [
    { key: "totalRev",     label: t.totalRevenue,       base: basePL.totalRev,          compare: comparePL.totalRev,          isPercent: false, inverse: false },
    { key: "totalCost",    label: t.totalCost,           base: basePL.totalCost,         compare: comparePL.totalCost,         inverse: true,    isPercent: false },
    { key: "primeCost",    label: t.primeTotalCost,      base: basePL.primePL?.total,    compare: comparePL.primePL?.total,    inverse: true,    isPercent: false },
    { key: "supplierCost", label: t.supplierTotalCost,   base: basePL.supplierPL?.total, compare: comparePL.supplierPL?.total, inverse: true,    isPercent: false },
    { key: "onsiteCost",   label: t.onsiteTotalCost,     base: basePL.onsiteTotal,       compare: comparePL.onsiteTotal,       inverse: true,    isPercent: false },
    { key: "otherCost",    label: t.otherTotalCost,      base: basePL.otherCostsTotal,   compare: comparePL.otherCostsTotal,   inverse: true,    isPercent: false },
    { key: "grossProfit",  label: t.grossProfit,         base: basePL.grossProfit,       compare: comparePL.grossProfit,       isPercent: false, inverse: false },
    { key: "grossMargin",  label: t.grossMargin,         base: basePL.grossMargin,       compare: comparePL.grossMargin,       isPercent: true,  inverse: false },
    { key: "directMargin", label: t.directMargin,        base: basePL.directMargin,      compare: comparePL.directMargin,      isPercent: true,  inverse: false },
  ] : [];

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-3 flex items-center gap-1">← {t.back}</button>
        <h2 className="text-xl font-bold text-white mb-1">📊 {t.compareVersions}</h2>
        <p className="text-sm text-gray-500">{project.code} — {project.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Version Selectors */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl border border-indigo-800 p-4">
              <label className="text-xs text-indigo-400 font-semibold mb-2 block">🅰️ {t.baseVersion}</label>
              <Sel value={baseId} onChange={setBaseId} options={[{ value: "", label: `-- ${t.selectVersion} --` }, ...versions.map((v, i) => ({ value: v.id.toString(), label: `v${i + 1} - ${stl(v.type)} (${v.date})` }))]} />
            </div>
            <div className="bg-gray-900 rounded-xl border border-purple-800 p-4">
              <label className="text-xs text-purple-400 font-semibold mb-2 block">🅱️ {t.compareWith}</label>
              <Sel value={compareId} onChange={setCompareId} options={[{ value: "", label: `-- ${t.selectVersion} --` }, ...versions.filter(v => v.id.toString() !== baseId).map(v => ({ value: v.id.toString(), label: `v${versions.indexOf(v) + 1} - ${stl(v.type)} (${v.date})` }))]} />
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <label className="text-xs text-gray-400 font-semibold mb-2 block">📋 {t.phase}</label>
              <Sel value={phaseType} onChange={(v) => setPhaseType(v as "planning" | "forecast")} options={[{ value: "planning", label: t.planning }, { value: "forecast", label: t.forecast }]} />
            </div>
          </div>

          {/* Comparison Table */}
          {(!baseId || !compareId) ? (
            <div className="text-center py-16 text-gray-600">
              <div className="text-5xl mb-4">⚖️</div>
              <p>{t.selectBothVersions}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t.totalRevenue, base: basePL?.totalRev,    compare: comparePL?.totalRev,    color: "blue",   inverse: false },
                  { label: t.totalCost,    base: basePL?.totalCost,   compare: comparePL?.totalCost,   color: "orange", inverse: true },
                  { label: t.grossProfit,  base: basePL?.grossProfit, compare: comparePL?.grossProfit, color: "green",  inverse: false },
                ].map(item => {
                  const diff = (item.compare || 0) - (item.base || 0);
                  const isPos = item.inverse ? diff < 0 : diff > 0;
                  return (
                    <div key={item.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                      <p className="text-xs text-gray-500 mb-2">{item.label}</p>
                      <div className="flex items-end justify-between">
                        <div><p className="text-xs text-gray-600">Base</p><p className={`text-lg font-bold text-${item.color}-400`}>{fmt(item.base)}</p></div>
                        <div className="text-2xl text-gray-700">→</div>
                        <div className="text-right"><p className="text-xs text-gray-600">Compare</p><p className={`text-lg font-bold text-${item.color}-400`}>{fmt(item.compare)}</p></div>
                      </div>
                      <div className={`mt-2 text-center text-sm font-semibold ${diff === 0 ? "text-gray-500" : isPos ? "text-green-400" : "text-red-400"}`}>
                        {diff === 0 ? t.noChange : isPos ? `↑ +${fmt(Math.abs(diff))}` : `↓ -${fmt(Math.abs(diff))}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Margin Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t.grossMargin,  base: basePL?.grossMargin  || 0, compare: comparePL?.grossMargin  || 0, target: admin.targetGrossMargin },
                  { label: t.directMargin, base: basePL?.directMargin || 0, compare: comparePL?.directMargin || 0, target: admin.targetDirectMargin },
                ].map(item => {
                  const diff = (item.compare || 0) - (item.base || 0);
                  return (
                    <div key={item.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                      <p className="text-xs text-gray-500 mb-3">{item.label}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center"><p className="text-xs text-indigo-400 mb-1">Base</p><p className={`text-2xl font-black ${mColor(item.base, item.target)}`}>{pct(item.base)}%</p></div>
                        <div className={`text-xl font-bold ${diff === 0 ? "text-gray-600" : diff > 0 ? "text-green-400" : "text-red-400"}`}>{diff === 0 ? "=" : `${diff > 0 ? "+" : ""}${pct(diff)}pp`}</div>
                        <div className="text-center"><p className="text-xs text-purple-400 mb-1">Compare</p><p className={`text-2xl font-black ${mColor(item.compare, item.target)}`}>{pct(item.compare)}%</p></div>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 flex"><div className="h-full bg-indigo-600/50" style={{ width: `${Math.min(item.base, 100)}%` }} /></div>
                        <div className="absolute inset-0 flex"><div className="h-full bg-purple-500/70 border-r-2 border-white" style={{ width: `${Math.min(item.compare, 100)}%` }} /></div>
                        <div className="absolute top-0 bottom-0 border-l-2 border-yellow-400" style={{ left: `${item.target}%` }} />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center">Target: {item.target}%</p>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Table */}
              <Card title={t.comparisonResult}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400">{t.metric}</th>
                        <th className="text-right py-3 px-4 text-indigo-400">🅰️ Base</th>
                        <th className="text-right py-3 px-4 text-purple-400">🅱️ Compare</th>
                        <th className="text-right py-3 px-4 text-gray-400">{t.difference}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(m => (
                        <tr key={m.key} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 text-gray-300 font-medium">{m.label}</td>
                          <td className="py-3 px-4 text-right text-indigo-300">{m.isPercent ? `${pct(m.base)}%` : fmt(m.base)}</td>
                          <td className="py-3 px-4 text-right text-purple-300">{m.isPercent ? `${pct(m.compare)}%` : fmt(m.compare)}</td>
                          <td className="py-3 px-4 text-right"><DiffCell base={m.base} compare={m.compare} isPercent={m.isPercent} inverse={m.inverse} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
