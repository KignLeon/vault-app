-- ================================================
-- GASCLUB247 — Supabase Migration 002
-- Row-Level Security (RLS) Policies
-- PUBLIC SITE — no user auth required for reading
-- Admin operations still require authenticated admin
-- ================================================

-- ── PROFILES RLS ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Anyone can read profiles (needed for public product pages)
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

-- Admins can update profiles
create policy "Admins can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- ── PRODUCTS RLS ──────────────────────────────────────────────────────
alter table public.products enable row level security;

-- Anyone (public) can view products — no auth required
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

-- Public users can create orders (anonymous checkout)
create policy "Anyone can create orders"
  on public.orders for insert
  with check (true);

-- Public users can NOT view orders (only admin can)
-- Admins can view all orders
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

-- Public users can read active promo codes (for checkout validation)
create policy "Active promo codes are publicly readable"
  on public.promo_codes for select
  using (active = true);

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

-- Public users can insert usage (anonymous promo validation)
create policy "Anyone can insert promo usage"
  on public.promo_usage for insert
  with check (true);

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
