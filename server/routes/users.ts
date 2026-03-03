import { Router } from "express";
import { pool } from "../db";
import { requirePmoOrDcl, requireAnyRole } from "../middleware/auth";

const router = Router();

// GET /api/me — current logged-in user (any authenticated user)
router.get("/me", requireAnyRole, (req, res) => {
  res.json(req.user);
});

// GET /api/users — list all users with their assignments (PMO/DCL only)
router.get("/users", requirePmoOrDcl, async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT
       u.id, u.email, u.display_name, u.role, u.active, u.created_at,
       COALESCE(
         (SELECT json_agg(up.project_id ORDER BY up.project_id)
          FROM user_projects up WHERE up.user_email = u.email),
         '[]'::json
       ) AS assigned_project_ids,
       COALESCE(
         (SELECT json_agg(ul.line_id ORDER BY ul.line_id)
          FROM user_lines ul WHERE ul.user_email = u.email),
         '[]'::json
       ) AS assigned_line_ids
     FROM users u
     ORDER BY u.created_at`
  );
  res.json(rows.map(r => ({
    id: Number(r.id),
    email: r.email,
    displayName: r.display_name,
    role: r.role,
    active: r.active,
    createdAt: r.created_at,
    assignedProjectIds: (r.assigned_project_ids as number[] | null || []).map(Number),
    assignedLineIds:    (r.assigned_line_ids    as number[] | null || []).map(Number),
  })));
});

// POST /api/users — create or upsert user (PMO/DCL only)
router.post("/users", requirePmoOrDcl, async (req, res) => {
  const { email, displayName, role } = req.body as { email: string; displayName?: string; role: string };
  if (!email || !role) { res.status(400).json({ error: "email và role là bắt buộc" }); return; }
  const normalized = email.trim().toLowerCase();
  const { rows } = await pool.query(
    `INSERT INTO users (email, display_name, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
       SET display_name = $2, role = $3, active = TRUE, updated_at = NOW()
     RETURNING id, email, display_name, role, active`,
    [normalized, displayName || normalized, role]
  );
  res.status(201).json({
    id: Number(rows[0].id),
    email: rows[0].email,
    displayName: rows[0].display_name,
    role: rows[0].role,
    active: rows[0].active,
  });
});

// PATCH /api/users/:email — update role, active flag, or displayName (PMO/DCL only)
router.patch("/users/:email", requirePmoOrDcl, async (req, res) => {
  const { role, active, displayName } = req.body as { role?: string; active?: boolean; displayName?: string };
  const normalized = decodeURIComponent(req.params.email).toLowerCase();
  const { rows } = await pool.query(
    `UPDATE users SET
       role         = COALESCE($1, role),
       active       = COALESCE($2, active),
       display_name = COALESCE($3, display_name),
       updated_at   = NOW()
     WHERE email = $4
     RETURNING id, email, display_name, role, active`,
    [role ?? null, active ?? null, displayName ?? null, normalized]
  );
  if (!rows[0]) { res.status(404).json({ error: "Không tìm thấy người dùng" }); return; }
  res.json({
    id: Number(rows[0].id),
    email: rows[0].email,
    displayName: rows[0].display_name,
    role: rows[0].role,
    active: rows[0].active,
  });
});

// DELETE /api/users/:email (PMO/DCL only)
router.delete("/users/:email", requirePmoOrDcl, async (req, res) => {
  const normalized = decodeURIComponent(req.params.email).toLowerCase();
  await pool.query("DELETE FROM users WHERE email = $1", [normalized]);
  res.status(204).send();
});

// PUT /api/users/:email/projects — replace all PM→project assignments (PMO/DCL only)
router.put("/users/:email/projects", requirePmoOrDcl, async (req, res) => {
  const normalized = decodeURIComponent(req.params.email).toLowerCase();
  const { projectIds } = req.body as { projectIds: number[] };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_projects WHERE user_email = $1", [normalized]);
    for (const pid of projectIds || []) {
      await client.query(
        "INSERT INTO user_projects (user_email, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [normalized, pid]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

// PUT /api/users/:email/lines — replace all SM→line assignments (PMO/DCL only)
router.put("/users/:email/lines", requirePmoOrDcl, async (req, res) => {
  const normalized = decodeURIComponent(req.params.email).toLowerCase();
  const { lineIds } = req.body as { lineIds: number[] };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_lines WHERE user_email = $1", [normalized]);
    for (const lid of lineIds || []) {
      await client.query(
        "INSERT INTO user_lines (user_email, line_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [normalized, lid]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

export default router;
