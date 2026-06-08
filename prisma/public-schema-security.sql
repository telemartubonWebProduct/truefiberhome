-- Review before applying. The application currently reads and writes these
-- tables through server-side Prisma, so browser roles should not need direct
-- PostgREST access.

begin;

alter table public.site_settings enable row level security;
alter table public.banners enable row level security;
alter table public.agents enable row level security;
alter table public.menu_categories enable row level security;
alter table public.home_sections enable row level security;
alter table public.packages enable row level security;
alter table public.promotions enable row level security;
alter table public.navigation_items enable row level security;
alter table public.footer_links enable row level security;
alter table public.contact_methods enable row level security;
alter table public.service_cards enable row level security;
alter table public.daily_performance_logs enable row level security;
alter table public.package_categories enable row level security;
alter table public.package_items enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.knowledge_snapshots enable row level security;
alter table public.click_events enable row level security;
alter table public.articles enable row level security;
alter table public.content_agent_config enable row level security;
alter table public.content_agent_runs enable row level security;
alter table public.content_agent_drafts enable row level security;

revoke all on table public.site_settings from anon, authenticated;
revoke all on table public.banners from anon, authenticated;
revoke all on table public.agents from anon, authenticated;
revoke all on table public.menu_categories from anon, authenticated;
revoke all on table public.home_sections from anon, authenticated;
revoke all on table public.packages from anon, authenticated;
revoke all on table public.promotions from anon, authenticated;
revoke all on table public.navigation_items from anon, authenticated;
revoke all on table public.footer_links from anon, authenticated;
revoke all on table public.contact_methods from anon, authenticated;
revoke all on table public.service_cards from anon, authenticated;
revoke all on table public.daily_performance_logs from anon, authenticated;
revoke all on table public.package_categories from anon, authenticated;
revoke all on table public.package_items from anon, authenticated;
revoke all on table public.admin_profiles from anon, authenticated;
revoke all on table public.chat_sessions from anon, authenticated;
revoke all on table public.chat_messages from anon, authenticated;
revoke all on table public.knowledge_snapshots from anon, authenticated;
revoke all on table public.click_events from anon, authenticated;
revoke all on table public.articles from anon, authenticated;
revoke all on table public.content_agent_config from anon, authenticated;
revoke all on table public.content_agent_runs from anon, authenticated;
revoke all on table public.content_agent_drafts from anon, authenticated;

commit;
