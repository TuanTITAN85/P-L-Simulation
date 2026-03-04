import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import type { LineService } from "../types";
import type { TranslationType } from "../i18n/translations";

interface Props { t: TranslationType; }

type SmEntry = { email: string; name: string };

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

// ── Single SM input with Azure AD lookup ──────────────────────────────────────
function SmInput({
  current,
  onSet,
  onRemove,
  t,
}: {
  current: SmEntry | null;
  onSet: (sm: SmEntry) => void;
  onRemove: () => void;
  t: TranslationType;
}) {
  const [email, setEmail]               = useState("");
  const [lookedUpName, setLookedUpName] = useState<string | null>(null); // null=idle, ""=not found
  const [fallbackName, setFallbackName] = useState("");
  const [looking, setLooking]           = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced lookup
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLookedUpName(null);
    setFallbackName("");
    if (!email.trim()) { setLooking(false); return; }
    setLooking(true);
    timerRef.current = setTimeout(async () => {
      try {
        const results = await api.getSystemUsers(undefined, email.trim());
        const exact = results.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (exact) { setLookedUpName(exact.name); return; }
        const azUser = await api.lookupAzureUser(email.trim());
        setLookedUpName(azUser ? azUser.name : "");
      } catch { setLookedUpName(""); }
      finally { setLooking(false); }
    }, 400);
  }, [email]);

  const resolvedName = lookedUpName || fallbackName.trim();

  const handleConfirm = () => {
    const e = email.trim().toLowerCase();
    if (!e || !resolvedName) return;
    onSet({ email: e, name: resolvedName });
    setEmail("");
    setLookedUpName(null);
    setFallbackName("");
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 block">{t.smPic} (1 SM / Line Service)</label>

      {/* Current SM chip */}
      {current && (
        <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-800/50 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <span className="text-white text-sm">{current.name}</span>
            <span className="text-gray-400 text-xs ml-1.5">({current.email})</span>
          </div>
          <button type="button" onClick={onRemove}
            className="text-gray-500 hover:text-red-400 text-lg leading-none transition shrink-0">×</button>
        </div>
      )}

      {/* Input for setting/replacing SM */}
      {!current && (
        <div className="space-y-1.5">
          <div className="flex gap-2 items-center">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@fpt.com"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleConfirm(); } }}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
            {looking && <span className="text-xs text-gray-500 shrink-0">{t.lookingUpUser}</span>}
          </div>

          {lookedUpName !== null && (
            lookedUpName ? (
              <div className="text-xs text-green-400">✓ {lookedUpName}</div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs text-yellow-500">{t.userNotFoundInAD}</div>
                <input type="text" value={fallbackName} onChange={e => setFallbackName(e.target.value)}
                  placeholder={t.name}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
              </div>
            )
          )}

          {email.trim() && resolvedName && (
            <button type="button" onClick={handleConfirm}
              className="text-xs px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-white transition">
              ✓ {resolvedName}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({
  item, onClose, onSaved, t,
}: {
  item: LineService | null;
  onClose: () => void;
  onSaved: () => void;
  t: TranslationType;
}) {
  const isEdit = item !== null;
  const [name, setName] = useState(item?.name ?? "");
  const [sm, setSm]     = useState<SmEntry | null>(
    item?.managers[0] ? { email: item.managers[0].email, name: item.managers[0].userName } : null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Tên không được để trống."); return; }
    setSaving(true);
    setError("");
    try {
      if (isEdit && item) {
        await api.updateLineService(item.id, name.trim());

        const oldSm = item.managers[0] ?? null;
        const smChanged = sm?.email !== oldSm?.email;

        if (sm && (!oldSm || smChanged)) {
          // Add/replace SM (backend enforces 1 SM — removes existing first)
          await api.addLineServiceManager(item.id, sm.email, sm.name);
        } else if (!sm && oldSm) {
          // SM removed
          await api.removeLineServiceManager(item.id, oldSm.userId);
        }
      } else {
        await api.createLineService(
          name.trim(),
          sm ? [{ email: sm.email, name: sm.name }] : [],
        );
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">
            {isEdit ? t.editLineService : t.addLineService}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {error && <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-sm text-red-300">{error}</div>}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">{t.lineServiceName} *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <SmInput current={sm} onSet={setSm} onRemove={() => setSm(null)} t={t} />
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-800">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
            {t.cancel}
          </button>
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium">
            {saving ? "…" : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export const LineServiceScreen = ({ t }: Props) => {
  const [services, setServices] = useState<LineService[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modalItem, setModalItem] = useState<LineService | null | undefined>(undefined);
  const { toast, show: showToast } = useToast();

  const load = async () => {
    try {
      const data = await api.getLineServices();
      setServices(data);
    } catch { showToast("Không tải được danh sách.", false); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (svc: LineService) => {
    if (!window.confirm(`${t.confirmDelete}: "${svc.name}"?`)) return;
    try {
      await api.deleteLineService(svc.id);
      showToast(t.savedOK);
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("project") || msg.includes("linked")) {
        showToast(t.hasProjectsLinked, false);
      } else {
        showToast(msg || t.importError, false);
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border ${
          toast.ok ? "bg-green-950 text-green-200 border-green-800" : "bg-red-950 text-red-200 border-red-800"
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">⚙️ {t.lineServiceMgmt}</h1>
        <button onClick={() => setModalItem(null)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg">
          + {t.addLineService}
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-12">Loading…</div>
      ) : services.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-12">{t.noData}</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">{t.lineServiceName}</th>
                <th className="text-left px-4 py-3">{t.smPic}</th>
                <th className="text-right px-4 py-3">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {services.map(svc => {
                const sm = svc.managers[0] ?? null;
                return (
                  <tr key={svc.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white font-medium">{svc.name}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {sm ? (
                        <span>
                          {sm.userName}
                          <span className="text-gray-500 text-xs ml-1.5">({sm.email})</span>
                        </span>
                      ) : (
                        <span className="text-gray-600 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setModalItem(svc)}
                        className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 mr-2">
                        {t.edit}
                      </button>
                      <button onClick={() => void handleDelete(svc)}
                        className="text-xs px-3 py-1 bg-red-900/60 hover:bg-red-800 rounded-lg text-red-300">
                        {t.del}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalItem !== undefined && (
        <Modal
          item={modalItem}
          t={t}
          onClose={() => setModalItem(undefined)}
          onSaved={() => { showToast(t.savedOK); void load(); }}
        />
      )}
    </div>
  );
};
