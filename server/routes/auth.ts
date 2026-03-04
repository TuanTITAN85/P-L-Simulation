import { Router } from "express";
import { pool } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { buildCurrentUser, verifyAzureToken } from "../middleware/auth";

const router = Router();

// ─── Strategy helpers ─────────────────────────────────────────────────────────

function signLocalToken(email: string, secret: string): string {
  return jwt.sign({ iss: "pl-sim-local", email }, secret, { expiresIn: "8h" });
}

// ─── POST /api/auth/login — local username+password authentication ─────────

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ success: false, error: "Tên đăng nhập và mật khẩu không được để trống." });
      return;
    }

    const q = username.toLowerCase().trim();

    // Try system_users first (new system)
    const { rows: sysRows } = await pool.query(
      `SELECT id, name, email, username, password_hash, account_type, status
         FROM system_users
        WHERE (username = $1 OR email = $1) AND account_type = 'local'`,
      [q]
    );

    if (sysRows.length > 0) {
      const u = sysRows[0];

      if (u.status !== "active") {
        res.status(403).json({ success: false, error: "Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ PMO." });
        return;
      }

      if (!u.password_hash) {
        res.status(401).json({ success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." });
        return;
      }

      const valid = await bcrypt.compare(password, u.password_hash as string);
      if (!valid) {
        res.status(401).json({ success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." });
        return;
      }

      const secret = process.env.LOCAL_JWT_SECRET;
      if (!secret) {
        res.status(500).json({ success: false, error: "Server chưa cấu hình LOCAL_JWT_SECRET." });
        return;
      }

      let currentUser;
      try {
        currentUser = await buildCurrentUser(u.email as string);
      } catch (e: unknown) {
        const err = e as Error & { statusCode?: number };
        res.status(err.statusCode || 403).json({ success: false, error: err.message || "Không đủ quyền truy cập." });
        return;
      }

      const token = signLocalToken(u.email as string, secret);
      res.json({ success: true, data: { token, user: currentUser } });
      return;
    }

    // Fallback: legacy users table
    const { rows: legacyRows } = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [q]
    );

    const legacyUser = legacyRows[0];
    if (!legacyUser || !legacyUser.password_hash) {
      res.status(401).json({ success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." });
      return;
    }

    if (!legacyUser.active) {
      res.status(403).json({ success: false, error: "Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ PMO." });
      return;
    }

    const valid = await bcrypt.compare(password, legacyUser.password_hash as string);
    if (!valid) {
      res.status(401).json({ success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." });
      return;
    }

    const secret = process.env.LOCAL_JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: "Server chưa cấu hình LOCAL_JWT_SECRET." });
      return;
    }

    const token = jwt.sign(
      {
        iss: "pl-sim-local",
        email: legacyUser.email as string,
        displayName: legacyUser.display_name as string,
        role: legacyUser.role as string,
      },
      secret,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          email:       legacyUser.email        as string,
          displayName: legacyUser.display_name as string,
          role:        legacyUser.role          as string,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ. Vui lòng thử lại." });
  }
});

// ─── POST /api/auth/sso — Azure AD SSO callback ───────────────────────────────

router.post("/auth/sso", async (req, res) => {
  try {
    const { token: azureToken } = req.body as { token?: string };

    if (!azureToken) {
      res.status(400).json({ success: false, error: "Token Azure AD không được để trống." });
      return;
    }

    const secret = process.env.LOCAL_JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: "Server chưa cấu hình LOCAL_JWT_SECRET." });
      return;
    }

    const { email, name } = await verifyAzureToken(azureToken);
    const currentUser = await buildCurrentUser(email, name);
    const token = signLocalToken(email, secret);

    res.json({ success: true, data: { token, user: currentUser } });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    const status = e.statusCode || 401;
    res.status(status).json({ success: false, error: e.message || "Xác thực SSO thất bại." });
  }
});

// ─── POST /api/auth/mock-sso — dev only ──────────────────────────────────────

if (process.env.NODE_ENV !== "production") {
  router.post("/auth/mock-sso", async (req, res) => {
    try {
      const { email } = req.body as { email?: string };

      if (!email) {
        res.status(400).json({ success: false, error: "Email không được để trống." });
        return;
      }

      const secret = process.env.LOCAL_JWT_SECRET;
      if (!secret) {
        res.status(500).json({ success: false, error: "Server chưa cấu hình LOCAL_JWT_SECRET." });
        return;
      }

      const currentUser = await buildCurrentUser(email.toLowerCase().trim());
      const token = signLocalToken(email.toLowerCase().trim(), secret);

      res.json({ success: true, data: { token, user: currentUser } });
    } catch (err: unknown) {
      const e = err as Error & { statusCode?: number };
      const status = e.statusCode || 400;
      res.status(status).json({ success: false, error: e.message || "Mock SSO thất bại." });
    }
  });
}

export default router;
