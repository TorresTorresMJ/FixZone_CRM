-- Habilita Supabase Realtime (postgres_changes) en notifications y team_tasks
-- para que la campanita y el checklist de equipo se actualicen al instante
-- sin esperar al polling de 90s ni a un refresh manual.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_tasks'
  ) then
    alter publication supabase_realtime add table public.team_tasks;
  end if;
end $$;
