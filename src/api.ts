import type {
  Project, Version, SimData, ActualEntry, AdminConfig, Location,
  AppUser, ManagedUser, Line, ProjectImportRow,
  // Phase 2
  CurrentUser, LineService, PmUser, DclUser, PmoUser,
  MasterProject, ApprovalHistoryEntry,
  // Phase 5
  ReviewItem,
} from "./types";

// ─── Auth token ──────────────────────────────────────────────────────────────

let _token = "";
export const setToken = (t: string) => { _token = t; };

// ─── Low-level fetch helpers ─────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (_token) h["Authorization"] = `Bearer ${_token}`;
  return h;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const j = await res.json(); msg = j.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  // Auto-unwrap Phase 2 { success: true, data: ... } envelope
  if (json && typeof json === "object" && !Array.isArray(json) && "success" in json && "data" in json) {
    if (!(json as { success: boolean }).success) {
      throw new Error((json as { error?: string }).error ?? "API error");
    }
    return (json as { data: T }).data;
  }
  return json as T;
}

const post  = <T>(url: string, body: unknown) => request<T>(url, { method: "POST",   body: JSON.stringify(body) });
const patch = <T>(url: string, body: unknown) => request<T>(url, { method: "PATCH",  body: JSON.stringify(body) });
const put   = <T>(url: string, body: unknown) => request<T>(url, { method: "PUT",    body: JSON.stringify(body) });
const del        = (url: string)              => request<void>(url, { method: "DELETE" });

