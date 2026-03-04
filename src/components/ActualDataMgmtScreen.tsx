import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import type { TranslationType } from "../i18n/translations";
import { today } from "../utils/helpers";
import { api } from "../api";
import { Toast } from "./Toast";

interface Props { t: TranslationType; }

interface ActualEntry {
  id: number;
  project_code: string;
  tab: string;
  month: string;
  offshore_actual_mm: number;
  onsite_actual_mm: number;
  actual_revenue: number;
  actual_direct_cost: number;
  calendar_effort: number;
  file_name: string;
  imported_at: string;
  selected_codes: string[];
}

interface ParsedEntry {
  projectCode: string;
  month: string;
  rows: Record<string, string>[];
  offshoreActualMM: number;
  actualRevenue: number;
  actualDirectCost: number;
  calendarEffort: number;
}

export const ActualDataMgmtScreen = ({ t }: Props) => {
  const [activeTab, setActiveTab] = useState<"prime" | "supplier">("prime");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<{
    fileName: string;
    entries: ParsedEntry[];
    headers: string[];
  } | null>(null);
  const [selCodes, setSelCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; failed: number; errors: { projectCode: string; reason: string }[] } | null>(null);

  const [entries, setEntries] = useState<ActualEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const loadEntries = async (tab: "prime" | "supplier", q?: string) => {
    setEntriesLoading(true);
    try {
      const data = await api.getActualEntries(tab, q);
      setEntries(data ?? []);
    } catch { /* silent */ }
    finally { setEntriesLoading(false); }
  };

  useEffect(() => { void loadEntries(activeTab, search || undefined); }, [activeTab]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    void loadEntries(activeTab, e.target.value || undefined);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa bản ghi này?")) return;
    setDeletingId(id);
    try {
      await api.deleteActualEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      showToast("Đã xóa bản ghi.");
    } catch { showToast("Xóa thất bại.", "error"); }
    finally { setDeletingId(null); }
  };

  const parseNum = (s: string) => parseFloat((s || "").replace(/,/g, "").replace(/\s/g, "")) || 0;

  const parseMonthYear = (s: string): string => {
    const M: Record<string, string> = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12" };
    const m = s.match(/^(\w{3})-(\d{2,4})$/);
    if (!m) return s;
    return `${m[2].length === 2 ? "20" + m[2] : m[2]}-${M[m[1]] || "01"}`;
  };

  const getField = (row: Record<string, string>, ...candidates: string[]): string => {
    for (const c of candidates) {
      if (row[c] !== undefined) return row[c];
      const k = Object.keys(row).find(h => h.toLowerCase() === c.toLowerCase());
      if (k) return row[k];
    }
    for (const c of candidates) {
      const k = Object.keys(row).find(h => h.toLowerCase().includes(c.toLowerCase()));
      if (k) return row[k];
    }
    return "";
  };

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    const delim = (lines[0].match(/\t/g) || []).length >= (lines[0].match(/,/g) || []).length ? "\t" : ",";
    const splitLine = (line: string): string[] => {
      const result: string[] = []; let cur = ""; let inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === delim && !inQ) { result.push(cur.trim()); cur = ""; }
        else { cur += ch; }
      }
      result.push(cur.trim());
      return result;
    };
    const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim());
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = (cols[idx] || "").replace(/^"|"$/g, "").trim(); });
      rows.push(row);
    }
    return { headers, rows };
  };

  const buildEntries = (headers: string[], rows: Record<string, string>[]): ParsedEntry[] => {
    const codeCol = headers.find(h => /project.?code/i.test(h)) || "";
    if (!codeCol) return [];

    // Direct Cost = sum of 5 component columns
    const DC_COLS = [
      "Direct Cost - Salary Expense",
      "Direct Cost - Manpower Hiring (POI)",
      "Direct Cost - Manpower Hiring (APP)",
      "Direct Cost - Other Direct Expense",
      "Direct Cost - General Expense Per Norm",
    ];
    const resolvedDcCols = DC_COLS.map(name => {
      const exact = headers.find(h => h.trim() === name);
      if (exact) return exact;
      return headers.find(h => h.toLowerCase().includes(name.toLowerCase().replace(/\s*\(.*\)/, "").trim())) || "";
    });

    // Group rows by project code
    const grouped = new Map<string, Record<string, string>[]>();
    for (const row of rows) {
      const code = (row[codeCol] || "").trim().toUpperCase();
      if (!code) continue;
      if (!grouped.has(code)) grouped.set(code, []);
      grouped.get(code)!.push(row);
    }

    const entries: ParsedEntry[] = [];
    for (const [code, codeRows] of grouped) {
      const monthRaw = getField(codeRows[0], "Month - Year", "Month-Year", "Month");
      const month = monthRaw && /[A-Za-z]/.test(monthRaw) ? parseMonthYear(monthRaw) : monthRaw || today().substring(0, 7);
      const rev  = codeRows.reduce((s, r) => s + parseNum(getField(r, "WIP Revenue / FSU Revenue", "WIP Revenue", "FSU Revenue")), 0);
      const cost = codeRows.reduce((s, r) => s + resolvedDcCols.reduce((acc, col) => acc + parseNum(r[col] || ""), 0), 0);
      const bmm  = codeRows.reduce((s, r) => s + parseNum(getField(r, "Billable MM", "Billable_MM")), 0);
      const ce   = codeRows.reduce((s, r) => s + parseNum(getField(r, "Calendar Effort", "Calendar_Effort")), 0);
      entries.push({ projectCode: code, month, rows: codeRows, offshoreActualMM: bmm, actualRevenue: rev, actualDirectCost: cost, calendarEffort: ce });
    }
    return entries;
  };

  const processRawData = (headers: string[], rows: Record<string, string>[], fileName: string) => {
    const codeCol = headers.find(h => /project.?code/i.test(h)) || "";
    if (!codeCol) { showToast("Không tìm thấy cột 'Project Code' trong file", "error"); return; }
    const entries = buildEntries(headers, rows);
    if (entries.length === 0) { showToast("Không đọc được dữ liệu từ file", "error"); return; }
    setStaged({ fileName, entries, headers });
    setSelCodes(entries.map(e => e.projectCode));
    setResult(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(new Uint8Array(ev.target?.result as ArrayBuffer), { type: "array" });
          const ws = wb.Sheets["Sheet1"];
          if (!ws) { showToast("Không tìm thấy sheet 'Sheet1' trong file", "error"); e.target.value = ""; return; }
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
          if (aoa.length < 4) { showToast("File không đủ dữ liệu (cần ít nhất 4 dòng)", "error"); e.target.value = ""; return; }
          const headers = aoa[2].map(h => String(h).trim());
          const dataRows = aoa.slice(3).filter(row => row.some(cell => cell !== ""));
          const rows: Record<string, string>[] = dataRows.map(cols => {
            const row: Record<string, string> = {};
            headers.forEach((h, i) => { row[h] = String(cols[i] ?? "").trim(); });
            return row;
          });
          processRawData(headers, rows, file.name);
        } catch { showToast(t.importError, "error"); }
        e.target.value = "";
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        try {
          const { headers, rows } = parseCSV(ev.target?.result as string);
          processRawData(headers, rows, file.name);
        } catch { showToast(t.importError, "error"); }
        e.target.value = "";
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!staged || selCodes.length === 0) return;
    setLoading(true);
    try {
      const selected = staged.entries.filter(e => selCodes.includes(e.projectCode));
      const entries = selected.map(e => ({
        projectCode: e.projectCode,
        month: e.month,
        importedAt: today(),
        fileName: staged.fileName,
        selectedCodes: [e.projectCode],
        offshoreActualMM: e.offshoreActualMM,
        onsiteActualMM: 0,
        actualRevenue: e.actualRevenue,
        actualDirectCost: e.actualDirectCost,
        calendarEffort: e.calendarEffort,
        rows: e.rows,
      }));
      const res = await api.importActualByCode(activeTab, entries);
      setResult(res);
      showToast(`Import hoàn tất: ${res.inserted} thành công${res.failed > 0 ? `, ${res.failed} lỗi` : ""}.`, res.failed === 0 ? "success" : "error");
      if (res.inserted > 0) { setStaged(null); setSelCodes([]); void loadEntries(activeTab, search || undefined); }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi import.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n === 0 ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">📊 {t.actualDataImport}</h1>
        <button onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-lg text-sm font-medium">
          📤 Chọn file
        </button>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Tab prime / supplier */}
      <div className="flex gap-1 mb-5 bg-gray-800 rounded-lg p-1 w-fit">
        {([{ key: "prime" as const, label: `🏢 ${t.actualPrime}` }, { key: "supplier" as const, label: `🤝 ${t.actualSupplier}` }]).map(tb => (
          <button key={tb.key} onClick={() => { setActiveTab(tb.key); setStaged(null); setSelCodes([]); setResult(null); setSearch(""); void loadEntries(tb.key); }}
            className={`px-4 py-2 rounded text-sm font-medium ${activeTab === tb.key ? "bg-gray-700 text-white" : "text-gray-500"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Format hint */}
      <div className="mb-5 px-3 py-2 bg-gray-800/60 rounded-lg text-xs text-gray-500">
        📋 Định dạng file: CSV/TSV/Excel (.xlsx) xuất từ hệ thống P&L nội bộ. Cần cột:{" "}
        <span className="text-gray-300">Project Code, Month - Year, WIP Revenue / FSU Revenue, Direct Cost, Billable MM, Calendar Effort</span>.
        {activeTab === "supplier" && <span className="text-purple-400 ml-1">Supplier: chọn cả mã gốc và mã SCD_.</span>}
      </div>

      {/* Upload zone (shown when no staged) */}
      {!staged && (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-xl py-16 cursor-pointer transition mb-6">
          <span className="text-4xl mb-3">📂</span>
          <span className="text-sm text-gray-400">Kéo thả hoặc click để chọn file</span>
          <span className="text-xs text-gray-600 mt-1">CSV / TSV / Excel (.xlsx, .xls)</span>
          <input type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" className="hidden" onChange={handleFileSelect} />
        </label>
      )}

      {/* Staged panel */}
      {staged && (
        <div className="mb-6 bg-gray-900 rounded-xl border border-teal-700/50 overflow-hidden">
          <div className="px-4 py-3 bg-teal-950/40 border-b border-teal-700/40 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-300">📁 {staged.fileName}</p>
              <p className="text-xs text-gray-500">
                {staged.entries.reduce((s, e) => s + e.rows.length, 0)} dòng · {staged.entries.length} mã dự án
              </p>
            </div>
            <button onClick={() => { setStaged(null); setSelCodes([]); setResult(null); }} className="text-gray-600 hover:text-gray-400 text-sm px-2">✕</button>
          </div>

          <div className="p-4 space-y-4">
            {/* Code selection + preview table */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chọn mã dự án để import</p>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800 text-gray-400">
                    <th className="px-3 py-2 w-8">
                      <input type="checkbox"
                        checked={selCodes.length === staged.entries.length}
                        onChange={e => setSelCodes(e.target.checked ? staged.entries.map(x => x.projectCode) : [])}
                        className="accent-teal-500" />
                    </th>
                    <th className="text-left px-3 py-2">Project Code</th>
                    <th className="text-left px-3 py-2">Tháng</th>
                    <th className="text-right px-3 py-2">Revenue</th>
                    <th className="text-right px-3 py-2">Direct Cost</th>
                    <th className="text-right px-3 py-2">Billable MM</th>
                    <th className="text-right px-3 py-2">Cal. Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {staged.entries.map(entry => {
                    const isSel = selCodes.includes(entry.projectCode);
                    const isSCD = entry.projectCode.startsWith("SCD_");
                    return (
                      <tr key={entry.projectCode} className={`border-t border-gray-800 ${isSel ? "bg-teal-900/10" : "opacity-50"}`}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={isSel}
                            onChange={e => setSelCodes(prev => e.target.checked ? [...prev, entry.projectCode] : prev.filter(c => c !== entry.projectCode))}
                            className="accent-teal-500" />
                        </td>
                        <td className="px-3 py-2">
                          <span className={`font-mono font-medium ${isSCD ? "text-purple-300" : "text-teal-300"}`}>{entry.projectCode}</span>
                          <span className="text-gray-600 ml-1">({entry.rows.length} dòng)</span>
                        </td>
                        <td className="px-3 py-2 text-indigo-300">{entry.month}</td>
                        <td className="px-3 py-2 text-right text-gray-300">{fmt(entry.actualRevenue)}</td>
                        <td className="px-3 py-2 text-right text-orange-300">{fmt(entry.actualDirectCost)}</td>
                        <td className="px-3 py-2 text-right text-teal-300">{entry.offshoreActualMM.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-gray-300">{entry.calendarEffort.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button onClick={() => void handleImport()}
                disabled={selCodes.length === 0 || loading}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded-lg text-sm font-medium">
                {loading ? "Đang import…" : `✅ Import ${selCodes.length} mã đã chọn`}
              </button>
              <button onClick={() => { setStaged(null); setSelCodes([]); }} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">{t.importResult}</h3>
          <div className="flex gap-6 text-sm mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">{t.successCount}</div>
              <div className="text-2xl font-bold text-green-400">{result.inserted}</div>
            </div>
            {result.failed > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{t.errorCount}</div>
                <div className="text-2xl font-bold text-red-400">{result.failed}</div>
              </div>
            )}
          </div>
          {result.errors.length > 0 && (
            <ul className="text-xs text-red-400 space-y-1 max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => <li key={i}>• {e.projectCode}: {e.reason}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* ── Imported entries list ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300">📋 Dữ liệu đã import ({entries.length})</h2>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Tìm mã dự án…"
              className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 w-44 focus:outline-none focus:border-teal-600"
            />
            <button onClick={() => void loadEntries(activeTab, search || undefined)}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg">
              🔄
            </button>
          </div>
        </div>

        {entriesLoading ? (
          <div className="text-center py-10 text-gray-600 text-sm">Đang tải…</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-gray-600 text-sm">Chưa có dữ liệu nào được import.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-gray-400">
                  <th className="text-left px-3 py-2">Project Code</th>
                  <th className="text-left px-3 py-2">Tháng</th>
                  <th className="text-right px-3 py-2">Revenue</th>
                  <th className="text-right px-3 py-2">Direct Cost</th>
                  <th className="text-right px-3 py-2">Billable MM</th>
                  <th className="text-right px-3 py-2">Cal. Effort</th>
                  <th className="text-left px-3 py-2">File</th>
                  <th className="text-left px-3 py-2">Import lúc</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    <td className="px-3 py-2 font-mono font-medium text-teal-300">{e.project_code}</td>
                    <td className="px-3 py-2 text-indigo-300">{e.month}</td>
                    <td className="px-3 py-2 text-right text-gray-300">{fmt(Number(e.actual_revenue))}</td>
                    <td className="px-3 py-2 text-right text-orange-300">{fmt(Number(e.actual_direct_cost))}</td>
                    <td className="px-3 py-2 text-right text-teal-300">{Number(e.offshore_actual_mm).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-gray-300">{Number(e.calendar_effort).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[140px] truncate" title={e.file_name}>{e.file_name || "—"}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{e.imported_at ? e.imported_at.substring(0, 10) : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => void handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="text-red-500 hover:text-red-400 disabled:opacity-40 px-1"
                        title="Xóa bản ghi này"
                      >🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
