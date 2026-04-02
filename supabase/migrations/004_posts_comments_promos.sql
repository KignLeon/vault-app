-- ================================================
-- GASCLUB247 — Migration 004: Posts, Comments, Promos
-- Community + Content + Deals management tables
-- ================================================

-- ── POSTS ─────────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id          uuid primary key default uuid_generate_v4(),
  type        text not null default 'update' check (type in ('announcement','drop','update','media','review','promo')),
  title       text not null,
  content     text not null,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  image_url   text,
  pinned      boolean not null default false,
  featured    boolean not null default false,
  likes       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.handle_updated_at();

-- ── COMMENTS ──────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid references public.posts(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  author_avatar text,
  content     text not null,
  likes       integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── PROMO CODES (extended) ────────────────────────────────────────────────────
-- Already created in 001, but add usage_count for display
alter table public.promo_codes
  add column if not exists usage_count integer not null default 0,
  add column if not exists max_uses integer default null,
  add column if not exists expires_at timestamptz default null,
  add column if not exists min_order_amount numeric(10,2) default null;

-- ── PRODUCT IMAGES (for multi-image support) ──────────────────────────────────
create table if not exists public.product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references public.products(id) on delete cascade,
  url         text not null,
  public_id   text,
  is_primary  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── ACTIVITY LOG (for admin visibility) ───────────────────────────────────────
create table if not exists public.activity_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete set null,
  user_name   text,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb default null,
  created_at  timestamptz not null default now()
);

-- ── SEED INITIAL POSTS ────────────────────────────────────────────────────────
insert into public.posts (type, title, content, author_name, pinned, featured) values
('announcement', '🔥 NEW DROPS INCOMING', 'Premium indoor batch just landed. Limited quantity — first come, first served. Check inventory now.', 'GASCLUB247', true, true),
('drop', '💎 PLATINUM LEMON CHERRY — RESTOCK', 'The #1 requested strain is back. PLATINUM LEMON CHERRY. Dense, loud, and in limited supply. Hit the inventory tab.', 'GASCLUB247', false, true),
('update', '📦 Ordering Process Updated', 'You can now add to cart and checkout directly in-app. Crypto, Zelle, and cash options available at checkout. No middlemen.', 'GASCLUB247', false, false),
('promo', '🎟️ PROMO CODE: PROMO1', '25% off your first order. Use code PROMO1 at checkout. One-time use per account. Limited time.', 'GASCLUB247', false, false),
('announcement', '⚡ MEMBERS ONLY DEAL', 'Approved buyers get exclusive bulk pricing. 1/4 LB, 1/2 LB, full pound tiers now live. See deals tab.', 'GASCLUB247', false, false)
on conflict do nothing;
