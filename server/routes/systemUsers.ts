import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";

const router = Router();

// GET /api/system-users?role=PM|SM|PMO|DCL&search=...
//
// Trả về danh sách user từ các role tables (email-based).
// Local admin (system_users với is_pmo=TRUE) được bao gồm khi filter PMO hoặc không filter.

router.get("/system-users", requireRole(["PM", "SM", "PMO", "DCL"]), async (req, res) => {
  const { role, search } = req.query as { role?: string; search?: string };
  const searchTerm = search?.trim() ? `%${search.trim()}%` : null;

  try {
    let rows: Record<string, unknown>[];

    if (role === "PM") {
      const { rows: r } = await pool.query(
        `SELECT id, email, name, status, ARRAY['PM'] AS roles
           FROM pm_roles
          WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
          ORDER BY name`,
        [searchTerm]
      );
      rows = r;

    } else if (role === "SM") {
      const { rows: r } = await pool.query(
        `SELECT MIN(id)::text AS id, email, MIN(name) AS name, MAX(status) AS status,
                ARRAY['SM'] AS roles
           FROM sm_role_assignments
          WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
          GROUP BY email
          ORDER BY MIN(name)`,
        [searchTerm]
      );
      rows = r;

    } else if (role === "DCL") {
      const { rows: r } = await pool.query(
        `SELECT id, email, name, status, ARRAY['DCL'] AS roles
           FROM dcl_roles
          WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
          ORDER BY name`,
        [searchTerm]
      );
      rows = r;

    } else if (role === "PMO") {
      // PMO = pmo_roles (SSO) + local admin với is_pmo = TRUE
      const { rows: r } = await pool.query(
        `SELECT id::text, email, name, status, ARRAY['PMO'] AS roles FROM pmo_roles
          WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
         UNION ALL
         SELECT id::text, email, name, status, ARRAY['PMO'] AS roles FROM system_users
          WHERE is_pmo = TRUE AND account_type = 'local'
            AND ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
         ORDER BY name`,
        [searchTerm]
      );
      rows = r;

    } else {
      // Không filter role: union tất cả, group by email, gom roles
      const { rows: r } = await pool.query(
        `WITH all_roles AS (
           SELECT email, name, status, 'PMO' AS role FROM pmo_roles
            WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
           UNION ALL
           SELECT email, name, status, 'PM'  AS role FROM pm_roles
            WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
           UNION ALL
           SELECT email, name, status, 'DCL' AS role FROM dcl_roles
            WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
           UNION ALL
           SELECT email, MIN(name) AS name, MAX(status) AS status, 'SM' AS role
             FROM sm_role_assignments
            WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
            GROUP BY email
           UNION ALL
           SELECT email, name, status, 'PMO' AS role FROM system_users
            WHERE is_pmo = TRUE AND account_type = 'local'
              AND ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)
         )
         SELECT email, MAX(name) AS name, MAX(status) AS status,
                ARRAY_AGG(DISTINCT role ORDER BY role) AS roles
           FROM all_roles
          GROUP BY email
          ORDER BY MAX(name)`,
        [searchTerm]
      );
      rows = r;
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET /system-users error:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ." });
  }
});

export default router;
