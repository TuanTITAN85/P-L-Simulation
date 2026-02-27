import { useState } from "react";
import type { Project, AdminConfig } from "./types";
import { T } from "./i18n/translations";
import { defAdmin, defProject, uid } from "./utils/helpers";
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
  const activeProject = projects.find(p => p.id === activeProjId);
  const activeVersion = activeProject?.versions.find(v => v.id === activeVerId);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{ fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-white">📊 {t.appTitle}</h1>
          <div className="flex gap-1">
            {[{ key: "projects", icon: "📂", label: t.projects }, { key: "admin", icon: "⚙️", label: t.admin }].map(item => (
              <button key={item.key} onClick={() => setScreen(item.key)}
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
          <ProjectListScreen projects={projects} setProjects={setProjects}
            onOpenProject={id => { setActiveProjId(id); setScreen("project-detail"); }} t={t} />
        )}
        {screen === "project-detail" && activeProject && (
          <ProjectDetailScreen project={activeProject} setProjects={setProjects}
            onOpenSim={(pid, vid) => { setActiveProjId(pid); setActiveVerId(vid); setScreen("simulation"); }}
            onOpenCompare={() => setScreen("compare")}
            onBack={() => setScreen("projects")} t={t} admin={admin} />
        )}
        {screen === "simulation" && activeProject && activeVersion && (
          <SimScreen project={activeProject} version={activeVersion} setProjects={setProjects}
            admin={admin} onBack={() => setScreen("project-detail")} t={t} />
        )}
        {screen === "compare" && activeProject && (
          <CompareVersionsScreen project={activeProject} admin={admin}
            onBack={() => setScreen("project-detail")} t={t} />
        )}
        {screen === "admin" && (
          <AdminScreen config={admin} setConfig={setAdmin} t={t} />
        )}
      </div>
    </div>
  );
}

// Suppress unused imports — these are kept for potential future use
export type { Project, AdminConfig };
export { defProject, uid };
