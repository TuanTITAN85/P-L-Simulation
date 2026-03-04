import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";
import { calcDirectCostFromRows } from "../utils/actualData";

const router = Router();

// ─── Helper mappers ───────────────────────────────────────────────────────────

function mapVersionFull(v: Record<string, unknown>) {
  return {
    id: Number(v.id),
    type: v.type as string,
    date: v.date as string,
    note: (v.note as string) || "",
    createdBy: v.created_by as string,
    data: typeof v.data === "string" ? JSON.parse(v.data as string) : (v.data ?? {}),
    // Workflow fields
    status: (v.status as string) || "draft",
    smSkipped: Boolean(v.sm_skipped),
    approvalHistory: Array.isArray(v.approval_history)
      ? v.approval_history
      : (typeof v.approval_history === "string" ? JSON.parse(v.approval_history as string) : []),
    currentRejectionComment: (v.current_rejection_comment as string) || null,
    submittedAt: (v.submitted_at as string) || null,
  };
}

function mapActualEntry(a: Record<string, unknown>) {
  const rows: Record<string, string>[] = typeof a.rows === "string"
    ? JSON.parse(a.rows as string)
    : ((a.rows as Record<string, string>[]) || []);
  return {
    id: Number(a.id),
    month: a.month as string,
    importedAt: a.imported_at as string,
    fileName: a.file_name as string,
    selectedCodes: (a.selected_codes as string[]) || [],
    offshoreActualMM: Number(a.offshore_actual_mm),
    onsiteActualMM: Number(a.onsite_actual_mm),
    actualRevenue: Number(a.actual_revenue),
    actualDirectCost: calcDirectCostFromRows(rows),
    calendarEffort: Number(a.calendar_effort),
    rows,
  };
}

function mapPmProject(
  p: Record<string, unknown>,
  versions: Record<string, unknown>[],
  actuals: Record<string, unknown>[],
) {
  return {
    id: Number(p.id),
    code: p.code as string,
    name: p.name as string,
    startDate: (p.start_date as string) || "",
    endDate: (p.end_date as string) || "",
    currency: (p.currency as string) || "USD",
    status: (p.status as string) || "active",
    lineId: p.line_id ? Number(p.line_id) : null,
    lineServiceId: (p.line_service_id as string) || null,
    lineServiceName: (p.line_service_name as string) || null,
    createdByName: (p.created_by_name as string) || null,
    createdByEmail: (p.created_by_email as string) || null,
    masterProjectId: (p.master_project_id as string) || null,
    projectType: (p.project_type as string) || null,
    contractType: (p.contract_type as string) || null,
    projectDescription: (p.project_description as string) || null,
    versions: versions.map(mapVersionFull),
    actualData: {
      prime:    actuals.filter(a => a.tab === "prime").map(mapActualEntry),
      supplier: actuals.filter(a => a.tab === "supplier").map(mapActualEntry),
    },
  };
}

// ─── GET /api/pm/projects ─────────────────────────────────────────────────────

