-- ================================================
-- GASCLUB247 — Supabase Migration 002
-- Row-Level Security (RLS) Policies
-- ================================================

-- ── PROFILES RLS ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Anyone can read profiles (needed for public product pages)
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── PRODUCTS RLS ──────────────────────────────────────────────────────
alter table public.products enable row level security;

-- All authenticated users (and public) can view products
create policy "Products are publicly readable"
  on public.products for select
  using (true);

-- Only admins can insert/update/delete products
create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- ── ORDERS RLS ────────────────────────────────────────────────────────
alter table public.orders enable row level security;

-- Users can view their own orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Users can create orders
create policy "Authenticated users can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id or auth.uid() is not null);

-- Admins can view and update ALL orders
create policy "Admins can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

create policy "Admins can update all orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- ── PROMO CODES RLS ───────────────────────────────────────────────────
alter table public.promo_codes enable row level security;

-- All authenticated users can read active promo codes
create policy "Active promo codes are readable by authenticated users"
  on public.promo_codes for select
  using (active = true and auth.uid() is not null);

-- Only admins can manage promo codes
create policy "Admins can manage promo codes"
  on public.promo_codes for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- ── PROMO USAGE RLS ───────────────────────────────────────────────────
alter table public.promo_usage enable row level security;

-- Users can view and insert their own usage
create policy "Users can manage own promo usage"
  on public.promo_usage for all
  using (auth.uid() = user_id);

-- Admins can view all
create policy "Admins can view all promo usage"
  on public.promo_usage for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );
