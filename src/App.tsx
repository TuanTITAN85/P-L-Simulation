import { useState, useEffect, useCallback } from "react";
import type { Project, AdminConfig, SimData } from "./types";
import { T } from "./i18n/translations";
import { defAdmin } from "./utils/helpers";
import { api } from "./api";
import { UserProvider, useUser } from "./context/UserContext";
import { ProjectListScreen } from "./components/ProjectListScreen";
import { ProjectDetailScreen } from "./components/ProjectDetailScreen";
import { SimScreen } from "./components/SimScreen";
import { CompareVersionsScreen } from "./components/CompareVersionsScreen";
import { AdminScreen } from "./components/AdminScreen";
import { LoginScreen } from "./components/LoginScreen";
import { PermissionsScreen } from "./components/PermissionsScreen";
import { ProjectImportScreen } from "./components/ProjectImportScreen";

function AppContent() {
  const { currentUser, loading: authLoading, logout } = useUser();
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const t = T[lang];
  const [screen, setScreen] = useState("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [admin, setAdmin] = useState<AdminConfig>(defAdmin());
  const [activeProjId, setActiveProjId] = useState<number | null>(null);
  const [activeVerId, setActiveVerId] = useState<number | null>(null);
  const [compareInitialIds, setCompareInitialIds] = useState<{ base: string; compare: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminDirty, setAdminDirty] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjId);
  const activeVersion = activeProject?.versions.find(v => v.id === activeVerId);

  const reload = useCallback(async () => {
    setLoading(true);
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

  useEffect(() => {
    if (currentUser) void reload();
  }, [currentUser, reload]);

  const openCompare = useCallback((base: string, compare = "") => {
    setCompareInitialIds({ base, compare });
    setScreen("compare");
  }, []);

  const onVersionSaved = useCallback((versionId: number, data: SimData) => {
    setProjects(ps => ps.map(p => ({
      ...p,
      versions: p.versions.map(v => v.id === versionId ? { ...v, data } : v),
    })));
  }, []);

  // ── Auth / data loading gates ──────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen t={t} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  // ── Role helpers ───────────────────────────────────────────────────────────

  const isPmoOrDcl = currentUser.role === "pmo" || currentUser.role === "dcl";

  const roleBadgeClass = ({
    pmo: "bg-purple-900 text-purple-300",
    dcl: "bg-orange-900 text-orange-300",
    sm:  "bg-blue-900 text-blue-300",
    pm:  "bg-indigo-900 text-indigo-300",
  } as Record<string, string>)[currentUser.role] ?? "bg-gray-800 text-gray-300";

  const canAccessAdmin = currentUser.role !== "pm";

  const navItems = [
    { key: "projects",    icon: "📂", label: t.projects },
    ...(isPmoOrDcl ? [{ key: "permissions", icon: "🔐", label: t.permissions }] : []),
    ...(canAccessAdmin   ? [{ key: "admin",       icon: "⚙️", label: t.admin }] : []),
  ];

  const isProjectSubscreen = ["project-detail", "simulation", "compare", "import"].includes(screen);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{ fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/fpt-logo.png" alt="FPT Software" className="h-8 w-auto" />
          <h1 className="text-base font-bold text-white">📊 {t.appTitle}</h1>
          <div className="flex gap-1">
            {navItems.map(item => (
              <button key={item.key} onClick={() => {
                if (item.key !== "admin" && adminDirty) {
                  if (!window.confirm("Cấu hình Admin có thay đổi chưa lưu. Rời trang sẽ mất thay đổi. Tiếp tục?")) return;
                  setAdminDirty(false);
                }
                setScreen(item.key);
              }}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  screen === item.key || (item.key === "projects" && isProjectSubscreen)
                    ? "bg-gray-800 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User info */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{currentUser.displayName || currentUser.email}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${roleBadgeClass}`}>
              {currentUser.role.toUpperCase()}
            </span>
          </div>
          <button onClick={() => void logout()}
            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition">
            {t.logout}
          </button>
          {/* Language switcher */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            {(["vi", "en"] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1 rounded text-sm font-medium ${lang === l ? "bg-indigo-600 text-white" : "text-gray-500"}`}>
                {l === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screen Router */}
      <div className="flex-1 overflow-y-auto">
        {screen === "projects" && (
          <ProjectListScreen
            projects={projects}
            onReload={reload}
            onOpenProject={id => { setActiveProjId(id); setScreen("project-detail"); }}
            canImport={isPmoOrDcl}
            onImport={() => setScreen("import")}
            t={t}
          />
        )}
        {screen === "project-detail" && activeProject && (
          <ProjectDetailScreen
            project={activeProject}
            onReload={reload}
            onOpenSim={(pid, vid) => { setActiveProjId(pid); setActiveVerId(vid); setScreen("simulation"); }}
            onOpenCompare={(base, compare) => openCompare(base, compare)}
            onBack={() => setScreen("projects")}
            t={t}
            admin={admin}
          />
        )}
        {screen === "simulation" && activeProject && activeVersion && (
          <SimScreen
            project={activeProject}
            version={activeVersion}
            onVersionSaved={onVersionSaved}
            onOpenCompare={base => openCompare(base)}
            admin={admin}
            onBack={() => setScreen("project-detail")}
            t={t}
          />
        )}
        {screen === "compare" && activeProject && (
          <CompareVersionsScreen
            project={activeProject}
            admin={admin}
            initialBaseId={compareInitialIds?.base}
            initialCompareId={compareInitialIds?.compare}
            onBack={() => setScreen("project-detail")}
            t={t}
          />
        )}
        {screen === "admin" && canAccessAdmin && (
          <AdminScreen
            config={admin}
            onSave={cfg => { setAdmin(cfg); api.saveAdmin(cfg).catch(console.error); }}
            onDirtyChange={setAdminDirty}
            t={t}
          />
        )}
        {screen === "permissions" && isPmoOrDcl && (
          <PermissionsScreen t={t} />
        )}
        {screen === "import" && isPmoOrDcl && (
          <ProjectImportScreen
            onBack={() => setScreen("projects")}
            onDone={() => { void reload(); setScreen("projects"); }}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
