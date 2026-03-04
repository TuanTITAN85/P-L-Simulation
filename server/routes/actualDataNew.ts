import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";
import { calcDirectCostFromRows } from "../utils/actualData";

const router = Router();


// ─── GET /api/actual-entries (PMO + DCL) ─────────────────────────────────────
// Query params: tab (prime|supplier), search (project code substring)

router.get("/actual-entries", requireRole(["PMO", "DCL"]), async (req, res) => {
  try {
    const tab    = (req.query.tab    as string | undefined) || "";
    const search = (req.query.search as string | undefined) || "";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (tab === "prime" || tab === "supplier") {
      params.push(tab);
      conditions.push(`tab = $${params.length}`);
    }
    if (search.trim()) {
      params.push(`%${search.trim().toUpperCase()}%`);
      conditions.push(`UPPER(project_code) LIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT id, project_code, tab, month, offshore_actual_mm, onsite_actual_mm,
              actual_revenue, calendar_effort,
              file_name, imported_at, selected_codes, rows
         FROM actual_entries
         ${where}
        ORDER BY imported_at DESC, id DESC
        LIMIT 500`,
      params
    );

    const data = rows.map(r => {
      const rawRows: Record<string, string>[] = typeof r.rows === "string"
        ? JSON.parse(r.rows as string)
        : ((r.rows as Record<string, string>[]) || []);
      return { ...r, rows: undefined, actual_direct_cost: calcDirectCostFromRows(rawRows) };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("GET /actual-entries:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── DELETE /api/actual-entries/:id (PMO + DCL) ───────────────────────────────

router.delete("/actual-entries/:id", requireRole(["PMO", "DCL"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ success: false, error: "ID không hợp lệ." });
      return;
    }
    const { rowCount } = await pool.query("DELETE FROM actual_entries WHERE id = $1", [id]);
    if (!rowCount) {
      res.status(404).json({ success: false, error: "Không tìm thấy bản ghi." });
      return;
    }
    res.json({ success: true, data: { deleted: id } });
  } catch (err) {
    console.error("DELETE /actual-entries/:id:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

// ─── POST /api/actual-entries/import-by-code (PMO + DCL) ─────────────────────
// Import actual entries by project code (no need for project ID on frontend)
// Body: { tab, entries: [{ projectCode, month, importedAt, fileName, selectedCodes,
//          offshoreActualMM, onsiteActualMM, actualRevenue, actualDirectCost,
//          calendarEffort, rows }] }

router.post("/actual-entries/import-by-code", requireRole(["PMO", "DCL"]), async (req, res) => {
  try {
    const { tab, entries } = req.body as {
      tab?: string;
      entries?: {
        projectCode?: string;
        month?: string;
        importedAt?: string;
        fileName?: string;
        selectedCodes?: string[];
        offshoreActualMM?: number;
        onsiteActualMM?: number;
        actualRevenue?: number;
        actualDirectCost?: number;
        calendarEffort?: number;
        rows?: unknown[];
      }[];
    };

    if (!tab || !["prime", "supplier"].includes(tab)) {
      res.status(400).json({ success: false, error: "tab phải là 'prime' hoặc 'supplier'." });
      return;
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ success: false, error: "Danh sách entries không được để trống." });
      return;
    }

    const results: { projectCode: string; id: number }[] = [];
    const errors: { projectCode: string; reason: string }[] = [];

    for (const entry of entries) {
      const code = (entry.projectCode || "").trim().toUpperCase();
      if (!code) { errors.push({ projectCode: "", reason: "Thiếu projectCode." }); continue; }
      if (!entry.month || !/^\d{4}-\d{2}$/.test(entry.month)) {
        errors.push({ projectCode: code, reason: `month không hợp lệ: '${entry.month}'.` }); continue;
      }

      // Soft reference: look up project_id if available, but don't block import if not found
      const { rows: proj } = await pool.query(
        "SELECT id FROM projects WHERE UPPER(code) = $1 LIMIT 1", [code]
      );
      const projectId: number | null = proj.length > 0 ? (proj[0].id as number) : null;

      try {
        const { rows: inserted } = await pool.query(
          `INSERT INTO actual_entries
             (project_id, project_code, tab, month, imported_at, file_name, selected_codes,
              offshore_actual_mm, onsite_actual_mm, actual_revenue,
              calendar_effort, rows)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
          [
            projectId, code, tab,
            entry.month, entry.importedAt ?? "", entry.fileName ?? "",
            entry.selectedCodes ?? [],
            entry.offshoreActualMM ?? 0, entry.onsiteActualMM ?? 0,
            entry.actualRevenue ?? 0,
            entry.calendarEffort ?? 0, JSON.stringify(entry.rows ?? []),
          ]
        );
        results.push({ projectCode: code, id: Number(inserted[0].id) });
      } catch (e) {
        errors.push({ projectCode: code, reason: (e as Error).message });
      }
    }

    res.json({ success: true, data: { inserted: results.length, failed: errors.length, errors } });
  } catch (err) {
    console.error("POST /actual-entries/import-by-code:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

export default router;
