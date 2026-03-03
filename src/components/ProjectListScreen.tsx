import { useState } from "react";
import type { Project } from "../types";
import type { TranslationType } from "../i18n/translations";
import { defProject } from "../utils/helpers";
import { api } from "../api";
import { Inp, Card } from "./ui";
import { Badge } from "./Badge";

interface ProjectListScreenProps {
  projects: Project[];
  onReload: () => Promise<void>;
  onOpenProject: (id: number) => void;
  canImport?: boolean;
  onImport?: () => void;
  t: TranslationType;
}

export const ProjectListScreen = ({ projects, onReload, onOpenProject, canImport, onImport, t }: ProjectListScreenProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [np, setNp] = useState(defProject());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const sC = (s: string): string => s === "active" ? "green" : "yellow";
  const sL = (s: string): string => ({ active: t.active, completed: t.completed, onHold: t.onHold }[s] || s);

  const handleAdd = async () => {
    await api.createProject(np);
    setShowAdd(false);
    setNp(defProject());
    await onReload();
  };

  const handleDelete = async (id: number) => {
    await api.deleteProject(id);
    setConfirmDeleteId(null);
    await onReload();
  };

  const confirmTarget = confirmDeleteId !== null ? projects.find(p => p.id === confirmDeleteId) : null;

  return (
    <div className="p-6">
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-gray-900 border border-red-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3">🗑️</div>
            <h3 className="text-white font-bold mb-1">{t.del} dự án?</h3>
            <p className="text-sm text-gray-400 mb-1"><span className="text-indigo-400 font-medium">{confirmTarget.code}</span> — {confirmTarget.name}</p>
            <p className="text-xs text-red-400 mb-5">Toàn bộ phiên bản và dữ liệu actual sẽ bị xoá vĩnh viễn.</p>
            <div className="flex gap-3">
              <button
                onClick={() => void handleDelete(confirmDeleteId!)}
                className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium transition"
              >
                Xác nhận xoá
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{t.projectList}</h2>
        <div className="flex gap-2">
          {canImport && onImport && (
            <button onClick={onImport} className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm">📥 {t.importFromExcel}</button>
          )}
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">+ {t.addProject}</button>
        </div>
      </div>
      {showAdd && (
        <Card title={t.addProject} className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="text-xs text-gray-500 mb-1 block">{t.projectCode}</label><Inp value={np.code} onChange={v => setNp(p => ({ ...p, code: v }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.projectName}</label><Inp value={np.name} onChange={v => setNp(p => ({ ...p, name: v }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.startDate}</label><Inp type="date" value={np.startDate} onChange={v => setNp(p => ({ ...p, startDate: v }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.endDate}</label><Inp type="date" value={np.endDate} onChange={v => setNp(p => ({ ...p, endDate: v }))} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleAdd()} className="px-4 py-2 bg-green-700 rounded-lg text-sm">{t.save}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
          </div>
        </Card>
      )}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-600"><div className="text-5xl mb-3">📂</div><p>{t.noData}</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {[t.projectCode, t.projectName, t.startDate, t.simVersions, t.status, t.actions].map(h => <th key={h} className="text-left py-3 px-3 text-gray-500">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => (
                <tr key={proj.id} className="border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer" onClick={() => onOpenProject(proj.id)}>
                  <td className="py-3 px-3 text-indigo-400 font-medium">{proj.code || "—"}</td>
                  <td className="py-3 px-3 text-white">{proj.name || "—"}</td>
                  <td className="py-3 px-3 text-gray-400">{proj.startDate || "—"}</td>
                  <td className="py-3 px-3"><Badge label={`${proj.versions.length} v`} color="indigo" /></td>
                  <td className="py-3 px-3"><Badge label={sL(proj.status)} color={sC(proj.status)} /></td>
                  <td className="py-3 px-3 flex gap-1">
                    <button onClick={e => { e.stopPropagation(); onOpenProject(proj.id); }} className="text-xs px-3 py-1 bg-indigo-700 rounded-lg">{t.view}</button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(proj.id); }} className="text-xs px-2 py-1 bg-red-900 rounded-lg text-red-300">{t.del}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
