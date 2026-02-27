import { useState, useMemo } from "react";
import type { AdminConfig, CostRef, CostRefItem } from "../types";
import type { TranslationType } from "../i18n/translations";
import { PACKAGES } from "../constants/packages";
import { DEFAULT_LOCS } from "../constants/defaults";
import { today, fmtN } from "../utils/helpers";
import { Toast } from "./Toast";

interface CostRefTableProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  t: TranslationType;
}

export const CostRefTable = ({ config, setConfig, t }: CostRefTableProps) => {
  const [activeType, setActiveType] = useState<"Primer" | "Supplier">("Primer");
  const [activeSub, setActiveSub] = useState<"salary" | "insurance">("salary");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, Record<string, string>> | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const locs = config.locations || DEFAULT_LOCS;
  const isShared = activeType === "Supplier" && activeSub === "insurance";
  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const getEff = (): CostRefItem => isShared
    ? config.costRef?.Primer?.insurance || { table: {}, unit: "USD", lastUpdated: "" }
    : (config.costRef?.[activeType]?.[activeSub] as CostRefItem) || { table: {}, unit: "USD", lastUpdated: "" };
  const startEdit = () => {
    if (isShared) return;
    const cur = getEff();
    const s: Record<string, Record<string, string>> = {};
    locs.forEach(l => { s[l.code] = {}; PACKAGES.forEach(p => { s[l.code][p] = cur.table?.[l.code]?.[p] || ""; }); });
    setDraft(s); setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setDraft(null); };
  const saveEdit = () => {
    if (!draft) return;
    setConfig(c => ({
      ...c,
      costRef: {
        ...c.costRef,
        [activeType]: {
          ...c.costRef?.[activeType],
          [activeSub]: { table: draft, unit: "USD", lastUpdated: today() }
        }
      } as CostRef
    }));
    setEditing(false); setDraft(null);
    showToast(t.savedOK);
  };
  const cur = getEff();
  const activeTable = editing ? draft : cur.table;
  const allVals = useMemo(() =>
    locs.flatMap(l => PACKAGES.map(p => Number(cur.table?.[l.code]?.[p]) || 0)).filter(v => v > 0),
    [cur.table, locs]
  );
  const getHeat = (val: string): string => {
    if (!val || isNaN(Number(val))) return "";
    const v = Number(val);
    const mn = Math.min(...allVals), mx = Math.max(...allVals);
    const r = mx > mn ? (v - mn) / (mx - mn) : 0.5;
    if (r < 0.33) return "bg-blue-900/40 text-blue-300";
    if (r < 0.66) return "bg-indigo-900/40 text-indigo-300";
    return "bg-purple-900/40 text-purple-300";
  };
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="flex gap-3 mb-5">
        {(["Primer", "Supplier"] as const).map(tp => (
          <button key={tp} onClick={() => { setActiveType(tp); setEditing(false); }}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${activeType === tp ? (tp === "Primer" ? "border-indigo-500 bg-indigo-900/30 text-indigo-300" : "border-purple-500 bg-purple-900/30 text-purple-300") : "border-gray-700 text-gray-500"}`}>
            {tp === "Primer" ? "🏢 " : "🤝 "}{tp === "Primer" ? t.primer : t.supplier}
          </button>
        ))}
      </div>
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1 w-fit">
        {([{ key: "salary" as const, label: `💰 ${t.salaryRef}` }, { key: "insurance" as const, label: `🏥 ${t.insuranceRef}` }]).map(tb => (
          <button key={tb.key} onClick={() => { setActiveSub(tb.key); setEditing(false); }}
            className={`px-4 py-1.5 rounded text-sm font-medium transition ${activeSub === tb.key ? "bg-gray-700 text-white" : "text-gray-500"}`}>
            {tb.label}
          </button>
        ))}
      </div>
      {isShared && cur.lastUpdated && <p className="text-xs text-gray-500 mb-3">🕐 {t.lastUpdated}: {cur.lastUpdated} <span className="text-gray-600">({t.sharedIns})</span></p>}
      {!isShared && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {!editing
              ? <button onClick={startEdit} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm">✏️ {t.editMode}</button>
              : <>
                  <button onClick={saveEdit} className="px-4 py-2 bg-green-700 rounded-lg text-sm">💾 {t.save}</button>
                  <button onClick={cancelEdit} className="px-3 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button>
                </>
            }
          </div>
          {cur.lastUpdated && <span className="text-xs text-gray-500">🕐 {t.lastUpdated}: {cur.lastUpdated}</span>}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-semibold sticky left-0 bg-gray-800">{t.location}</th>
              {PACKAGES.map(p => <th key={p} className="text-center py-3 px-2 text-gray-300 font-bold">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {locs.map((loc, li) => (
              <tr key={loc.code} className={`border-b border-gray-800/60 ${li % 2 === 0 ? "bg-gray-900" : "bg-gray-900/50"}`}>
                <td className="py-2 px-4 sticky left-0 bg-inherit">
                  <span className={`font-bold text-xs px-2 py-0.5 rounded ${activeType === "Primer" ? "bg-indigo-900/50 text-indigo-300" : "bg-purple-900/50 text-purple-300"}`}>{loc.code}</span>
                </td>
                {PACKAGES.map(p => {
                  const val = activeTable?.[loc.code]?.[p] || "";
                  return (
                    <td key={p} className="py-1.5 px-1 text-center">
                      {editing
                        ? <input type="number" value={draft?.[loc.code]?.[p] || ""} onChange={e => setDraft(prev => prev ? ({ ...prev, [loc.code]: { ...prev[loc.code], [p]: e.target.value } }) : null)} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1.5 text-center text-xs text-white" />
                        : <div className={`px-2 py-1.5 rounded text-xs font-medium ${val ? getHeat(val) : "text-gray-700"}`}>{val ? fmtN(val) : "—"}</div>
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
