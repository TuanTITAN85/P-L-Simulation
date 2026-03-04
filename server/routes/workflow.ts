import { Router } from "express";
import { pool } from "../db";
import { requireRole } from "../middleware/auth";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalHistoryEntry {
  step:      "SM" | "PMO" | "DCL";
  userId:    string;
  userName:  string;
  action:    "approved" | "rejected" | "skipped";
  comment?:  string;
  timestamp: string;
}

// ─── Helper: fetch version + project in one query ─────────────────────────────

async function getVersionWithProject(projectId: string, versionId: string) {
  const { rows } = await pool.query(
    `SELECT v.id, v.project_id, v.status, v.approval_history,
            v.current_rejection_comment, v.sm_skipped, v.submitted_at,
            v.data,
            p.line_service_id, p.created_by_email
       FROM versions v
       JOIN projects p ON p.id = v.project_id
      WHERE v.id = $1 AND v.project_id = $2`,
    [versionId, projectId]
  );
  return rows[0] as Record<string, unknown> | undefined;
}

// ─── POST /api/projects/:id/versions/:vid/submit ──────────────────────────────

router.post(
  "/projects/:id/versions/:vid/submit",
  requireRole(["PM", "PMO", "SM", "DCL"]),
  async (req, res) => {
    try {
      const { id, vid } = req.params;
      const currentUser = req.currentUser!;

      const version = await getVersionWithProject(id, vid);
      if (!version) {
        res.status(404).json({ success: false, error: "Không tìm thấy version." });
        return;
      }

      if (version.status !== "draft") {
        res.status(400).json({
          success: false,
          error: `Version đang ở trạng thái '${version.status}', không thể submit.`,
        });
        return;
      }

      // Check conflict of interest: PM có phải SM của Line Service này không?
      const lineServiceId = version.line_service_id as string | null;
      let smSkipped = false;
      let newStatus: string = "pending_sm";
      const history: ApprovalHistoryEntry[] = (version.approval_history as ApprovalHistoryEntry[]) || [];

      if (lineServiceId && currentUser.managedLineServiceIds?.includes(lineServiceId)) {
        // PM đồng thời là SM của Line Service này → bỏ qua bước SM
        smSkipped = true;
        newStatus = "pending_pmo";

        history.push({
          step:      "SM",
          userId:    currentUser.id,
          userName:  currentUser.name,
          action:    "skipped",
          comment:   "PM là SM của Line Service này (conflict of interest — tự động bỏ qua)",
          timestamp: new Date().toISOString(),
        });
      }

      const now = new Date();

      await pool.query(
        `UPDATE versions
            SET status                    = $1,
                sm_skipped                = $2,
                submitted_at              = COALESCE(submitted_at, $3),
                approval_history          = $4::jsonb,
                current_rejection_comment = NULL
          WHERE id = $5`,
        [newStatus, smSkipped, now.toISOString(), JSON.stringify(history), vid]
      );

      console.log(
        `[SUBMIT] version=${vid} by=${currentUser.email} → ${newStatus}${smSkipped ? " (SM skipped)" : ""}`
      );

      res.json({
        success: true,
        data: {
          id:         vid,
          status:     newStatus,
          smSkipped,
          submittedAt: now.toISOString(),
        },
      });
    } catch (err) {
      console.error("POST /versions/:vid/submit:", err);
      res.status(500).json({ success: false, error: "Lỗi máy chủ." });
    }
  }
);

// ─── POST /api/projects/:id/versions/:vid/approve ────────────────────────────

router.post(
  "/projects/:id/versions/:vid/approve",
  requireRole(["SM", "PMO", "DCL"]),
  async (req, res) => {
    try {
      const { id, vid } = req.params;
      const { comment } = req.body as { comment?: string };
      const currentUser = req.currentUser!;

      const version = await getVersionWithProject(id, vid);
      if (!version) {
        res.status(404).json({ success: false, error: "Không tìm thấy version." });
        return;
      }

      const currentStatus = version.status as string;
      const lineServiceId = version.line_service_id as string | null;
      const history: ApprovalHistoryEntry[] = (version.approval_history as ApprovalHistoryEntry[]) || [];

      let step: "SM" | "PMO" | "DCL";
      let nextStatus: string;

      // Xác định bước dựa theo trạng thái + quyền người dùng
      if (
        currentStatus === "pending_sm" &&
        currentUser.roles.includes("SM") &&
        lineServiceId &&
        currentUser.managedLineServiceIds?.includes(lineServiceId) &&
        // PM tạo version không được approve bước SM của chính mình
        currentUser.email !== (version.created_by_email as string)
      ) {
        step = "SM";
        nextStatus = "pending_pmo";
      } else if (currentStatus === "pending_pmo" && currentUser.roles.includes("PMO")) {
        step = "PMO";
        nextStatus = "pending_dcl";
      } else if (currentStatus === "pending_dcl" && currentUser.roles.includes("DCL")) {
        step = "DCL";
        nextStatus = "approved";
      } else {
        res.status(403).json({
          success: false,
          error: "Bạn không có quyền phê duyệt ở bước này hoặc trạng thái không hợp lệ.",
        });
        return;
      }

      history.push({
        step,
        userId:    currentUser.id,
        userName:  currentUser.name,
        action:    "approved",
        comment:   comment?.trim() || undefined,
        timestamp: new Date().toISOString(),
      });

      await pool.query(
        `UPDATE versions
            SET status           = $1,
                approval_history = $2::jsonb,
                current_rejection_comment = NULL
          WHERE id = $3`,
        [nextStatus, JSON.stringify(history), vid]
      );

      console.log(`[APPROVE] version=${vid} step=${step} by=${currentUser.email} → ${nextStatus}`);

      res.json({
        success: true,
        data: { id: vid, status: nextStatus, step, approvedBy: currentUser.name },
      });
    } catch (err) {
      console.error("POST /versions/:vid/approve:", err);
      res.status(500).json({ success: false, error: "Lỗi máy chủ." });
    }
  }
);

