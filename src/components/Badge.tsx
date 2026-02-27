export const Badge = ({ label, color = "gray" }: { label: string; color?: string }) => {
  const c: Record<string, string> = {
    gray: "bg-gray-700 text-gray-300",
    green: "bg-green-900 text-green-300",
    yellow: "bg-yellow-900 text-yellow-300",
    red: "bg-red-900 text-red-300",
    indigo: "bg-indigo-900 text-indigo-300",
    purple: "bg-purple-900 text-purple-300",
    teal: "bg-teal-900 text-teal-300",
    blue: "bg-blue-900 text-blue-300",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[color] || c.gray}`}>{label}</span>;
};
