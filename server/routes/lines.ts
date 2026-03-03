import { Router } from "express";
import { pool } from "../db";
import { requirePmoOrDcl, requireAnyRole } from "../middleware/auth";

const router = Router();

// GET /api/lines — any authenticated user (SM needs this for their line list)
router.get("/lines", requireAnyRole, async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM lines ORDER BY code");
  res.json(rows.map(r => ({ id: Number(r.id), code: r.code, name: r.name })));
});

// POST /api/lines (PMO/DCL only)
router.post("/lines", requirePmoOrDcl, async (req, res) => {
  const { code, name } = req.body as { code: string; name?: string };
  if (!code) { res.status(400).json({ error: "code là bắt buộc" }); return; }
  const { rows } = await pool.query(
    `INSERT INTO lines (code, name)
     VALUES ($1, $2)
     ON CONFLICT (code) DO UPDATE SET name = $2
     RETURNING *`,
    [code.trim().toUpperCase(), name || code]
  );
  res.status(201).json({ id: Number(rows[0].id), code: rows[0].code, name: rows[0].name });
});

// PATCH /api/lines/:id (PMO/DCL only)
router.patch("/lines/:id", requirePmoOrDcl, async (req, res) => {
  const { name, code } = req.body as { name?: string; code?: string };
  const { rows } = await pool.query(
    `UPDATE lines SET
       name = COALESCE($1, name),
       code = COALESCE($2, code)
     WHERE id = $3 RETURNING *`,
    [name ?? null, code ? code.trim().toUpperCase() : null, req.params.id]
  );
  if (!rows[0]) { res.status(404).json({ error: "Không tìm thấy line" }); return; }
  res.json({ id: Number(rows[0].id), code: rows[0].code, name: rows[0].name });
});

// DELETE /api/lines/:id (PMO/DCL only)
router.delete("/lines/:id", requirePmoOrDcl, async (req, res) => {
  await pool.query("DELETE FROM lines WHERE id = $1", [req.params.id]);
  res.status(204).send();
});

export default router;
