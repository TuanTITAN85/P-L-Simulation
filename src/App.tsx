import { useState, useEffect, useCallback, useRef } from "react";
import type { AdminConfig } from "./types";
import { T } from "./i18n/translations";
import { defAdmin } from "./utils/helpers";
import { api } from "./api";
import { UserProvider, useUser } from "./context/UserContext";
import { AdminScreen }             from "./components/AdminScreen";
import { LoginScreen }             from "./components/LoginScreen";
import { LineServiceScreen }       from "./components/LineServiceScreen";
import { PmManagementScreen }      from "./components/PmManagementScreen";
import { DclManagementScreen }     from "./components/DclManagementScreen";
import { PmoManagementScreen }     from "./components/PmoManagementScreen";
import { MasterProjectsScreen }    from "./components/MasterProjectsScreen";
import { ActualDataMgmtScreen }    from "./components/ActualDataMgmtScreen";
import { PmProjectsScreen }        from "./components/PmProjectsScreen";
import { ReviewScreen }            from "./components/ReviewScreen";

// ── Role helpers ──────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  PMO: "bg-purple-900 text-purple-300",
  DCL: "bg-orange-900 text-orange-300",
  SM:  "bg-blue-900  text-blue-300",
  PM:  "bg-indigo-900 text-indigo-300",
};

const MGMT_SCREENS = new Set(["line-services", "pm-mgmt", "dcl-mgmt", "pmo-mgmt", "master-projects", "actual-data-import", "admin"]);
const REVIEW_SCREENS = new Set(["review-sm", "review-pmo", "approve"]);

