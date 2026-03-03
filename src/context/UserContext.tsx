import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { msalInstance, loginRequest } from "../auth/msalConfig";
import { api } from "../api";
import type { AppUser } from "../types";

const LOCAL_TOKEN_KEY = "pl_sim_local_token";

interface UserContextValue {
  currentUser: AppUser | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  localLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  currentUser: null,
  loading: true,
  error: null,
  login: async () => {},
  localLogin: async () => {},
  logout: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track login type so logout knows whether to call MSAL
  const [loginType, setLoginType] = useState<"o365" | "local" | null>(null);

  // On mount: restore session — try local token first, then MSAL
  useEffect(() => {
    const init = async () => {
      try {
        // ── 1. Try restoring local session ────────────────────────────────────
        const localToken = sessionStorage.getItem(LOCAL_TOKEN_KEY);
        if (localToken) {
          api.setToken(localToken);
          try {
            const me = await api.getMe();
            setCurrentUser(me);
            setLoginType("local");
            return;
          } catch {
            // Token expired or revoked — clear it and fall through to MSAL
            sessionStorage.removeItem(LOCAL_TOKEN_KEY);
            api.setToken("");
          }
        }

        // ── 2. Try restoring O365 session via MSAL ────────────────────────────
        await msalInstance.initialize();
        await msalInstance.handleRedirectPromise();

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) return;

        const tokenRes = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });

        api.setToken(tokenRes.accessToken);
        const me = await api.getMe();
        setCurrentUser(me);
        setLoginType("o365");
      } catch (err) {
        console.error("Session restore failed:", err);
        api.setToken("");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  // ── O365 login ─────────────────────────────────────────────────────────────
  const login = async () => {
    setError(null);
    try {
      const result = await msalInstance.loginPopup(loginRequest);
      api.setToken(result.accessToken);
      const me = await api.getMe();
      setCurrentUser(me);
      setLoginType("o365");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("403") || msg.includes("Tài khoản")) {
        setError("Tài khoản O365 của bạn chưa được đăng ký trong hệ thống. Vui lòng liên hệ PMO.");
      } else if (msg.includes("user_cancelled") || msg.includes("popup_window_error")) {
        // User closed the popup — not an error
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    }
  };

  // ── Local login ────────────────────────────────────────────────────────────
  const localLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { token?: string; user?: AppUser; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Đăng nhập thất bại.");
        return;
      }
      const { token, user } = data;
      if (!token || !user) { setError("Phản hồi server không hợp lệ."); return; }
      api.setToken(token);
      sessionStorage.setItem(LOCAL_TOKEN_KEY, token);
      setCurrentUser(user);
      setLoginType("local");
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (loginType === "o365") {
      try { await msalInstance.logoutPopup(); } catch { /* ignore */ }
    } else {
      sessionStorage.removeItem(LOCAL_TOKEN_KEY);
    }
    api.setToken("");
    setCurrentUser(null);
    setLoginType(null);
  };

  return (
    <UserContext.Provider value={{ currentUser, loading, error, login, localLogin, logout }}>
      {children}
    </UserContext.Provider>
  );
};
