create extension if not exists "pgcrypto";

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  domain text,
  created_at timestamptz not null default now()
);

create table if not exists jury_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists allowed_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
);

alter table allowed_users enable row level security;


do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Allow read own email'
      and tablename = 'allowed_users'
  ) then
    create policy "Allow read own email"
    on allowed_users
    for select
    using (email = auth.email());
  end if;
end $$;

create table if not exists scores_round1 (
  team_id uuid not null references teams(id) on delete cascade,
  review text not null default '',
  problem_understanding numeric not null default 0,
  innovation_creativity numeric not null default 0,
  technical_implementation numeric not null default 0,
  functionality_demo numeric not null default 0,
  impact_usefulness numeric not null default 0,
  ui_ux_design numeric not null default 0,
  feasibility numeric not null default 0,
  presentation_communication numeric not null default 0,
  business_market_potential numeric not null default 0,
  testing_robustness numeric not null default 0,
  created_by_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  primary key (team_id)
);

create table if not exists scores_round2 (
  team_id uuid not null references teams(id) on delete cascade,
  review text not null default '',
  problem_understanding numeric not null default 0,
  innovation_creativity numeric not null default 0,
  technical_implementation numeric not null default 0,
  functionality_demo numeric not null default 0,
  impact_usefulness numeric not null default 0,
  ui_ux_design numeric not null default 0,
  feasibility numeric not null default 0,
  presentation_communication numeric not null default 0,
  business_market_potential numeric not null default 0,
  testing_robustness numeric not null default 0,
  created_by_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  primary key (team_id)
);


create or replace view leaderboard as
select
  t.id as team_id,
  t.name as team_name,
  coalesce(
    (select
      sum(
        coalesce(r1.problem_understanding,0) + coalesce(r1.innovation_creativity,0) +
        coalesce(r1.technical_implementation,0) + coalesce(r1.functionality_demo,0) +
        coalesce(r1.impact_usefulness,0) + coalesce(r1.ui_ux_design,0) +
        coalesce(r1.feasibility,0) + coalesce(r1.presentation_communication,0) +
        coalesce(r1.business_market_potential,0) + coalesce(r1.testing_robustness,0)
      )
      from scores_round1 r1 where r1.team_id = t.id
    ), 0)
  +
  coalesce(
    (select
      sum(
        coalesce(r2.problem_understanding,0) + coalesce(r2.innovation_creativity,0) +
        coalesce(r2.technical_implementation,0) + coalesce(r2.functionality_demo,0) +
        coalesce(r2.impact_usefulness,0) + coalesce(r2.ui_ux_design,0) +
        coalesce(r2.feasibility,0) + coalesce(r2.presentation_communication,0) +
        coalesce(r2.business_market_potential,0) + coalesce(r2.testing_robustness,0)
      )
      from scores_round2 r2 where r2.team_id = t.id
    ), 0)
  as total_score
from teams t;