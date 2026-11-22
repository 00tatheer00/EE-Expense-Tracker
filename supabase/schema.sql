-- =====================================================================
-- EE Expense Tracker — Supabase schema
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is idempotent where practical, so re-running is safe.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Authorized users (allow-list)
--    Only emails listed here get a profile, and only users with a
--    profile can read or write any data (enforced by RLS below).
-- ---------------------------------------------------------------------
create table if not exists public.allowed_users (
  email      text primary key check (email = lower(email)),
  full_name  text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  full_name  text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Membership check used by every policy.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

-- Create a profile automatically when an allow-listed user is created in Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select full_name into v_name from public.allowed_users where email = lower(new.email);
  if v_name is not null then
    insert into public.profiles (id, email, full_name)
    values (new.id, lower(new.email), v_name)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Business divisions — each keeps fully independent records
-- ---------------------------------------------------------------------
create table if not exists public.divisions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  short_name  text not null,
  description text,
  color       text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Categories — scoped to exactly one division
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions (id) on delete restrict,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (division_id, name),
  unique (id, division_id) -- target for the composite FK on expenses
);

-- ---------------------------------------------------------------------
-- 4. Expenses
--    The composite FK (category_id, division_id) guarantees that an
--    expense can never use a category from another division.
-- ---------------------------------------------------------------------
create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  division_id    uuid not null references public.divisions (id) on delete restrict,
  category_id    uuid not null,
  title          text not null check (char_length(title) between 2 and 160),
  description    text,
  amount         numeric(14, 2) not null check (amount > 0),
  currency       text not null default 'PKR',
  expense_date   date not null,
  paid_to        text not null,
  location       text,
  purpose        text,
  payment_method text not null check (payment_method in (
                   'Cash', 'Bank Transfer', 'Cheque', 'Credit/Debit Card',
                   'JazzCash', 'Easypaisa', 'Online Payment', 'Other')),
  notes          text,
  receipt_path   text,
  receipt_name   text,
  created_by     uuid not null default auth.uid() references public.profiles (id),
  updated_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  foreign key (category_id, division_id)
    references public.categories (id, division_id) on delete restrict
);

create index if not exists expenses_division_date_idx on public.expenses (division_id, expense_date desc);
create index if not exists expenses_category_idx      on public.expenses (category_id);
create index if not exists expenses_created_at_idx    on public.expenses (created_at desc);
create index if not exists expenses_created_by_idx    on public.expenses (created_by);

-- Stamp who created / updated each row (cannot be spoofed by the client).
create or replace function public.stamp_expense()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists expenses_stamp on public.expenses;
create trigger expenses_stamp
  before insert or update on public.expenses
  for each row execute function public.stamp_expense();

-- ---------------------------------------------------------------------
-- 5. Audit trail — every create / edit / delete is recorded
-- ---------------------------------------------------------------------
create table if not exists public.expense_audit (
  id         bigint generated always as identity primary key,
  expense_id uuid not null,
  action     text not null check (action in ('created', 'updated', 'deleted')),
  actor_id   uuid references public.profiles (id),
  changed_at timestamptz not null default now(),
  old_data   jsonb,
  new_data   jsonb
);

create index if not exists expense_audit_expense_idx on public.expense_audit (expense_id, changed_at desc);

