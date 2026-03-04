import { useState, useEffect, useCallback } from "react";
import type { Project, Version, SimData, AdminConfig, MasterProject, LineService, ApprovalHistoryEntry } from "../types";
import type { TranslationType } from "../i18n/translations";
import { SIM_TYPES } from "../constants/packages";
import { DEFAULT_LOCS } from "../constants/defaults";
import { today, defVersion, defSimData } from "../utils/helpers";
import { api } from "../api";
import { useUser } from "../context/UserContext";
import { Badge } from "./Badge";
import { SimScreen } from "./SimScreen";
import { CompareVersionsScreen } from "./CompareVersionsScreen";
import { ActualDataScreen } from "./ActualDataScreen";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubScreen = "list" | "detail" | "sim" | "compare";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:        "bg-gray-700 text-gray-300",
  pending_sm:   "bg-yellow-900/70 text-yellow-300",
  pending_pmo:  "bg-orange-900/70 text-orange-300",
  pending_dcl:  "bg-blue-900/70 text-blue-300",
  approved:     "bg-green-900/70 text-green-300",
  rejected:     "bg-red-900/70 text-red-300",
};

function statusLabel(status: string, t: TranslationType): string {
  const map: Record<string, keyof TranslationType> = {
    draft:        "statusDraft",
    pending_sm:   "statusPendingSm",
    pending_pmo:  "statusPendingPmo",
    pending_dcl:  "statusPendingDcl",
    approved:     "statusApproved",
    rejected:     "statusRejected",
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

// ─── Toast hook ───────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

// ─── Add Project Modal ────────────────────────────────────────────────────────

interface AddProjectModalProps {
  t: TranslationType;
  currentUserName: string;
  onClose: () => void;
  onSaved: (project: Project) => void;
}

function AddProjectModal({ t, currentUserName, onClose, onSaved }: AddProjectModalProps) {
  const [masterProjects, setMasterProjects] = useState<MasterProject[]>([]);
  const [lineServices, setLineServices]     = useState<LineService[]>([]);
  const [selectedMp, setSelectedMp]         = useState<MasterProject | null>(null);
  const [mpSearch, setMpSearch]             = useState("");
  const [lineServiceId, setLineServiceId]   = useState("");
  const [currency, setCurrency]             = useState("USD");
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    Promise.all([api.getAvailableMasterProjects(), api.getLineServices()])
      .then(([mps, ls]) => { setMasterProjects(mps); setLineServices(ls); })
      .catch(() => setError("Không tải được dữ liệu. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = masterProjects.filter(mp =>
    !mpSearch ||
    mp.projectCode.toLowerCase().includes(mpSearch.toLowerCase()) ||
    mp.projectName.toLowerCase().includes(mpSearch.toLowerCase()),
  );

  const handleSave = async () => {
    if (!selectedMp) { setError("Vui lòng chọn dự án."); return; }
    if (!lineServiceId) { setError("Vui lòng chọn Line Service."); return; }
    setSaving(true);
    setError("");
    try {
      const proj = await api.createPmProject({
        masterProjectId: selectedMp.id,
        lineServiceId,
        currency,
      });
      onSaved(proj);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tạo dự án.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">➕ {t.createPmProject}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-4">
            {/* Master project search */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.selectMasterProject} *</label>
              <input
                type="text"
                value={mpSearch}
                onChange={e => setMpSearch(e.target.value)}
                placeholder={`${t.search} (mã / tên)…`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 mb-2 focus:outline-none focus:border-indigo-500"
              />
              <div className="max-h-44 overflow-y-auto border border-gray-700 rounded-lg divide-y divide-gray-800">
                {filtered.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">{t.noData}</div>
                ) : (
                  filtered.map(mp => (
                    <button key={mp.id} onClick={() => setSelectedMp(mp)}
                      className={`w-full text-left px-3 py-2.5 text-sm transition ${
                        selectedMp?.id === mp.id
                          ? "bg-indigo-900/60 text-indigo-200"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}>
                      <span className="font-mono text-indigo-400 mr-2">{mp.projectCode}</span>
                      <span>{mp.projectName}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Auto-fill readonly fields */}
            {selectedMp && (
              <div className="bg-gray-800/60 rounded-xl p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Thông tin dự án (tự động điền)</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">{t.projectCode}: </span><span className="text-white font-mono">{selectedMp.projectCode}</span></div>
                  <div><span className="text-gray-500">{t.projectName}: </span><span className="text-white">{selectedMp.projectName}</span></div>
                  <div><span className="text-gray-500">{t.startDate}: </span><span className="text-gray-300">{selectedMp.startDate ? selectedMp.startDate.slice(0, 10) : "—"}</span></div>
                  <div><span className="text-gray-500">{t.endDate}: </span><span className="text-gray-300">{selectedMp.endDate ? selectedMp.endDate.slice(0, 10) : "—"}</span></div>
                  {selectedMp.projectType && <div><span className="text-gray-500">{t.projectType}: </span><span className="text-gray-300">{selectedMp.projectType}</span></div>}
                  {selectedMp.contractType && <div><span className="text-gray-500">{t.contractType}: </span><span className="text-gray-300">{selectedMp.contractType}</span></div>}
                  {selectedMp.projectDescription && (
                    <div className="col-span-2"><span className="text-gray-500">{t.projectDescription}: </span><span className="text-gray-300">{selectedMp.projectDescription}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* PM inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.lineService} *</label>
                <select
                  value={lineServiceId}
                  onChange={e => setLineServiceId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">— Chọn Line Service —</option>
                  {lineServices.map(ls => (
                    <option key={ls.id} value={ls.id}>{ls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.currency}</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.createdByLabel}</label>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">{currentUserName}</div>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition">{t.cancel}</button>
              <button
                onClick={() => void handleSave()}
                disabled={saving || !selectedMp || !lineServiceId}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium transition"
              >
                {saving ? "Đang tạo…" : t.save}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Approval History ─────────────────────────────────────────────────────────

function ApprovalHistory({ history, t }: { history: ApprovalHistoryEntry[]; t: TranslationType }) {
  const stepLabel: Record<string, string> = {
    SM: t.stepSm, PMO: t.stepPmo, DCL: t.stepDcl,
  };
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
              <span className="shrink-0 bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs font-medium">{stepLabel[entry.step] ?? entry.step}</span>
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

// ─── Actual Data Tab ──────────────────────────────────────────────────────────


// ─── Version Item ─────────────────────────────────────────────────────────────

interface VersionItemProps {
  version: Version;
  projectId: number;
  canEdit: boolean;      // overall permission (SM=false)
  t: TranslationType;
  onOpenSim: (ver: Version) => void;
  onDeleted: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}

function VersionItem({ version, projectId, canEdit, t, onOpenSim, onDeleted, showToast }: VersionItemProps) {
  const status = version.status ?? "draft";
  const smSkipped = version.smSkipped ?? false;
  const history = version.approvalHistory ?? [];
  const rejComment = version.currentRejectionComment ?? null;
  const [deleting, setDeleting]     = useState(false);
  const [showHistAcc, setShowHistAcc] = useState(false);

  const canEditThis = canEdit && (status === "draft" || status === "rejected");
  const isPending = status === "pending_sm" || status === "pending_pmo" || status === "pending_dcl";
  const canDelete = canEdit && (status === "draft" || status === "rejected");

  const pendingWho: Record<string, string> = {
    pending_sm:  "SM",
    pending_pmo: "PMO",
    pending_dcl: "DCL",
  };

  const handleDelete = async () => {
    if (!window.confirm(t.confirmDeleteVersion)) return;
    setDeleting(true);
    try {
      await api.deletePmVersion(projectId, version.id);
      showToast(t.deleteVersionSuccess);
      onDeleted();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi khi xóa phiên bản.", false);
    } finally {
      setDeleting(false);
    }
  };

  const typeColors: Record<string, string> = {
    bidding: "yellow", planning: "indigo", monthly: "green", adhoc: "gray",
  };

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 space-y-3 ${status === "rejected" ? "border-red-800/60" : "border-gray-800"}`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={versionTypeLabel(version.type)} color={typeColors[version.type] ?? "gray"} />
          <span className="text-sm text-gray-400">{version.date}</span>
          <StatusBadge status={status} t={t} />
          {smSkipped && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700" title={t.skippedTooltip}>
              {t.smSkippedTag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEditThis ? (
            <button onClick={() => onOpenSim(version)}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-xs font-medium transition">
              ✏️ {t.openSim}
            </button>
          ) : (
            <button onClick={() => onOpenSim(version)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition">
              👁 {t.view}
            </button>
          )}
          {canDelete && (
            <button onClick={() => void handleDelete()} disabled={deleting}
              className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 disabled:opacity-50 rounded-lg text-xs text-red-300 transition">
              {deleting ? "…" : t.del}
            </button>
          )}
        </div>
      </div>

      {/* Rejected: show comment box */}
      {status === "rejected" && rejComment && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
          <p className="text-xs text-red-400 font-medium mb-1">❌ {t.rejectedCommentLabel}</p>
          <p className="text-sm text-red-200">"{rejComment}"</p>
        </div>
      )}

      {/* Pending: show waiting state */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="animate-pulse">⏳</span>
          <span>{t.waitingForLabel}: <span className="text-gray-300 font-medium">{pendingWho[status]}</span></span>
        </div>
      )}

      {/* Approval history accordion */}
      <div>
        <button onClick={() => setShowHistAcc(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition">
          {showHistAcc ? "▲" : "▼"} {t.approvalHistoryTitle} ({history.length})
        </button>
        {showHistAcc && (
          <div className="mt-2">
            <ApprovalHistory history={history} t={t} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Version Panel ────────────────────────────────────────────────────────

interface AddVersionPanelProps {
  project: Project;
  admin: AdminConfig;
  t: TranslationType;
  onAdded: () => void;
  onCancel: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}

function AddVersionPanel({ project, admin, t, onAdded, onCancel, showToast }: AddVersionPanelProps) {
  const existingTypes = new Set(project.versions.map(v => v.type));
  const hasApprovedPlanning = project.versions.some(v => v.type === "planning" && v.status === "approved");

  // Find first valid (non-disabled) type to use as default
  const firstValidType = (() => {
    for (const s of SIM_TYPES) {
      const isSingle = s.key === "bidding" || s.key === "planning";
      const needsApproval = s.key === "monthly" || s.key === "adhoc";
      const alreadyExists = isSingle && existingTypes.has(s.key);
      const blocked = needsApproval && !hasApprovedPlanning;
      if (!alreadyExists && !blocked) return s.key;
    }
    return SIM_TYPES[0].key;
  })();

  const [newVer, setNewVer] = useState(() => ({ ...defVersion(), type: firstValidType }));
  const [saving, setSaving] = useState(false);

  const addVersion = async () => {
    setSaving(true);
    try {
      const locs = admin.locations || DEFAULT_LOCS;
      await api.addVersion(project.id, { ...newVer, date: today(), data: defSimData(locs) });
      onAdded();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi khi tạo version.", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t.versionType}</label>
          <select
            value={newVer.type}
            onChange={e => setNewVer(x => ({ ...x, type: e.target.value }))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {SIM_TYPES.map(s => {
              const isSingle   = s.key === "bidding" || s.key === "planning";
              const needsApproval = s.key === "monthly" || s.key === "adhoc";
              const alreadyExists = isSingle && existingTypes.has(s.key);
              const blocked       = needsApproval && !hasApprovedPlanning;
              let tooltip = "";
              if (alreadyExists) tooltip = (t.versionTypeExistsFmt as string).replace("TYPE", s.vi);
              if (blocked)       tooltip = t.needProjectPlanningApproved;
              return (
                <option key={s.key} value={s.key} disabled={alreadyExists || blocked} title={tooltip}>
                  {s.vi}{alreadyExists ? " ✓" : blocked ? " 🔒" : ""}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t.versionDate}</label>
          <input type="date" value={newVer.date} onChange={e => setNewVer(x => ({ ...x, date: e.target.value }))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t.versionNote}</label>
          <input type="text" value={newVer.note} onChange={e => setNewVer(x => ({ ...x, note: e.target.value }))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            placeholder="Ghi chú…" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => void addVersion()} disabled={saving}
          className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-sm transition">
          {saving ? "Đang tạo…" : t.save}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
      </div>
    </div>
  );
}

// ─── Edit Line Service Modal ──────────────────────────────────────────────────

function EditLineServiceModal({
  project, t, onClose, onSaved,
}: {
  project: Project;
  t: TranslationType;
  onClose: () => void;
  onSaved: (lineServiceId: string, lineServiceName: string | null) => void;
}) {
  const [lineServices, setLineServices] = useState<LineService[]>([]);
  const [selected, setSelected]         = useState(project.lineServiceId ?? "");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    api.getLineServices()
      .then(setLineServices)
      .catch(() => setError("Không tải được Line Service."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!selected) { setError("Vui lòng chọn Line Service."); return; }
    setSaving(true);
    try {
      const result = await api.updateProjectLineService(project.id, selected);
      onSaved(result.lineServiceId, result.lineServiceName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">🏢 {t.editLineService}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        {loading ? (
          <div className="text-center py-6 text-gray-500 text-sm">Loading…</div>
        ) : (
          <div className="space-y-4">
            {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Chọn Line Service —</option>
              {lineServices.map(ls => (
                <option key={ls.id} value={ls.id}>{ls.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition">{t.cancel}</button>
              <button onClick={() => void handleSave()} disabled={saving || !selected}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium transition">
                {saving ? "…" : t.save}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Project Detail View ──────────────────────────────────────────────────────

interface DetailViewProps {
  project: Project;
  admin: AdminConfig;
  t: TranslationType;
  canEditVersions: boolean;
  canDeleteProject: boolean;
  onBack: () => void;
  onOpenSim: (ver: Version) => void;
  onRefresh: () => void;
  onProjectDeleted: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}

function DetailView({ project, admin, t, canEditVersions, canDeleteProject, onBack, onOpenSim, onRefresh, onProjectDeleted, showToast }: DetailViewProps) {
  const [tab, setTab]               = useState<"versions" | "actual">("versions");
  const [showAddVer, setShowAddVer] = useState(false);
  const [showEditLS, setShowEditLS] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [localProject, setLocalProject] = useState(project);

  // Keep localProject in sync when project prop updates
  useEffect(() => { setLocalProject(project); }, [project]);

  const latestStatus = localProject.versions.length > 0
    ? (localProject.versions[localProject.versions.length - 1].status ?? "draft")
    : null;

  const handleDeleteProject = async () => {
    if (!window.confirm(t.confirmDeleteProject)) return;
    setDeleting(true);
    try {
      await api.deletePmProject(localProject.id);
      showToast(t.deleteProjectSuccess);
      onProjectDeleted();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi khi xóa dự án.", false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {showEditLS && (
        <EditLineServiceModal
          project={localProject}
          t={t}
          onClose={() => setShowEditLS(false)}
          onSaved={(lsId, lsName) => {
            setLocalProject(p => ({ ...p, lineServiceId: lsId, lineServiceName: lsName }));
            onRefresh();
          }}
        />
      )}

      {/* Header */}
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-800">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-2 transition">← {t.back}</button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">{localProject.name || "—"}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-mono text-indigo-400">{localProject.code}</span>
              {" · "}{localProject.startDate ? localProject.startDate.slice(0, 10) : "?"} → {localProject.endDate ? localProject.endDate.slice(0, 10) : "?"}
              {" · "}{localProject.currency}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-500">
              <span className="flex items-center gap-1">
                🏢 <span className="text-gray-300">{localProject.lineServiceName || "—"}</span>
                {canEditVersions && (
                  <button onClick={() => setShowEditLS(true)}
                    className="ml-1 text-indigo-400 hover:text-indigo-300 transition text-xs"
                    title={t.editLineService}>
                    ✏️
                  </button>
                )}
              </span>
              {localProject.createdByName && (
                <span>👤 <span className="text-gray-300">{localProject.createdByName}</span></span>
              )}
              {localProject.projectType && <span className="text-gray-600">{localProject.projectType}</span>}
              {localProject.contractType && <span className="text-gray-600">{localProject.contractType}</span>}
              {latestStatus && <StatusBadge status={latestStatus} t={t} />}
            </div>
          </div>
          {canDeleteProject && (
            <button onClick={() => void handleDeleteProject()} disabled={deleting}
              className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 disabled:opacity-50 rounded-lg text-xs text-red-300 transition shrink-0">
              {deleting ? "…" : `🗑 ${t.deleteProject}`}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {[
            { key: "versions", label: `📋 ${t.simVersions}` },
            { key: "actual",   label: `📊 ${t.actualData}` },
          ].map(s => (
            <button key={s.key} onClick={() => setTab(s.key as typeof tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === s.key ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "versions" && (
          <div className="p-6 space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{localProject.versions.length} phiên bản</span>
              {canEditVersions && (
                <button onClick={() => setShowAddVer(v => !v)}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm transition">
                  + {t.addVersion}
                </button>
              )}
            </div>

            {showAddVer && canEditVersions && (
              <AddVersionPanel
                project={localProject}
                admin={admin}
                t={t}
                showToast={showToast}
                onAdded={() => { setShowAddVer(false); onRefresh(); }}
                onCancel={() => setShowAddVer(false)}
              />
            )}

            {localProject.versions.length === 0 && !showAddVer && (
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-2">📋</div>
                <p>{t.noData}</p>
              </div>
            )}

            <div className="space-y-3">
              {localProject.versions.map(ver => (
                <VersionItem
                  key={ver.id}
                  version={ver}
                  projectId={localProject.id}
                  canEdit={canEditVersions}
                  t={t}
                  onOpenSim={onOpenSim}
                  onDeleted={onRefresh}
                  showToast={showToast}
                />
              ))}
            </div>
          </div>
        )}
        {tab === "actual" && <ActualDataScreen project={localProject} onReload={async () => { onRefresh(); }} t={t} />}
      </div>
    </div>
  );
}

// ─── Project List View ────────────────────────────────────────────────────────

interface ListViewProps {
  projects: Project[];
  t: TranslationType;
  currentUserName: string;
  canCreate: boolean;
  showPmColumn: boolean;
  listTitle: string;
  onOpenProject: (p: Project) => void;
  onProjectAdded: (p: Project) => void;
}

function ListView({ projects, t, currentUserName, canCreate, showPmColumn, listTitle, onOpenProject, onProjectAdded }: ListViewProps) {
  const [showAdd, setShowAdd]           = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = projects.filter(p =>
    !statusFilter || (p.versions.at(-1)?.status ?? "draft") === statusFilter,
  );

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {showAdd && (
        <AddProjectModal
          t={t}
          currentUserName={currentUserName}
          onClose={() => setShowAdd(false)}
          onSaved={p => { onProjectAdded(p); setShowAdd(false); }}
        />
      )}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">📂 {listTitle}</h1>
        {canCreate && (
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
            + {t.createPmProject}
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          <option value="">{t.filterAllStatuses}</option>
          {["draft", "pending_sm", "pending_pmo", "pending_dcl", "approved", "rejected"].map(s => (
            <option key={s} value={s}>{statusLabel(s, t)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-5xl mb-3">📂</div>
          <p className="text-sm">{t.noData}</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">{t.projectCode}</th>
                <th className="text-left px-4 py-3">{t.projectName}</th>
                <th className="text-left px-4 py-3">{t.lineService}</th>
                {showPmColumn && <th className="text-left px-4 py-3">{t.projectManager}</th>}
                <th className="text-left px-4 py-3">{t.versionStatus}</th>
                <th className="text-left px-4 py-3">{t.startDate}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const latest = p.versions.at(-1);
                const latestStatus = latest?.status ?? "draft";
                return (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition"
                    onClick={() => onOpenProject(p)}>
                    <td className="px-4 py-3 text-indigo-400 font-mono font-medium">{p.code || "—"}</td>
                    <td className="px-4 py-3 text-white">{p.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{p.lineServiceName || "—"}</td>
                    {showPmColumn && (
                      <td className="px-4 py-3 text-gray-400">{p.createdByEmail ? p.createdByEmail.replace(/@fpt\.com$/i, "") : p.createdByName || "—"}</td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={latestStatus} t={t} />
                        {latest?.smSkipped && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                            {t.smSkippedTag}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fmt(p.startDate)}</td>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface PmProjectsScreenProps {
  admin: AdminConfig;
  t: TranslationType;
}

export const PmProjectsScreen = ({ admin, t }: PmProjectsScreenProps) => {
  const { currentUser } = useUser();
  const { toast, show: showToast } = useToast();

  const [subScreen, setSubScreen] = useState<SubScreen>("list");
  const [pmProjects, setPmProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeVersion, setActiveVersion] = useState<Version | null>(null);
  const [compareInitBase, setCompareInitBase] = useState<string | undefined>();
  const [loadingProjects, setLoadingProjects] = useState(true);

  const isPmoOrDcl = !!(currentUser?.roles.includes("PMO") || currentUser?.roles.includes("DCL"));
  const hasSM      = !isPmoOrDcl && (currentUser?.roles.includes("SM") ?? false);
  const canCreate  = currentUser?.roles.includes("PM") ?? false;
  const listTitle  = isPmoOrDcl ? t.allProjects : hasSM ? t.myLineProjects : t.myProjects;

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await api.getPmProjects();
      setPmProjects(data);
      // Keep activeProject in sync if it's open
      if (activeProject) {
        const refreshed = data.find(p => p.id === activeProject.id);
        if (refreshed) setActiveProject(refreshed);
      }
    } catch {
      showToast("Không tải được danh sách dự án.", false);
    } finally {
      setLoadingProjects(false);
    }
  }, [activeProject]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadProjects(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const Toast = toast ? (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border ${
      toast.ok ? "bg-green-950 text-green-200 border-green-800" : "bg-red-950 text-red-200 border-red-800"
    }`}>{toast.msg}</div>
  ) : null;

  // ── Compare sub-screen ─────────────────────────────────────────────────────
  if (subScreen === "compare" && activeProject) {
    return (
      <>
        {Toast}
        <CompareVersionsScreen
          project={activeProject}
          admin={admin}
          initialBaseId={compareInitBase}
          onBack={() => setSubScreen("sim")}
          t={t}
        />
      </>
    );
  }

  // ── Simulation sub-screen ──────────────────────────────────────────────────
  if (subScreen === "sim" && activeProject && activeVersion) {
    return (
      <>
        {Toast}
        <SimScreen
          project={activeProject}
          version={activeVersion}
          showWorkflow={canCreate}
          canEdit={!hasSM}
          onVersionSaved={(id, data) => {
            const updatedVer: Version = { ...activeVersion, data };
            setActiveVersion(updatedVer);
            setPmProjects(ps => ps.map(p => p.id === activeProject.id
              ? { ...p, versions: p.versions.map(v => v.id === id ? { ...v, data } : v) }
              : p,
            ));
            setActiveProject(prev => prev ? {
              ...prev,
              versions: prev.versions.map(v => v.id === id ? { ...v, data } : v),
            } : prev);
          }}
          onVersionStatusChanged={(id, updates) => {
            const merge = (v: Version) => v.id === id ? { ...v, ...updates } : v;
            setActiveVersion(prev => prev ? merge(prev) : prev);
            setPmProjects(ps => ps.map(p => p.id === activeProject.id
              ? { ...p, versions: p.versions.map(merge) }
              : p,
            ));
            setActiveProject(prev => prev
              ? { ...prev, versions: prev.versions.map(merge) }
              : prev,
            );
          }}
          onOpenCompare={base => { setCompareInitBase(base); setSubScreen("compare"); }}
          admin={admin}
          onBack={() => setSubScreen("detail")}
          t={t}
        />
      </>
    );
  }

  // ── Detail sub-screen ──────────────────────────────────────────────────────
  if (subScreen === "detail" && activeProject) {
    return (
      <>
        {Toast}
        <DetailView
          project={activeProject}
          admin={admin}
          t={t}
          canEditVersions={canCreate}
          canDeleteProject={canCreate || isPmoOrDcl}
          onBack={() => { setSubScreen("list"); setActiveProject(null); }}
          onOpenSim={ver => { setActiveVersion(ver); setSubScreen("sim"); }}
          onRefresh={async () => { await loadProjects(); }}
          onProjectDeleted={() => { setSubScreen("list"); setActiveProject(null); void loadProjects(); }}
          showToast={showToast}
        />
      </>
    );
  }

  // ── List sub-screen ────────────────────────────────────────────────────────
  return (
    <>
      {Toast}
      {loadingProjects ? (
        <div className="flex items-center justify-center py-24 text-gray-500">Loading…</div>
      ) : (
        <ListView
          projects={pmProjects}
          t={t}
          currentUserName={currentUser?.name || currentUser?.email || ""}
          canCreate={canCreate}
          listTitle={listTitle}
          showPmColumn={isPmoOrDcl || hasSM}
          onOpenProject={p => { setActiveProject(p); setSubScreen("detail"); }}
          onProjectAdded={p => {
            setPmProjects(ps => [p, ...ps]);
            showToast(t.addProjectSuccess);
          }}
        />
      )}
    </>
  );
};
