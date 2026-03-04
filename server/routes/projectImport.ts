import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";

const router = Router();

interface ProjectImportRow {
  code: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  status?: string;
  lineCode?: string;
}

// POST /api/projects/import — batch upsert projects from Excel (PMO/DCL only)
// Frontend parses the Excel file and sends pre-mapped rows.
router.post("/projects/import", requireRole(["PMO", "DCL"]), async (req, res) => {
  const { rows } = req.body as { rows: ProjectImportRow[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: "rows array là bắt buộc" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const results: { code: string; action: "created" | "updated"; id: number }[] = [];
    const errors:  { code: string; error: string }[] = [];

    for (const row of rows) {
      if (!row.code?.trim()) {
        errors.push({ code: "(trống)", error: "Thiếu mã dự án" });
        continue;
      }

      // Resolve line_id by lineCode (if provided)
      let lineId: number | null = null;
      if (row.lineCode) {
        const lineRes = await client.query(
          "SELECT id FROM lines WHERE code = $1",
          [row.lineCode.trim().toUpperCase()]
        );
        if (lineRes.rows.length > 0) lineId = Number(lineRes.rows[0].id);
      }

      const { rows: existing } = await client.query(
        "SELECT id, name FROM projects WHERE code = $1",
        [row.code.trim()]
      );

      if (existing.length > 0) {
        const upd = await client.query(
          `UPDATE projects SET
             name       = $1,
             start_date = $2,
             end_date   = $3,
             currency   = $4,
             status     = $5,
             line_id    = $6,
             updated_at = NOW()
           WHERE id = $7 RETURNING id`,
          [
            row.name || existing[0].name,
            row.startDate  || "",
            row.endDate    || "",
            row.currency   || "USD",
            row.status     || "active",
            lineId,
            existing[0].id,
          ]
        );
        results.push({ code: row.code, action: "updated", id: Number(upd.rows[0].id) });
      } else {
        const ins = await client.query(
          `INSERT INTO projects (code, name, start_date, end_date, currency, status, line_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            row.code.trim(),
            row.name       || row.code,
            row.startDate  || "",
            row.endDate    || "",
            row.currency   || "USD",
            row.status     || "active",
            lineId,
          ]
        );
        results.push({ code: row.code, action: "created", id: Number(ins.rows[0].id) });
      }
    }

    await client.query("COMMIT");
    res.json({ results, errors });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

export default router;
