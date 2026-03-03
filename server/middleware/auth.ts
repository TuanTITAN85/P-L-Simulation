import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { pool } from "../db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = "pm" | "sm" | "pmo" | "dcl";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      email: string;
      displayName: string;
      role: AppRole;
    };
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

async function verifyAzureToken(token: string): Promise<{ email: string; name: string }> {
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

function verifyLocalToken(token: string): { email: string } {
  const secret = process.env.LOCAL_JWT_SECRET;
  if (!secret) throw new Error("LOCAL_JWT_SECRET not configured");
  const payload = jwt.verify(token, secret) as jwt.JwtPayload;
  const email = ((payload.email as string) || "").toLowerCase().trim();
  if (!email) throw new Error("Local token has no email claim");
  return { email };
}

// ─── Middleware factory ───────────────────────────────────────────────────────

export function requireAuth(allowedRoles?: AppRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Chưa đăng nhập" });
      return;
    }

    const token = authHeader.slice(7);

    try {
      // Peek at payload (without verifying) to detect token type
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
