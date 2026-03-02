import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import type { Project, ActualEntry } from "../types";
import type { TranslationType } from "../i18n/translations";
import { today, fmt } from "../utils/helpers";
import { api } from "../api";
import { Toast } from "./Toast";
import { Badge } from "./Badge";

interface ActualDataScreenProps {
  project: Project;
  onReload: () => Promise<void>;
  t: TranslationType;
}

export const ActualDataScreen = ({ project, onReload, t }: ActualDataScreenProps) => {
  const [activeTab, setActiveTab] = useState<"prime" | "supplier">("prime");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<{ fileName: string; allRows: Record<string, string>[]; codes: string[]; headers: string[] } | null>(null);
  const [selCodes, setSelCodes] = useState<string[]>([]);

  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // CSV/TSV parser with quoted-value support
  const parseFile = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
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

  // Flexible column lookup: exact → case-insensitive → partial
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

  const parseNum = (s: string) => parseFloat((s || "").replace(/,/g, "").replace(/\s/g, "")) || 0;

  const parseMonthYear = (s: string): string => {
    const M: Record<string, string> = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12" };
    const m = s.match(/^(\w{3})-(\d{2,4})$/);
    if (!m) return s;
    return `${m[2].length === 2 ? "20" + m[2] : m[2]}-${M[m[1]] || "01"}`;
  };

  const findDirectCostCol = (headers: string[]): string =>
    headers.find(h => h.trim() === "Direct Cost") ||
    headers.find(h => /^direct cost$/i.test(h.trim())) ||
    headers.find(h => h.toLowerCase().includes("direct cost") && !h.includes(" - ")) || "";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processRows = (headers: string[], rows: Record<string, string>[]) => {
      const codeCol = headers.find(h => /project.?code/i.test(h)) || "";
      if (!codeCol) {
        showToast("Không tìm thấy cột 'Project Code' trong file", "error");
        return;
      }
      const allCodes = [...new Set(rows.map(r => (r[codeCol] || "").trim()).filter(Boolean))];
      const pc = project.code.trim();
      // Only keep codes matching this project (+ SCD_ variants for supplier tab)
      const matchedCodes = allCodes.filter(c =>
        c.toLowerCase() === pc.toLowerCase() ||
        (activeTab === "supplier" && c.startsWith("SCD_"))
      ).sort();
      if (matchedCodes.length === 0) {
        showToast(`Không có dữ liệu cho mã dự án "${pc}" trong file`, "error");
        return;
      }
      setStaged({ fileName: file.name, allRows: rows, codes: matchedCodes, headers });
      setSelCodes(matchedCodes); // auto-select all matching codes
    };

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
          // Headers at row 3 (index 2), data from row 4 (index 3)
          const headers = aoa[2].map(h => String(h).trim());
          const dataRows = aoa.slice(3).filter(row => row.some(cell => cell !== ""));
          const rows: Record<string, string>[] = dataRows.map(cols => {
            const row: Record<string, string> = {};
            headers.forEach((h, i) => { row[h] = String(cols[i] ?? "").trim(); });
            return row;
          });
          processRows(headers, rows);
        } catch { showToast(t.importError, "error"); }
        e.target.value = "";
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        try {
          const { headers, rows } = parseFile(ev.target?.result as string);
          processRows(headers, rows);
        } catch { showToast(t.importError, "error"); }
        e.target.value = "";
      };
      reader.readAsText(file);
    }
  };

  const getPreview = () => {
    if (!staged || selCodes.length === 0) return null;
    const codeCol = staged.headers.find(h => /project.?code/i.test(h)) || "";
    const dcCol = findDirectCostCol(staged.headers);
    const filtered = staged.allRows.filter(r => selCodes.includes((r[codeCol] || "").trim()));
    const rev  = filtered.reduce((s, r) => s + parseNum(getField(r, "WIP Revenue / FSU Revenue", "WIP Revenue", "FSU Revenue")), 0);
    const cost = filtered.reduce((s, r) => s + parseNum(r[dcCol] || ""), 0);
    const bmm  = filtered.reduce((s, r) => s + parseNum(getField(r, "Billable MM", "Billable_MM")), 0);
    const ce   = filtered.reduce((s, r) => s + parseNum(getField(r, "Calendar Effort", "Calendar_Effort")), 0);
    const monthRaw = getField(filtered[0] || {}, "Month - Year", "Month-Year", "Month");
    const month = monthRaw && /[A-Za-z]/.test(monthRaw) ? parseMonthYear(monthRaw) : monthRaw || today().substring(0, 7);
    return { filtered, rev, cost, bmm, ce, month };
  };

  const handleConfirmImport = async () => {
    const preview = getPreview();
    if (!preview || preview.filtered.length === 0) { showToast("Không có dữ liệu phù hợp", "error"); return; }
    const entry: Omit<ActualEntry, "id"> = {
      month: preview.month, importedAt: today(),
      rows: preview.filtered, fileName: staged!.fileName, selectedCodes: selCodes,
      offshoreActualMM: preview.bmm, onsiteActualMM: 0,
      actualRevenue: preview.rev, actualDirectCost: preview.cost, calendarEffort: preview.ce,
    };
    await api.addActual(project.id, activeTab, entry);
    setStaged(null); setSelCodes([]);
    showToast(t.importSuccess);
    await onReload();
  };

  const preview = getPreview();
  const entries = project.actualData?.[activeTab] || [];

  return (
    <div className="p-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-white">{t.actualData}</h3>
        <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-lg text-sm">📤 {t.importActual}</button>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-800 rounded-lg p-1 w-fit">
        {([{ key: "prime" as const, label: `🏢 ${t.actualPrime}` }, { key: "supplier" as const, label: `🤝 ${t.actualSupplier}` }]).map(tb => (
          <button key={tb.key} onClick={() => { setActiveTab(tb.key); setStaged(null); setSelCodes([]); }}
            className={`px-4 py-2 rounded text-sm font-medium ${activeTab === tb.key ? "bg-gray-700 text-white" : "text-gray-500"}`}>{tb.label}</button>
        ))}
      </div>

      {/* Import format hint */}
      <div className="mb-4 px-3 py-2 bg-gray-800/60 rounded-lg text-xs text-gray-500">
        📋 Định dạng file: CSV/TSV xuất từ hệ thống P&L nội bộ. Cần cột: <span className="text-gray-300">Project Code, Month - Year, WIP Revenue / FSU Revenue, Direct Cost, Billable MM, Calendar Effort</span>.
        {activeTab === "supplier" && <span className="text-purple-400 ml-1">Supplier: chọn cả mã gốc và mã SCD_.</span>}
      </div>

      {/* Staged import panel */}
      {staged && (
        <div className="mb-6 bg-gray-900 rounded-xl border border-teal-700/50 overflow-hidden">
          <div className="px-4 py-3 bg-teal-950/40 border-b border-teal-700/40 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-300">📁 {staged.fileName}</p>
              <p className="text-xs text-gray-500">{staged.allRows.length} dòng trong file · {staged.codes.length} code khớp với <span className="text-teal-400 font-medium">{project.code}</span></p>
            </div>
            <button onClick={() => { setStaged(null); setSelCodes([]); }} className="text-gray-600 hover:text-gray-400 text-sm px-2">✕</button>
          </div>
          <div className="p-4 space-y-4">
            {/* Code selection */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Chọn Project Code để import {activeTab === "supplier" && <span className="text-purple-400 normal-case">(Supplier: chọn cả mã SCD_)</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {staged.codes.map(code => {
                  const isSel = selCodes.includes(code);
                  const isSCD = code.startsWith("SCD_");
                  return (
                    <label key={code} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition select-none ${
                      isSel ? (isSCD ? "border-purple-500 bg-purple-900/30 text-purple-200" : "border-teal-500 bg-teal-900/30 text-teal-200")
                             : "border-gray-700 text-gray-500 hover:border-gray-600"}`}>
                      <input type="checkbox" checked={isSel}
                        onChange={e => setSelCodes(prev => e.target.checked ? [...prev, code] : prev.filter(c => c !== code))}
                        className="accent-teal-500" />
                      {isSCD && <span className="text-xs bg-purple-800/60 text-purple-300 px-1 rounded">SCD</span>}
                      <span>{code}</span>
                    </label>
                  );
                })}
              </div>
              {activeTab === "supplier" && (
                <p className="text-xs text-gray-600 mt-2">💡 Với Supplier, hãy chọn đồng thời mã dự án gốc và mã SCD_ để tổng hợp đầy đủ chi phí.</p>
              )}
            </div>

            {/* Preview aggregated data */}
            {preview && preview.filtered.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-2">Xem trước dữ liệu sẽ import ({preview.filtered.length} dòng · Tháng: <span className="text-teal-300">{preview.month}</span>)</p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { lb: "Revenue", val: `$${fmt(preview.rev)}` },
                    { lb: "Direct Cost", val: `$${fmt(preview.cost)}` },
                    { lb: "Billable MM", val: `${preview.bmm.toFixed(2)} MM` },
                    { lb: "Calendar Effort", val: `${preview.ce.toFixed(2)} MM` },
                  ].map(item => (
                    <div key={item.lb} className="bg-gray-900 rounded-lg p-2">
                      <p className="text-xs text-gray-500">{item.lb}</p>
                      <p className="text-sm font-bold text-teal-300">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selCodes.length > 0 && (!preview || preview.filtered.length === 0) && (
              <p className="text-xs text-yellow-500">⚠️ Không tìm thấy dòng nào khớp với code đã chọn trong file.</p>
            )}

            {/* Confirm / Cancel */}
            <div className="flex gap-2">
              <button onClick={() => void handleConfirmImport()} disabled={selCodes.length === 0 || !preview || preview.filtered.length === 0}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded-lg text-sm font-medium">
                ✅ Xác nhận Import ({selCodes.length} code đã chọn)
              </button>
              <button onClick={() => { setStaged(null); setSelCodes([]); }} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Existing entries */}
      {entries.length === 0 && !staged ? (
        <div className="text-center py-12 text-gray-600"><div className="text-4xl mb-3">📊</div><p>{t.noData}</p></div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge label={entry.month} color="teal" />
                    <span className="text-xs text-gray-500">{t.lastUpdated}: {entry.importedAt}</span>
                    <span className="text-xs text-gray-600">📁 {entry.fileName}</span>
                  </div>
                  {entry.selectedCodes?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {entry.selectedCodes.map(c => (
                        <span key={c} className={`text-xs px-2 py-0.5 rounded font-medium ${c.startsWith("SCD_") ? "bg-purple-900/50 text-purple-300" : "bg-indigo-900/50 text-indigo-300"}`}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => { void api.deleteActual(entry.id).then(() => onReload()); }}
                  className="text-xs px-3 py-1 bg-red-900 rounded-lg text-red-300 shrink-0">{t.del}</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { lb: "Revenue", val: entry.actualRevenue > 0 ? `$${fmt(entry.actualRevenue)}` : "—", cls: "text-blue-300" },
                  { lb: "Direct Cost", val: entry.actualDirectCost > 0 ? `$${fmt(entry.actualDirectCost)}` : "—", cls: "text-orange-300" },
                  { lb: "Billable MM", val: entry.offshoreActualMM > 0 ? `${entry.offshoreActualMM.toFixed(2)} MM` : "—", cls: "text-teal-300" },
                  { lb: "Calendar Effort", val: entry.calendarEffort > 0 ? `${entry.calendarEffort.toFixed(2)} MM` : "—", cls: "text-indigo-300" },
                ].map(item => (
                  <div key={item.lb} className="bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">{item.lb}</p>
                    <p className={`text-sm font-semibold ${item.cls}`}>{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
