-- One-time cleanup: permanently delete every job and everything that
-- cascades from it (applications, assignments, submissions, bug reports,
-- test lab data, payment records, job attachments).
--
-- This is irreversible. Run only if you're sure -- there is no undo.
--
-- Tables that reference jobs optionally (payment_webhook_events.payment_id,
-- moderation_cases.job_id) are set to null by their existing "on delete set
-- null" foreign keys, not deleted -- this is expected and harmless.
--
-- Files already uploaded to Supabase Storage (job logos, attachments, bug
-- screenshots/videos) are NOT deleted by this script -- only the database
-- rows referencing them are. Clean up storage separately if you want to
-- reclaim that space.

delete from public.jobs;
