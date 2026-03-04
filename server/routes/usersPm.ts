import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";

const router = Router();

// ─── Helper: map pm_roles row → PmUser shape ──────────────────────────────────

function mapPmUser(u: Record<string, unknown>) {
  return {
    id:           u.id         as string,
    name:         u.name       as string,
    email:        u.email      as string,
    accountType:  "sso",
    status:       u.status     as string,
    createdAt:    u.created_at as string,
    pmAssignedAt: u.created_at as string,
  };
}

// ─── GET /api/users/pm (PMO) ─────────────────────────────────────────────────

router.get("/users/pm", requireRole(["PMO"]), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, status, created_at
         FROM pm_roles
        ORDER BY name`
    );

    res.json({ success: true, data: rows.map(mapPmUser) });
  } catch (err) {
    console.error("GET /users/pm:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/users/pm (PMO) ────────────────────────────────────────────────
// Body: { name, email }
// Logic: UPSERT vào pm_roles theo email (không tạo system_users)

router.post("/users/pm", requireRole(["PMO"]), async (req, res) => {
  try {
    const { name, email } = req.body as { name?: string; email?: string };

    if (!name?.trim() || !email?.trim()) {
      res.status(400).json({ success: false, error: "name và email không được để trống." });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO pm_roles (name, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email, status, created_at`,
      [name.trim(), email.toLowerCase().trim()]
    );

    res.status(201).json({ success: true, data: mapPmUser(rows[0]) });
  } catch (err) {
    console.error("POST /users/pm:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── PUT /api/users/pm/:id (PMO) ─────────────────────────────────────────────

router.put("/users/pm/:id", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status } = req.body as {
      name?: string;
      email?: string;
      status?: "active" | "inactive";
    };

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (name   !== undefined) { sets.push(`name = $${idx++}`);   vals.push(name.trim()); }
    if (email  !== undefined) { sets.push(`email = $${idx++}`);  vals.push(email.toLowerCase().trim()); }
    if (status !== undefined) { sets.push(`status = $${idx++}`); vals.push(status); }

    if (sets.length === 0) {
      res.status(400).json({ success: false, error: "Không có trường nào được cập nhật." });
      return;
    }

    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE pm_roles SET ${sets.join(", ")}
        WHERE id = $${idx}
       RETURNING id, name, email, status, created_at`,
      vals
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy PM user." });
      return;
    }

    res.json({ success: true, data: mapPmUser(rows[0]) });
  } catch (err) {
    console.error("PUT /users/pm/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── DELETE /api/users/pm/:id (PMO) ──────────────────────────────────────────

router.delete("/users/pm/:id", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM pm_roles WHERE id = $1`,
      [id]
    );

    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy PM user." });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error("DELETE /users/pm/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/users/pm/import (PMO) — Bulk CSV import ───────────────────────
// Body: { rows: [{ name, email }] }

router.post("/users/pm/import", requireRole(["PMO"]), async (req, res) => {
  try {
    const { rows: inputRows } = req.body as { rows?: { name?: string; email?: string }[] };

    if (!Array.isArray(inputRows) || inputRows.length === 0) {
      res.status(400).json({ success: false, error: "Danh sách rows không được để trống." });
      return;
    }

    const results: { email: string; action: "created" | "updated" }[] = [];
    const errors: { email: string; error: string }[] = [];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const row of inputRows) {
        if (!row.email?.trim() || !row.name?.trim()) {
          errors.push({ email: row.email || "(trống)", error: "Thiếu name hoặc email." });
          continue;
        }

        try {
          const email = row.email.toLowerCase().trim();

          const { rows: upserted } = await client.query(
            `INSERT INTO pm_roles (name, email)
             VALUES ($1, $2)
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
             RETURNING email, (xmax = 0) AS inserted`,
            [row.name.trim(), email]
          );

          results.push({
            email,
            action: (upserted[0].inserted as boolean) ? "created" : "updated",
          });
        } catch (e) {
          errors.push({ email: row.email, error: (e as Error).message });
        }
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      data: { results, errors, success: results.length, failed: errors.length },
    });
  } catch (err) {
    console.error("POST /users/pm/import:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

export default router;
