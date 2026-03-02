import { useState, useEffect, useCallback } from "react";
import type { Project, AdminConfig, SimData } from "./types";
import { T } from "./i18n/translations";
import { defAdmin } from "./utils/helpers";
import { api } from "./api";
import { ProjectListScreen } from "./components/ProjectListScreen";
import { ProjectDetailScreen } from "./components/ProjectDetailScreen";
import { SimScreen } from "./components/SimScreen";
import { CompareVersionsScreen } from "./components/CompareVersionsScreen";
import { AdminScreen } from "./components/AdminScreen";

export default function App() {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const t = T[lang];
  const [screen, setScreen] = useState("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [admin, setAdmin] = useState<AdminConfig>(defAdmin());
  const [activeProjId, setActiveProjId] = useState<number | null>(null);
  const [activeVerId, setActiveVerId] = useState<number | null>(null);
  const [compareInitialIds, setCompareInitialIds] = useState<{ base: string; compare: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminDirty, setAdminDirty] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjId);
  const activeVersion = activeProject?.versions.find(v => v.id === activeVerId);

  const reload = useCallback(async () => {
    try {
      const [ps, a] = await Promise.all([api.getProjects(), api.getAdmin()]);
      setProjects(ps);
      setAdmin(a);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const openCompare = useCallback((base: string, compare = "") => {
    setCompareInitialIds({ base, compare });
    setScreen("compare");
  }, []);

  // Keep parent state in sync after SimScreen explicit saves
  const onVersionSaved = useCallback((versionId: number, data: SimData) => {
    setProjects(ps => ps.map(p => ({
      ...p,
      versions: p.versions.map(v => v.id === versionId ? { ...v, data } : v),
    })));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{ fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/fpt-logo.png" alt="FPT Software" className="h-8 w-auto" />
          <h1 className="text-base font-bold text-white">📊 {t.appTitle}</h1>
          <div className="flex gap-1">
            {[{ key: "projects", icon: "📂", label: t.projects }, { key: "admin", icon: "⚙️", label: t.admin }].map(item => (
              <button key={item.key} onClick={() => {
                if (item.key !== "admin" && adminDirty) {
                  if (!window.confirm("Cấu hình Admin có thay đổi chưa lưu. Rời trang sẽ mất thay đổi. Tiếp tục?")) return;
                  setAdminDirty(false);
                }
                setScreen(item.key);
              }}
                className={`px-3 py-1.5 rounded text-sm font-medium ${(screen === item.key || (item.key === "projects" && ["project-detail", "simulation", "compare"].includes(screen))) ? "bg-gray-800 text-white" : "text-gray-500"}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {(["vi", "en"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded text-sm font-medium ${lang === l ? "bg-indigo-600 text-white" : "text-gray-500"}`}>
              {l === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Router */}
      <div className="flex-1 overflow-y-auto">
        {screen === "projects" && (
          <ProjectListScreen projects={projects} onReload={reload}
            onOpenProject={id => { setActiveProjId(id); setScreen("project-detail"); }} t={t} />
        )}
        {screen === "project-detail" && activeProject && (
          <ProjectDetailScreen project={activeProject} onReload={reload}
            onOpenSim={(pid, vid) => { setActiveProjId(pid); setActiveVerId(vid); setScreen("simulation"); }}
            onOpenCompare={(base, compare) => openCompare(base, compare)}
            onBack={() => setScreen("projects")} t={t} admin={admin} />
        )}
        {screen === "simulation" && activeProject && activeVersion && (
          <SimScreen project={activeProject} version={activeVersion}
            onVersionSaved={onVersionSaved}
            onOpenCompare={base => openCompare(base)}
            admin={admin} onBack={() => setScreen("project-detail")} t={t} />
        )}
        {screen === "compare" && activeProject && (
          <CompareVersionsScreen project={activeProject} admin={admin}
            initialBaseId={compareInitialIds?.base}
            initialCompareId={compareInitialIds?.compare}
            onBack={() => setScreen("project-detail")} t={t} />
        )}
        {screen === "admin" && (
          <AdminScreen config={admin}
            onSave={cfg => { setAdmin(cfg); api.saveAdmin(cfg).catch(console.error); }}
            onDirtyChange={setAdminDirty}
            t={t} />
        )}
      </div>
    </div>
  );
}
