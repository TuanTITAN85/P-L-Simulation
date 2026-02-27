export const Toast = ({ msg, type = "success" }: { msg: string; type?: string }) => (
  <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 ${type === "success" ? "bg-green-800 text-green-100" : "bg-red-800 text-red-100"}`}>
    {type === "success" ? "✓" : "✗"} {msg}
  </div>
);
