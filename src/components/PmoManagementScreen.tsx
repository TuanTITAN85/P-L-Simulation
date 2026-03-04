import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import type { PmoUser } from "../types";
import type { TranslationType } from "../i18n/translations";

interface Props { t: TranslationType; }

type Filter = "all" | "active" | "inactive";

function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

// ── Add/Edit modal ─────────────────────────────────────────────────────────────
function Modal({
  editUser, onClose, onSaved, t,
}: {
  editUser: PmoUser | null;
  onClose: () => void;
  onSaved: () => void;
  t: TranslationType;
}) {
  const isEdit = editUser !== null;

  // Edit mode fields
  const [name, setName]     = useState(editUser?.name ?? "");
  const [email, setEmail]   = useState(editUser?.email ?? "");
  const [status, setStatus] = useState(editUser?.status ?? "active");

  // Add mode: email lookup
  const [addEmail, setAddEmail]         = useState("");
  const [lookedUpName, setLookedUpName] = useState<string | null>(null);
  const [fallbackName, setFallbackName] = useState("");
  const [looking, setLooking]           = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (isEdit) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setLookedUpName(null);
    setFallbackName("");
    if (!addEmail.trim()) { setLooking(false); return; }
    setLooking(true);
    timerRef.current = setTimeout(async () => {
      try {
        // 1. Check local DB first
        const results = await api.getSystemUsers(undefined, addEmail.trim());
        const exact = results.find(u => u.email.toLowerCase() === addEmail.trim().toLowerCase());
        if (exact) { setLookedUpName(exact.name); return; }
        // 2. Fallback: query Azure AD via Microsoft Graph
        const azUser = await api.lookupAzureUser(addEmail.trim());
        setLookedUpName(azUser ? azUser.name : "");
      } catch { setLookedUpName(""); }
      finally { setLooking(false); }
    }, 400);
  }, [addEmail, isEdit]);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      if (isEdit) {
        if (!name.trim() || !email.trim()) { setError("Tên và email không được để trống."); setSaving(false); return; }
        await api.updatePmoUser(editUser.id, { name: name.trim(), email: email.trim(), status });
      } else {
        const finalName = lookedUpName || fallbackName.trim();
        if (!addEmail.trim()) { setError("Email không được để trống."); setSaving(false); return; }
        if (!finalName) { setError("Không tìm được tên — vui lòng nhập thủ công."); setSaving(false); return; }
        await api.createPmoUser({ name: finalName, email: addEmail.trim() });
      }
      onSaved(); onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">{isEdit ? t.editPmo : t.addPmo}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {error && <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-sm text-red-300">{error}</div>}

          {isEdit ? (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t.name} *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t.o365Email} *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t.status}</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="active">{t.active}</option>
                  <option value="inactive">{t.inactive}</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t.o365Email} *</label>
                <div className="relative">
                  <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)}
                    placeholder="email@fpt.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                  {looking && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{t.lookingUpUser}</span>}
                </div>
              </div>
              {!looking && addEmail.trim() && lookedUpName !== null && (
                lookedUpName ? (
                  <div className="flex items-center gap-2 bg-gray-800 border border-green-800/50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-green-400 text-xs">✓</span>
                    <div>
                      <div className="text-white font-medium">{lookedUpName}</div>
                      <div className="text-xs text-gray-500">{t.nameAutoLoaded}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-amber-400 mb-1">⚠ {t.userNotFoundInAD}</div>
                    <input type="text" value={fallbackName} onChange={e => setFallbackName(e.target.value)}
                      placeholder={t.name}
                      className="w-full bg-gray-800 border border-amber-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                )
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">{t.cancel}</button>
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium">
            {saving ? "…" : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CSV Import section ─────────────────────────────────────────────────────────
function CsvImport({ onDone, t }: { onDone: () => void; t: TranslationType }) {
  const [file, setFile]     = useState<File | null>(null);
  const [result, setResult] = useState<{ success: number; failed: number; errors: { email: string; error: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const downloadTemplate = () => {
    const csv = "name,email\nNguyễn Văn A,a@fpt.com\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "pmo_template.csv";
    a.click();
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.trim().split("\n").slice(1);
      const rows = lines.map(line => {
        const [name, email] = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
        return { name, email };
      }).filter(r => r.name && r.email);
      const res = await api.importPmoUsers(rows);
      setResult({ success: res.success, failed: res.failed, errors: res.errors });
      if (res.success > 0) onDone();
    } catch (err) {
      setResult({ success: 0, failed: 1, errors: [{ email: "—", error: err instanceof Error ? err.message : "Lỗi" }] });
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">{t.importCSV}</h3>
        <button onClick={downloadTemplate} className="text-xs text-indigo-400 hover:text-indigo-300">{t.importTemplate}</button>
      </div>
      <p className="text-xs text-gray-600 mb-3">Template: <code className="text-gray-500">name, email</code></p>
      <div className="flex gap-2">
        <label className="flex-1 flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-600">
          <span className="text-xs text-gray-400">{file ? file.name : t.noFileSelected}</span>
          <input type="file" accept=".csv" onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); }} className="hidden" />
        </label>
        <button onClick={() => void handleImport()} disabled={!file || loading}
          className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white">
          {loading ? "…" : t.confirmImport}
        </button>
      </div>
      {result && (
        <div className="mt-3 text-xs">
          <span className="text-green-400">{t.successCount}: {result.success}</span>
          {result.failed > 0 && <span className="text-red-400 ml-3">{t.errorCount}: {result.failed}</span>}
          {result.errors.length > 0 && (
            <ul className="mt-2 text-red-400 space-y-0.5">
              {result.errors.map((e, i) => <li key={i}>• {e.email}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export const PmoManagementScreen = ({ t }: Props) => {
  const [users, setUsers]         = useState<PmoUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<Filter>("all");
  const [search, setSearch]       = useState("");
  const [modalUser, setModalUser] = useState<PmoUser | null | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);
  const { toast, show: showToast } = useToast();

  const load = async () => {
    try { setUsers(await api.getPmoUsers()); }
    catch { showToast("Không tải được danh sách.", false); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = users.filter(u => {
    if (filter === "active"   && u.status !== "active") return false;
    if (filter === "inactive" && u.status === "active") return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
                  !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (u: PmoUser) => {
    if (!window.confirm(`${t.confirmDelete}: "${u.name}"?`)) return;
    try {
      await api.deletePmoUser(u.id);
      showToast(t.savedOK);
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.importError, false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border ${
          toast.ok ? "bg-green-950 text-green-200 border-green-800" : "bg-red-950 text-red-200 border-red-800"
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">🏢 {t.pmoMgmt}</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(v => !v)}
            className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300">
            📥 {t.importCSV}
          </button>
          <button onClick={() => setModalUser(null)}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium">
            + {t.addPmo}
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 text-sm">
          {(["all", "active", "inactive"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md transition ${filter === f ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
              {f === "all" ? t.filterAll : f === "active" ? t.filterActive : t.filterInactive}
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
          className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
      </div>

      {showImport && <CsvImport t={t} onDone={() => { void load(); setShowImport(false); }} />}

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-12">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-12">{t.noData}</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">{t.name}</th>
                <th className="text-left px-4 py-3">{t.o365Email}</th>
                <th className="text-left px-4 py-3">{t.currentRoles}</th>
                <th className="text-left px-4 py-3">{t.status}</th>
                <th className="text-right px-4 py-3">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-purple-900 text-purple-300">PMO</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                      {u.status === "active" ? t.active : t.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setModalUser(u)}
                      className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 mr-2">{t.edit}</button>
                    <button onClick={() => void handleDelete(u)}
                      className="text-xs px-3 py-1 bg-red-900/60 hover:bg-red-800 rounded-lg text-red-300">{t.del}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalUser !== undefined && (
        <Modal editUser={modalUser} t={t}
          onClose={() => setModalUser(undefined)}
          onSaved={() => { showToast(t.savedOK); void load(); }} />
      )}
    </div>
  );
};
