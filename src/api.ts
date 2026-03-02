import type { Project, Version, SimData, ActualEntry, AdminConfig, Location } from "./types";

// ─── Low-level fetch helpers ─────────────────────────────────────────────────

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`API ${init?.method ?? "GET"} ${url} → ${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const headers = { "Content-Type": "application/json" };
const post  = <T>(url: string, body: unknown) => request<T>(url, { method: "POST",   headers, body: JSON.stringify(body) });
const patch = <T>(url: string, body: unknown) => request<T>(url, { method: "PATCH",  headers, body: JSON.stringify(body) });
const put   = <T>(url: string, body: unknown) => request<T>(url, { method: "PUT",    headers, body: JSON.stringify(body) });
const del        = (url: string)              => request<void>(url, { method: "DELETE" });

// ─── Typed API surface ───────────────────────────────────────────────────────

export const api = {
  // Projects
  getProjects:   ()                                        => request<Project[]>("/api/projects"),
  createProject: (p: Omit<Project, "id">)                 => post<Project>("/api/projects", p),
  patchProject:  (id: number, f: Partial<Project>)        => patch<Project>(`/api/projects/${id}`, f),
  deleteProject: (id: number)                             => del(`/api/projects/${id}`),

  // Versions
  addVersion:   (projId: number, v: Omit<Version, "id">) => post<Version>(`/api/projects/${projId}/versions`, v),
  saveVersion:  (id: number, data: SimData)               => patch<Version>(`/api/versions/${id}`, { data }),

  // Actual entries
  addActual:    (projId: number, tab: string, e: Omit<ActualEntry, "id">) =>
                  post<ActualEntry>(`/api/projects/${projId}/actual/${tab}`, e),
  deleteActual: (id: number)                              => del(`/api/actual/${id}`),

  // Admin config
  getAdmin:  ()                    => request<AdminConfig>("/api/admin"),
  saveAdmin: (cfg: AdminConfig)    => put<AdminConfig>("/api/admin", cfg),

  // AI analysis
  analyzePyramid: (payload: {
    ceEMP: Record<string, Record<string, string>> | undefined;
    ceAPP: Record<string, Record<string, string>> | undefined;
    sk: "prime" | "supplier";
    locations: Location[];
  }) => post<{ analysis: string }>("/api/ai/analyze-pyramid", payload),
};
