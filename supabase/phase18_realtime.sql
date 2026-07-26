-- Enable Realtime for core marketplace tables
-- This allows our React frontend to subscribe to changes instantly

-- Drop the publication if it exists to ensure a clean state
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create the publication for realtime
CREATE PUBLICATION supabase_realtime;

-- Add all the tables that we need to listen to in the frontend
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE job_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE test_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE test_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE bug_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE payouts;
