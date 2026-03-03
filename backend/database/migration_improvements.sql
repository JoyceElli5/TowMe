-- TowMe Improvements Migration
-- Run this in your Supabase SQL Editor

-- 1. Add idempotency_key column to towing_requests
ALTER TABLE towing_requests
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Unique index on idempotency_key (where not null) to enforce uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_requests_idempotency_key
ON towing_requests(idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- 2. Composite indexes for hot query patterns
-- Used by: getUserRequests, getRequests filtering by status + user
CREATE INDEX IF NOT EXISTS idx_requests_status_user
ON towing_requests(status, user_id);

-- Used by: getOperatorRequests, acceptRequest active-job check
CREATE INDEX IF NOT EXISTS idx_requests_status_operator
ON towing_requests(status, operator_id);

-- 3. Optimize operator location lookups for matching service
-- Used by: findNearestOperator batch-fetching recent locations
CREATE INDEX IF NOT EXISTS idx_operator_locations_operator_timestamp
ON operator_locations(operator_id, timestamp DESC);
