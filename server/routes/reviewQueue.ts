import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";

const router = Router();

// ─── Helper: map flat SQL row → ReviewItem ────────────────────────────────────

function mapReviewItem(row: Record<string, unknown>) {
  const history = Array.isArray(row.approval_history)
    ? row.approval_history
    : typeof row.approval_history === "string"
      ? (JSON.parse(row.approval_history as string) as unknown[])
      : [];

  return {
    versionId:       Number(row.id),
    projectId:       Number(row.project_id),
    projectCode:     (row.code as string) || "",
    projectName:     (row.name as string) || "",
    lineServiceId:   (row.line_service_id as string) || null,
    lineServiceName: (row.line_service_name as string) || null,
    versionType:     (row.type as string) || "",
    createdByName:   (row.created_by_name as string) || null,
    submittedAt:     (row.submitted_at as string) || null,
    status:          (row.status as string) || "draft",
    smSkipped:       Boolean(row.sm_skipped),
    approvalHistory: history,
    versionData:     typeof row.data === "string"
                       ? JSON.parse(row.data as string)
                       : (row.data ?? {}),
  };
}

// ─── GET /api/review/counts ───────────────────────────────────────────────────

router.get("/review/counts", requireRole(["SM", "PMO", "DCL"]), async (req, res) => {
  try {
    const currentUser = req.currentUser!;
    const counts = { sm: 0, pmo: 0, dcl: 0 };

    if (currentUser.roles.includes("SM")) {
      const lsIds = currentUser.managedLineServiceIds ?? [];
      if (lsIds.length > 0) {
        const { rows } = await pool.query(
          `SELECT COUNT(*)::int AS cnt
             FROM versions v
             JOIN projects p ON p.id = v.project_id
            WHERE v.status = 'pending_sm'
              AND p.line_service_id = ANY($1)`,
          [lsIds],
        );
        counts.sm = (rows[0]?.cnt as number) || 0;
      }
    }

    if (currentUser.roles.includes("PMO")) {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM versions WHERE status = 'pending_pmo'`,
      );
      counts.pmo = (rows[0]?.cnt as number) || 0;
    }

    if (currentUser.roles.includes("DCL")) {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM versions WHERE status = 'pending_dcl'`,
      );
      counts.dcl = (rows[0]?.cnt as number) || 0;
    }

    res.json({ success: true, data: counts });
  } catch (err) {
    console.error("GET /review/counts:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── GET /api/review/pending-sm ───────────────────────────────────────────────

router.get("/review/pending-sm", requireRole(["SM"]), async (req, res) => {
  try {
    const currentUser = req.currentUser!;
    const lsIds = currentUser.managedLineServiceIds ?? [];

    if (lsIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const { rows } = await pool.query(
      `SELECT v.id, v.type, v.status, v.sm_skipped, v.submitted_at,
              v.approval_history, v.data,
              p.id       AS project_id,
              p.code,
              p.name,
              p.line_service_id,
              p.created_by_name,
              ls.name    AS line_service_name
         FROM versions v
         JOIN projects p  ON p.id  = v.project_id
         LEFT JOIN line_services ls ON ls.id = p.line_service_id
        WHERE v.status = 'pending_sm'
          AND p.line_service_id = ANY($1)
        ORDER BY v.submitted_at ASC NULLS LAST`,
      [lsIds],
    );

    res.json({ success: true, data: rows.map(mapReviewItem) });
  } catch (err) {
    console.error("GET /review/pending-sm:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── GET /api/review/pending-pmo ─────────────────────────────────────────────

router.get("/review/pending-pmo", requireRole(["PMO"]), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.id, v.type, v.status, v.sm_skipped, v.submitted_at,
              v.approval_history, v.data,
              p.id       AS project_id,
              p.code,
              p.name,
              p.line_service_id,
              p.created_by_name,
              ls.name    AS line_service_name
         FROM versions v
         JOIN projects p  ON p.id  = v.project_id
         LEFT JOIN line_services ls ON ls.id = p.line_service_id
        WHERE v.status = 'pending_pmo'
        ORDER BY v.submitted_at ASC NULLS LAST`,
    );

    res.json({ success: true, data: rows.map(mapReviewItem) });
  } catch (err) {
    console.error("GET /review/pending-pmo:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── GET /api/review/pending-dcl ─────────────────────────────────────────────

router.get("/review/pending-dcl", requireRole(["DCL"]), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.id, v.type, v.status, v.sm_skipped, v.submitted_at,
              v.approval_history, v.data,
              p.id       AS project_id,
              p.code,
              p.name,
              p.line_service_id,
              p.created_by_name,
              ls.name    AS line_service_name
         FROM versions v
         JOIN projects p  ON p.id  = v.project_id
         LEFT JOIN line_services ls ON ls.id = p.line_service_id
        WHERE v.status = 'pending_dcl'
        ORDER BY v.submitted_at ASC NULLS LAST`,
    );

    res.json({ success: true, data: rows.map(mapReviewItem) });
  } catch (err) {
    console.error("GET /review/pending-dcl:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

export default router;
