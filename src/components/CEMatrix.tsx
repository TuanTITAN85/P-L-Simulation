import { useState } from "react";
import type { Location } from "../types";
import type { TranslationType } from "../i18n/translations";
import { PACKAGES } from "../constants/packages";
import { DEFAULT_LOCS } from "../constants/defaults";

interface CEMatrixProps {
  label: string;
  ceData: Record<string, Record<string, string>> | undefined;
  onChange: (loc: string, pkg: string, val: string) => void;
  locations: Location[];
  t: TranslationType;
}

export const CEMatrix = ({ label, ceData, onChange, locations, t }: CEMatrixProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const locs = locations || DEFAULT_LOCS;
  const totByLoc = (loc: string): number => PACKAGES.reduce((s, p) => s + (parseFloat(ceData?.[loc]?.[p] || "") || 0), 0);
  const totByPkg = (pkg: string): number => locs.reduce((s, l) => s + (parseFloat(ceData?.[l.code]?.[pkg] || "") || 0), 0);
  const grand = locs.reduce((s, l) => s + totByLoc(l.code), 0);
  return (
    <div className="mb-3">
      <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2 w-full text-left hover:text-white">
        <span className="text-xs">{collapsed ? "▶" : "▼"}</span>{label}
        <span className="ml-auto text-indigo-400 text-xs font-bold">{t.total}: {grand || 0} MM</span>
      </button>
      {!collapsed && (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="text-xs w-full">
            <thead><tr className="bg-gray-800">
              <th className="text-left py-2 px-3 text-gray-500 sticky left-0 bg-gray-800 w-16">{t.location}</th>
              {PACKAGES.map(p => <th key={p} className="text-center py-2 px-1 text-gray-500 min-w-12">{p}</th>)}
              <th className="text-center py-2 px-2 text-gray-400">{t.total}</th>
            </tr></thead>
            <tbody>
              {locs.map(loc => (
                <tr key={loc.code} className="border-t border-gray-800/60">
                  <td className="py-1 px-3 text-gray-400 font-medium sticky left-0 bg-gray-900">{loc.code}</td>
                  {PACKAGES.map(p => (
                    <td key={p} className="py-0.5 px-0.5">
                      <input type="number" value={ceData?.[loc.code]?.[p] || ""} onChange={e => onChange(loc.code, p, e.target.value)} placeholder="0" min="0" step="0.1"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-center text-xs focus:outline-none focus:border-indigo-500 text-white" />
                    </td>
                  ))}
                  <td className="py-1 px-2 text-center text-indigo-400 font-semibold">{totByLoc(loc.code) || "—"}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-700 bg-gray-800/40">
                <td className="py-2 px-3 text-gray-400 font-semibold sticky left-0 bg-gray-800/40">{t.total}</td>
                {PACKAGES.map(p => <td key={p} className="py-2 text-center text-gray-400">{totByPkg(p) || "—"}</td>)}
                <td className="py-2 px-2 text-center text-white font-bold">{grand || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
