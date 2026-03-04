import { useState } from "react";
import type { Project } from "../types";
import type { TranslationType } from "../i18n/translations";
import { fmt } from "../utils/helpers";
import { Badge } from "./Badge";

interface ActualDataScreenProps {
  project: Project;
  onReload?: () => Promise<void>;
  t: TranslationType;
}

export const ActualDataScreen = ({ project, t }: ActualDataScreenProps) => {
  const [activeTab, setActiveTab] = useState<"prime" | "supplier">("prime");

  const entries = project.actualData?.[activeTab] || [];

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-800 rounded-lg p-1 w-fit">
        {([{ key: "prime" as const, label: `🏢 ${t.actualPrime}` }, { key: "supplier" as const, label: `🤝 ${t.actualSupplier}` }]).map(tb => (
          <button key={tb.key} onClick={() => setActiveTab(tb.key)}
            className={`px-4 py-2 rounded text-sm font-medium ${activeTab === tb.key ? "bg-gray-700 text-white" : "text-gray-500"}`}>{tb.label}</button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-600"><div className="text-4xl mb-3">📊</div><p>{t.noData}</p></div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="mb-3 space-y-1.5">
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
