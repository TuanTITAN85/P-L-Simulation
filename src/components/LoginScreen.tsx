import { useState } from "react";
import { useUser } from "../context/UserContext";
import type { TranslationType } from "../i18n/translations";

interface LoginScreenProps { t: TranslationType; }

export const LoginScreen = ({ t }: LoginScreenProps) => {
  const { login, localLogin, mockSSOLogin, error } = useUser();
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [mockEmail, setMockEmail]     = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [showMock, setShowMock]       = useState(false);

  const isDev = import.meta.env.DEV;

  const handleLocalSubmit = async () => {
    setLocalLoading(true);
    try { await localLogin(username, password); }
    finally { setLocalLoading(false); }
  };

  const handleMockSSO = async () => {
    if (!mockEmail.trim()) return;
    setMockLoading(true);
    try { await mockSSOLogin(mockEmail.trim()); }
    finally { setMockLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center gap-5">
        <img src="/fpt-logo.png" alt="FPT Software" className="h-14 w-auto" />
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-1">📊 {t.appTitle}</h1>
          <p className="text-sm text-gray-400">Vui lòng đăng nhập để tiếp tục</p>
        </div>

        {error && (
          <div className="w-full bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 text-center">
            {error}
          </div>
        )}

        {/* O365 SSO */}
        <button
          onClick={() => void login()}
          className="w-full flex items-center justify-center gap-3 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-600 rounded-xl text-white font-medium text-sm transition"
        >
          <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          {t.loginWithO365Company}
        </button>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 border-t border-gray-800" />
          <span className="text-xs text-gray-600">hoặc</span>
          <div className="flex-1 border-t border-gray-800" />
        </div>

        {/* Local credentials form */}
        <form onSubmit={e => { e.preventDefault(); void handleLocalSubmit(); }} className="w-full flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={localLoading || !username || !password}
            className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-xl text-white font-medium text-sm transition"
          >
            {localLoading ? "Đang đăng nhập..." : t.login}
          </button>
        </form>

        {/* Mock SSO (dev only) */}
        {isDev && (
          <div className="w-full">
            <button
              onClick={() => setShowMock(v => !v)}
              className="text-xs text-gray-600 hover:text-gray-400 w-full text-left"
            >
              🛠 {showMock ? "▲" : "▼"} {t.mockSsoEmail}
            </button>
            {showMock && (
              <form onSubmit={e => { e.preventDefault(); void handleMockSSO(); }} className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={mockEmail}
                  onChange={e => setMockEmail(e.target.value)}
                  placeholder="user@fpt.com"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={mockLoading || !mockEmail}
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 rounded-lg text-xs text-white transition"
                >
                  {mockLoading ? "…" : "Go"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
