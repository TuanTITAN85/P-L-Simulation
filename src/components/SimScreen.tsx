import { useState, useMemo } from "react";
import type { Project, Version, AdminConfig, SimData } from "../types";
import type { TranslationType } from "../i18n/translations";
import { SIM_TYPES } from "../constants/packages";
import { pct, mColor } from "../utils/helpers";
import { calcPhase } from "../utils/calculations";
import { PhasePanel } from "./PhasePanel";

interface SimScreenProps {
  project: Project;
  version: Version;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  admin: AdminConfig;
  onBack: () => void;
  t: TranslationType;
}

export const SimScreen = ({ project, version, setProjects, admin, onBack, t }: SimScreenProps) => {
  const [phase, setPhase] = useState<"planning" | "forecast">("planning");
  const d = version.data;
  const isForecastOK = ["monthly", "adhoc"].includes(version.type);

  const updSec = (pk: string, sk: string, field: string, val: unknown) => {
    setProjects(ps => ps.map(p => {
      if (p.id !== project.id) return p;
      const newVersions = p.versions.map(v => {
        if (v.id !== version.id) return v;
        const phaseData = v.data[pk as keyof SimData];
        const phaseDataAny = phaseData as unknown as Record<string, unknown>;
        const sectionData = phaseDataAny[sk];
        const section = typeof sectionData === "object" && sectionData !== null ? sectionData : {};
        return {
          ...v,
          data: {
            ...v.data,
            [pk]: { ...phaseData, [sk]: { ...(section as Record<string, unknown>), [field]: val } }
          }
        };
      });
      return { ...p, versions: newVersions };
    }));
  };

  const updField = (pk: string, field: string, val: unknown) => {
    setProjects(ps => ps.map(p => {
      if (p.id !== project.id) return p;
      const newVersions = p.versions.map(v => {
        if (v.id !== version.id) return v;
        return { ...v, data: { ...v.data, [pk]: { ...v.data[pk as keyof SimData], [field]: val } } };
      });
      return { ...p, versions: newVersions };
    }));
  };

  const planPL = useMemo(() => calcPhase(d?.planning, admin), [d?.planning, admin]);
  const fcPL   = useMemo(() => calcPhase(d?.forecast, admin),  [d?.forecast, admin]);
  const activePL = phase === "planning" ? planPL : fcPL;
  const tgt_g = admin.targetGrossMargin || 40;
  const tgt_d = admin.targetDirectMargin || 54;
  const stl = (key: string): string => SIM_TYPES.find(s => s.key === key)?.vi || key;

  const combinedFcMetrics = useMemo(() => {
    if (phase !== "forecast") return null;
    const planData = d?.planning;
    const primeEntries = project.actualData?.prime || [];
    const planOff = parseFloat(planData?.offshore?.billableMM || "") || 0;
    const planOns = parseFloat(planData?.onsite?.billableMM || "") || 0;
    const planOffRev = parseFloat(planData?.offshore?.wipRevenue || "") || 0;
    const planOnsRev = parseFloat(planData?.onsite?.wipRevenue || "") || 0;
    const actOffMM = primeEntries.reduce((s, e) => s + (e.offshoreActualMM || 0), 0);
    const actOnsMM = primeEntries.reduce((s, e) => s + (e.onsiteActualMM || 0), 0);
    const upOff = planOff > 0 ? planOffRev / planOff : 0;
    const upOns = planOns > 0 ? planOnsRev / planOns : 0;
    const actRevFromEntries = primeEntries.reduce((s, e) => s + (e.actualRevenue || 0), 0);
    const actCostFromEntries = primeEntries.reduce((s, e) => s + (e.actualDirectCost || 0), 0);
    const actRev = actRevFromEntries > 0 ? actRevFromEntries : actOffMM * upOff + actOnsMM * upOns;
    const planMM = planOff + planOns;
    const actMM = actOffMM + actOnsMM;
    const actDirectCost = actCostFromEntries > 0 ? actCostFromEntries : (planMM > 0 ? planPL.directCost * (actMM / planMM) : 0);
    const combinedRev = actRev + fcPL.totalRev;
    const combinedDirectCost = actDirectCost + fcPL.directCost;
    const combinedOverhead = combinedDirectCost / 9;
    const combinedDeliveryExpense = combinedDirectCost + combinedOverhead;
    const combinedDirectProfit = combinedRev - combinedDirectCost;
    const combinedDirectMargin = combinedRev > 0 ? (combinedDirectProfit / combinedRev) * 100 : 0;
    const combinedGP = combinedRev - combinedDeliveryExpense;
    const combinedGM = combinedRev > 0 ? (combinedGP / combinedRev) * 100 : 0;
    return { combinedGM, combinedDM: combinedDirectMargin };
  }, [phase, d?.planning, project.actualData, planPL, fcPL]);

  const displayGM = phase === "forecast" && combinedFcMetrics ? combinedFcMetrics.combinedGM : activePL.grossMargin;
  const displayDM = phase === "forecast" && combinedFcMetrics ? combinedFcMetrics.combinedDM : activePL.directMargin;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white">← {t.back}</button>
        <div className="flex-1 min-w-0">
          <span className="text-white font-semibold">{project.code} — {project.name}</span>
          <span className="text-gray-500 text-sm ml-2">{stl(version.type)} · {version.date}</span>
        </div>
        <div className="flex items-center gap-4">
          {([[t.grossMargin, displayGM, tgt_g], [t.directMargin, displayDM, tgt_d]] as const).map(([lb, v, tgt]) => (
            <div key={lb} className="text-center">
              <div className="text-xs text-gray-500">{lb}{phase === "forecast" && combinedFcMetrics ? " (combined)" : ""}</div>
              <div className={`text-lg font-black ${mColor(v, tgt)}`}>{pct(v)}%</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-950 px-6 pt-4 pb-0 flex gap-2">
        <button onClick={() => setPhase("planning")}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${phase === "planning" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>
          📋 {t.planningPhase}
        </button>
        {isForecastOK
          ? <button onClick={() => setPhase("forecast")}
              className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${phase === "forecast" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>
              🔭 {t.forecastPhase}
            </button>
          : <button disabled className="px-5 py-2.5 rounded-t-xl text-sm font-semibold text-gray-700 cursor-not-allowed">🔭 {t.forecastPhase}</button>
        }
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-900 border-t border-gray-800">
        <div className="p-5 max-w-5xl mx-auto">
          <PhasePanel
            phaseKey={phase} phaseData={d?.[phase]} pl={activePL}
            isForecast={phase === "forecast"} planData={d?.planning}
            actualData={project.actualData} updSec={updSec} updField={updField}
            admin={admin} t={t}
          />
        </div>
      </div>
    </div>
  );
};
