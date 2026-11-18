-- Apply before running the one-time legacy rescan endpoint.
-- The server service role needs these two reads to locate referenced files.
grant select (id, file_path, developer_id) on public.job_attachments to service_role;
grant select (tester_id, proof_document_path) on public.tester_banking_details to service_role;
