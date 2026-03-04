import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { pool } from "../db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = "pm" | "sm" | "pmo" | "dcl";

export interface CurrentUser {
  id: string;           // UUID cho local admin; email cho SSO user
  name: string;
  email: string;
  accountType: "local" | "sso";
  roles: Array<"PM" | "SM" | "PMO" | "DCL">;
  isPMO: boolean;
  managedLineServiceIds?: string[];
  dclTitle?: "DCL" | "Vice DCL";
}

declare module "express-serve-static-core" {
  interface Request {
    // Legacy single-role user (old system — backward compat)
    user?: {
      email: string;
      displayName: string;
      role: AppRole;
    };
    // New multi-role user
    currentUser?: CurrentUser;
  }
}

// ─── JWKS client — caches Azure AD signing keys ───────────────────────────────

const TENANT_ID = process.env.AZURE_TENANT_ID || "";
const CLIENT_ID = process.env.AZURE_CLIENT_ID || "";

const jwks = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000, // 10 minutes
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key?.getPublicKey());
  });
}

// ─── Azure AD token verification ─────────────────────────────────────────────

export async function verifyAzureToken(token: string): Promise<{ email: string; name: string }> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) return reject(err);
        const payload = decoded as jwt.JwtPayload;
        const email = (
          payload.preferred_username ||
          payload.upn ||
          payload.email ||
          ""
        ).toLowerCase().trim();
        if (!email) return reject(new Error("Token has no email claim"));
        resolve({ email, name: (payload.name as string) || email });
      }
    );
  });
}

// ─── Local JWT verification ───────────────────────────────────────────────────

export function verifyLocalToken(token: string): { email: string } {
  const secret = process.env.LOCAL_JWT_SECRET;
  if (!secret) throw new Error("LOCAL_JWT_SECRET not configured");
  const payload = jwt.verify(token, secret) as jwt.JwtPayload;
  const email = ((payload.email as string) || "").toLowerCase().trim();
  if (!email) throw new Error("Local token has no email claim");
  return { email };
}

// ─── Build CurrentUser từ role tables (không cần system_users cho SSO) ────────
//
// Luồng:
//   1. Nếu là local admin → tìm trong system_users (account_type='local')
//   2. Nếu là SSO user   → tra cứu email trong pmo_roles, pm_roles,
//                          sm_role_assignments, dcl_roles
//   3. Không có role nào → 403
//
// ssoName: tên lấy từ Azure AD token (ưu tiên hơn tên trong role table)

