import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { api } from "../api";
import type { MasterProject } from "../types";
import type { TranslationType } from "../i18n/translations";

interface Props { t: TranslationType; }

function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

// ── Date parser: "D/Mon/YY" → "YYYY-MM-DD" ───────────────────────────────────
const MONTH_MAP: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};
function parseFptDate(s: string): string {
  if (!s) return "";
  const m = s.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})$/);
  if (!m) return s;
  const [, d, mon, y] = m;
  const month = MONTH_MAP[mon] ?? MONTH_MAP[mon.charAt(0).toUpperCase() + mon.slice(1).toLowerCase()];
  if (!month) return s;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${month}-${d.padStart(2, "0")}`;
}

// ── Parse FPT Excel export ────────────────────────────────────────────────────
type ImportRow = {
  projectCode: string; projectName: string; projectDescription: string;
  startDate: string; endDate: string; projectType: string; contractType: string;
  projectManager: string;
};

function parseXlsx(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
        if (jsonData.length < 2) { resolve([]); return; }

        const headerRow = jsonData[0].map(h => String(h).trim());
        const colIdx = (name: string) => headerRow.indexOf(name);

        const rows: ImportRow[] = jsonData.slice(1)
          .map(row => {
            const get = (name: string) => String((row as string[])[colIdx(name)] ?? "").trim();
            return {
              projectCode:       get("Project Code").toUpperCase(),
              projectName:       get("Project Name"),
              projectDescription:get("Short Description"),
              startDate:         parseFptDate(get("Start Date")),
              endDate:           parseFptDate(get("End Date")),
              projectType:       get("Project Category") || get("Project Type"),
              contractType:      get("Project Contract Type"),
              projectManager:    get("Project Manager").toLowerCase(),
            };
          })
          .filter(r => r.projectCode && r.projectName);

        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Import section ────────────────────────────────────────────────────────────
function ImportSection({ onDone, t }: { onDone: () => void; t: TranslationType }) {
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [result, setResult]   = useState<{ success: number; failed: number; errors: { projectCode: string; error: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (f: File) => {
    setFile(f);
    setResult(null);
    try {
      const rows = await parseXlsx(f);
      setPreview(rows.slice(0, 10));
    } catch {
      setPreview([]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const rows = await parseXlsx(file);
      const res = await api.importMasterProjects(rows);
      setResult({ success: res.success, failed: res.failed, errors: res.errors });
      if (res.success > 0) onDone();
    } catch (err) {
      setResult({ success: 0, failed: 1, errors: [{ projectCode: "—", error: err instanceof Error ? err.message : "Lỗi" }] });
    } finally {
      setLoading(false);
    }
  };

  const COLS: (keyof ImportRow)[] = ["projectCode", "projectName", "projectType", "contractType", "startDate", "endDate"];
  const COL_LABELS: Record<string, string> = {
    projectCode: "Mã dự án", projectName: "Tên dự án", projectType: "Loại dự án",
    contractType: "Loại HĐ", startDate: "Bắt đầu", endDate: "Kết thúc",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-white text-sm">📥 Import danh sách dự án từ FPT Excel</h2>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Tải lên file <span className="text-gray-300 font-medium">List Project Export Full.xlsx</span> từ hệ thống FPT.
        Hệ thống sẽ tự đọc các cột: <span className="text-gray-400">Project Code, Project Name, Short Description, Start Date, End Date, Project Category, Project Contract Type</span>.
      </p>

      {/* Drop zone */}
      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-8 cursor-pointer transition ${
        file ? "border-indigo-600 bg-indigo-950/20" : "border-gray-700 hover:border-gray-600"
      }`}>
        <span className="text-2xl mb-2">📂</span>
        <span className="text-sm text-gray-400">{file ? `✓ ${file.name}` : "Kéo thả hoặc nhấn để chọn"}</span>
        <span className="text-xs text-gray-600 mt-1">Excel (.xlsx / .xls)</span>
        <input type="file" accept=".xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) void handleFileChange(f); }} className="hidden" />
      </label>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs text-gray-400 mb-2">Xem trước ({preview.length} hàng đầu)</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-gray-400">
                  {COLS.map(c => <th key={c} className="text-left px-3 py-2">{COL_LABELS[c]}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/30">
                    {COLS.map(c => <td key={c} className="px-3 py-1.5 text-gray-300">{row[c] || "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button onClick={() => void handleImport()} disabled={!file || loading || preview.length === 0}
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white font-medium">
          {loading ? "Đang import…" : t.confirmImport}
        </button>
      </div>

      {result && (
        <div className="mt-3 bg-gray-800 rounded-lg px-4 py-3 text-sm">
          <div className="flex gap-4">
            <span className="text-green-400">{t.successCount}: <b>{result.success}</b></span>
            {result.failed > 0 && <span className="text-red-400">{t.errorCount}: <b>{result.failed}</b></span>}
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-xs text-red-400 space-y-0.5">
              {result.errors.map((e, i) => <li key={i}>• [{e.projectCode}] {e.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export const MasterProjectsScreen = ({ t }: Props) => {
  const [projects, setProjects] = useState<MasterProject[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const { toast, show: showToast } = useToast();

  const load = async () => {
    try { setProjects(await api.getMasterProjects()); }
    catch { showToast("Không tải được danh sách.", false); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = projects.filter(p =>
    !search ||
    p.projectCode.toLowerCase().includes(search.toLowerCase()) ||
    p.projectName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (p: MasterProject) => {
    if (p.hasPlanning) { showToast(`Dự án "${p.projectCode}" đã có Planning, không thể xóa.`, false); return; }
    if (!window.confirm(`${t.confirmDelete}: [${p.projectCode}] ${p.projectName}?`)) return;
    try {
      await api.deleteMasterProject(p.id);
      showToast(t.savedOK);
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.importError, false);
    }
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border ${
          toast.ok ? "bg-green-950 text-green-200 border-green-800" : "bg-red-950 text-red-200 border-red-800"
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">📋 {t.masterProjectMgmt}</h1>
        <span className="text-sm text-gray-500">{projects.length} dự án</span>
      </div>

      <ImportSection t={t} onDone={() => void load()} />

      {/* Search */}
      <div className="mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t.search} (mã / tên)…`}
          className="w-full max-w-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-12">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-12">{t.noData}</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">{t.projectCode}</th>
                <th className="text-left px-4 py-3">{t.projectName}</th>
                <th className="text-left px-4 py-3">{t.projectType}</th>
                <th className="text-left px-4 py-3">{t.contractType}</th>
                <th className="text-left px-4 py-3">{t.startDate}</th>
                <th className="text-left px-4 py-3">{t.endDate}</th>
                <th className="text-left px-4 py-3">{t.importedDate}</th>
                <th className="text-left px-4 py-3">Planning</th>
                <th className="text-right px-4 py-3">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-indigo-400 font-mono font-medium">{p.projectCode}</td>
                  <td className="px-4 py-3 text-white">{p.projectName}</td>
                  <td className="px-4 py-3 text-gray-400">{p.projectType ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{p.contractType ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(p.startDate)}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(p.endDate)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.importedAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.hasPlanning ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-500"}`}>
                      {p.hasPlanning ? t.hasPlanning : t.noPlanning}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => void handleDelete(p)}
                      disabled={p.hasPlanning}
                      className="text-xs px-3 py-1 bg-red-900/60 hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-red-300">
                      {t.del}
                    </button>
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
