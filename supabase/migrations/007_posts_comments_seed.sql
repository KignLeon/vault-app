-- ================================================
-- GASCLUB247 — Migration 007: Posts, Comments & Seed Data
-- Creates posts + comments tables, seeds initial content
-- ================================================

-- ── POSTS ─────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id            uuid primary key default uuid_generate_v4(),
  type          text not null default 'update' check (type in ('announcement', 'drop', 'update', 'media', 'review', 'promo')),
  title         text not null,
  content       text not null,
  author_id     uuid references auth.users(id) on delete set null,
  author_name   text default 'GASCLUB247',
  image_url     text,
  pinned        boolean not null default false,
  featured      boolean not null default false,
  likes         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.posts is 'Community feed posts for GASCLUB247';

create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.handle_updated_at();

-- ── COMMENTS ──────────────────────────────────────────────────────────
create table if not exists public.comments (
  id            uuid primary key default uuid_generate_v4(),
  post_id       uuid not null references public.posts(id) on delete cascade,
  author_id     uuid references auth.users(id) on delete set null,
  author_name   text default 'Anonymous',
  author_avatar text,
  content       text not null,
  likes         integer not null default 0,
  created_at    timestamptz not null default now()
);

comment on table public.comments is 'Comments on community posts';

-- ── RLS for posts ─────────────────────────────────────────────────────
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Everyone can read posts and comments
create policy "Public read posts" on public.posts for select using (true);
create policy "Public read comments" on public.comments for select using (true);

-- Authenticated users can create
create policy "Auth insert posts" on public.posts for insert with check (auth.role() = 'authenticated');
create policy "Auth insert comments" on public.comments for insert with check (auth.role() = 'authenticated');

-- Authors + admins can update/delete
create policy "Author update posts" on public.posts for update using (auth.uid() = author_id);
create policy "Author delete posts" on public.posts for delete using (auth.uid() = author_id);
create policy "Author delete comments" on public.comments for delete using (auth.uid() = author_id);

-- ── SEED POSTS (Social Proof) ─────────────────────────────────────────
insert into public.posts (type, title, content, author_name, pinned, featured, likes, created_at) values
(
  'announcement',
  '🔥 GASCLUB247 IS LIVE',
  'The vault is officially open. Premium strains, direct pricing, no middlemen. Welcome to the club.',
  'Leon Benefield',
  true, true, 47,
  now() - interval '7 days'
),
(
  'drop',
  '🚀 PLATINUM LEMON CHERRY — NOW AVAILABLE',
  'One of the most requested strains just dropped. Indoor grown, heavy trichomes, citrus-gas profile. Limited quantities — grab before it''s gone.',
  'Leon Benefield',
  false, true, 32,
  now() - interval '5 days'
),
(
  'update',
  'BULK PRICING IS HERE 📦',
  'QP and HP pricing now available on all flower. The more you grab, the more you save. Check the inventory for tiered pricing on every strain.',
  'GASCLUB247',
  false, false, 28,
  now() - interval '4 days'
),
(
  'review',
  '⭐ LEMON DIOR RUNTZ — Customer Review',
  'Just got my pack of Lemon Dior Runtz. The smell alone is crazy — sweet lemon with a diesel finish. Bag appeal is 10/10. Burns clean, smooth smoke, heavy head high. Best I''ve had in months. Will be back for the QP.',
  'SmokeKing_LA',
  false, false, 19,
  now() - interval '3 days'
),
(
  'promo',
  '🎁 FIRST-TIME BUYER PROMO — 25% OFF',
  'New to the club? Use code PROMO1 at checkout for 25% off your first order. One-time use, no minimum. Welcome to GASCLUB247.',
  'GASCLUB247',
  true, false, 35,
  now() - interval '3 days'
),
(
  'media',
  '📸 FRESH PACK — RAINBOW KANDY',
  'Just opened up a fresh unit of Rainbow Kandy. The colors on these nugs are insane — purple, green, orange hairs everywhere. This one is going to move fast.',
  'Leon Benefield',
  false, false, 22,
  now() - interval '2 days'
),
(
  'update',
  'NEW CATEGORY: PRE-ROLLS 🔥',
  'By popular demand — pre-rolls are now available. 5 strains, all indoor flower, hand-rolled. Perfect for sampling before committing to a pack. Check the inventory.',
  'GASCLUB247',
  false, false, 15,
  now() - interval '1 day'
),
(
  'drop',
  '💎 EXOTIC DROP — LCG 85 & GASTOPIA',
  'Two new exotics just hit the vault. LCG 85 is a heavy indica with a pungent gas nose. Gastopia is a balanced hybrid with fruit-forward terps. Both are premium grade.',
  'Leon Benefield',
  false, true, 41,
  now() - interval '12 hours'
)
on conflict do nothing;

-- ── SEED COMMENTS (Engagement) ────────────────────────────────────────
-- We'll add comments by referencing the post IDs dynamically
do $$
declare
  post_live uuid;
  post_plc uuid;
  post_promo uuid;
  post_review uuid;
begin
  select id into post_live from public.posts where title like '%IS LIVE%' limit 1;
  select id into post_plc  from public.posts where title like '%PLATINUM LEMON%' limit 1;
  select id into post_promo from public.posts where title like '%FIRST-TIME%' limit 1;
  select id into post_review from public.posts where title like '%Customer Review%' limit 1;

  if post_live is not null then
    insert into public.comments (post_id, author_name, content, likes, created_at) values
      (post_live, 'DankMaster420', 'Finally a real plug with consistent quality. Been looking for something like this 🔥', 8, now() - interval '6 days'),
      (post_live, 'WestCoastSmoke', 'The UI on this platform is crazy clean. Feels like ordering from a luxury brand.', 5, now() - interval '5 days 18 hours'),
      (post_live, 'Terp_Hunter', 'Prices are fair too. No cap, this is how it should be done.', 3, now() - interval '5 days 6 hours')
    on conflict do nothing;
  end if;

  if post_plc is not null then
    insert into public.comments (post_id, author_name, content, likes, created_at) values
      (post_plc, 'BagChaser_OG', 'Copped the QP immediately. This strain is gas 💨', 6, now() - interval '4 days 12 hours'),
      (post_plc, 'NugLife', 'The pics don''t do it justice. Terps are insane in person.', 4, now() - interval '4 days')
    on conflict do nothing;
  end if;

  if post_promo is not null then
    insert into public.comments (post_id, author_name, content, likes, created_at) values
      (post_promo, 'FirstTimer_J', 'Used the code on my first order, saved a ton. Good looks 🙌', 7, now() - interval '2 days 6 hours'),
      (post_promo, 'CaliSmoke', 'This deal is crazy. 25% off is wild for this quality.', 4, now() - interval '2 days')
    on conflict do nothing;
  end if;

  if post_review is not null then
    insert into public.comments (post_id, author_name, content, likes, created_at) values
      (post_review, 'PurpleDream', 'Facts on the Lemon Dior. That strain hits different 🍋⛽', 5, now() - interval '2 days 12 hours'),
      (post_review, 'ZenSmoker', 'Second this review 100%. The cure on mine was perfect.', 3, now() - interval '2 days 3 hours')
    on conflict do nothing;
  end if;
end $$;
