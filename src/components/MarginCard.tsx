import { pct, mColor, mBg } from "../utils/helpers";
import type { TranslationType } from "../i18n/translations";

export const MarginCard = ({ label, value, target, t }: { label: string; value: number; target: number; t: TranslationType }) => {
  const diff = value - target;
  const isAbove = value >= target;
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-black ${mColor(value, target)}`}>{pct(value)}%</p>
      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full transition-all ${mBg(value, target)}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
        <div className="absolute top-0 bottom-0 border-l-2 border-white opacity-50" style={{ left: `${Math.min(target, 100)}%` }} />
      </div>
      <p className={`text-xs mt-1.5 font-medium ${mColor(value, target)}`}>
        {isAbove ? "✓" : "✗"} {isAbove ? t.aboveTarget : t.belowTarget} {target}% ({isAbove ? "+" : ""}{pct(diff)}pp)
      </p>
    </div>
  );
};