// ─── POST /api/projects/:id/versions/:vid/reject ─────────────────────────────

router.post(
  "/projects/:id/versions/:vid/reject",
  requireRole(["SM", "PMO", "DCL"]),
  async (req, res) => {
    try {
      const { id, vid } = req.params;
      const { comment } = req.body as { comment?: string };
      const currentUser = req.currentUser!;

      if (!comment?.trim()) {
        res.status(400).json({ success: false, error: "Lý do từ chối (comment) là bắt buộc." });
        return;
      }

      const version = await getVersionWithProject(id, vid);
      if (!version) {
        res.status(404).json({ success: false, error: "Không tìm thấy version." });
        return;
      }

      const currentStatus = version.status as string;
      const lineServiceId = version.line_service_id as string | null;
      const history: ApprovalHistoryEntry[] = (version.approval_history as ApprovalHistoryEntry[]) || [];

      // Kiểm tra quyền reject theo bước
      const canReject =
        (currentStatus === "pending_sm"  && currentUser.roles.includes("SM")  && lineServiceId && currentUser.managedLineServiceIds?.includes(lineServiceId)) ||
        (currentStatus === "pending_pmo" && currentUser.roles.includes("PMO")) ||
        (currentStatus === "pending_dcl" && currentUser.roles.includes("DCL"));

      if (!canReject) {
        res.status(403).json({
          success: false,
          error: "Bạn không có quyền từ chối ở bước này hoặc trạng thái không hợp lệ.",
        });
        return;
      }

      const step = currentStatus === "pending_sm" ? "SM" : currentStatus === "pending_pmo" ? "PMO" : "DCL";

      history.push({
        step:      step as "SM" | "PMO" | "DCL",
        userId:    currentUser.id,
        userName:  currentUser.name,
        action:    "rejected",
        comment:   comment.trim(),
        timestamp: new Date().toISOString(),
      });

      await pool.query(
        `UPDATE versions
            SET status                    = 'draft',
                approval_history          = $1::jsonb,
                current_rejection_comment = $2
          WHERE id = $3`,
        [JSON.stringify(history), comment.trim(), vid]
      );

      console.log(`[REJECT] version=${vid} step=${step} by=${currentUser.email}`);

      res.json({
        success: true,
        data: {
          id:     vid,
          status: "draft",
          step,
          rejectedBy: currentUser.name,
          comment: comment.trim(),
        },
      });
    } catch (err) {
      console.error("POST /versions/:vid/reject:", err);
      res.status(500).json({ success: false, error: "Lỗi máy chủ." });
    }
  }
);

// ─── POST /api/projects/:id/versions/:vid/clone-from-bidding ─────────────────

router.post(
  "/projects/:id/versions/:vid/clone-from-bidding",
  requireRole(["PM", "PMO", "SM", "DCL"]),
  async (req, res) => {
    try {
      const { id, vid } = req.params;

      // vid là ID của version Project Planning (target)
      const { rows: targetRows } = await pool.query(
        `SELECT id, type, project_id FROM versions WHERE id = $1 AND project_id = $2`,
        [vid, id]
      );

      if (targetRows.length === 0) {
        res.status(404).json({ success: false, error: "Không tìm thấy version Project Planning." });
        return;
      }

      // Lấy version Bidding mới nhất của cùng project
      const { rows: biddingRows } = await pool.query(
        `SELECT id, data FROM versions
          WHERE project_id = $1 AND LOWER(type) LIKE '%bidding%'
          ORDER BY created_at DESC
          LIMIT 1`,
        [id]
      );

      if (biddingRows.length === 0) {
        res.status(404).json({ success: false, error: "Không tìm thấy version Bidding để clone." });
        return;
      }

      const biddingData = biddingRows[0].data;

      // Copy data vào Planning version — KHÔNG copy status, history, timestamps
      const { rows: updated } = await pool.query(
        `UPDATE versions SET data = $1 WHERE id = $2
         RETURNING id, type, data, status, created_at`,
        [biddingData, vid]
      );

      console.log(`[CLONE] version=${vid} cloned from bidding=${biddingRows[0].id}`);

      res.json({ success: true, data: updated[0] });
    } catch (err) {
      console.error("POST /versions/:vid/clone-from-bidding:", err);
      res.status(500).json({ success: false, error: "Lỗi máy chủ." });
    }
  }
);

export default router;
