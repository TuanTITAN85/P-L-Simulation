import { useState, useEffect, useCallback, useMemo } from "react";
import type { AdminConfig, ReviewItem, VersionStatus } from "../types";
import type { TranslationType } from "../i18n/translations";
import { api } from "../api";
import { useUser } from "../context/UserContext";
import { PhasePanel } from "./PhasePanel";
import { calcPhase } from "../utils/calculations";
import { SIM_TYPES } from "../constants/packages";

export type ReviewMode = "sm" | "pmo" | "dcl";

// ─── Toast hook ───────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:       "bg-gray-700 text-gray-300",
  pending_sm:  "bg-yellow-900/70 text-yellow-300",
  pending_pmo: "bg-orange-900/70 text-orange-300",
  pending_dcl: "bg-blue-900/70 text-blue-300",
  approved:    "bg-green-900/70 text-green-300",
  rejected:    "bg-red-900/70 text-red-300",
};

function statusLabel(status: string, t: TranslationType): string {
  const map: Record<string, keyof TranslationType> = {
    draft:       "statusDraft",
    pending_sm:  "statusPendingSm",
    pending_pmo: "statusPendingPmo",
    pending_dcl: "statusPendingDcl",
    approved:    "statusApproved",
    rejected:    "statusRejected",
  };
  const key = map[status];
  return key ? (t[key] as string) : status;
}

