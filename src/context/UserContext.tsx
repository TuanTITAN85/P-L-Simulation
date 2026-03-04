import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { msalInstance, loginRequest } from "../auth/msalConfig";
import { api } from "../api";
import type { CurrentUser } from "../types";

const LOCAL_TOKEN_KEY = "pl_sim_local_token";
const LOCAL_USER_KEY  = "pl_sim_local_user";

// ── Normalize legacy single-role user to CurrentUser ──────────────────────────
function normalizeLegacyUser(u: Record<string, unknown>): CurrentUser {
  const role = ((u.role as string) || "pm").toUpperCase() as "PM" | "SM" | "PMO" | "DCL";
  return {
    id: "legacy",
    name: (u.displayName as string) || (u.email as string) || "",
    email: (u.email as string) || "",
    accountType: "local",
    roles: [role],
    isPMO: role === "PMO",
  };
}

interface UserContextValue {
  currentUser: CurrentUser | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  localLogin: (username: string, password: string) => Promise<void>;
  mockSSOLogin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  currentUser: null,
  loading: true,
  error: null,
  login: async () => {},
  localLogin: async () => {},
  mockSSOLogin: async () => {},
  logout: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [loginType, setLoginType]     = useState<"o365" | "local" | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function saveSession(token: string, user: CurrentUser) {
    api.setToken(token);
    sessionStorage.setItem(LOCAL_TOKEN_KEY, token);
    sessionStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    api.setToken("");
    sessionStorage.removeItem(LOCAL_TOKEN_KEY);
    sessionStorage.removeItem(LOCAL_USER_KEY);
  }

  // Parse { success, data: { token, user } } auth response
  async function parseAuthResponse(res: Response): Promise<{ token: string; user: CurrentUser } | null> {
    type AuthResp = { success: boolean; data?: { token: string; user: Record<string, unknown> }; error?: string };
    const json = await res.json() as AuthResp;
    if (!res.ok || !json.success || !json.data) {
      setError(json.error ?? "Đăng nhập thất bại.");
      return null;
    }
    const { token, user: raw } = json.data;
    const user: CurrentUser = ("roles" in raw && Array.isArray(raw.roles))
      ? (raw as unknown as CurrentUser)
      : normalizeLegacyUser(raw);
    return { token, user };
  }

  // ── Session restore ──────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // Always initialize MSAL first (required before any MSAL API call)
        await msalInstance.initialize();

        // 1. Try local session from sessionStorage
        const storedToken = sessionStorage.getItem(LOCAL_TOKEN_KEY);
        const storedUser  = sessionStorage.getItem(LOCAL_USER_KEY);
        if (storedToken && storedUser) {
          try {
            const user = JSON.parse(storedUser) as CurrentUser;
            api.setToken(storedToken);
            setCurrentUser(user);
            setLoginType("local");
            return;
          } catch {
            clearSession();
          }
        }

        // 2. Try restoring O365 session via MSAL
        const redirectResult = await msalInstance.handleRedirectPromise();

        // If returning from loginRedirect, use the ID token (not access token)
        // accessToken is for Microsoft Graph; idToken has aud=CLIENT_ID for server-side verify
        if (redirectResult?.idToken) {
          const res = await fetch("/api/auth/sso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: redirectResult.idToken }),
          });
          const parsed = await parseAuthResponse(res);
          if (parsed) {
            saveSession(parsed.token, parsed.user);
            setCurrentUser(parsed.user);
            setLoginType("o365");
          }
          return;
        }

        // Otherwise try silent token for existing session
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) return;

        const tokenRes = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });

        const res = await fetch("/api/auth/sso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenRes.idToken }),
        });
        const parsed = await parseAuthResponse(res);
        if (parsed) {
          saveSession(parsed.token, parsed.user);
          setCurrentUser(parsed.user);
          setLoginType("o365");
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    void init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── O365 login (redirect flow) ────────────────────────────────────────────
  const login = async () => {
    setError(null);
    try {
      await msalInstance.loginRedirect(loginRequest);
      // Page navigates away; result handled in useEffect via handleRedirectPromise
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("user_cancelled")) {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    }
  };

  // ── Local login ───────────────────────────────────────────────────────────
  const localLogin = async (username: string, password: string) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const parsed = await parseAuthResponse(res);
      if (parsed) {
        saveSession(parsed.token, parsed.user);
        setCurrentUser(parsed.user);
        setLoginType("local");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    }
  };

  // ── Mock SSO (dev only) ───────────────────────────────────────────────────
  const mockSSOLogin = async (email: string) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/mock-sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const parsed = await parseAuthResponse(res);
      if (parsed) {
        saveSession(parsed.token, parsed.user);
        setCurrentUser(parsed.user);
        setLoginType("o365");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    const wasO365 = loginType === "o365";
    clearSession();
    setCurrentUser(null);
    setLoginType(null);
    if (wasO365) {
      try { await msalInstance.logoutRedirect({ postLogoutRedirectUri: window.location.origin }); } catch { /* ignore */ }
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, loading, error, login, localLogin, mockSSOLogin, logout }}>
      {children}
    </UserContext.Provider>
  );
};
