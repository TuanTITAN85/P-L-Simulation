import { Router } from "express";
import { pool } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

// POST /api/auth/login — local username+password authentication
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email và mật khẩu không được để trống." });
      return;
    }

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    const user = rows[0];

    // Return same error for "not found" and "no password" to avoid email enumeration
    if (!user || !user.password_hash) {
      res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng." });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: "Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ PMO." });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng." });
      return;
    }

    const secret = process.env.LOCAL_JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "Server chưa cấu hình LOCAL_JWT_SECRET." });
      return;
    }

    const token = jwt.sign(
      {
        iss: "pl-sim-local",
        email: user.email as string,
        displayName: user.display_name as string,
        role: user.role as string,
      },
      secret,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        email:       user.email       as string,
        displayName: user.display_name as string,
        role:        user.role         as string,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Lỗi máy chủ. Vui lòng thử lại." });
  }
});

export default router;
