import { useState } from "react";
import type { Project } from "../types";
import type { TranslationType } from "../i18n/translations";
import { uid, defProject } from "../utils/helpers";
import { Inp, Card } from "./ui";
import { Badge } from "./Badge";

interface ProjectListScreenProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onOpenProject: (id: number) => void;
  t: TranslationType;
}

export const ProjectListScreen = ({ projects, setProjects, onOpenProject, t }: ProjectListScreenProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [np, setNp] = useState(defProject());
  const sC = (s: string): string => s === "active" ? "green" : "yellow";
  const sL = (s: string): string => ({ active: t.active, completed: t.completed, onHold: t.onHold }[s] || s);
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{t.projectList}</h2>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">+ {t.addProject}</button>
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
            <button onClick={() => { setProjects(ps => [...ps, { ...np, id: uid() }]); setShowAdd(false); setNp(defProject()); }} className="px-4 py-2 bg-green-700 rounded-lg text-sm">{t.save}</button>
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
                    <button onClick={e => { e.stopPropagation(); setProjects(ps => ps.filter(p => p.id !== proj.id)); }} className="text-xs px-2 py-1 bg-red-900 rounded-lg text-red-300">{t.del}</button>
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
