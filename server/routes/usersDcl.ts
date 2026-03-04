import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";

const router = Router();

// ─── Helper: map dcl_roles row → DclUser shape ────────────────────────────────

function mapDclUser(u: Record<string, unknown>) {
  return {
    id:            u.id         as string,
    name:          u.name       as string,
    email:         u.email      as string,
    accountType:   "sso",
    status:        u.status     as string,
    createdAt:     u.created_at as string,
    dclTitle:      u.title      as "DCL" | "Vice DCL",
    dclAssignedAt: u.created_at as string,
  };
}

// ─── GET /api/users/dcl (PMO) ─────────────────────────────────────────────────

router.get("/users/dcl", requireRole(["PMO"]), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, title, status, created_at
         FROM dcl_roles
        ORDER BY name`
    );

    res.json({ success: true, data: rows.map(mapDclUser) });
  } catch (err) {
    console.error("GET /users/dcl:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/users/dcl (PMO) ───────────────────────────────────────────────
// Body: { name, email, title? }

router.post("/users/dcl", requireRole(["PMO"]), async (req, res) => {
  try {
    const { name, email, title = "DCL" } = req.body as {
      name?: string;
      email?: string;
      title?: "DCL" | "Vice DCL";
    };

    if (!["DCL", "Vice DCL"].includes(title)) {
      res.status(400).json({ success: false, error: "title phải là 'DCL' hoặc 'Vice DCL'." });
      return;
    }

    if (!name?.trim() || !email?.trim()) {
      res.status(400).json({ success: false, error: "name và email không được để trống." });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO dcl_roles (name, email, title)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title
       RETURNING id, name, email, title, status, created_at`,
      [name.trim(), email.toLowerCase().trim(), title]
    );

    res.status(201).json({ success: true, data: mapDclUser(rows[0]) });
  } catch (err) {
    console.error("POST /users/dcl:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── PUT /api/users/dcl/:id (PMO) ────────────────────────────────────────────

router.put("/users/dcl/:id", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status, title } = req.body as {
      name?: string;
      email?: string;
      status?: "active" | "inactive";
      title?: "DCL" | "Vice DCL";
    };

    if (title !== undefined && !["DCL", "Vice DCL"].includes(title)) {
      res.status(400).json({ success: false, error: "title phải là 'DCL' hoặc 'Vice DCL'." });
      return;
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (name   !== undefined) { sets.push(`name = $${idx++}`);   vals.push(name.trim()); }
    if (email  !== undefined) { sets.push(`email = $${idx++}`);  vals.push(email.toLowerCase().trim()); }
    if (status !== undefined) { sets.push(`status = $${idx++}`); vals.push(status); }
    if (title  !== undefined) { sets.push(`title = $${idx++}`);  vals.push(title); }

    if (sets.length === 0) {
      res.status(400).json({ success: false, error: "Không có trường nào được cập nhật." });
      return;
    }

    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE dcl_roles SET ${sets.join(", ")}
        WHERE id = $${idx}
       RETURNING id, name, email, title, status, created_at`,
      vals
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy DCL user." });
      return;
    }

    res.json({ success: true, data: mapDclUser(rows[0]) });
  } catch (err) {
    console.error("PUT /users/dcl/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── DELETE /api/users/dcl/:id (PMO) ─────────────────────────────────────────

router.delete("/users/dcl/:id", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM dcl_roles WHERE id = $1`,
      [id]
    );

    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy DCL user." });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error("DELETE /users/dcl/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

export default router;
