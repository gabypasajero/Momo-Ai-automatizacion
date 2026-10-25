-- Resúmenes de aprendizaje: Momo analiza la semana (conversaciones, entrenamientos, dudas) y propone mejoras.
create table if not exists momo.learning_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references momo.organizations(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists learning_reports_org_idx on momo.learning_reports(organization_id, created_at desc);
alter table momo.learning_reports enable row level security;
create policy "miembros leen" on momo.learning_reports for select to authenticated using (momo.has_role(organization_id));
create policy "equipo crea" on momo.learning_reports for insert to authenticated with check (momo.has_role(organization_id, array['owner', 'admin', 'agent']));
grant select, insert on momo.learning_reports to authenticated;