function StatusBadge({ status, t }: { status: string; t: TranslationType }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? "bg-gray-700 text-gray-300"}`}>
      {statusLabel(status, t)}
    </span>
  );
}

function versionTypeLabel(type: string): string {
  return SIM_TYPES.find(s => s.key === type)?.vi || type;
}

// ─── Approval History (self-contained copy) ───────────────────────────────────

function ApprovalHistoryPanel({ history, t }: { history: ReviewItem["approvalHistory"]; t: TranslationType }) {
  const stepLabel: Record<string, string> = { SM: t.stepSm, PMO: t.stepPmo, DCL: t.stepDcl };
  const actionLabel: Record<string, string> = {
    approved: t.actionApproved,
    rejected: t.actionRejected,
    skipped:  t.actionSkipped,
  };
  const actionColor: Record<string, string> = {
    approved: "text-green-400",
    rejected: "text-red-400",
    skipped:  "text-gray-400",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">📜 {t.approvalHistoryTitle}</h3>
      {history.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-2">{t.noData}</p>
      ) : (
        <div className="space-y-2">
          {history.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 text-sm border-b border-gray-800/50 pb-2 last:border-0 last:pb-0">
              <span className="shrink-0 bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs font-medium">
                {stepLabel[entry.step] ?? entry.step}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-200 font-medium">{entry.userName}</span>
                  <span className={`text-xs font-medium ${actionColor[entry.action] ?? "text-gray-400"}`}>
                    {actionLabel[entry.action] ?? entry.action}
                    {entry.action === "skipped" && (
                      <span className="ml-1 text-gray-500" title={t.skippedTooltip}>ⓘ</span>
                    )}
                  </span>
                </div>
                {entry.comment && <p className="text-xs text-gray-400 mt-0.5 italic">"{entry.comment}"</p>}
              </div>
              <span className="text-xs text-gray-600 shrink-0 whitespace-nowrap">
                {new Date(entry.timestamp).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

interface RejectModalProps {
  t: TranslationType;
  loading: boolean;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

function RejectModal({ t, loading, onConfirm, onCancel }: RejectModalProps) {
  const [comment, setComment] = useState("");
  const tooShort = comment.trim().length > 0 && comment.trim().length < 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">❌ {t.rejectModalTitle}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <textarea
          rows={4}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={t.rejectCommentPlaceholder}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
          autoFocus
        />
        {tooShort && <p className="text-xs text-red-400 mt-1">{t.rejectCommentMinLength}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition">
            {t.cancel}
          </button>
          <button
            onClick={() => comment.trim().length >= 10 && onConfirm(comment.trim())}
            disabled={comment.trim().length < 10 || loading}
            className="px-5 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 rounded-lg text-sm font-medium transition"
          >
            {loading ? "Đang xử lý…" : t.confirmReject}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

interface DetailViewProps {
  item: ReviewItem;
  admin: AdminConfig;
  t: TranslationType;
  onBack: () => void;
  onActionDone: (item: ReviewItem) => void;
  showToast: (msg: string, ok?: boolean) => void;
}

function DetailView({ item, admin, t, onBack, onActionDone, showToast }: DetailViewProps) {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<"pl" | "history">("pl");
  const [phase, setPhase] = useState<"planning" | "forecast">("planning");
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const status = item.status;
  const isForecastOK = ["monthly", "adhoc"].includes(item.versionType);

  // Determine which action role applies right now
  const canActAsSM =
    status === "pending_sm" &&
    currentUser?.roles.includes("SM") &&
    !!(item.lineServiceId && currentUser?.managedLineServiceIds?.includes(item.lineServiceId));
  const canActAsPMO = status === "pending_pmo" && currentUser?.roles.includes("PMO");
  const canActAsDCL = status === "pending_dcl" && currentUser?.roles.includes("DCL");
  const canAct = canActAsSM || canActAsPMO || canActAsDCL;

  // Compute P&L results for readonly PhasePanel
  const planPL = useMemo(() => calcPhase(item.versionData?.planning, admin), [item.versionData, admin]);
  const fcPL   = useMemo(() => calcPhase(item.versionData?.forecast,  admin), [item.versionData, admin]);
  const activePL = phase === "planning" ? planPL : fcPL;

  const handleApprove = async () => {
    if (!window.confirm(t.confirmApprove)) return;
    setProcessing(true);
    try {
      await api.approveVersion(item.projectId, item.versionId);
      showToast(t.approveSuccess);
      onActionDone(item);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi khi approve.", false);
      setProcessing(false);
    }
  };

  const handleReject = async (comment: string) => {
    setProcessing(true);
    try {
      await api.rejectVersion(item.projectId, item.versionId, comment);
      showToast(t.rejectSuccess);
      setShowRejectModal(false);
      onActionDone(item);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi khi reject.", false);
      setProcessing(false);
    }
  };

  const fmtDateTime = (d: string | null) =>
    d ? new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div className="flex flex-col h-full">
      {showRejectModal && (
        <RejectModal
          t={t}
          loading={processing}
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-800 shrink-0">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-3 transition">
          ← {t.back}
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Project info */}
          <div>
            <h2 className="text-xl font-bold text-white">{item.projectName || "—"}</h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-500">
              <span className="font-mono text-indigo-400 text-sm">{item.projectCode}</span>
              {item.lineServiceName && (
                <span>🏢 <span className="text-gray-300">{item.lineServiceName}</span></span>
              )}
              {item.createdByName && (
                <span>👤 <span className="text-gray-300">{item.createdByName}</span></span>
              )}
              <span>🗓 <span className="text-gray-300">{fmtDateTime(item.submittedAt)}</span></span>
              <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                {versionTypeLabel(item.versionType)}
              </span>
              <StatusBadge status={status} t={t} />
            </div>
          </div>

          {/* Action buttons */}
          {canAct && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => void handleApprove()}
                disabled={processing}
                className="px-5 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-sm font-semibold transition"
              >
                {processing ? "…" : `✅ ${t.approveAction}`}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="px-5 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition"
              >
                ❌ {t.rejectAction}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {([
            { key: "pl",      label: `📊 ${t.plTab}` },
            { key: "history", label: `📜 ${t.historyTab} (${item.approvalHistory.length})` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        {activeTab === "pl" && (
          <>
            {/* Phase selector */}
            <div className="bg-gray-950 px-6 pt-4 pb-0 flex gap-2">
              <button onClick={() => setPhase("planning")}
                className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${
                  phase === "planning"
                    ? "bg-gray-900 border-gray-800 text-white"
                    : "bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"
                }`}>
                📋 {t.planningPhase}
              </button>
              {isForecastOK && (
                <button onClick={() => setPhase("forecast")}
                  className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${
                    phase === "forecast"
                      ? "bg-gray-900 border-gray-800 text-white"
                      : "bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"
                  }`}>
                  🔭 {t.forecastPhase}
                </button>
              )}
            </div>

            {/* Readonly P&L — readOnly prop disables inputs but keeps tabs clickable */}
            <div className="border-t border-gray-800">
              <div className="px-5 pt-3 pb-1">
                <span className="text-xs text-gray-600 italic">👁 {t.pendingReadonly}</span>
              </div>
              <div className="p-5 max-w-5xl mx-auto">
                <PhasePanel
                  phaseKey={phase}
                  phaseData={item.versionData?.[phase]}
                  pl={activePL}
                  isForecast={phase === "forecast"}
                  planData={item.versionData?.planning}
                  actualData={{ prime: [], supplier: [] }}
                  updSec={() => {}}
                  updField={() => {}}
                  admin={admin}
                  t={t}
                  readOnly
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="p-6 max-w-2xl mx-auto">
            <ApprovalHistoryPanel history={item.approvalHistory} t={t} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SM info helper (for PMO list) ────────────────────────────────────────────

function getSmStatus(item: ReviewItem): { skipped: boolean; approvedBy: string | null } {
  if (item.smSkipped) return { skipped: true, approvedBy: null };
  const entry = item.approvalHistory.find(h => h.step === "SM" && h.action === "approved");
  return { skipped: false, approvedBy: entry?.userName ?? null };
}

// ─── List View ────────────────────────────────────────────────────────────────

interface ListViewProps {
  mode: ReviewMode;
  items: ReviewItem[];
  t: TranslationType;
  onSelect: (item: ReviewItem) => void;
}

function ListView({ mode, items, t, onSelect }: ListViewProps) {
  const [lsFilter, setLsFilter] = useState("");

  const lineServices = Array.from(
    new Set(items.map(i => i.lineServiceName).filter((n): n is string => !!n)),
  );
  const filtered = lsFilter ? items.filter(i => i.lineServiceName === lsFilter) : items;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  const icon  = mode === "dcl" ? "✅" : "📋";
  const title = mode === "sm" ? t.reviewSmTitle : mode === "pmo" ? t.reviewPmoTitle : t.approveTitle;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">
          {icon} {title}
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({items.length})</span>
          )}
        </h1>

        {/* Line service filter (PMO + DCL, only when multiple options) */}
        {(mode === "pmo" || mode === "dcl") && lineServices.length > 1 && (
          <select value={lsFilter} onChange={e => setLsFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">{t.allLineServices}</option>
            {lineServices.map(ls => (
              <option key={ls} value={ls}>{ls}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-sm">{t.noVersionsPending}</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">{t.projectName}</th>
                <th className="text-left px-4 py-3">{t.projectCode}</th>
                <th className="text-left px-4 py-3">{t.lineService}</th>
                <th className="text-left px-4 py-3">{t.versionType}</th>
                <th className="text-left px-4 py-3">{t.pmCreator}</th>
                {mode === "pmo" && (
                  <th className="text-left px-4 py-3">{t.smApprovedBy}</th>
                )}
                <th className="text-left px-4 py-3">{t.submittedAtLabel}</th>
                <th className="text-right px-4 py-3">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const smSt = mode === "pmo" ? getSmStatus(item) : null;
                return (
                  <tr
                    key={`${item.projectId}-${item.versionId}`}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition"
                    onClick={() => onSelect(item)}
                  >
                    <td className="px-4 py-3 text-white font-medium">{item.projectName || "—"}</td>
                    <td className="px-4 py-3 text-indigo-400 font-mono">{item.projectCode || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{item.lineServiceName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                        {versionTypeLabel(item.versionType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{item.createdByName || "—"}</td>
                    {mode === "pmo" && (
                      <td className="px-4 py-3">
                        {smSt?.skipped ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700"
                            title={t.skippedTooltip}
                          >
                            {t.smSkippedTag}
                          </span>
                        ) : smSt?.approvedBy ? (
                          <span className="text-xs text-green-400">{smSt.approvedBy}</span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-400">{fmtDate(item.submittedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); onSelect(item); }}
                        className="text-xs px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg transition"
                      >
                        {t.view}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ReviewScreenProps {
  mode: ReviewMode;
  admin: AdminConfig;
  t: TranslationType;
  onActionDone: () => void;
}

export const ReviewScreen = ({ mode, admin, t, onActionDone }: ReviewScreenProps) => {
  const { toast, show: showToast } = useToast();
  const [items, setItems]       = useState<ReviewItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<ReviewItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      let data: ReviewItem[];
      if      (mode === "sm")  data = await api.getReviewPendingSm();
      else if (mode === "pmo") data = await api.getReviewPendingPmo();
      else                     data = await api.getReviewPendingDcl();
      setItems(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi tải dữ liệu.", false);
    } finally {
      setLoading(false);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadItems(); }, [loadItems]);

  const handleActionDone = useCallback((processed: ReviewItem) => {
    setItems(prev => prev.filter(
      i => !(i.versionId === processed.versionId && i.projectId === processed.projectId),
    ));
    setSelected(null);
    onActionDone();
  }, [onActionDone]);

  const ToastBanner = toast && (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border ${
      toast.ok
        ? "bg-green-950 text-green-200 border-green-800"
        : "bg-red-950 text-red-200 border-red-800"
    }`}>
      {toast.msg}
    </div>
  );

  if (selected) {
    return (
      <>
        {ToastBanner}
        <DetailView
          item={selected}
          admin={admin}
          t={t}
          onBack={() => setSelected(null)}
          onActionDone={handleActionDone}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <>
      {ToastBanner}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-500">Loading…</div>
      ) : (
        <ListView mode={mode} items={items} t={t} onSelect={setSelected} />
      )}
    </>
  );
};
