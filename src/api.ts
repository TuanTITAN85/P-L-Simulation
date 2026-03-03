import type { Project, Version, SimData, ActualEntry, AdminConfig, Location,
              AppUser, ManagedUser, Line, ProjectImportRow } from "./types";

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
  return res.json() as Promise<T>;
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

  // Expose setToken for UserContext
  setToken,
};
