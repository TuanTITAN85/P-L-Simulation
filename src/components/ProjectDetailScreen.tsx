import { useState } from "react";
import type { Project, AdminConfig } from "../types";
import type { TranslationType } from "../i18n/translations";
import { SIM_TYPES } from "../constants/packages";
import { DEFAULT_LOCS } from "../constants/defaults";
import { uid, today, defVersion, defSimData } from "../utils/helpers";
import { Inp, Sel, Card } from "./ui";
import { Badge } from "./Badge";
import { Toast } from "./Toast";
import { ActualDataScreen } from "./ActualDataScreen";

interface ProjectDetailScreenProps {
  project: Project;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onOpenSim: (projId: number, verId: number) => void;
  onOpenCompare: () => void;
  onBack: () => void;
  t: TranslationType;
  admin: AdminConfig;
}

export const ProjectDetailScreen = ({ project, setProjects, onOpenSim, onOpenCompare, onBack, t, admin }: ProjectDetailScreenProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newVer, setNewVer] = useState(defVersion());
  const [section, setSection] = useState("simulations");
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<Project>>({});
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const stl = (key: string): string => SIM_TYPES.find(s => s.key === key)?.vi || key;
  const startEditProject = () => { setEditDraft({ code: project.code, name: project.name, startDate: project.startDate, endDate: project.endDate, currency: project.currency, status: project.status }); setIsEditing(true); };
  const saveEditProject = () => { setProjects(ps => ps.map(p => p.id === project.id ? { ...p, ...editDraft } : p)); setIsEditing(false); showToast(t.savedOK); };
  const addVersion = () => {
    const locs = admin.locations || DEFAULT_LOCS;
    setProjects(ps => ps.map(p => p.id === project.id ? { ...p, versions: [...p.versions, { ...newVer, id: uid(), date: today(), data: defSimData(locs) }] } : p));
    setShowAdd(false); setNewVer(defVersion());
  };

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-800">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-2">← {t.back}</button>
        {!isEditing ? (
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-white">{project.name || "—"}</h2>
              <p className="text-sm text-gray-500">{project.code} · {project.startDate || "?"} → {project.endDate || "?"}</p>
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
              <button onClick={saveEditProject} className="px-4 py-2 bg-green-700 rounded-lg text-sm">💾 {t.save}</button>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
            </div>
          </div>
        )}
        <div className="flex gap-1">
          {[{ key: "simulations", label: `📋 ${t.simVersions}` }, { key: "actual", label: `📊 ${t.actualData}` }, { key: "compare", label: `⚖️ ${t.compare}` }].map(s => (
            <button key={s.key} onClick={() => s.key === "compare" ? onOpenCompare() : setSection(s.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${section === s.key ? "bg-gray-800 text-white" : "text-gray-500"}`}>{s.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {section === "simulations" && (
          <div className="p-6">
            <div className="flex justify-end mb-4">
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
                  <button onClick={addVersion} className="px-4 py-2 bg-green-700 rounded-lg text-sm">{t.save}</button>
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
                </div>
              </Card>
            )}
            {project.versions.length === 0 && <div className="text-center py-12 text-gray-600"><div className="text-4xl mb-2">📋</div><p>{t.noData}</p></div>}
            <div className="space-y-3">
              {project.versions.map((ver, idx) => {
                const tc: Record<string, string> = { bidding: "yellow", planning: "indigo", monthly: "green", adhoc: "gray" };
                return (
                  <div key={ver.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-600 w-6">v{idx + 1}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge label={stl(ver.type)} color={tc[ver.type] || "gray"} />
                          <span className="text-sm text-gray-400">{ver.date}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => onOpenSim(project.id, ver.id)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">{t.openSim}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {section === "actual" && <ActualDataScreen project={project} setProjects={setProjects} t={t} />}
      </div>
    </div>
  );
};
