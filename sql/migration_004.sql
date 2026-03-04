-- ============================================================
-- Migration 004 — Cleanup legacy actual_data table
-- Mục tiêu: Xóa bảng actual_data (legacy) không còn sử dụng.
--           Dữ liệu actual hiện nay được lưu tại actual_entries.
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS actual_data;

COMMIT;
