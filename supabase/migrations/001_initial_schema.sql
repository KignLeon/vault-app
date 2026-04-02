-- ================================================
-- GASCLUB247 — Supabase Schema Migration 001
-- Initial schema: profiles, products, orders, promo_codes
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES (extends auth.users) ─────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  email         text,
  role          text not null default 'member' check (role in ('member', 'approved_buyer', 'admin', 'super_admin')),
  avatar_url    text default 'https://api.dicebear.com/7.x/initials/svg?seed=user',
  purchase_count integer not null default 0,
  promo_used    boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.profiles is 'Extended user profiles for GASCLUB247 members';

-- ── PRODUCTS ──────────────────────────────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default uuid_generate_v4(),
  sku           text unique not null,
  name          text not null,
  category      text not null default 'featured',
  image_url     text not null default '',
  images        jsonb not null default '[]'::jsonb,
  price         numeric(10,2) not null default 0,
  stock         integer not null default 0,
  status        text not null default 'in-stock' check (status in ('in-stock', 'low-stock', 'sold-out')),
  description   text not null default '',
  tags          jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  bulk_tiers    jsonb default null,
  viewers       integer default 0,
  recent_orders integer default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.products is 'GASCLUB247 product catalog';

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- ── ORDERS ────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    text unique not null,
  user_id         uuid references auth.users(id) on delete set null,
  user_email      text,
  user_name       text,
  items           jsonb not null default '[]'::jsonb,
  subtotal        numeric(10,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  shipping_cost   numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  promo_code      text,
  shipping_method text not null default 'standard',
  payment_method  text not null default 'crypto',
  status          text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  tracking_number text,
  notes           text,
  address         text,
  city            text,
  state           text,
  zip             text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.orders is 'Customer orders — persisted from checkout';

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- Generate human-readable order number
create or replace function public.generate_order_number()
returns trigger language plpgsql as $$
begin
  new.order_number = 'GC-' || upper(substring(new.id::text from 1 for 8));
  return new;
end;
$$;

create trigger orders_set_number
  before insert on public.orders
  for each row execute procedure public.generate_order_number();

-- ── PROMO CODES ───────────────────────────────────────────────────────
create table if not exists public.promo_codes (
  id           uuid primary key default uuid_generate_v4(),
  code         text unique not null,
  discount_pct numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  one_time     boolean not null default true,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Seed initial promo code
insert into public.promo_codes (code, discount_pct, one_time, active)
values ('PROMO1', 25.00, true, true)
on conflict (code) do nothing;

-- ── PROMO USAGE TRACKING ──────────────────────────────────────────────
create table if not exists public.promo_usage (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade,
  promo_code text not null,
  used_at    timestamptz not null default now(),
  unique(user_id, promo_code)
);

-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
