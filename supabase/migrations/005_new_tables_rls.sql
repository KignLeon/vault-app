-- ================================================
-- GASCLUB247 — Migration 005: RLS for new tables
-- ================================================

-- ── POSTS RLS ─────────────────────────────────────────────────────────────────
alter table public.posts enable row level security;

-- Anyone can read posts
create policy "Posts are publicly readable"
  on public.posts for select using (true);

-- Authenticated users can create posts
create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() is not null);

-- Users can edit/delete their own posts; admins can edit/delete all
create policy "Users can edit own posts"
  on public.posts for update
  using (
    auth.uid() = author_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

create policy "Users can delete own posts"
  on public.posts for delete
  using (
    auth.uid() = author_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- ── COMMENTS RLS ──────────────────────────────────────────────────────────────
alter table public.comments enable row level security;

create policy "Comments are publicly readable"
  on public.comments for select using (true);

create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() is not null);

create policy "Users can edit own comments"
  on public.comments for update
  using (
    auth.uid() = author_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

create policy "Users can delete own comments"
  on public.comments for delete
  using (
    auth.uid() = author_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- ── PRODUCT IMAGES RLS ────────────────────────────────────────────────────────
alter table public.product_images enable row level security;

create policy "Product images are publicly readable"
  on public.product_images for select using (true);

create policy "Admins can manage product images"
  on public.product_images for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- ── ACTIVITY LOG RLS ──────────────────────────────────────────────────────────
alter table public.activity_log enable row level security;

create policy "Admins can view activity log"
  on public.activity_log for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

create policy "System can insert activity log"
  on public.activity_log for insert
  with check (true);
