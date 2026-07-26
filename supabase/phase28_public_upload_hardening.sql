begin;

update storage.buckets
set file_size_limit = 1048576,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']::text[]
where id = 'job-logos';

commit;