export async function buildCurrentUser(email: string, ssoName?: string): Promise<CurrentUser> {
  const normalizedEmail = email.toLowerCase().trim();

  // ── Bước 1: Kiểm tra local admin ────────────────────────────────────────────
  const { rows: localRows } = await pool.query(
    `SELECT id, name, email, status, is_pmo
       FROM system_users
      WHERE email = $1 AND account_type = 'local'`,
    [normalizedEmail]
  );

  if (localRows.length > 0) {
    const u = localRows[0];
    if (u.status !== "active") {
      const err = new Error("Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ PMO.") as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }
    // Local admin luôn có role PMO (via is_pmo flag)
    const roles: Array<"PM" | "SM" | "PMO" | "DCL"> = u.is_pmo ? ["PMO"] : [];
    return {
      id:          u.id          as string,
      name:        u.name        as string,
      email:       normalizedEmail,
      accountType: "local",
      roles,
      isPMO:       Boolean(u.is_pmo),
    };
  }

  // ── Bước 2: Kiểm tra SSO user trong các role tables ──────────────────────────
  const [pmoRes, pmRes, smRes, dclRes] = await Promise.all([
    pool.query(
      `SELECT id, name, status FROM pmo_roles WHERE email = $1`,
      [normalizedEmail]
    ),
    pool.query(
      `SELECT id, name, status FROM pm_roles WHERE email = $1`,
      [normalizedEmail]
    ),
    pool.query(
      `SELECT sra.id, sra.name, sra.status, sra.line_service_id
         FROM sm_role_assignments sra
        WHERE sra.email = $1`,
      [normalizedEmail]
    ),
    pool.query(
      `SELECT id, name, status, title FROM dcl_roles WHERE email = $1`,
      [normalizedEmail]
    ),
  ]);

  const roles: Array<"PM" | "SM" | "PMO" | "DCL"> = [];
  let managedLineServiceIds: string[] | undefined;
  let dclTitle: "DCL" | "Vice DCL" | undefined;
  // Dùng tên từ Azure AD token nếu có; fallback về tên trong role table
  let displayName = ssoName || "";

  if (pmoRes.rows.length > 0 && pmoRes.rows[0].status === "active") {
    roles.push("PMO");
    if (!displayName) displayName = pmoRes.rows[0].name as string;
  }

  if (pmRes.rows.length > 0 && pmRes.rows[0].status === "active") {
    roles.push("PM");
    if (!displayName) displayName = pmRes.rows[0].name as string;
  }

  const activeSmRows = smRes.rows.filter((r) => r.status === "active");
  if (activeSmRows.length > 0) {
    roles.push("SM");
    managedLineServiceIds = activeSmRows.map((r) => r.line_service_id as string);
    if (!displayName) displayName = activeSmRows[0].name as string;
  }

  if (dclRes.rows.length > 0 && dclRes.rows[0].status === "active") {
    roles.push("DCL");
    dclTitle = dclRes.rows[0].title as "DCL" | "Vice DCL";
    if (!displayName) displayName = dclRes.rows[0].name as string;
  }

  if (roles.length === 0) {
    const err = new Error("Tài khoản chưa được cấp quyền, vui lòng liên hệ PMO.") as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  return {
    id:          normalizedEmail, // SSO user dùng email làm ID
    name:        displayName || normalizedEmail,
    email:       normalizedEmail,
    accountType: "sso",
    roles,
    isPMO:       roles.includes("PMO"),
    managedLineServiceIds,
    dclTitle,
  };
}

// ─── New multi-role middleware ─────────────────────────────────────────────────

export function requireRole(allowedRoles?: Array<"PM" | "SM" | "PMO" | "DCL">) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "Chưa đăng nhập" });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const peeked = jwt.decode(token) as jwt.JwtPayload | null;
      const isLocal = peeked?.iss === "pl-sim-local";

      let currentUser: CurrentUser;

      if (isLocal) {
        const { email } = verifyLocalToken(token);
        currentUser = await buildCurrentUser(email);
      } else {
        const { email, name } = await verifyAzureToken(token);
        currentUser = await buildCurrentUser(email, name);
      }

      req.currentUser = currentUser;

      if (allowedRoles && allowedRoles.length > 0) {
        const hasRole = allowedRoles.some((r) => currentUser.roles.includes(r));
        if (!hasRole) {
          res.status(403).json({ success: false, error: "Không đủ quyền truy cập" });
          return;
        }
      }

      next();
    } catch (e: unknown) {
      const err = e as Error & { statusCode?: number };
      if (err.statusCode) {
        res.status(err.statusCode).json({ success: false, error: err.message });
      } else {
        console.error("Auth error:", err);
        res.status(401).json({ success: false, error: "Token không hợp lệ hoặc đã hết hạn" });
      }
    }
  };
}

// ─── Legacy middleware (users table — backward compat) ────────────────────────

export function requireAuth(allowedRoles?: AppRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Chưa đăng nhập" });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const peeked = jwt.decode(token) as jwt.JwtPayload | null;
      const isLocal = peeked?.iss === "pl-sim-local";

      let email: string;
      let fallbackName: string;

      if (isLocal) {
        ({ email } = verifyLocalToken(token));
        fallbackName = email;
      } else {
        const az = await verifyAzureToken(token);
        email = az.email;
        fallbackName = az.name;
      }

      // DB lookup — enforces active status and gets authoritative role
      const { rows } = await pool.query(
        "SELECT role, display_name, active FROM users WHERE email = $1",
        [email]
      );

      if (rows.length === 0) {
        res.status(403).json({ error: "Tài khoản chưa được đăng ký trong hệ thống. Vui lòng liên hệ PMO." });
        return;
      }

      const dbUser = rows[0];
      if (!dbUser.active) {
        res.status(403).json({ error: "Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ PMO." });
        return;
      }

      const role = dbUser.role as AppRole;
      req.user = { email, displayName: dbUser.display_name || fallbackName, role };

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        res.status(403).json({ error: "Không đủ quyền truy cập" });
        return;
      }

      next();
    } catch (err) {
      console.error("Auth error:", err);
      res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }
  };
}

export const requirePmoOrDcl = requireAuth(["pmo", "dcl"]);
export const requireAnyRole  = requireAuth();
