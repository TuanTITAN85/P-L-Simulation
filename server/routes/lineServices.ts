import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";

const router = Router();

// ─── Helper: build manager list cho một line service ──────────────────────────

async function getManagersForLine(lineServiceId: string) {
  const { rows } = await pool.query(
    `SELECT id, name, email, status
       FROM sm_role_assignments
      WHERE line_service_id = $1
      ORDER BY name`,
    [lineServiceId]
  );
  return rows.map((r) => ({
    userId:   r.id    as string,   // sm_role_assignments.id (UUID)
    userName: r.name  as string,
    email:    r.email as string,
    status:   r.status as string,
  }));
}

// ─── GET /api/line-services ───────────────────────────────────────────────────

router.get("/line-services", requireRole(["PM", "SM", "PMO", "DCL"]), async (_req, res) => {
  try {
    const { rows: lineRows } = await pool.query(
      `SELECT ls.id, ls.name
         FROM line_services ls
        ORDER BY ls.name`
    );

    const result = await Promise.all(
      lineRows.map(async (ls) => ({
        id:       ls.id   as string,
        name:     ls.name as string,
        managers: await getManagersForLine(ls.id as string),
      }))
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("GET /line-services:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/line-services (PMO) ───────────────────────────────────────────
// Body: { name, managers?: [{ email, name }] }

router.post("/line-services", requireRole(["PMO"]), async (req, res) => {
  try {
    const { name, managers = [] } = req.body as {
      name?: string;
      managers?: { email: string; name: string }[];
    };

    if (!name?.trim()) {
      res.status(400).json({ success: false, error: "Tên Line Service không được để trống." });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `INSERT INTO line_services (name) VALUES ($1) RETURNING id, name`,
        [name.trim()]
      );
      const ls = rows[0];

      for (const m of managers) {
        if (!m.email?.trim() || !m.name?.trim()) continue;
        await client.query(
          `INSERT INTO sm_role_assignments (email, name, line_service_id)
           VALUES ($1, $2, $3) ON CONFLICT (email, line_service_id) DO NOTHING`,
          [m.email.toLowerCase().trim(), m.name.trim(), ls.id]
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        data: {
          id:       ls.id   as string,
          name:     ls.name as string,
          managers: await getManagersForLine(ls.id as string),
        },
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /line-services:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── PUT /api/line-services/:id (PMO) ────────────────────────────────────────

router.put("/line-services/:id", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body as { name?: string };

    if (!name?.trim()) {
      res.status(400).json({ success: false, error: "Tên Line Service không được để trống." });
      return;
    }

    const { rows } = await pool.query(
      `UPDATE line_services SET name = $1 WHERE id = $2 RETURNING id, name`,
      [name.trim(), id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy Line Service." });
      return;
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("PUT /line-services/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── DELETE /api/line-services/:id (PMO) ─────────────────────────────────────

router.delete("/line-services/:id", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;

    const { rows: linked } = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM projects WHERE line_service_id = $1`,
      [id]
    );

    if ((linked[0].cnt as number) > 0) {
      res.status(400).json({
        success: false,
        error: `Không thể xóa — có ${linked[0].cnt} dự án đang liên kết với Line Service này.`,
      });
      return;
    }

    const { rowCount } = await pool.query(
      `DELETE FROM line_services WHERE id = $1`,
      [id]
    );

    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy Line Service." });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error("DELETE /line-services/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/line-services/:id/managers (PMO) — Thêm SM ───────────────────
// Body: { email, name }

router.post("/line-services/:id/managers", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name } = req.body as { email?: string; name?: string };

    if (!email?.trim()) {
      res.status(400).json({ success: false, error: "email không được để trống." });
      return;
    }
    if (!name?.trim()) {
      res.status(400).json({ success: false, error: "name không được để trống." });
      return;
    }

    // Verify line service exists
    const { rows: lsRows } = await pool.query(
      `SELECT id FROM line_services WHERE id = $1`,
      [id]
    );
    if (lsRows.length === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy Line Service." });
      return;
    }

    // Enforce 1 SM per line service: remove existing SM first
    await pool.query(
      `DELETE FROM sm_role_assignments WHERE line_service_id = $1`,
      [id]
    );

    const { rows } = await pool.query(
      `INSERT INTO sm_role_assignments (email, name, line_service_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, status`,
      [email.toLowerCase().trim(), name.trim(), id]
    );

    res.status(201).json({
      success: true,
      data: {
        userId:   rows[0].id    as string,
        userName: rows[0].name  as string,
        email:    rows[0].email as string,
        status:   rows[0].status as string,
      },
    });
  } catch (err) {
    console.error("POST /line-services/:id/managers:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── DELETE /api/line-services/:id/managers/:uid (PMO) — Gỡ SM ──────────────
// :uid = sm_role_assignments.id

router.delete("/line-services/:id/managers/:uid", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id, uid } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM sm_role_assignments
        WHERE id = $1 AND line_service_id = $2`,
      [uid, id]
    );

    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy SM assignment." });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error("DELETE /line-services/:id/managers/:uid:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

export default router;