router.get("/pm/projects", requireRole(["PM", "SM", "PMO", "DCL"]), async (req, res) => {
  try {
    const currentUser = req.currentUser!;
    const isPmoOrDcl = currentUser.roles.includes("PMO") || currentUser.roles.includes("DCL");
    const isSm = !isPmoOrDcl && currentUser.roles.includes("SM");

    let projectRows: Record<string, unknown>[];

    if (isPmoOrDcl) {
      // PMO / DCL — all projects
      const { rows } = await pool.query(
        `SELECT p.*,
                ls.name AS line_service_name,
                mp.project_type,
                mp.contract_type,
                mp.project_description
           FROM projects p
           LEFT JOIN line_services ls ON ls.id = p.line_service_id
           LEFT JOIN master_projects mp ON mp.id = p.master_project_id
          ORDER BY p.created_at DESC`,
      );
      projectRows = rows;
    } else if (isSm) {
      // SM — projects belonging to their managed line services
      const { rows } = await pool.query(
        `SELECT p.*,
                ls.name AS line_service_name,
                mp.project_type,
                mp.contract_type,
                mp.project_description
           FROM projects p
           LEFT JOIN line_services ls ON ls.id = p.line_service_id
           LEFT JOIN master_projects mp ON mp.id = p.master_project_id
          WHERE p.line_service_id IN (
            SELECT line_service_id FROM sm_role_assignments
             WHERE email = $1 AND status = 'active'
          )
          ORDER BY p.created_at DESC`,
        [currentUser.email],
      );
      projectRows = rows;
    } else {
      // PM — only projects they created
      const { rows } = await pool.query(
        `SELECT p.*,
                ls.name AS line_service_name,
                mp.project_type,
                mp.contract_type,
                mp.project_description
           FROM projects p
           LEFT JOIN line_services ls ON ls.id = p.line_service_id
           LEFT JOIN master_projects mp ON mp.id = p.master_project_id
          WHERE p.created_by_email = $1
          ORDER BY p.created_at DESC`,
        [currentUser.email],
      );
      projectRows = rows;
    }

    if (projectRows.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const ids = projectRows.map((p) => p.id);

    const { rows: versionRows } = await pool.query(
      `SELECT id, project_id, type, date, note, created_by, data,
              status, sm_skipped, approval_history,
              current_rejection_comment, submitted_at
         FROM versions
        WHERE project_id = ANY($1)
        ORDER BY created_at ASC`,
      [ids],
    );

    const codes = projectRows.map((p) => (p.code as string).toUpperCase());

    const { rows: actualRows } = await pool.query(
      `SELECT * FROM actual_entries WHERE UPPER(project_code) = ANY($1) ORDER BY id`,
      [codes],
    );

    const data = projectRows.map((p) => {
      const pid = Number(p.id);
      const pcode = (p.code as string).toUpperCase();
      return mapPmProject(
        p,
        versionRows.filter((v) => Number(v.project_id) === pid),
        actualRows.filter((a) => (a.project_code as string)?.toUpperCase() === pcode),
      );
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("GET /pm/projects:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/pm/projects ────────────────────────────────────────────────────

router.post("/pm/projects", requireRole(["PM"]), async (req, res) => {
  try {
    const { masterProjectId, lineServiceId, currency } = req.body as {
      masterProjectId?: string;
      lineServiceId?: string;
      currency?: string;
    };

    const currentUser = req.currentUser!;

    if (!masterProjectId) {
      res.status(400).json({ success: false, error: "masterProjectId là bắt buộc." });
      return;
    }
    if (!lineServiceId) {
      res.status(400).json({ success: false, error: "lineServiceId là bắt buộc." });
      return;
    }

    // Fetch master project
    const { rows: mpRows } = await pool.query(
      `SELECT id, project_code, project_name, project_description,
              start_date, end_date, project_type, contract_type
         FROM master_projects WHERE id = $1`,
      [masterProjectId],
    );

    if (mpRows.length === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy master project." });
      return;
    }

    // Check if already has P&L
    const { rows: existing } = await pool.query(
      `SELECT id FROM projects WHERE master_project_id = $1 LIMIT 1`,
      [masterProjectId],
    );

    if (existing.length > 0) {
      res.status(400).json({ success: false, error: "Dự án này đã có P&L được tạo." });
      return;
    }

    const mp = mpRows[0];

    const { rows } = await pool.query(
      `INSERT INTO projects
         (code, name, start_date, end_date, currency, status,
          line_service_id, created_by_email, created_by_name, master_project_id)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9)
       RETURNING *`,
      [
        mp.project_code as string,
        mp.project_name as string,
        (mp.start_date as string) || null,
        (mp.end_date as string) || null,
        currency || "USD",
        lineServiceId,
        currentUser.email,
        currentUser.name,
        masterProjectId,
      ],
    );

    const newProject = rows[0];

    // Fetch line service name
    const { rows: lsRows } = await pool.query(
      `SELECT name FROM line_services WHERE id = $1`,
      [lineServiceId],
    );

    res.status(201).json({
      success: true,
      data: mapPmProject(
        {
          ...newProject,
          line_service_name: (lsRows[0]?.name as string) || null,
          project_type:        mp.project_type,
          contract_type:       mp.contract_type,
          project_description: mp.project_description,
        },
        [],
        [],
      ),
    });
  } catch (err) {
    console.error("POST /pm/projects:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── PATCH /api/pm/projects/:id — update line service ────────────────────────

router.patch("/pm/projects/:id", requireRole(["PM", "PMO"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { lineServiceId } = req.body as { lineServiceId?: string };
    const currentUser = req.currentUser!;

    // PM can only edit their own projects
    if (currentUser.roles.includes("PM") && !currentUser.roles.includes("PMO")) {
      const { rows: own } = await pool.query(
        `SELECT id FROM projects WHERE id = $1 AND created_by_email = $2`,
        [id, currentUser.email],
      );
      if (own.length === 0) {
        res.status(403).json({ success: false, error: "Không có quyền chỉnh sửa dự án này." });
        return;
      }
    }

    if (!lineServiceId) {
      res.status(400).json({ success: false, error: "lineServiceId là bắt buộc." });
      return;
    }

    const { rows } = await pool.query(
      `UPDATE projects SET line_service_id = $1, updated_at = NOW()
          WHERE id = $2
       RETURNING id, line_service_id`,
      [lineServiceId, id],
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy dự án." });
      return;
    }

    const { rows: lsRows } = await pool.query(
      `SELECT name FROM line_services WHERE id = $1`,
      [lineServiceId],
    );

    res.json({
      success: true,
      data: {
        lineServiceId: rows[0].line_service_id as string,
        lineServiceName: (lsRows[0]?.name as string) || null,
      },
    });
  } catch (err) {
    console.error("PATCH /pm/projects/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── DELETE /api/pm/projects/:id ─────────────────────────────────────────────

router.delete("/pm/projects/:id", requireRole(["PM", "PMO"]), async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.currentUser!;

    // PM can only delete their own projects; PMO can delete any
    if (!currentUser.roles.includes("PMO")) {
      const { rows: own } = await pool.query(
        `SELECT id FROM projects WHERE id = $1 AND created_by_email = $2`,
        [id, currentUser.email],
      );
      if (own.length === 0) {
        res.status(403).json({ success: false, error: "Không có quyền xóa dự án này." });
        return;
      }
    }

    // Only allow delete if all versions are in draft/rejected
    const { rows: lockedVersions } = await pool.query(
      `SELECT id FROM versions
        WHERE project_id = $1
          AND status NOT IN ('draft', 'rejected')`,
      [id],
    );
    if (lockedVersions.length > 0) {
      res.status(400).json({
        success: false,
        error: "Không thể xóa dự án khi có phiên bản đang chờ duyệt hoặc đã được duyệt.",
      });
      return;
    }

    await pool.query(`DELETE FROM versions WHERE project_id = $1`, [id]);
    const { rowCount } = await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);

    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy dự án." });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error("DELETE /pm/projects/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── DELETE /api/pm/projects/:id/versions/:vid ────────────────────────────────

router.delete("/pm/projects/:id/versions/:vid", requireRole(["PM", "PMO"]), async (req, res) => {
  try {
    const { id, vid } = req.params;
    const currentUser = req.currentUser!;

    // Check version exists and belongs to project
    const { rows: verRows } = await pool.query(
      `SELECT v.id, v.status, p.created_by_email
         FROM versions v
         JOIN projects p ON p.id = v.project_id
        WHERE v.id = $1 AND v.project_id = $2`,
      [vid, id],
    );

    if (verRows.length === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy phiên bản." });
      return;
    }

    const ver = verRows[0];

    // PM can only delete versions of their own projects
    if (!currentUser.roles.includes("PMO")) {
      if ((ver.created_by_email as string) !== currentUser.email) {
        res.status(403).json({ success: false, error: "Không có quyền xóa phiên bản này." });
        return;
      }
    }

    // Only draft or rejected versions can be deleted
    if (!["draft", "rejected"].includes(ver.status as string)) {
      res.status(400).json({
        success: false,
        error: "Chỉ có thể xóa phiên bản ở trạng thái Bản nháp hoặc Bị từ chối.",
      });
      return;
    }

    await pool.query(`DELETE FROM versions WHERE id = $1`, [vid]);
    res.json({ success: true, data: null });
  } catch (err) {
    console.error("DELETE /pm/projects/:id/versions/:vid:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

export default router;
