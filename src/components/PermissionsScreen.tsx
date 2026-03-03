import { useState, useEffect } from "react";
import type { ManagedUser, Line } from "../types";
import type { TranslationType } from "../i18n/translations";
import { api } from "../api";
import { useUser } from "../context/UserContext";
import { Inp, Card } from "./ui";
import { Badge } from "./Badge";
import * as XLSX from "xlsx";

interface PermissionsScreenProps {
  t: TranslationType;
}

const ROLES = ["pm", "sm", "pmo", "dcl"];

type UserImportRow = { email: string; displayName: string; role: string };
type ImportColKey = "email" | "displayName" | "role" | "skip";
const USER_FIELD_OPTIONS: { value: ImportColKey; label: string }[] = [
  { value: "skip",        label: "— Bỏ qua —" },
  { value: "email",       label: "Email" },
  { value: "displayName", label: "Tên hiển thị" },
  { value: "role",        label: "Nhóm quyền" },
];
const USER_AUTO_DETECT: Record<string, ImportColKey> = {
  "email": "email", "e-mail": "email", "tài khoản": "email", "account": "email",
  "tên": "displayName", "tên hiển thị": "displayName", "name": "displayName", "display name": "displayName",
  "role": "role", "nhóm quyền": "role", "quyền": "role", "chức vụ": "role",
};

export const PermissionsScreen = ({ t }: PermissionsScreenProps) => {
  const { currentUser } = useUser();
  const [tab, setTab] = useState<"users" | "lines">("users");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const reload = async () => {
    setDataLoading(true);
    const [us, ls] = await Promise.all([api.getUsers(), api.getLines()]);
    setUsers(us);
    setLines(ls);
    setDataLoading(false);
  };

  useEffect(() => { void reload(); }, []);

  // ── Users tab ──────────────────────────────────────────────────────────────
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", displayName: "", role: "pm" });

  // ── Users Excel import ─────────────────────────────────────────────────────
  const [showImport, setShowImport] = useState(false);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRawRows, setImportRawRows] = useState<Record<string, string>[]>([]);
  const [importColMap, setImportColMap] = useState<Record<string, ImportColKey>>({});
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importResults, setImportResults] = useState<{ ok: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const wb = XLSX.read(ev.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      if (rows.length === 0) return;
      const hdrs = Object.keys(rows[0]);
      const autoMap: Record<string, ImportColKey> = {};
      hdrs.forEach(h => { autoMap[h] = USER_AUTO_DETECT[h.toLowerCase().trim()] ?? "skip"; });
      setImportHeaders(hdrs);
      setImportRawRows(rows);
      setImportColMap(autoMap);
      setImportStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const importPreviewRows: UserImportRow[] = importRawRows.slice(0, 10).map(row => ({
    email:       (Object.entries(importColMap).find(([,v]) => v === "email")?.[0] ? row[Object.entries(importColMap).find(([,v]) => v === "email")![0]] : "") ?? "",
    displayName: (Object.entries(importColMap).find(([,v]) => v === "displayName")?.[0] ? row[Object.entries(importColMap).find(([,v]) => v === "displayName")![0]] : "") ?? "",
    role:        (Object.entries(importColMap).find(([,v]) => v === "role")?.[0] ? row[Object.entries(importColMap).find(([,v]) => v === "role")![0]] : "pm") ?? "pm",
  }));

  const handleImportConfirm = async () => {
    setImporting(true);
    const emailCol = Object.entries(importColMap).find(([,v]) => v === "email")?.[0];
    const nameCol  = Object.entries(importColMap).find(([,v]) => v === "displayName")?.[0];
    const roleCol  = Object.entries(importColMap).find(([,v]) => v === "role")?.[0];
    let ok = 0; const errors: string[] = [];
    for (const row of importRawRows) {
      const email = emailCol ? (row[emailCol] ?? "").toLowerCase().trim() : "";
      if (!email) { errors.push(`(hàng trống email)`); continue; }
      const displayName = nameCol ? (row[nameCol] ?? "").trim() : "";
      const rawRole = roleCol ? (row[roleCol] ?? "").toLowerCase().trim() : "pm";
      const role = ROLES.includes(rawRole) ? rawRole : "pm";
      try {
        await api.createUser(email, displayName, role);
        ok++;
      } catch {
        errors.push(email);
      }
    }
    setImportResults({ ok, errors });
    setImportStep(3);
    setImporting(false);
    await reload();
  };

  const resetImport = () => {
    setShowImport(false);
    setImportStep(1);
    setImportHeaders([]);
    setImportRawRows([]);
    setImportColMap({});
    setImportResults(null);
  };

  // ── Lines tab ──────────────────────────────────────────────────────────────
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLine, setNewLine] = useState({ code: "", name: "" });
  const [editLineId, setEditLineId] = useState<number | null>(null);
  const [editLineName, setEditLineName] = useState("");

  // Handlers
  const handleAddUser = async () => {
    await api.createUser(newUser.email, newUser.displayName, newUser.role);
    setShowAddUser(false);
    setNewUser({ email: "", displayName: "", role: "pm" });
    await reload();
  };

  const handleToggleActive = async (u: ManagedUser) => {
    await api.patchUser(u.email, { active: !u.active });
    await reload();
  };

  const handlePatchRole = async (u: ManagedUser, role: string) => {
    await api.patchUser(u.email, { role });
    await reload();
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Xoá người dùng ${email}?`)) return;
    await api.deleteUser(email);
    await reload();
  };

  const handleAddLine = async () => {
    await api.createLine(newLine.code, newLine.name);
    setShowAddLine(false);
    setNewLine({ code: "", name: "" });
    await reload();
  };

  const handlePatchLine = async (id: number) => {
    await api.patchLine(id, editLineName);
    setEditLineId(null);
    await reload();
  };

  const handleDeleteLine = async (id: number) => {
    if (!window.confirm("Xoá line này?")) return;
    await api.deleteLine(id);
    await reload();
  };

  if (dataLoading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">🔐 {t.permissions}</h2>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit">
        {[
          { key: "users", label: `👤 ${t.userMgmt}` },
          { key: "lines", label: `📊 ${t.lineMgmt}` },
        ].map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key as typeof tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === tb.key ? "bg-indigo-700 text-white" : "text-gray-400 hover:text-white"
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Users ── */}
      {tab === "users" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">{t.userMgmt}</h3>
            <div className="flex gap-2">
              <button onClick={() => { setShowImport(true); setImportStep(1); }}
                className="px-3 py-1.5 bg-green-800 hover:bg-green-700 rounded-lg text-sm text-green-200">
                📥 Import Excel
              </button>
              <button onClick={() => setShowAddUser(true)}
                className="px-3 py-1.5 bg-indigo-700 rounded-lg text-sm">
                + Thêm người dùng
              </button>
            </div>
          </div>

          {/* ── Excel import panel ── */}
          {showImport && (
            <Card title="Import người dùng từ Excel" className="mb-4">
              {importStep === 1 && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-400">Chọn file .xlsx với các cột: <span className="text-white">email</span>, tên hiển thị, nhóm quyền (pm/sm/pmo/dcl).</p>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportFile}
                    className="text-sm text-gray-300 file:mr-3 file:px-3 file:py-1 file:bg-indigo-700 file:text-white file:rounded file:border-0 cursor-pointer" />
                  <button onClick={resetImport} className="w-fit px-3 py-1.5 bg-gray-700 rounded text-sm">{t.cancel}</button>
                </div>
              )}

              {importStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-3">Map cột Excel → trường dữ liệu ({importRawRows.length} hàng)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {importHeaders.map(h => (
                        <div key={h} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-28 truncate">{h}</span>
                          <span className="text-gray-600">→</span>
                          <select value={importColMap[h]} onChange={e => setImportColMap(m => ({ ...m, [h]: e.target.value as ImportColKey }))}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">
                            {USER_FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <p className="text-xs text-gray-500 mb-2">Preview (10 hàng đầu):</p>
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          {["Email", "Tên hiển thị", "Nhóm quyền"].map(h => (
                            <th key={h} className="text-left py-1 px-2 text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreviewRows.map((r, i) => (
                          <tr key={i} className="border-b border-gray-800/40">
                            <td className="py-1 px-2 text-indigo-400">{r.email || "—"}</td>
                            <td className="py-1 px-2 text-white">{r.displayName || "—"}</td>
                            <td className="py-1 px-2 text-gray-300">{r.role || "pm"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void handleImportConfirm()} disabled={importing}
                      className="px-3 py-1.5 bg-green-700 rounded text-sm disabled:opacity-50">
                      {importing ? "Đang import..." : `✅ Xác nhận import ${importRawRows.length} hàng`}
                    </button>
                    <button onClick={resetImport} className="px-3 py-1.5 bg-gray-700 rounded text-sm">{t.cancel}</button>
                  </div>
                </div>
              )}

              {importStep === 3 && importResults && (
                <div className="flex flex-col gap-3">
                  <p className="text-green-400 text-sm">✅ Import xong: <strong>{importResults.ok}</strong> người dùng.</p>
                  {importResults.errors.length > 0 && (
                    <p className="text-red-400 text-sm">❌ Lỗi: {importResults.errors.join(", ")}</p>
                  )}
                  <button onClick={resetImport} className="w-fit px-3 py-1.5 bg-gray-700 rounded text-sm">Đóng</button>
                </div>
              )}
            </Card>
          )}

          {showAddUser && (
            <Card title="Thêm người dùng" className="mb-4">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email (O365 hoặc username)</label>
                  <Inp value={newUser.email} onChange={v => setNewUser(p => ({ ...p, email: v.toLowerCase() }))} placeholder="ho.ten@fpt.com" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tên hiển thị</label>
                  <Inp value={newUser.displayName} onChange={v => setNewUser(p => ({ ...p, displayName: v }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nhóm quyền</label>
                  <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
                    {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void handleAddUser()} className="px-3 py-1.5 bg-green-700 rounded text-sm">{t.save}</button>
                <button onClick={() => setShowAddUser(false)} className="px-3 py-1.5 bg-gray-700 rounded text-sm">{t.cancel}</button>
              </div>
            </Card>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {["Email", "Tên hiển thị", "Nhóm quyền", "Trạng thái", "Thao tác"].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-600">{t.noData}</td></tr>
                )}
                {users.map(u => {
                  const isSelf = u.email === currentUser?.email;
                  return (
                    <tr key={u.email} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                      <td className="py-2 px-3 text-indigo-400">
                        {u.email} {isSelf && <span className="text-xs text-gray-500">(bạn)</span>}
                      </td>
                      <td className="py-2 px-3 text-white">{u.displayName || "—"}</td>
                      <td className="py-2 px-3">
                        {isSelf ? (
                          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">{u.role.toUpperCase()}</span>
                        ) : (
                          <select value={u.role} onChange={e => void handlePatchRole(u, e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white">
                            {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Badge label={u.active ? "Hoạt động" : "Vô hiệu"} color={u.active ? "green" : "gray"} />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {!isSelf && (
                            <>
                              <button onClick={() => void handleToggleActive(u)}
                                className={`text-xs px-2 py-0.5 rounded ${u.active ? "bg-yellow-900 text-yellow-300" : "bg-green-900 text-green-300"}`}>
                                {u.active ? "Vô hiệu hoá" : "Kích hoạt"}
                              </button>
                              <button onClick={() => void handleDeleteUser(u.email)}
                                className="text-xs px-2 py-0.5 bg-red-900 rounded text-red-300">{t.del}</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Lines ── */}
      {tab === "lines" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">{t.lineMgmt}</h3>
            <button onClick={() => setShowAddLine(true)} className="px-3 py-1.5 bg-indigo-700 rounded-lg text-sm">
              + Thêm Line
            </button>
          </div>
          {showAddLine && (
            <Card title="Thêm Line" className="mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mã Line</label>
                  <Inp value={newLine.code} onChange={v => setNewLine(p => ({ ...p, code: v }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tên Line</label>
                  <Inp value={newLine.name} onChange={v => setNewLine(p => ({ ...p, name: v }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void handleAddLine()} className="px-3 py-1.5 bg-green-700 rounded text-sm">{t.save}</button>
                <button onClick={() => setShowAddLine(false)} className="px-3 py-1.5 bg-gray-700 rounded text-sm">{t.cancel}</button>
              </div>
            </Card>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Mã", "Tên Line", "Thao tác"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-gray-600">{t.noData}</td></tr>
              )}
              {lines.map(l => (
                <tr key={l.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                  <td className="py-2 px-3 text-indigo-400 font-medium">{l.code}</td>
                  <td className="py-2 px-3 text-white">
                    {editLineId === l.id ? (
                      <div className="flex gap-2">
                        <Inp value={editLineName} onChange={setEditLineName} />
                        <button onClick={() => void handlePatchLine(l.id)} className="text-xs px-2 py-0.5 bg-green-700 rounded">{t.save}</button>
                        <button onClick={() => setEditLineId(null)} className="text-xs px-2 py-0.5 bg-gray-700 rounded">{t.cancel}</button>
                      </div>
                    ) : (l.name || "—")}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditLineId(l.id); setEditLineName(l.name); }}
                        className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">{t.editMode}</button>
                      <button onClick={() => void handleDeleteLine(l.id)}
                        className="text-xs px-2 py-0.5 bg-red-900 rounded text-red-300">{t.del}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
