import { useState, useMemo, useEffect } from "react";
import type { Project, Version, AdminConfig, SimData } from "../types";
import type { TranslationType } from "../i18n/translations";
import { SIM_TYPES } from "../constants/packages";
import { pct, mColor } from "../utils/helpers";
import { calcPhase } from "../utils/calculations";
import { api } from "../api";
import { PhasePanel } from "./PhasePanel";

interface SimScreenProps {
  project: Project;
  version: Version;
  onVersionSaved: (versionId: number, data: SimData) => void;
  onOpenCompare: (baseId: string) => void;
  admin: AdminConfig;
  onBack: () => void;
  t: TranslationType;
  /** Set true to enable PM workflow buttons (Submit, Clone from Bidding) */
  showWorkflow?: boolean;
  /** Set false to hide Save button and make screen view-only (e.g. SM role) */
  canEdit?: boolean;
  /** Called when version status changes (submit/clone) to update parent state */
  onVersionStatusChanged?: (versionId: number, updates: Partial<Version>) => void;
}

export const SimScreen = ({
  project, version, onVersionSaved, onOpenCompare, admin, onBack, t,
  showWorkflow = false, canEdit = true, onVersionStatusChanged,
}: SimScreenProps) => {
  // For monthly/adhoc: planning phase uses approved planning version data (read-only)
  const isMonthlyOrAdhoc = version.type === "monthly" || version.type === "adhoc";
  const approvedPlanVer = project.versions.find(v => v.type === "planning" && v.status === "approved");
  const planningReadOnly = isMonthlyOrAdhoc;

  const [phase, setPhase] = useState<"planning" | "forecast">("planning");
  const [localData, setLocalData] = useState<SimData>(() => {
    if (isMonthlyOrAdhoc && approvedPlanVer?.data) {
      return { ...version.data, planning: approvedPlanVer.data.planning };
    }
    return version.data;
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const status = version.status ?? "draft";
  const hasBidding = project.versions.some(v => v.type === "bidding");
  const isDraftEditable = status === "draft" || status === "rejected";
  const canClone  = showWorkflow && canEdit && version.type === "planning" && status === "draft" && hasBidding;

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleBack = () => {
    if (dirty) { setShowLeaveConfirm(true); } else { onBack(); }
  };

  const isForecastOK = ["monthly", "adhoc"].includes(version.type);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveVersion(version.id, localData);
      onVersionSaved(version.id, localData);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const result = await api.submitVersion(project.id, version.id);
      onVersionStatusChanged?.(version.id, {
        status: result.status as Version["status"],
        smSkipped: result.smSkipped,
        submittedAt: result.submittedAt,
      });
      setShowSubmitConfirm(false);
      onBack();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Lỗi khi submit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClone = async () => {
    if (!window.confirm(t.cloneConfirm)) return;
    setCloning(true);
    setActionError(null);
    try {
      const result = await api.cloneFromBidding(project.id, version.id);
      const newData = (typeof result.data === "string"
        ? JSON.parse(result.data as string)
        : result.data) as SimData;
      setLocalData(newData);
      setDirty(false);
      onVersionStatusChanged?.(version.id, { data: newData });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Lỗi khi clone.");
    } finally {
      setCloning(false);
    }
  };

  const updSec = (pk: string, sk: string, field: string, val: unknown) => {
    setLocalData(prev => {
      const phaseData = prev[pk as keyof SimData];
      const phaseDataAny = phaseData as unknown as Record<string, unknown>;
      const sectionData = phaseDataAny[sk];
      const section = typeof sectionData === "object" && sectionData !== null ? sectionData : {};
      return {
        ...prev,
        [pk]: { ...phaseData, [sk]: { ...(section as Record<string, unknown>), [field]: val } },
      };
    });
    setDirty(true);
  };

  const updField = (pk: string, field: string, val: unknown) => {
    setLocalData(prev => ({
      ...prev,
      [pk]: { ...prev[pk as keyof SimData], [field]: val },
    }));
    setDirty(true);
  };

  const planPL = useMemo(() => calcPhase(localData?.planning, admin), [localData?.planning, admin]);
  const fcPL   = useMemo(() => calcPhase(localData?.forecast, admin),  [localData?.forecast, admin]);
  const activePL = phase === "planning" ? planPL : fcPL;
  const tgt_g = admin.targetGrossMargin || 40;
  const tgt_d = admin.targetDirectMargin || 54;
  const stl = (key: string): string => SIM_TYPES.find(s => s.key === key)?.vi || key;

  const combinedFcMetrics = useMemo(() => {
    if (phase !== "forecast") return null;
    const planData = localData?.planning;
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
  }, [phase, localData?.planning, project.actualData, planPL, fcPL]);

  const displayGM = phase === "forecast" && combinedFcMetrics ? combinedFcMetrics.combinedGM : activePL.grossMargin;
  const displayDM = phase === "forecast" && combinedFcMetrics ? combinedFcMetrics.combinedDM : activePL.directMargin;

  return (
    <div className="flex flex-col h-full">
      {/* Submit confirm dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { if (!submitting) setShowSubmitConfirm(false); }}>
          <div className="bg-gray-900 border border-indigo-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3">🚀</div>
            <h3 className="text-white font-bold mb-1">{t.submitForReview}</h3>
            <p className="text-sm text-gray-400 mb-4">{t.submitConfirm}</p>
            {actionError && <p className="text-sm text-red-400 mb-3">{actionError}</p>}
            <div className="flex gap-3">
              <button onClick={() => void handleSubmit()} disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 rounded-lg text-sm font-medium transition">
                {submitting ? "…" : t.submitForReview}
              </button>
              <button onClick={() => { setShowSubmitConfirm(false); setActionError(null); }} disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave confirm dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowLeaveConfirm(false)}>
          <div className="bg-gray-900 border border-yellow-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3">⚠️</div>
            <h3 className="text-white font-bold mb-1">Có thay đổi chưa lưu</h3>
            <p className="text-sm text-gray-400 mb-5">Bạn có thay đổi chưa được lưu. Rời trang sẽ mất toàn bộ thay đổi.</p>
            <div className="flex gap-3">
              <button onClick={onBack} className="flex-1 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 rounded-lg text-sm font-medium transition">Rời trang</button>
              <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">Ở lại</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={handleBack} className="text-sm text-gray-500 hover:text-white shrink-0">← {t.back}</button>
        <div className="flex-1 min-w-0">
          <span className="text-white font-semibold">{project.code} — {project.name}</span>
          <span className="text-gray-500 text-sm ml-2">{stl(version.type)} · {version.date}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {([[t.grossMargin, displayGM, tgt_g], [t.directMargin, displayDM, tgt_d]] as const).map(([lb, v, tgt]) => (
            <div key={lb} className="text-center">
              <div className="text-xs text-gray-500">{lb}{phase === "forecast" && combinedFcMetrics ? " (combined)" : ""}</div>
              <div className={`text-lg font-black ${mColor(v, tgt)}`}>{pct(v)}%</div>
            </div>
          ))}
          {/* Clone from Bidding — only for planning versions */}
          {canClone && (
            <button onClick={() => void handleClone()} disabled={cloning}
              className="text-sm px-3 py-1.5 bg-amber-900/70 hover:bg-amber-800 disabled:opacity-50 rounded-lg text-amber-200 transition">
              {cloning ? "…" : `📋 ${t.cloneFromBidding}`}
            </button>
          )}
          {/* Submit for Review */}
          {showWorkflow && canEdit && isDraftEditable && (
            <button
              onClick={() => { if (!dirty) setShowSubmitConfirm(true); }}
              disabled={dirty}
              title={dirty ? t.saveThenSubmit : undefined}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
                dirty
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-700 hover:bg-indigo-600 text-white"
              }`}
            >
              🚀 {t.submitForReview}
            </button>
          )}
          <button
            onClick={() => onOpenCompare(version.id.toString())}
            className="text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition"
          >
            ⚖️ {t.compare}
          </button>
          {canEdit && (
            <button
              onClick={() => void handleSave()}
              disabled={!dirty || saving}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition ${dirty ? "bg-green-700 hover:bg-green-600 text-white" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
            >
              {saving ? "Đang lưu..." : dirty ? `💾 ${t.save}` : `✓ ${t.save}`}
            </button>
          )}
        </div>
      </div>

      {/* Phase tabs */}
      <div className="bg-gray-950 px-6 pt-4 pb-0 flex gap-2">
        <button onClick={() => setPhase("planning")}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${phase === "planning" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>
          📋 {t.planningPhase}{planningReadOnly ? " 🔒" : ""}
        </button>
        {isForecastOK && (
          <button onClick={() => setPhase("forecast")}
            className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${phase === "forecast" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>
            🔭 {t.forecastPhase}
          </button>
        )}
      </div>

      {/* Phase content */}
      <div className="flex-1 overflow-y-auto bg-gray-900 border-t border-gray-800">
        {planningReadOnly && phase === "planning" && (
          <div className="px-5 pt-3 pb-0 max-w-5xl mx-auto">
            <div className="text-xs text-yellow-600 bg-yellow-950/30 border border-yellow-800/50 rounded-lg px-3 py-2">
              🔒 {t.planningFromApproved}
            </div>
          </div>
        )}
        <div className="p-5 max-w-5xl mx-auto">
          <PhasePanel
            phaseKey={phase} phaseData={localData?.[phase]} pl={activePL}
            isForecast={phase === "forecast"} planData={localData?.planning}
            actualData={project.actualData} updSec={updSec} updField={updField}
            admin={admin} t={t}
            readOnly={phase === "planning" && planningReadOnly}
          />
        </div>
      </div>
    </div>
  );
};
