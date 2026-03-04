import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";

const router = Router();

// ─── Helper ───────────────────────────────────────────────────────────────────

function mapMasterProject(r: Record<string, unknown>) {
  return {
    id:                 r.id                    as string,
    projectCode:        r.project_code          as string,
    projectName:        r.project_name          as string,
    projectDescription: r.project_description   as string | null,
    startDate:          r.start_date            as string | null,
    endDate:            r.end_date              as string | null,
    projectType:        r.project_type          as string | null,
    contractType:       r.contract_type         as string | null,
    projectManager:     r.project_manager       as string | null,
    importedAt:         r.imported_at           as string,
    importedBy:         r.imported_by_email     as string | null,
    hasPlanning:        (r.has_planning as string | null) === "1",
  };
}

// ─── GET /api/master-projects (PMO) ──────────────────────────────────────────

router.get("/master-projects", requireRole(["PMO", "DCL", "SM"]), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT mp.*,
              CASE WHEN p.id IS NOT NULL THEN '1' ELSE NULL END AS has_planning
         FROM master_projects mp
         LEFT JOIN projects p ON p.master_project_id = mp.id
        ORDER BY mp.project_code`
    );

    res.json({ success: true, data: rows.map(mapMasterProject) });
  } catch (err) {
    console.error("GET /master-projects:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── GET /api/master-projects/available (PM) — chưa có P&L ──────────────────
// PM: chỉ thấy dự án mà project_manager = email prefix của họ
// PMO/DCL/SM: thấy tất cả

router.get("/master-projects/available", requireRole(["PM", "PMO", "DCL", "SM"]), async (req, res) => {
  try {
    const user = req.currentUser!;
    const isPmOnly = user.roles.includes("PM") && !user.roles.some(r => ["PMO", "DCL", "SM"].includes(r));
    const emailPrefix = user.email.split("@")[0].toLowerCase();

    const { rows } = isPmOnly
      ? await pool.query(
          `SELECT mp.*
             FROM master_projects mp
            WHERE NOT EXISTS (
              SELECT 1 FROM projects p WHERE p.master_project_id = mp.id
            )
              AND LOWER(mp.project_manager) = $1
            ORDER BY mp.project_code`,
          [emailPrefix]
        )
      : await pool.query(
          `SELECT mp.*
             FROM master_projects mp
            WHERE NOT EXISTS (
              SELECT 1 FROM projects p WHERE p.master_project_id = mp.id
            )
            ORDER BY mp.project_code`
        );

    res.json({
      success: true,
      data: rows.map((r) => mapMasterProject({ ...r, has_planning: null })),
    });
  } catch (err) {
    console.error("GET /master-projects/available:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/master-projects (PMO) ─────────────────────────────────────────

router.post("/master-projects", requireRole(["PMO"]), async (req, res) => {
  try {
    const {
      projectCode, projectName, projectDescription,
      startDate, endDate, projectType, contractType,
    } = req.body as {
      projectCode?: string;
      projectName?: string;
      projectDescription?: string;
      startDate?: string;
      endDate?: string;
      projectType?: string;
      contractType?: string;
    };

    if (!projectCode?.trim() || !projectName?.trim()) {
      res.status(400).json({ success: false, error: "projectCode và projectName không được để trống." });
      return;
    }

    const importedBy = req.currentUser?.email || null;

    const { rows } = await pool.query(
      `INSERT INTO master_projects
         (project_code, project_name, project_description, start_date, end_date,
          project_type, contract_type, imported_by_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        projectCode.trim().toUpperCase(),
        projectName.trim(),
        projectDescription?.trim() || null,
        startDate || null,
        endDate   || null,
        projectType?.trim() || null,
        contractType?.trim() || null,
        importedBy,
      ]
    );

    res.status(201).json({ success: true, data: mapMasterProject({ ...rows[0], has_planning: null }) });
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    if (e.code === "23505") {
      res.status(400).json({ success: false, error: "Mã dự án đã tồn tại." });
      return;
    }
    console.error("POST /master-projects:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── PUT /api/master-projects/:id (PMO) ──────────────────────────────────────

router.put("/master-projects/:id", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      projectCode, projectName, projectDescription,
      startDate, endDate, projectType, contractType,
    } = req.body as Record<string, string | undefined>;

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (projectCode    !== undefined) { sets.push(`project_code = $${idx++}`);        vals.push(projectCode.trim().toUpperCase()); }
    if (projectName    !== undefined) { sets.push(`project_name = $${idx++}`);        vals.push(projectName.trim()); }
    if (projectDescription !== undefined) { sets.push(`project_description = $${idx++}`); vals.push(projectDescription.trim() || null); }
    if (startDate      !== undefined) { sets.push(`start_date = $${idx++}`);          vals.push(startDate || null); }
    if (endDate        !== undefined) { sets.push(`end_date = $${idx++}`);            vals.push(endDate || null); }
    if (projectType    !== undefined) { sets.push(`project_type = $${idx++}`);        vals.push(projectType.trim() || null); }
    if (contractType   !== undefined) { sets.push(`contract_type = $${idx++}`);       vals.push(contractType.trim() || null); }

    if (sets.length === 0) {
      res.status(400).json({ success: false, error: "Không có trường nào được cập nhật." });
      return;
    }

    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE master_projects SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      vals
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy master project." });
      return;
    }

    // Check has_planning
    const { rows: linked } = await pool.query(
      `SELECT id FROM projects WHERE master_project_id = $1 LIMIT 1`,
      [id]
    );

    res.json({
      success: true,
      data: mapMasterProject({ ...rows[0], has_planning: linked.length > 0 ? "1" : null }),
    });
  } catch (err) {
    console.error("PUT /master-projects/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── DELETE /api/master-projects/:id (PMO) ───────────────────────────────────

router.delete("/master-projects/:id", requireRole(["PMO"]), async (req, res) => {
  try {
    const { id } = req.params;

    // Check linked P&L project
    const { rows: linked } = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM projects WHERE master_project_id = $1`,
      [id]
    );

    if ((linked[0].cnt as number) > 0) {
      res.status(400).json({
        success: false,
        error: "Không thể xóa — đã có P&L được tạo cho project này.",
      });
      return;
    }

    const { rowCount } = await pool.query(
      `DELETE FROM master_projects WHERE id = $1`,
      [id]
    );

    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ success: false, error: "Không tìm thấy master project." });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error("DELETE /master-projects/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/master-projects/import (PMO) — Bulk import ───────────────────

router.post("/master-projects/import", requireRole(["PMO"]), async (req, res) => {
  try {
    const { rows: inputRows } = req.body as {
      rows?: {
        projectCode?: string;
        projectName?: string;
        projectDescription?: string;
        startDate?: string;
        endDate?: string;
        projectType?: string;
        contractType?: string;
        projectManager?: string;
      }[];
    };

    if (!Array.isArray(inputRows) || inputRows.length === 0) {
      res.status(400).json({ success: false, error: "Danh sách rows không được để trống." });
      return;
    }

    const importedBy = req.currentUser?.email || null;
    const results: { projectCode: string; action: "created" | "updated" }[] = [];
    const errors: { projectCode: string; error: string }[] = [];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const row of inputRows) {
        if (!row.projectCode?.trim() || !row.projectName?.trim()) {
          errors.push({ projectCode: row.projectCode || "(trống)", error: "Thiếu projectCode hoặc projectName." });
          continue;
        }

        try {
          const code = row.projectCode.trim().toUpperCase();

          const { rows: upserted } = await client.query(
            `INSERT INTO master_projects
               (project_code, project_name, project_description, start_date, end_date,
                project_type, contract_type, project_manager, imported_by_email)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (project_code) DO UPDATE SET
               project_name        = EXCLUDED.project_name,
               project_description = EXCLUDED.project_description,
               start_date          = EXCLUDED.start_date,
               end_date            = EXCLUDED.end_date,
               project_type        = EXCLUDED.project_type,
               contract_type       = EXCLUDED.contract_type,
               project_manager     = EXCLUDED.project_manager,
               imported_at         = NOW(),
               imported_by_email   = EXCLUDED.imported_by_email
             RETURNING project_code, (xmax = 0) AS inserted`,
            [
              code,
              row.projectName.trim(),
              row.projectDescription?.trim() || null,
              row.startDate || null,
              row.endDate   || null,
              row.projectType?.trim() || null,
              row.contractType?.trim() || null,
              row.projectManager?.trim().toLowerCase() || null,
              importedBy,
            ]
          );

          results.push({
            projectCode: upserted[0].project_code as string,
            action: (upserted[0].inserted as boolean) ? "created" : "updated",
          });
        } catch (e) {
          errors.push({ projectCode: row.projectCode, error: (e as Error).message });
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
    console.error("POST /master-projects/import:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

export default router;
