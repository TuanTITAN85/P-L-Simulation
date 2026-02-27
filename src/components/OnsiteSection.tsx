import type { PhaseData, PhasePLResult } from "../types";
import type { TranslationType } from "../i18n/translations";
import { Inp, SummaryRow } from "./ui";

interface OnsiteSectionProps {
  phaseKey: string;
  phaseData: PhaseData | undefined;
  pl: PhasePLResult;
  updField: (phaseKey: string, field: string, val: unknown) => void;
  t: TranslationType;
}

export const OnsiteSection = ({ phaseKey, phaseData, pl, updField, t }: OnsiteSectionProps) => (
  <div className="space-y-4">
    <p className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">💡 Costs at other OBs</p>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-xs text-gray-500 mb-1 block">{t.calEffortEMP} (MM)</label><Inp type="number" value={phaseData?.onsiteCeEMP} onChange={v => updField(phaseKey, "onsiteCeEMP", v)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.calEffortAPP} (MM)</label><Inp type="number" value={phaseData?.onsiteCeAPP} onChange={v => updField(phaseKey, "onsiteCeAPP", v)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.unitSalEMP}</label><Inp type="number" value={phaseData?.onsiteUnitSalEMP} onChange={v => updField(phaseKey, "onsiteUnitSalEMP", v)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.unitSalAPP}</label><Inp type="number" value={phaseData?.onsiteUnitSalAPP} onChange={v => updField(phaseKey, "onsiteUnitSalAPP", v)} /></div>
      <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">{t.otherExp}</label><Inp type="number" value={phaseData?.onsiteOtherExp} onChange={v => updField(phaseKey, "onsiteOtherExp", v)} /></div>
    </div>
    <div className="rounded-xl border border-teal-800 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📊 {t.summary}</p>
      <div className="space-y-1 divide-y divide-gray-800">
        <SummaryRow label={t.unitSalEMP + " cost"} value={pl?.oEMP} />
        <SummaryRow label={t.unitSalAPP + " cost"} value={pl?.oAPP} />
        <SummaryRow label={t.otherExp} value={pl?.oOther} />
        <SummaryRow label={t.onsiteTotalCost} value={pl?.onsiteTotal} bold highlight />
      </div>
    </div>
  </div>
);
