import { useMemo } from "react";
import type { VNSection, PLResult, Location } from "../types";
import type { TranslationType } from "../i18n/translations";
import { DEFAULT_LOCS } from "../constants/defaults";
import { fmt, analyzePyramid } from "../utils/helpers";
import { Inp, AutoField, SummaryRow } from "./ui";
import { CEMatrix } from "./CEMatrix";

interface VNCostSectionProps {
  label: string;
  color: string;
  sk: "prime" | "supplier";
  phaseKey: string;
  data: VNSection | undefined;
  pl: PLResult | undefined;
  updSec: (phaseKey: string, sk: string, field: string, val: unknown) => void;
  locations: Location[];
  t: TranslationType;
}

export const VNCostSection = ({ label, color, sk, phaseKey, data, pl, updSec, locations, t }: VNCostSectionProps) => {
  const locs = locations || DEFAULT_LOCS;
  const upd = (type: string, loc: string, pkg: string, val: string) => {
    const f = type === "EMP" ? "ceEMP" : "ceAPP";
    updSec(phaseKey, sk, f, { ...data?.[f], [loc]: { ...data?.[f]?.[loc], [pkg]: val } });
  };
  const bdr = color === "indigo" ? "border-indigo-800" : "border-purple-800";
  const bg = color === "indigo" ? "bg-indigo-950/30" : "bg-purple-950/30";
  const tc = color === "indigo" ? "text-indigo-300" : "text-purple-300";
  const empPyramid = useMemo(() => analyzePyramid(data?.ceEMP, locs), [data?.ceEMP, locs]);
  const appPyramid = useMemo(() => analyzePyramid(data?.ceAPP, locs), [data?.ceAPP, locs]);
  return (
    <div className={`rounded-xl border ${bdr} overflow-hidden`}>
      <div className={`px-5 py-3 ${bg} flex items-center justify-between`}>
        <span className={`text-sm font-bold ${tc}`}>{label}</span>
        <span className="text-xs text-gray-400">Total: <span className="text-white font-bold">{fmt(pl?.total)}</span></span>
      </div>
      <div className="p-5 space-y-4">
        <CEMatrix label={`${t.calEffortEMP} (MM)`} ceData={data?.ceEMP} onChange={(l, p, v) => upd("EMP", l, p, v)} locations={locs} t={t} />
        {empPyramid.status !== "info" && (
          <div className={`rounded-lg px-3 py-2 text-xs flex gap-2 items-start ${empPyramid.status === "warning" ? "bg-yellow-950/60 border border-yellow-700/60 text-yellow-300" : "bg-green-950/60 border border-green-700/60 text-green-300"}`}>
            <span className="shrink-0">🤖 AI:</span><span>{empPyramid.message}</span>
          </div>
        )}
        <CEMatrix label={`${t.calEffortAPP} (MM)`} ceData={data?.ceAPP} onChange={(l, p, v) => upd("APP", l, p, v)} locations={locs} t={t} />
        {appPyramid.status !== "info" && (
          <div className={`rounded-lg px-3 py-2 text-xs flex gap-2 items-start ${appPyramid.status === "warning" ? "bg-yellow-950/60 border border-yellow-700/60 text-yellow-300" : "bg-green-950/60 border border-green-700/60 text-green-300"}`}>
            <span className="shrink-0">🤖 AI:</span><span>{appPyramid.message}</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 bg-gray-800 rounded-xl p-4">
          <AutoField label={t.empSalaryCost} value={fmt(pl?.empCost)} note="auto" />
          <AutoField label={t.appSalaryCost} value={fmt(pl?.appCost)} note="auto" />
          <AutoField label={t.insurance} value={fmt(pl?.insCost)} note="auto" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">{t.otCampaignPct}</label><Inp type="number" value={data?.otCampaignPct} onChange={v => updSec(phaseKey, sk, "otCampaignPct", v)} placeholder="10" /></div>
          <AutoField label={t.otCampaignCost} value={fmt(pl?.otCamp)} note="auto" />
          <div><label className="text-xs text-gray-500 mb-1 block">{t.xjob}</label><Inp type="number" value={data?.xjob} onChange={v => updSec(phaseKey, sk, "xjob", v)} placeholder="0" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">{t.otherExp}</label><Inp type="number" value={data?.otherExp} onChange={v => updSec(phaseKey, sk, "otherExp", v)} placeholder="0" /></div>
        </div>
        <div className={`rounded-xl border ${bdr} p-4 mt-2`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📊 {t.summary}</p>
          <div className="space-y-1 divide-y divide-gray-800">
            <SummaryRow label={t.empSalaryCost} value={pl?.empCost} />
            <SummaryRow label={t.appSalaryCost} value={pl?.appCost} />
            <SummaryRow label={t.insurance} value={pl?.insCost} />
            <SummaryRow label={t.otCampaignCost} value={pl?.otCamp} />
            <SummaryRow label={t.xjob} value={pl?.xjob} />
            <SummaryRow label={t.otherExp} value={pl?.other} />
            <SummaryRow label={color === "indigo" ? t.primeTotalCost : t.supplierTotalCost} value={pl?.total} bold highlight />
          </div>
        </div>
      </div>
    </div>
  );
};
