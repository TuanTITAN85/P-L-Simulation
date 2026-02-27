import { useMemo } from "react";
import type { OtherCostItem } from "../types";
import type { TranslationType } from "../i18n/translations";
import { uid, fmt } from "../utils/helpers";
import { Inp, Sel } from "./ui";

interface OtherCostsTabProps {
  items: OtherCostItem[];
  onChange: (items: OtherCostItem[]) => void;
  cats: string[];
  t: TranslationType;
}

export const OtherCostsTab = ({ items, onChange, cats, t }: OtherCostsTabProps) => {
  const addItem = () => onChange([...items, { id: uid(), category: cats[0] || "", unitPrice: "", qty: "", months: "", note: "" }]);
  const updItem = (id: number, field: keyof OtherCostItem, val: string) => onChange(items.map(it => it.id === id ? { ...it, [field]: val } : it));
  const delItem = (id: number) => onChange(items.filter(it => it.id !== id));
  const total = items.reduce((s, it) => s + (parseFloat(it.unitPrice) || 0) * (parseFloat(it.qty) || 0) * (parseFloat(it.months) || 0), 0);
  const grouped = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach(it => {
      const amt = (parseFloat(it.unitPrice) || 0) * (parseFloat(it.qty) || 0) * (parseFloat(it.months) || 0);
      if (amt > 0) m[it.category] = (m[it.category] || 0) + amt;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [items]);
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-800 border-b border-gray-700">
            <th className="text-left py-3 px-3 text-gray-400 min-w-36">{t.category}</th>
            <th className="text-right py-3 px-3 text-gray-400 min-w-28">{t.unitPrice} (USD)</th>
            <th className="text-right py-3 px-3 text-gray-400 min-w-20">{t.qty}</th>
            <th className="text-right py-3 px-3 text-gray-400 min-w-20">{t.months}</th>
            <th className="text-right py-3 px-3 text-gray-400 min-w-28">{t.amount} (USD)</th>
            <th className="text-left py-3 px-3 text-gray-400 min-w-32">{t.note}</th>
            <th className="py-3 px-2 w-8"></th>
          </tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-600 text-sm">{t.noData}</td></tr>}
            {items.map(it => {
              const amt = (parseFloat(it.unitPrice) || 0) * (parseFloat(it.qty) || 0) * (parseFloat(it.months) || 0);
              return (
                <tr key={it.id} className="border-t border-gray-800/60 hover:bg-gray-800/30">
                  <td className="py-1.5 px-2"><Sel value={it.category} onChange={v => updItem(it.id, "category", v)} options={cats.map(c => ({ value: c, label: c }))} /></td>
                  <td className="py-1.5 px-2"><Inp type="number" value={it.unitPrice} onChange={v => updItem(it.id, "unitPrice", v)} placeholder="0" /></td>
                  <td className="py-1.5 px-2"><Inp type="number" value={it.qty} onChange={v => updItem(it.id, "qty", v)} placeholder="1" /></td>
                  <td className="py-1.5 px-2"><Inp type="number" value={it.months} onChange={v => updItem(it.id, "months", v)} placeholder="1" /></td>
                  <td className="py-1.5 px-2"><div className="text-right font-semibold text-green-300 py-2 pr-1">${fmt(amt)}</div></td>
                  <td className="py-1.5 px-2"><Inp value={it.note} onChange={v => updItem(it.id, "note", v)} placeholder="..." /></td>
                  <td className="py-1.5 px-2 text-center"><button onClick={() => delItem(it.id)} className="text-gray-600 hover:text-red-400">✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={addItem} className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm">+ {t.addItem}</button>
        <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-2">
          <span className="text-sm text-gray-400">{t.otherTotalCost}:</span>
          <span className="text-lg font-bold text-green-300">${fmt(total)} USD</span>
        </div>
      </div>
      {grouped.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">📦 Tổng hợp theo danh mục</p>
          </div>
          <div className="p-3 space-y-1">
            {grouped.map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                <span className="text-sm text-gray-300">{cat}</span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-20 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${total > 0 ? (amt / total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{total > 0 ? ((amt / total) * 100).toFixed(0) : 0}%</span>
                  <span className="font-semibold text-green-300 text-sm w-28 text-right">${fmt(amt)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <span className="text-sm font-bold text-white">Tổng</span>
              <span className="font-bold text-green-300">${fmt(total)} USD</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
