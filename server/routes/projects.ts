import { Router } from "express";
import { pool } from "../db";
import { requirePmoOrDcl } from "../middleware/auth";

const router = Router();

// ─── Helper mappers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVersion(v: any) {
  return {
    id: Number(v.id),
    type: v.type,
    date: v.date,
    note: v.note || "",
    createdBy: v.created_by,
    data: typeof v.data === "string" ? JSON.parse(v.data) : (v.data ?? {}),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapActualEntry(a: any) {
  return {
    id: Number(a.id),
    month: a.month,
    importedAt: a.imported_at,
    fileName: a.file_name,
    selectedCodes: a.selected_codes || [],
    offshoreActualMM: Number(a.offshore_actual_mm),
    onsiteActualMM: Number(a.onsite_actual_mm),
    actualRevenue: Number(a.actual_revenue),
    actualDirectCost: Number(a.actual_direct_cost),
    calendarEffort: Number(a.calendar_effort),
    rows: typeof a.rows === "string" ? JSON.parse(a.rows) : (a.rows || []),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProject(p: any, versions: any[], actuals: any[]) {
  return {
    id: Number(p.id),
    code: p.code,
    name: p.name,
    startDate: p.start_date,
    endDate: p.end_date,
    currency: p.currency,
    status: p.status,
    lineId: p.line_id ? Number(p.line_id) : null,
    versions: versions.map(mapVersion),
    actualData: {
      prime:    actuals.filter(a => a.tab === "prime").map(mapActualEntry),
      supplier: actuals.filter(a => a.tab === "supplier").map(mapActualEntry),
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/projects — filtered by role
router.get("/projects", async (req, res) => {
  const user = req.user!;
  let projectRows;

  if (user.role === "pmo" || user.role === "dcl") {
    const { rows } = await pool.query("SELECT * FROM projects ORDER BY created_at");
    projectRows = rows;
  } else if (user.role === "sm") {
    const { rows } = await pool.query(
      `SELECT DISTINCT p.*
       FROM projects p
       JOIN user_lines ul ON ul.line_id = p.line_id
       WHERE ul.user_email = $1
       ORDER BY p.created_at`,
      [user.email]
    );
    projectRows = rows;
  } else {
    // pm — only assigned projects
    const { rows } = await pool.query(
      `SELECT p.*
       FROM projects p
       JOIN user_projects up ON up.project_id = p.id
       WHERE up.user_email = $1
       ORDER BY p.created_at`,
      [user.email]
    );
    projectRows = rows;
  }

  if (projectRows.length === 0) { res.json([]); return; }

  const ids = projectRows.map(p => p.id);
  const { rows: versions } = await pool.query(
    "SELECT * FROM versions WHERE project_id = ANY($1) ORDER BY created_at", [ids]
  );
  const { rows: actuals } = await pool.query(
    "SELECT * FROM actual_entries WHERE project_id = ANY($1) ORDER BY id", [ids]
  );

  res.json(projectRows.map(p =>
    mapProject(
      p,
      versions.filter(v => Number(v.project_id) === Number(p.id)),
      actuals.filter(a => Number(a.project_id) === Number(p.id)),
    )
  ));
});

// POST /api/projects — PMO/DCL only
router.post("/projects", requirePmoOrDcl, async (req, res) => {
  const { code, name, startDate, endDate, currency, status, lineId } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO projects (code, name, start_date, end_date, currency, status, line_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [code ?? "", name ?? "", startDate ?? "", endDate ?? "", currency ?? "USD", status ?? "active", lineId ?? null]
  );
  res.status(201).json(mapProject(rows[0], [], []));
});

// PATCH /api/projects/:id — PMO/DCL only
router.patch("/projects/:id", requirePmoOrDcl, async (req, res) => {
  const { code, name, startDate, endDate, currency, status, lineId } = req.body;
  const { rows } = await pool.query(
    `UPDATE projects SET code=$1, name=$2, start_date=$3, end_date=$4,
       currency=$5, status=$6, line_id=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
    [code ?? "", name ?? "", startDate ?? "", endDate ?? "", currency ?? "USD", status ?? "active", lineId ?? null, req.params.id]
  );
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: Number(rows[0].id), code: rows[0].code, name: rows[0].name,
    startDate: rows[0].start_date, endDate: rows[0].end_date,
    currency: rows[0].currency, status: rows[0].status, lineId: rows[0].line_id ? Number(rows[0].line_id) : null });
});

// DELETE /api/projects/:id — PMO/DCL only
router.delete("/projects/:id", requirePmoOrDcl, async (req, res) => {
  await pool.query("DELETE FROM projects WHERE id=$1", [req.params.id]);
  res.status(204).send();
});

// POST /api/projects/:id/versions
router.post("/projects/:id/versions", async (req, res) => {
  const { type, date, note, createdBy, data } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO versions (project_id, type, date, note, created_by, data)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.params.id, type ?? "bidding", date ?? "", note ?? "", createdBy ?? "", JSON.stringify(data ?? {})]
  );
  res.status(201).json(mapVersion(rows[0]));
});

// PATCH /api/versions/:id  — full data JSONB replace
router.patch("/versions/:id", async (req, res) => {
  const { data } = req.body;
  const { rows } = await pool.query(
    "UPDATE versions SET data=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
    [JSON.stringify(data), req.params.id]
  );
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapVersion(rows[0]));
});

// POST /api/projects/:id/actual/:tab
router.post("/projects/:id/actual/:tab", async (req, res) => {
  const { tab } = req.params;
  const {
    month, importedAt, fileName, selectedCodes,
    offshoreActualMM, onsiteActualMM,
    actualRevenue, actualDirectCost, calendarEffort,
    rows: dataRows,
  } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO actual_entries
       (project_id, tab, month, imported_at, file_name, selected_codes,
        offshore_actual_mm, onsite_actual_mm, actual_revenue, actual_direct_cost,
        calendar_effort, rows)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      req.params.id, tab,
      month ?? "", importedAt ?? "", fileName ?? "",
      selectedCodes ?? [],
      offshoreActualMM ?? 0, onsiteActualMM ?? 0,
      actualRevenue ?? 0, actualDirectCost ?? 0, calendarEffort ?? 0,
      JSON.stringify(dataRows ?? []),
    ]
  );
  res.status(201).json(mapActualEntry(rows[0]));
});

// DELETE /api/actual/:id
router.delete("/actual/:id", async (req, res) => {
  await pool.query("DELETE FROM actual_entries WHERE id=$1", [req.params.id]);
  res.status(204).send();
});

export default router;