// ─── Typed API surface ───────────────────────────────────────────────────────

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  getMe: () => request<AppUser>("/api/me"),

  // ── Users (PMO/DCL) ───────────────────────────────────────────────────────
  getUsers:       ()                                                       => request<ManagedUser[]>("/api/users"),
  createUser:     (email: string, displayName: string, role: string)      => post<ManagedUser>("/api/users", { email, displayName, role }),
  patchUser:      (email: string, fields: { role?: string; active?: boolean; displayName?: string }) =>
                    patch<ManagedUser>(`/api/users/${encodeURIComponent(email)}`, fields),
  deleteUser:     (email: string)                                          => del(`/api/users/${encodeURIComponent(email)}`),
  assignProjects: (email: string, projectIds: number[])                   => put<{ ok: boolean }>(`/api/users/${encodeURIComponent(email)}/projects`, { projectIds }),
  assignLines:    (email: string, lineIds: number[])                      => put<{ ok: boolean }>(`/api/users/${encodeURIComponent(email)}/lines`, { lineIds }),

  // ── Lines ─────────────────────────────────────────────────────────────────
  getLines:    ()                              => request<Line[]>("/api/lines"),
  createLine:  (code: string, name: string)    => post<Line>("/api/lines", { code, name }),
  patchLine:   (id: number, name: string)      => patch<Line>(`/api/lines/${id}`, { name }),
  deleteLine:  (id: number)                    => del(`/api/lines/${id}`),

  // ── Project Import ────────────────────────────────────────────────────────
  importProjects: (rows: ProjectImportRow[]) =>
    post<{ results: { code: string; action: string; id: number }[]; errors: { code: string; error: string }[] }>(
      "/api/projects/import", { rows }
    ),

  // ── Projects ──────────────────────────────────────────────────────────────
  getProjects:   ()                                        => request<Project[]>("/api/projects"),
  createProject: (p: Omit<Project, "id">)                 => post<Project>("/api/projects", p),
  patchProject:  (id: number, f: Partial<Project>)        => patch<Project>(`/api/projects/${id}`, f),
  deleteProject: (id: number)                             => del(`/api/projects/${id}`),

  // ── Versions ──────────────────────────────────────────────────────────────
  addVersion:   (projId: number, v: Omit<Version, "id">) => post<Version>(`/api/projects/${projId}/versions`, v),
  saveVersion:  (id: number, data: SimData)               => patch<Version>(`/api/versions/${id}`, { data }),

  // ── Actual entries ────────────────────────────────────────────────────────
  addActual:    (projId: number, tab: string, e: Omit<ActualEntry, "id">) =>
                  post<ActualEntry>(`/api/projects/${projId}/actual/${tab}`, e),
  deleteActual: (id: number)                              => del(`/api/actual/${id}`),

  // ── Admin config ──────────────────────────────────────────────────────────
  getAdmin:  ()                    => request<AdminConfig>("/api/admin"),
  saveAdmin: (cfg: AdminConfig)    => put<AdminConfig>("/api/admin", cfg),

  // ── AI analysis ───────────────────────────────────────────────────────────
  analyzePyramid: (payload: {
    ceEMP: Record<string, Record<string, string>> | undefined;
    ceAPP: Record<string, Record<string, string>> | undefined;
    sk: "prime" | "supplier";
    locations: Location[];
  }) => post<{ analysis: string }>("/api/ai/analyze-pyramid", payload),

  // ── Auth (Phase 2) ────────────────────────────────────────────────────────
  loginNew:  (username: string, password: string) =>
    post<{ token: string; user: CurrentUser }>("/api/auth/login", { username, password }),
  loginSSO:  (token: string) =>
    post<{ token: string; user: CurrentUser }>("/api/auth/sso", { token }),
  mockSSO:   (email: string) =>
    post<{ token: string; user: CurrentUser }>("/api/auth/mock-sso", { email }),

  // ── Line Services (Phase 2) ───────────────────────────────────────────────
  getLineServices:     () => request<LineService[]>("/api/line-services"),
  createLineService:   (name: string, managers?: { email: string; name: string }[]) =>
    post<LineService>("/api/line-services", { name, managers }),
  updateLineService:   (id: string, name: string) =>
    put<LineService>(`/api/line-services/${id}`, { name }),
  deleteLineService:   (id: string) => del(`/api/line-services/${id}`),
  addLineServiceManager:    (id: string, email: string, name: string) =>
    post<{ userId: string; userName: string; email: string; status: string }>(`/api/line-services/${id}/managers`, { email, name }),
  removeLineServiceManager: (id: string, uid: string) =>
    del(`/api/line-services/${id}/managers/${uid}`),

  // ── PM users (Phase 2) ───────────────────────────────────────────────────
  getPmUsers:    () => request<PmUser[]>("/api/users/pm"),
  createPmUser:  (body: { name: string; email: string }) =>
    post<PmUser>("/api/users/pm", body),
  updatePmUser:  (id: string, body: { name?: string; email?: string; status?: string }) =>
    put<PmUser>(`/api/users/pm/${id}`, body),
  deletePmUser:  (id: string) => del(`/api/users/pm/${id}`),
  importPmUsers: (rows: { name: string; email: string }[]) =>
    post<{ results: { email: string; action: string }[]; errors: { email: string; error: string }[]; success: number; failed: number }>(
      "/api/users/pm/import", { rows }
    ),

  // ── DCL users (Phase 2) ──────────────────────────────────────────────────
  getDclUsers:   () => request<DclUser[]>("/api/users/dcl"),
  createDclUser: (body: { name: string; email: string; title?: "DCL" | "Vice DCL" }) =>
    post<DclUser>("/api/users/dcl", body),
  updateDclUser: (id: string, body: { name?: string; email?: string; status?: string; title?: "DCL" | "Vice DCL" }) =>
    put<DclUser>(`/api/users/dcl/${id}`, body),
  deleteDclUser: (id: string) => del(`/api/users/dcl/${id}`),

  // ── PMO users (Phase 2) ──────────────────────────────────────────────────
  getPmoUsers:    () => request<PmoUser[]>("/api/users/pmo"),
  createPmoUser:  (body: { userId?: string; name?: string; email?: string }) =>
    post<PmoUser>("/api/users/pmo", body),
  updatePmoUser:  (id: string, body: { name?: string; email?: string; status?: string }) =>
    put<PmoUser>(`/api/users/pmo/${id}`, body),
  deletePmoUser:  (id: string) => del(`/api/users/pmo/${id}`),
  importPmoUsers: (rows: { name: string; email: string }[]) =>
    post<{ results: { email: string; action: string }[]; errors: { email: string; error: string }[]; success: number; failed: number }>(
      "/api/users/pmo/import", { rows }
    ),

  // ── Master Projects (Phase 2) ─────────────────────────────────────────────
  getMasterProjects:          () => request<MasterProject[]>("/api/master-projects"),
  getAvailableMasterProjects: () => request<MasterProject[]>("/api/master-projects/available"),
  createMasterProject: (body: {
    projectCode: string; projectName: string; projectDescription?: string;
    startDate?: string; endDate?: string; projectType?: string; contractType?: string;
  }) => post<MasterProject>("/api/master-projects", body),
  updateMasterProject: (id: string, body: Partial<{
    projectCode: string; projectName: string; projectDescription: string;
    startDate: string; endDate: string; projectType: string; contractType: string;
  }>) => put<MasterProject>(`/api/master-projects/${id}`, body),
  deleteMasterProject: (id: string) => del(`/api/master-projects/${id}`),
  importMasterProjects: (rows: { projectCode: string; projectName: string; [k: string]: string }[]) =>
    post<{ results: { projectCode: string; action: string }[]; errors: { projectCode: string; error: string }[]; success: number; failed: number }>(
      "/api/master-projects/import", { rows }
    ),

  // ── Workflow (Phase 2) ────────────────────────────────────────────────────
  submitVersion: (projectId: number, versionId: number) =>
    post<{ id: number; status: string; smSkipped: boolean; submittedAt: string }>(
      `/api/projects/${projectId}/versions/${versionId}/submit`, {}
    ),
  approveVersion: (projectId: number, versionId: number, comment?: string) =>
    post<{ id: number; status: string; step: string; approvedBy: string }>(
      `/api/projects/${projectId}/versions/${versionId}/approve`, { comment }
    ),
  rejectVersion: (projectId: number, versionId: number, comment: string) =>
    post<{ id: number; status: string; step: string; rejectedBy: string; comment: string }>(
      `/api/projects/${projectId}/versions/${versionId}/reject`, { comment }
    ),
  cloneFromBidding: (projectId: number, versionId: number) =>
    post<{ id: number; type: string; data: unknown; status: string }>(
      `/api/projects/${projectId}/versions/${versionId}/clone-from-bidding`, {}
    ),

  // ── Actual Data (Phase 2) ─────────────────────────────────────────────────
  importActualByCode: (tab: string, entries: {
    projectCode: string; month: string; importedAt: string; fileName: string;
    selectedCodes: string[]; offshoreActualMM: number; onsiteActualMM: number;
    actualRevenue: number; actualDirectCost: number; calendarEffort: number;
    rows: unknown[];
  }[]) =>
    post<{ inserted: number; failed: number; errors: { projectCode: string; reason: string }[] }>(
      "/api/actual-entries/import-by-code", { tab, entries }
    ),
  getActualEntries: (tab: string, search?: string) =>
    request<{
      id: number; project_code: string; tab: string; month: string;
      offshore_actual_mm: number; onsite_actual_mm: number;
      actual_revenue: number; actual_direct_cost: number; calendar_effort: number;
      file_name: string; imported_at: string; selected_codes: string[];
    }[]>(
      `/api/actual-entries?tab=${encodeURIComponent(tab)}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    ),
  deleteActualEntry: (id: number) =>
    del<{ deleted: number }>(`/api/actual-entries/${id}`),

  // ── Azure AD user lookup (Microsoft Graph) ───────────────────────────────
  lookupAzureUser: (email: string) =>
    request<{ name: string; email: string } | null>(
      `/api/azure-user?email=${encodeURIComponent(email)}`
    ),

  // ── System Users (Phase 3) ────────────────────────────────────────────────
  getSystemUsers: (role?: string, search?: string) => {
    const p = new URLSearchParams();
    if (role)   p.set("role",   role);
    if (search) p.set("search", search);
    const qs = p.toString();
    return request<{ id: string; name: string; email: string; status: string; roles: string[] }[]>(
      `/api/system-users${qs ? "?" + qs : ""}`
    );
  },

  // ── Approval history (typed helper) ──────────────────────────────────────
  parseApprovalHistory: (raw: unknown): ApprovalHistoryEntry[] =>
    Array.isArray(raw) ? (raw as ApprovalHistoryEntry[]) : [],

  // ── PM Projects (Phase 4) ─────────────────────────────────────────────────
  getPmProjects: () => request<Project[]>("/api/pm/projects"),
  createPmProject: (body: {
    masterProjectId: string;
    lineServiceId: string;
    currency: string;
  }) => post<Project>("/api/pm/projects", body),
  updateProjectLineService: (projectId: number, lineServiceId: string) =>
    patch<{ lineServiceId: string; lineServiceName: string | null }>(
      `/api/pm/projects/${projectId}`, { lineServiceId }
    ),
  deletePmProject: (projectId: number) => del(`/api/pm/projects/${projectId}`),
  deletePmVersion: (projectId: number, versionId: number) =>
    del(`/api/pm/projects/${projectId}/versions/${versionId}`),

  // ── Review Queue (Phase 5) ────────────────────────────────────────────────
  getReviewCounts:     () => request<{ sm: number; pmo: number; dcl: number }>("/api/review/counts"),
  getReviewPendingSm:  () => request<ReviewItem[]>("/api/review/pending-sm"),
  getReviewPendingPmo: () => request<ReviewItem[]>("/api/review/pending-pmo"),
  getReviewPendingDcl: () => request<ReviewItem[]>("/api/review/pending-dcl"),

  // Expose setToken for UserContext
  setToken,
};
