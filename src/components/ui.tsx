import React from "react";
import { fmt } from "../utils/helpers";

export interface InpProps {
  value: string | number | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}

export const Inp = ({ value, onChange, placeholder, type = "text", className = "", disabled = false }: InpProps) => (
  <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
    className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white w-full disabled:opacity-40 ${className}`} />
);

export interface SelOption { value: string; label: string; }

export interface SelProps {
  value: string;
  onChange: (val: string) => void;
  options: (SelOption | string)[];
  className?: string;
}

export const Sel = ({ value, onChange, options, className = "" }: SelProps) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white w-full ${className}`}>
    {options.map(o => {
      const val = typeof o === "string" ? o : o.value;
      const label = typeof o === "string" ? o : o.label;
      return <option key={val} value={val}>{label}</option>;
    })}
  </select>
);

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const Card = ({ title, children, className = "", action }: CardProps) => (
  <div className={`bg-gray-900 rounded-xl border border-gray-800 ${className}`}>
    {title && (
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

export const AutoField = ({ label, value, note, className = "" }: { label?: string; value: string; note?: string; className?: string }) => (
  <div className={className}>
    {label && <label className="text-xs text-gray-500 mb-1 block">{label}</label>}
    <div className="bg-gray-700/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-indigo-300 font-medium flex items-center justify-between">
      <span>{value}</span>
      {note && <span className="text-xs text-gray-500 ml-2">{note}</span>}
    </div>
  </div>
);

export const SummaryRow = ({ label, value, bold = false, highlight = false }: { label: string; value: number | undefined; bold?: boolean; highlight?: boolean }) => (
  <div className={`flex justify-between items-center py-2 ${bold ? "border-t-2 border-gray-600 mt-1 pt-3" : ""}`}>
    <span className={`text-sm ${bold ? "font-bold text-white" : "text-gray-400"}`}>{label}</span>
    <span className={`font-bold ${bold ? (highlight ? "text-green-400 text-base" : "text-white text-base") : "text-gray-200"}`}>{fmt(value)}</span>
  </div>
);
