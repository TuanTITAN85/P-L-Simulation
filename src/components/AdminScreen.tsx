import { useState, useEffect } from "react";
import type { AdminConfig } from "../types";
import type { TranslationType } from "../i18n/translations";
import { today } from "../utils/helpers";
import { Inp, Card } from "./ui";
import { CostRefTable } from "./CostRefTable";

interface AdminScreenProps {
  config: AdminConfig;
  onSave: (cfg: AdminConfig) => void;
  onDirtyChange?: (dirty: boolean) => void;
  t: TranslationType;
}

export const AdminScreen = ({ config, onSave, onDirtyChange, t }: AdminScreenProps) => {
  const [cfg, setCfg_] = useState<AdminConfig>(config);
  const [tab, setTab] = useState("target");
  const [newLoc, setNewLoc] = useState({ code: "", nameVi: "", nameEn: "" });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onDirtyChange?.(dirty);
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, onDirtyChange]);

  const setConfig = (fn: (prev: AdminConfig) => AdminConfig) => {
    setCfg_(prev => fn(prev));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.resolve(onSave(cfg));
      setDirty(false);
      onDirtyChange?.(false);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "target",    icon: "🎯", label: t.targetSettings },
    { key: "roles",     icon: "👤", label: t.rolesConfig },
    { key: "contracts", icon: "📄", label: t.contractConfig },
    { key: "locations", icon: "📍", label: t.locationConfig },
    { key: "othercats", icon: "📦", label: t.otherCostCatsConfig },
    { key: "costref",   icon: "💰", label: t.costRefConfig },
    { key: "income",    icon: "🎁", label: t.projectIncomeConfig },
  ];

  const TS = ({ ts }: { ts?: string }) => ts
    ? <span className="text-xs text-gray-500">🕐 {t.lastUpdated}: {ts}</span>
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{t.adminTitle}</h2>
        <button
          onClick={() => void handleSave()}
          disabled={!dirty || saving}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition ${dirty ? "bg-green-700 hover:bg-green-600 text-white" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
        >
          {saving ? "Đang lưu..." : dirty ? `💾 ${t.save}` : `✓ ${t.save}`}
        </button>
      </div>
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === tb.key ? "bg-gray-700 text-white" : "text-gray-500"}`}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      {tab === "target" && (
        <Card title={t.targetSettings}>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-4">
              <label className="text-xs text-gray-500 mb-1 block">{t.targetGM}</label>
              <div className="flex items-center gap-2">
                <Inp type="number" value={cfg.targetGrossMargin} onChange={v => setConfig(c => ({ ...c, targetGrossMargin: parseFloat(v) || 0 }))} />
                <span className="text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <label className="text-xs text-gray-500 mb-1 block">{t.targetDM}</label>
              <div className="flex items-center gap-2">
                <Inp type="number" value={cfg.targetDirectMargin} onChange={v => setConfig(c => ({ ...c, targetDirectMargin: parseFloat(v) || 0 }))} />
                <span className="text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === "roles" && (
        <Card title={t.rolesConfig} action={<TS ts={cfg.lastUpdatedRoles} />}>
          <div className="space-y-2 mb-4">
            {cfg.roles.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Inp value={r} onChange={v => setConfig(c => ({ ...c, roles: c.roles.map((x, j) => j === i ? v : x), lastUpdatedRoles: today() }))} />
                <button onClick={() => setConfig(c => ({ ...c, roles: c.roles.filter((_, j) => j !== i), lastUpdatedRoles: today() }))} className="text-gray-600 hover:text-red-400 px-2">✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => setConfig(c => ({ ...c, roles: [...c.roles, ""], lastUpdatedRoles: today() }))} className="text-sm px-3 py-1.5 bg-indigo-700 rounded-lg">+ {t.addRole}</button>
        </Card>
      )}

      {tab === "contracts" && (
        <Card title={t.contractConfig} action={<TS ts={cfg.lastUpdatedContracts} />}>
          <div className="space-y-2 mb-4">
            {cfg.contractTypes.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1"><Inp value={c} onChange={v => setConfig(c2 => ({ ...c2, contractTypes: c2.contractTypes.map((x, j) => j === i ? v : x), lastUpdatedContracts: today() }))} /></div>
                <button onClick={() => setConfig(c2 => ({ ...c2, contractTypes: c2.contractTypes.filter((_, j) => j !== i), lastUpdatedContracts: today() }))} className="text-gray-600 hover:text-red-400 px-2">✕</button>
              </div>
            ))}
            {cfg.contractTypes.length === 0 && <p className="text-sm text-gray-600 py-2">{t.noData}</p>}
          </div>
          <button onClick={() => setConfig(c => ({ ...c, contractTypes: [...c.contractTypes, ""], lastUpdatedContracts: today() }))} className="text-sm px-3 py-1.5 bg-indigo-700 rounded-lg">+ {t.addContract}</button>
        </Card>
      )}

      {tab === "locations" && (
        <Card title={t.locationConfig} action={<TS ts={cfg.lastUpdatedLocations} />}>
          <div className="space-y-2 mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-3 text-gray-500 text-xs">Code</th>
                  <th className="text-left py-2 px-3 text-gray-500 text-xs">Tên (VI)</th>
                  <th className="text-left py-2 px-3 text-gray-500 text-xs">Name (EN)</th>
                  <th className="text-center py-2 px-3 text-gray-500 text-xs">{t.active}</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {cfg.locations.map((loc, i) => (
                  <tr key={loc.code} className="border-b border-gray-800/50">
                    <td className="py-1.5 px-2 w-20"><Inp value={loc.code} onChange={v => setConfig(c => ({ ...c, locations: c.locations.map((x, j) => j === i ? { ...x, code: v } : x), lastUpdatedLocations: today() }))} /></td>
                    <td className="py-1.5 px-2"><Inp value={loc.name.vi} onChange={v => setConfig(c => ({ ...c, locations: c.locations.map((x, j) => j === i ? { ...x, name: { ...x.name, vi: v } } : x), lastUpdatedLocations: today() }))} /></td>
                    <td className="py-1.5 px-2"><Inp value={loc.name.en} onChange={v => setConfig(c => ({ ...c, locations: c.locations.map((x, j) => j === i ? { ...x, name: { ...x.name, en: v } } : x), lastUpdatedLocations: today() }))} /></td>
                    <td className="py-1.5 px-2 text-center">
                      <input type="checkbox" checked={loc.active !== false} onChange={e => setConfig(c => ({ ...c, locations: c.locations.map((x, j) => j === i ? { ...x, active: e.target.checked } : x), lastUpdatedLocations: today() }))} className="accent-indigo-500" />
                    </td>
                    <td className="py-1.5 px-2"><button onClick={() => setConfig(c => ({ ...c, locations: c.locations.filter((_, j) => j !== i), lastUpdatedLocations: today() }))} className="text-gray-600 hover:text-red-400">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500 font-semibold">+ {t.addLocation}</p>
            <div className="grid grid-cols-3 gap-2">
              <Inp value={newLoc.code} onChange={v => setNewLoc(x => ({ ...x, code: v }))} placeholder="Code (e.g. HN)" />
              <Inp value={newLoc.nameVi} onChange={v => setNewLoc(x => ({ ...x, nameVi: v }))} placeholder="Tên tiếng Việt" />
              <Inp value={newLoc.nameEn} onChange={v => setNewLoc(x => ({ ...x, nameEn: v }))} placeholder="English name" />
            </div>
            <button onClick={() => {
              if (!newLoc.code) return;
              setConfig(c => ({ ...c, locations: [...c.locations, { code: newLoc.code.toUpperCase(), name: { vi: newLoc.nameVi, en: newLoc.nameEn }, active: true }], lastUpdatedLocations: today() }));
              setNewLoc({ code: "", nameVi: "", nameEn: "" });
            }} className="text-sm px-3 py-1.5 bg-indigo-700 rounded-lg">{t.addLocation}</button>
          </div>
        </Card>
      )}

      {tab === "othercats" && (
        <Card title={t.otherCostCatsConfig} action={<TS ts={cfg.lastUpdatedOtherCats} />}>
          <div className="space-y-2 mb-4">
            {cfg.otherCostCats.map((c, i) => (
              <div key={i} className="flex gap-2">
                <Inp value={c} onChange={v => setConfig(c2 => ({ ...c2, otherCostCats: c2.otherCostCats.map((x, j) => j === i ? v : x), lastUpdatedOtherCats: today() }))} />
                <button onClick={() => setConfig(c2 => ({ ...c2, otherCostCats: c2.otherCostCats.filter((_, j) => j !== i), lastUpdatedOtherCats: today() }))} className="text-gray-600 hover:text-red-400 px-2">✕</button>
              </div>
            ))}
            {cfg.otherCostCats.length === 0 && <p className="text-sm text-gray-600 py-2">{t.noData}</p>}
          </div>
          <button onClick={() => setConfig(c => ({ ...c, otherCostCats: [...c.otherCostCats, ""], lastUpdatedOtherCats: today() }))} className="text-sm px-3 py-1.5 bg-indigo-700 rounded-lg">+ {t.addCat}</button>
        </Card>
      )}

      {tab === "costref" && <Card title={t.costRefConfig}><CostRefTable config={cfg} setConfig={setConfig} t={t} /></Card>}

      {tab === "income" && (
        <Card title={t.projectIncomeConfig}>
          <div className="max-w-sm">
            <label className="text-xs text-gray-500 mb-1 block">{t.projectIncomePct}</label>
            <div className="flex items-center gap-3">
              <Inp type="number" value={cfg.projectIncomePct} onChange={v => setConfig(c => ({ ...c, projectIncomePct: parseFloat(v) || 0 }))} className="w-32" />
              <span className="text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">{t.projectIncomeNote}</p>
          </div>
        </Card>
      )}
    </div>
  );
};
