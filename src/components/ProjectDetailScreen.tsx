import { useState } from "react";
import type { Project, AdminConfig } from "../types";
import type { TranslationType } from "../i18n/translations";
import { SIM_TYPES } from "../constants/packages";
import { DEFAULT_LOCS } from "../constants/defaults";
import { today, defVersion, defSimData } from "../utils/helpers";
import { api } from "../api";
import { Inp, Sel, Card } from "./ui";
import { Badge } from "./Badge";
import { Toast } from "./Toast";
import { ActualDataScreen } from "./ActualDataScreen";

interface ProjectDetailScreenProps {
  project: Project;
  onReload: () => Promise<void>;
  onOpenSim: (projId: number, verId: number) => void;
  onOpenCompare: (base: string, compare: string) => void;
  onBack: () => void;
  t: TranslationType;
  admin: AdminConfig;
}

export const ProjectDetailScreen = ({ project, onReload, onOpenSim, onOpenCompare, onBack, t, admin }: ProjectDetailScreenProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newVer, setNewVer] = useState(defVersion());
  const [section, setSection] = useState("simulations");
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<Project>>({});
  const [compareSelected, setCompareSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const stl = (key: string): string => SIM_TYPES.find(s => s.key === key)?.vi || key;

  const handleBack = () => {
    if (isEditing && window.confirm("Bạn đang chỉnh sửa thông tin dự án. Rời trang sẽ mất thay đổi chưa lưu. Tiếp tục?")) {
      setIsEditing(false);
      onBack();
    } else if (!isEditing) {
      onBack();
    }
  };

  const startEditProject = () => {
    setEditDraft({ code: project.code, name: project.name, startDate: project.startDate, endDate: project.endDate, currency: project.currency, status: project.status });
    setIsEditing(true);
  };

  const saveEditProject = async () => {
    await api.patchProject(project.id, editDraft);
    setIsEditing(false);
    showToast(t.savedOK);
    await onReload();
  };

  const addVersion = async () => {
    const locs = admin.locations || DEFAULT_LOCS;
    await api.addVersion(project.id, { ...newVer, date: today(), data: defSimData(locs) });
    setShowAdd(false);
    setNewVer(defVersion());
    await onReload();
  };

  const toggleCompareSelect = (verId: string) => {
    setCompareSelected(prev =>
      prev.includes(verId)
        ? prev.filter(id => id !== verId)
        : prev.length < 2 ? [...prev, verId] : prev
    );
  };

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-800">
        <button onClick={handleBack} className="text-sm text-gray-500 hover:text-white mb-2">← {t.back}</button>
        {!isEditing ? (
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-white">{project.name || "—"}</h2>
              <p className="text-sm text-gray-500">{project.code} · {project.startDate ? project.startDate.slice(0, 10) : "?"} → {project.endDate ? project.endDate.slice(0, 10) : "?"}</p>
              <Badge label={({ active: t.active, completed: t.completed, onHold: t.onHold }[project.status] || project.status)} color={project.status === "active" ? "green" : "yellow"} />
            </div>
            <button onClick={startEditProject} className="px-3 py-1.5 bg-gray-700 rounded-lg text-sm">✏️ {t.editProject}</button>
          </div>
        ) : (
          <div className="mb-3 bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">{t.projectCode}</label><Inp value={editDraft.code} onChange={v => setEditDraft(d => ({ ...d, code: v }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t.projectName}</label><Inp value={editDraft.name} onChange={v => setEditDraft(d => ({ ...d, name: v }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t.startDate}</label><Inp type="date" value={editDraft.startDate} onChange={v => setEditDraft(d => ({ ...d, startDate: v }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t.endDate}</label><Inp type="date" value={editDraft.endDate} onChange={v => setEditDraft(d => ({ ...d, endDate: v }))} /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void saveEditProject()} className="px-4 py-2 bg-green-700 rounded-lg text-sm">💾 {t.save}</button>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
            </div>
          </div>
        )}
        <div className="flex gap-1">
          {[{ key: "simulations", label: `📋 ${t.simVersions}` }, { key: "actual", label: `📊 ${t.actualData}` }].map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${section === s.key ? "bg-gray-800 text-white" : "text-gray-500"}`}>{s.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {section === "simulations" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              {compareSelected.length === 2 ? (
                <button
                  onClick={() => onOpenCompare(compareSelected[0], compareSelected[1])}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition"
                >
                  ⚖️ {t.compare}
                </button>
              ) : (
                <p className="text-xs text-gray-600">
                  {compareSelected.length === 0
                    ? `Chọn 2 phiên bản để so sánh`
                    : `Đã chọn ${compareSelected.length}/2 — chọn thêm 1 phiên bản`}
                </p>
              )}
              <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">+ {t.addVersion}</button>
            </div>
            {showAdd && (
              <Card title={t.addVersion} className="mb-5">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.versionType}</label><Sel value={newVer.type} onChange={v => setNewVer(x => ({ ...x, type: v }))} options={SIM_TYPES.map(s => ({ value: s.key, label: stl(s.key) }))} /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.versionDate}</label><Inp type="date" value={newVer.date} onChange={v => setNewVer(x => ({ ...x, date: v }))} /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.createdBy}</label><Inp value={newVer.createdBy} onChange={v => setNewVer(x => ({ ...x, createdBy: v }))} /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void addVersion()} className="px-4 py-2 bg-green-700 rounded-lg text-sm">{t.save}</button>
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
                </div>
              </Card>
            )}
            {project.versions.length === 0 && <div className="text-center py-12 text-gray-600"><div className="text-4xl mb-2">📋</div><p>{t.noData}</p></div>}
            <div className="space-y-3">
              {project.versions.map((ver, idx) => {
                const tc: Record<string, string> = { bidding: "yellow", planning: "indigo", monthly: "green", adhoc: "gray" };
                const verId = ver.id.toString();
                const isSelected = compareSelected.includes(verId);
                const isDisabled = !isSelected && compareSelected.length >= 2;
                return (
                  <div key={ver.id} className={`bg-gray-900 border rounded-xl p-4 flex items-center justify-between transition ${isSelected ? "border-purple-600" : "border-gray-800"}`}>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => toggleCompareSelect(verId)}
                        className="w-4 h-4 accent-purple-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                      />
                      <span className="text-xs text-gray-600 w-5">v{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <Badge label={stl(ver.type)} color={tc[ver.type] || "gray"} />
                        <span className="text-sm text-gray-400">{ver.date}</span>
                      </div>
                    </div>
                    <button onClick={() => onOpenSim(project.id, ver.id)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">{t.openSim}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {section === "actual" && <ActualDataScreen project={project} onReload={onReload} t={t} />}
      </div>
    </div>
  );
};