function AppContent() {
  const { currentUser, loading: authLoading, logout } = useUser();
  const [lang, setLang]         = useState<"vi" | "en">("vi");
  const t = T[lang];
  const [screen, setScreen]     = useState("projects");
  const [admin, setAdmin]       = useState<AdminConfig>(defAdmin());
  const [loading, setLoading]   = useState(false);
  const [adminDirty, setAdminDirty] = useState(false);
  const [mgmtOpen, setMgmtOpen] = useState(false);
  const mgmtRef = useRef<HTMLDivElement>(null);
  const [reviewCounts, setReviewCounts] = useState({ sm: 0, pmo: 0, dcl: 0 });

  // ── Close mgmt dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mgmtRef.current && !mgmtRef.current.contains(e.target as Node)) {
        setMgmtOpen(false);
      }
    };
    if (mgmtOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [mgmtOpen]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const a = await api.getAdmin();
      setAdmin(a);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReviewCounts = useCallback(async () => {
    if (!currentUser) return;
    const isReviewer = currentUser.roles.some(r => ["SM", "PMO", "DCL"].includes(r));
    if (!isReviewer) return;
    try {
      const counts = await api.getReviewCounts();
      setReviewCounts(counts);
    } catch { /* ignore — badge is non-critical */ }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) void reload();
  }, [currentUser, reload]);

  // Fetch review counts on login, then poll every 60 s
  useEffect(() => {
    if (!currentUser) return;
    void loadReviewCounts();
    const id = setInterval(() => void loadReviewCounts(), 60_000);
    return () => clearInterval(id);
  }, [currentUser, loadReviewCounts]);

  const navigate = (key: string) => {
    if (key !== "admin" && adminDirty) {
      if (!window.confirm("Cấu hình Admin có thay đổi chưa lưu. Rời trang sẽ mất thay đổi. Tiếp tục?")) return;
      setAdminDirty(false);
    }
    setScreen(key);
    setMgmtOpen(false);
  };

  // ── Auth / loading gates ──────────────────────────────────────────────────
  if (authLoading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading…</div>;
  }
  if (!currentUser) {
    return <LoginScreen t={t} />;
  }
  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading…</div>;
  }

  // ── Role flags ────────────────────────────────────────────────────────────
  const hasPMO = currentUser.roles.includes("PMO");
  const hasDCL = currentUser.roles.includes("DCL");
  const hasSM  = currentUser.roles.includes("SM");

  // Admin (System Config) = PMO and DCL only; SM has NO access
  const canAccessAdmin = hasPMO || hasDCL;

  const isMgmtScreen   = MGMT_SCREENS.has(screen);
  const isReviewScreen = REVIEW_SCREENS.has(screen);

  // ── Navigation items ──────────────────────────────────────────────────────
  const mainNav: { key: string; icon: string; label: string; badge?: number }[] = [
    { key: "projects", icon: "📂", label: t.projects },
    ...(hasSM  ? [{ key: "review-sm",  icon: "📋", label: t.reviewSm,    badge: reviewCounts.sm  }] : []),
    ...(hasPMO ? [{ key: "review-pmo", icon: "📋", label: t.reviewPmo,   badge: reviewCounts.pmo }] : []),
    ...(hasDCL ? [{ key: "approve",    icon: "✅", label: t.needApprove, badge: reviewCounts.dcl }] : []),
  ];

  // Management dropdown items (PMO only) — grouped by category
  const mgmtItems: ({ key: string; icon: string; label: string } | null)[] = hasPMO ? [
    // Dữ liệu dự án
    { key: "master-projects",    icon: "📋", label: t.masterProjectMgmt },
    { key: "actual-data-import", icon: "📊", label: t.actualDataImport },
    null,
    // Phân quyền & Line
    { key: "line-services",      icon: "🏢", label: t.lineServiceMgmt },
    { key: "pmo-mgmt",           icon: "🛡️", label: t.pmoMgmt },
    { key: "pm-mgmt",            icon: "👤", label: t.pmMgmt },
    { key: "dcl-mgmt",           icon: "🔑", label: t.dclMgmt },
    null,
    // Cấu hình hệ thống
    { key: "admin",              icon: "🔧", label: t.configuration },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{ fontFamily: "system-ui,sans-serif" }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <img src="/fpt-logo.png" alt="FPT Software" className="h-8 w-auto" />
          <h1
            className="text-base font-bold text-white cursor-pointer hover:text-indigo-300 transition"
            onClick={() => navigate("projects")}
          >
            {t.appTitle}
          </h1>

          {/* Main nav buttons */}
          <div className="flex gap-1 flex-wrap">
            {mainNav.map(item => {
              const isActive = screen === item.key;
              return (
                <button key={item.key} onClick={() => navigate(item.key)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}>
                  {item.icon} {item.label}
                  {(item.badge ?? 0) > 0 && (
                    <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quản lý dropdown (PMO only) */}
            {hasPMO && (
              <div ref={mgmtRef} className="relative">
                <button onClick={() => setMgmtOpen(o => !o)}
                  className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition ${
                    isMgmtScreen && !isReviewScreen ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}>
                  ⚙️ {t.management}
                  <span className="text-xs opacity-50">{mgmtOpen ? "▲" : "▼"}</span>
                </button>

                {mgmtOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 min-w-56 py-1.5">
                    {mgmtItems.map((item, i) =>
                      item === null ? (
                        <div key={`div-${i}`} className="my-1 border-t border-gray-700" />
                      ) : (
                        <button key={item.key} onClick={() => navigate(item.key)}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition ${
                            screen === item.key
                              ? "bg-indigo-900/50 text-indigo-200"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          }`}>
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DCL-only: access to System Config + Actual Data Import */}
            {!hasPMO && hasDCL && (
              <>
                <button onClick={() => navigate("actual-data-import")}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    screen === "actual-data-import" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}>
                  📊 {t.actualDataImport}
                </button>
                <button onClick={() => navigate("admin")}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    screen === "admin" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}>
                  ⚙️ {t.configuration}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: user info + logout + lang */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{currentUser.name || currentUser.email}</span>
            <div className="flex gap-1">
              {currentUser.roles.map(role => (
                <span key={role} className={`text-xs px-2 py-0.5 rounded font-medium ${ROLE_COLORS[role] ?? "bg-gray-800 text-gray-300"}`}>
                  {role}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => void logout()}
            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition">
            {t.logout}
          </button>
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

      {/* ── Screen Router ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {screen === "projects" && (
          <PmProjectsScreen admin={admin} t={t} />
        )}
        {screen === "admin" && canAccessAdmin && (
          <AdminScreen
            config={admin}
            onSave={cfg => { setAdmin(cfg); api.saveAdmin(cfg).catch(console.error); }}
            onDirtyChange={setAdminDirty}
            t={t}
          />
        )}
        {/* ── Management screens (PMO only) ──────────────────────────────── */}
        {screen === "line-services"      && hasPMO && <LineServiceScreen      t={t} />}
        {screen === "pmo-mgmt"           && hasPMO && <PmoManagementScreen    t={t} />}
        {screen === "pm-mgmt"            && hasPMO && <PmManagementScreen     t={t} />}
        {screen === "dcl-mgmt"           && hasPMO && <DclManagementScreen    t={t} />}
        {screen === "master-projects"    && hasPMO && <MasterProjectsScreen   t={t} />}
        {screen === "actual-data-import" && (hasPMO || hasDCL) && <ActualDataMgmtScreen t={t} />}

        {/* ── Review / Approve screens (Phase 5) ──────────────────────────── */}
        {screen === "review-sm"  && hasSM  && (
          <ReviewScreen mode="sm"  admin={admin} t={t} onActionDone={() => void loadReviewCounts()} />
        )}
        {screen === "review-pmo" && hasPMO && (
          <ReviewScreen mode="pmo" admin={admin} t={t} onActionDone={() => void loadReviewCounts()} />
        )}
        {screen === "approve"    && hasDCL && (
          <ReviewScreen mode="dcl" admin={admin} t={t} onActionDone={() => void loadReviewCounts()} />
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
