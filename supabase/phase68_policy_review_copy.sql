-- Remove an automatic-approval promise that the platform does not implement.
-- Published policies may override the local fallback copy.
update public.policies
set content = replace(
  content,
  'Unreviewed reports automatically approve after 7 days to protect Tester payout timelines.',
  'If a report remains unreviewed, Testers can contact SQUASH support for a manual review.'
)
where slug = 'developer-terms'
  and content like '%Unreviewed reports automatically approve after 7 days to protect Tester payout timelines.%';