create or replace function public.audit_expense()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.expense_audit (expense_id, action, actor_id, new_data)
    values (new.id, 'created', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.expense_audit (expense_id, action, actor_id, old_data, new_data)
    values (new.id, 'updated', auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.expense_audit (expense_id, action, actor_id, old_data)
    values (old.id, 'deleted', auth.uid(), to_jsonb(old));
    return old;
  end if;
end;
$$;

drop trigger if exists expenses_audit on public.expenses;
create trigger expenses_audit
  after insert or update or delete on public.expenses
  for each row execute function public.audit_expense();

-- ---------------------------------------------------------------------
-- 6. Reporting views (security_invoker → RLS of the caller applies)
-- ---------------------------------------------------------------------
create or replace view public.expense_monthly
with (security_invoker = true) as
select
  division_id,
  date_trunc('month', expense_date)::date as month,
  sum(amount)::numeric(16, 2)             as total,
  count(*)::int                           as count
from public.expenses
group by division_id, date_trunc('month', expense_date);

create or replace view public.expense_category_monthly
with (security_invoker = true) as
select
  division_id,
  category_id,
  date_trunc('month', expense_date)::date as month,
  sum(amount)::numeric(16, 2)             as total,
  count(*)::int                           as count
from public.expenses
group by division_id, category_id, date_trunc('month', expense_date);

-- ---------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------
alter table public.allowed_users enable row level security;
alter table public.profiles      enable row level security;
alter table public.divisions     enable row level security;
alter table public.categories    enable row level security;
alter table public.expenses      enable row level security;
alter table public.expense_audit enable row level security;

-- allowed_users: no client access at all (managed from the SQL editor).

drop policy if exists "members read profiles" on public.profiles;
create policy "members read profiles" on public.profiles
  for select to authenticated using (public.is_member());

-- Profiles are managed only from the SQL editor (no client updates), so a
-- disabled user can never re-activate themselves.
drop policy if exists "update own profile" on public.profiles;

drop policy if exists "members read divisions" on public.divisions;
create policy "members read divisions" on public.divisions
  for select to authenticated using (public.is_member());

drop policy if exists "members read categories" on public.categories;
create policy "members read categories" on public.categories
  for select to authenticated using (public.is_member());
drop policy if exists "members insert categories" on public.categories;
create policy "members insert categories" on public.categories
  for insert to authenticated with check (public.is_member());
drop policy if exists "members update categories" on public.categories;
create policy "members update categories" on public.categories
  for update to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "members read expenses" on public.expenses;
create policy "members read expenses" on public.expenses
  for select to authenticated using (public.is_member());
drop policy if exists "members insert expenses" on public.expenses;
create policy "members insert expenses" on public.expenses
  for insert to authenticated with check (public.is_member());
drop policy if exists "members update expenses" on public.expenses;
create policy "members update expenses" on public.expenses
  for update to authenticated using (public.is_member()) with check (public.is_member());
drop policy if exists "members delete expenses" on public.expenses;
create policy "members delete expenses" on public.expenses
  for delete to authenticated using (public.is_member());

drop policy if exists "members read audit" on public.expense_audit;
create policy "members read audit" on public.expense_audit
  for select to authenticated using (public.is_member());
-- (audit rows are written only by the security-definer trigger)

-- ---------------------------------------------------------------------
-- 8. Receipt storage (private bucket, 10 MB, images + PDF)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "members read receipts" on storage.objects;
create policy "members read receipts" on storage.objects
  for select to authenticated using (bucket_id = 'receipts' and public.is_member());
drop policy if exists "members upload receipts" on storage.objects;
create policy "members upload receipts" on storage.objects
  for insert to authenticated with check (bucket_id = 'receipts' and public.is_member());
drop policy if exists "members update receipts" on storage.objects;
create policy "members update receipts" on storage.objects
  for update to authenticated using (bucket_id = 'receipts' and public.is_member());
drop policy if exists "members delete receipts" on storage.objects;
create policy "members delete receipts" on storage.objects
  for delete to authenticated using (bucket_id = 'receipts' and public.is_member());

-- ---------------------------------------------------------------------
-- 9. Seed data
-- ---------------------------------------------------------------------
insert into public.divisions (slug, name, short_name, description, color, sort_order) values
  ('emerging-edge', 'Emerging Edge', 'Emerging Edge', 'Main company operational expenses', '#2B4FB8', 1),
  ('eest', 'Emerging Edge School of Technology', 'EEST', 'Educational and academy-related expenses', '#0E9F6E', 2),
  ('stylone', 'STYLONE', 'STYLONE', 'E-commerce store operations, inventory, marketing and logistics', '#D9650B', 3)
on conflict (slug) do nothing;

insert into public.categories (division_id, name)
select d.id, c.name
from public.divisions d
join (values
  ('emerging-edge', 'Office Rent'),
  ('emerging-edge', 'Utilities'),
  ('emerging-edge', 'Salaries & Payroll'),
  ('emerging-edge', 'Software & Subscriptions'),
  ('emerging-edge', 'Equipment & Hardware'),
  ('emerging-edge', 'Internet & Telecom'),
  ('emerging-edge', 'Travel & Transport'),
  ('emerging-edge', 'Meals & Entertainment'),
  ('emerging-edge', 'Marketing & Branding'),
  ('emerging-edge', 'Professional Services'),
  ('emerging-edge', 'Office Supplies'),
  ('emerging-edge', 'Maintenance & Repairs'),
  ('emerging-edge', 'Taxes & Government Fees'),
  ('emerging-edge', 'Miscellaneous'),

  ('eest', 'Instructor & Trainer Fees'),
  ('eest', 'Course Materials'),
  ('eest', 'Lab Equipment'),
  ('eest', 'Venue & Rent'),
  ('eest', 'Events & Workshops'),
  ('eest', 'Certifications & Exams'),
  ('eest', 'Student Activities'),
  ('eest', 'Marketing & Admissions'),
  ('eest', 'Software & LMS'),
  ('eest', 'Scholarships'),
  ('eest', 'Utilities'),
  ('eest', 'Refreshments'),
  ('eest', 'Miscellaneous'),

  ('stylone', 'Inventory & Stock Purchase'),
  ('stylone', 'Packaging'),
  ('stylone', 'Shipping & Courier'),
  ('stylone', 'Digital Advertising'),
  ('stylone', 'Influencer Marketing'),
  ('stylone', 'Photography & Content'),
  ('stylone', 'Website & Hosting'),
  ('stylone', 'Payment Gateway Fees'),
  ('stylone', 'Marketplace Fees'),
  ('stylone', 'Returns & Refunds'),
  ('stylone', 'Warehouse & Storage'),
  ('stylone', 'Staff Salaries'),
  ('stylone', 'Miscellaneous')
) as c(slug, name) on c.slug = d.slug
on conflict (division_id, name) do nothing;

-- >>> EDIT THESE THREE EMAILS before running <<<
insert into public.allowed_users (email, full_name) values
  ('tatheer@example.com', 'Tatheer Hussain'),
  ('shaheen@example.com', 'Sir Shaheen'),
  ('komal@example.com',   'Komal Bibi')
on conflict (email) do update set full_name = excluded.full_name;

-- Backfill profiles for allow-listed users that already exist in Auth.
insert into public.profiles (id, email, full_name)
select u.id, lower(u.email), a.full_name
from auth.users u
join public.allowed_users a on a.email = lower(u.email)
on conflict (id) do nothing;
