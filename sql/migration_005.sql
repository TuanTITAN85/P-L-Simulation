-- ============================================================
-- Migration 005 — Drop actual_direct_cost from actual_entries
-- Mục tiêu: actualDirectCost được tính động từ raw rows tại
--           server (server/utils/actualData.ts), không lưu DB.
-- ============================================================

BEGIN;

ALTER TABLE actual_entries DROP COLUMN IF EXISTS actual_direct_cost;

COMMIT;
