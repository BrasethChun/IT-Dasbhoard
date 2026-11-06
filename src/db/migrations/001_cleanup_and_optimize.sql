-- ============================================================================
-- Migration: 001_cleanup_and_optimize.sql
-- Description: Safe schema cleanup, typo table deprecation, and query index optimization
-- Author: Staff Full-Stack Engineer & Database Architect
-- ============================================================================

-- ----------------------------------------------------------------------------
-- UP MIGRATION
-- ----------------------------------------------------------------------------

-- Step 1: Deprecate empty typo table `helpesk` (renaming before drop for zero data loss risk)
-- Note: 'helpdesk' is the active production table with 17+ records.
RENAME TABLE `helpesk` TO `_deprecated_helpesk`;

-- Step 2: Composite index on `notes` for fast user-scoped timeline queries
-- Eliminates table scans and filesorts during `SELECT ... WHERE user_id = ? ORDER BY updated_at DESC`
CREATE INDEX idx_notes_user_updated ON `notes` (user_id, updated_at DESC);

-- Step 3: Global order index on `notes` for admin & multi-user dashboard overviews
CREATE INDEX idx_notes_updated ON `notes` (updated_at DESC);

-- Step 4: Composite index on `it_fixed_assets` for business unit and category filtering
CREATE INDEX idx_fa_bu_cat ON `it_fixed_assets` (bu_name, category);

-- Step 5: Composite index on `it_assets_control` for business unit and category filtering
CREATE INDEX idx_ac_bu_cat ON `it_assets_control` (bu_name, category);

-- Step 6: Composite index on `users` for authentication & active status checks
CREATE INDEX idx_users_email_status ON `users` (email, status);


-- ----------------------------------------------------------------------------
-- DOWN MIGRATION (ROLLBACK)
-- ----------------------------------------------------------------------------

-- Step 1: Restore deprecated table
-- RENAME TABLE `_deprecated_helpesk` TO `helpesk`;

-- Step 2: Drop performance indexes
-- DROP INDEX idx_notes_user_updated ON `notes`;
-- DROP INDEX idx_notes_updated ON `notes`;
-- DROP INDEX idx_fa_bu_cat ON `it_fixed_assets`;
-- DROP INDEX idx_ac_bu_cat ON `it_assets_control`;
-- DROP INDEX idx_users_email_status ON `users`;
