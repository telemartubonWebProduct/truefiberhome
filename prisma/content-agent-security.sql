alter table public.content_agent_config enable row level security;
alter table public.content_agent_runs enable row level security;
alter table public.content_agent_drafts enable row level security;

revoke all on table public.content_agent_config from anon, authenticated;
revoke all on table public.content_agent_runs from anon, authenticated;
revoke all on table public.content_agent_drafts from anon, authenticated;
