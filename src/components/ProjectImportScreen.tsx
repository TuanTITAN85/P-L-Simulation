import { useState } from "react";
import type { ProjectImportRow } from "../types";
import type { TranslationType } from "../i18n/translations";
import { api } from "../api";
import * as XLSX from "xlsx";

interface ProjectImportScreenProps {
  onBack: () => void;
  onDone: () => void;
  t: TranslationType;
}

type FieldKey = "code" | "name" | "startDate" | "endDate" | "status" | "lineCode" | "skip";
type ColMap = Record<string, FieldKey>;

const FIELD_OPTIONS: { value: FieldKey; label: string }[] = [
  { value: "skip",      label: "— Bỏ qua —" },
  { value: "code",      label: "Mã dự án" },
  { value: "name",      label: "Tên dự án" },
  { value: "startDate", label: "Ngày bắt đầu" },
  { value: "endDate",   label: "Ngày kết thúc" },
  { value: "status",    label: "Trạng thái" },
  { value: "lineCode",  label: "Mã Line" },
];

const AUTO_DETECT: Record<string, FieldKey> = {
  "mã dự án": "code", "project code": "code", "code": "code", "mã": "code",
  "tên dự án": "name", "project name": "name", "name": "name", "tên": "name",
  "ngày bắt đầu": "startDate", "start date": "startDate", "startdate": "startDate",
  "ngày kết thúc": "endDate", "end date": "endDate", "enddate": "endDate",
  "trạng thái": "status", "status": "status",
  "line": "lineCode", "line code": "lineCode", "mã line": "lineCode",
};

type ImportResult = {
  results: { code: string; action: string; id: number }[];
  errors:  { code: string; error: string }[];
};

export const ProjectImportScreen = ({ onBack, onDone, t }: ProjectImportScreenProps) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [colMap, setColMap] = useState<ColMap>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
      if (jsonData.length < 2) return;
      const hdrs = jsonData[0].map(String);
      const rows = jsonData.slice(1)
        .map(row => Object.fromEntries(hdrs.map((h, i) => [h, String((row as string[])[i] ?? "")])))
        .filter(row => Object.values(row).some((v: string) => v.trim() !== ""));
      setHeaders(hdrs);
      setRawRows(rows);
      const map: ColMap = {};
      hdrs.forEach(h => { map[h] = AUTO_DETECT[h.toLowerCase().trim()] ?? "skip"; });
      setColMap(map);
      setStep(2);
    };
    reader.readAsArrayBuffer(file);
  };

  const mappedRows: ProjectImportRow[] = rawRows.map(row => {
    const r: ProjectImportRow = {};
    headers.forEach(h => {
      const field = colMap[h];
      if (field && field !== "skip") (r as Record<string, string>)[field] = row[h];
    });
    return r;
  });

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api.importProjects(mappedRows);
      setResult(res);
      setStep(4);
    } catch (err) {
      console.error("Import failed:", err);
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setStep(1);
    setHeaders([]);
    setRawRows([]);
    setColMap({});
    setResult(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-white text-sm">← {t.back}</button>
        <h2 className="text-xl font-bold text-white">📥 {t.importFromExcel}</h2>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8 max-w-md">
        {([1, 2, 3, 4] as const).map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              step >= s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-500"
            }`}>{s}</div>
            {i < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-indigo-600" : "bg-gray-800"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="max-w-md">
          <h3 className="text-white font-semibold mb-2">Bước 1: Tải lên file Excel</h3>
          <p className="text-sm text-gray-400 mb-4">Chọn file .xlsx chứa thông tin dự án cần import.</p>
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gray-700 hover:border-indigo-600 rounded-xl p-10 text-center transition">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-gray-400 text-sm">Kéo thả hoặc click để chọn file .xlsx / .xls</p>
            </div>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </label>
        </div>
      )}

      {/* Step 2: Column mapping */}
      {step === 2 && (
        <div className="max-w-2xl">
          <h3 className="text-white font-semibold mb-2">Bước 2: Ánh xạ cột dữ liệu</h3>
          <p className="text-sm text-gray-400 mb-4">Xác nhận các cột tương ứng với trường trong hệ thống.</p>
          <div className="space-y-2 mb-6">
            {headers.map(h => (
              <div key={h} className="flex items-center gap-4 p-2 bg-gray-900 rounded-lg">
                <span className="text-sm text-gray-300 w-48 truncate">{h}</span>
                <span className="text-gray-600">→</span>
                <select value={colMap[h] ?? "skip"}
                  onChange={e => setColMap(m => ({ ...m, [h]: e.target.value as FieldKey }))}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white flex-1">
                  {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">Xem trước →</button>
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.back}</button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div>
          <h3 className="text-white font-semibold mb-2">
            Bước 3: Xem trước dữ liệu ({rawRows.length} hàng)
          </h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {(["code", "name", "startDate", "endDate", "status", "lineCode"] as const).map(f => (
                    <th key={f} className="text-left py-2 px-3 text-gray-500">
                      {FIELD_OPTIONS.find(o => o.value === f)?.label ?? f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappedRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-1.5 px-3 text-indigo-400">{row.code || "—"}</td>
                    <td className="py-1.5 px-3 text-white">{row.name || "—"}</td>
                    <td className="py-1.5 px-3 text-gray-400">{row.startDate || "—"}</td>
                    <td className="py-1.5 px-3 text-gray-400">{row.endDate || "—"}</td>
                    <td className="py-1.5 px-3 text-gray-400">{row.status || "—"}</td>
                    <td className="py-1.5 px-3 text-gray-400">{row.lineCode || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rawRows.length > 10 && (
              <p className="text-xs text-gray-600 mt-2">... và {rawRows.length - 10} hàng khác</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleImport()} disabled={importing}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm disabled:opacity-50">
              {importing ? "Đang import..." : `✅ Xác nhận import (${rawRows.length} hàng)`}
            </button>
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.back}</button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && result && (
        <div className="max-w-lg">
          <h3 className="text-white font-semibold mb-4">Bước 4: Kết quả import</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-950 border border-green-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {result.results.filter(r => r.action === "created").length}
              </div>
              <div className="text-xs text-green-600 mt-1">Tạo mới</div>
            </div>
            <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {result.results.filter(r => r.action === "updated").length}
              </div>
              <div className="text-xs text-blue-600 mt-1">Cập nhật</div>
            </div>
            <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{result.errors.length}</div>
              <div className="text-xs text-red-600 mt-1">Lỗi</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-red-300 mb-2">Chi tiết lỗi:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">{e.code}: {e.error}</p>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { onDone(); }}
              className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">← Về danh sách dự án</button>
            <button onClick={resetImport}
              className="px-4 py-2 bg-gray-700 rounded-lg text-sm">Import thêm</button>
          </div>
        </div>
      )}
    </div>
  );
};
