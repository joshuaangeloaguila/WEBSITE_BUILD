-- CARPE admin CMS — run this once in the Supabase SQL Editor for a brand-new project.
-- Project setup checklist (do these in the Supabase dashboard, not here):
--   1. Create a new project.
--   2. Storage > New bucket > name it "media" > toggle "Public bucket" ON.
--   3. Paste this whole file into SQL Editor > New query > Run.
--   4. Project Settings > API: copy the "Project URL" and the "anon public" key —
--      you'll paste both into data/supabase-client.js.

-- ========== TABLES ==========

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price numeric(10,2) not null,
  category text not null,
  description text,
  sizes text[] not null default '{}',
  swatch_colors text[] not null default '{}',
  image_url text,
  image_path text,
  image_urls text[] not null default '{}',
  image_paths text[] not null default '{}',
  best_seller boolean not null default false,
  new_arrival boolean not null default false,
  trending boolean not null default false,
  collection boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  image_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  items jsonb not null default '[]',
  total numeric(10,2) not null default 0,
  status text not null default 'paid' check (status in ('paid','ordered','preparing','shipped','delivered','cancelled','refunded')),
  notes text,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.promos (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null default 'percent' check (discount_type in ('percent','amount')),
  discount_value numeric(10,2) not null,
  min_subtotal numeric(10,2),
  max_uses integer,
  uses integer not null default 0,
  one_per_email boolean not null default false,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  created_at timestamptz not null default now()
);

-- ========== ROW LEVEL SECURITY ==========
-- Public read for the storefront; public write for now since admin.html only has a
-- client-side password gate (no real Supabase Auth yet, per project decision).
-- NOTE: this means anyone holding the anon key (visible in view-source on the site)
-- can write to these tables directly via the REST API, bypassing the admin password
-- screen. Acceptable for now; tighten these policies before this handles anything real.

alter table public.products enable row level security;
alter table public.gallery enable row level security;
alter table public.orders enable row level security;
alter table public.promos enable row level security;
alter table public.categories enable row level security;

create policy products_select_anon on public.products for select using (true);
create policy products_insert_anon on public.products for insert with check (true);
create policy products_update_anon on public.products for update using (true) with check (true);
create policy products_delete_anon on public.products for delete using (true);

create policy gallery_select_anon on public.gallery for select using (true);
create policy gallery_insert_anon on public.gallery for insert with check (true);
create policy gallery_update_anon on public.gallery for update using (true) with check (true);
create policy gallery_delete_anon on public.gallery for delete using (true);

create policy orders_select_anon on public.orders for select using (true);
create policy orders_insert_anon on public.orders for insert with check (true);
create policy orders_update_anon on public.orders for update using (true) with check (true);
create policy orders_delete_anon on public.orders for delete using (true);

create policy promos_select_anon on public.promos for select using (true);
create policy promos_insert_anon on public.promos for insert with check (true);
create policy promos_update_anon on public.promos for update using (true) with check (true);
create policy promos_delete_anon on public.promos for delete using (true);

create policy categories_select_anon on public.categories for select using (true);
create policy categories_insert_anon on public.categories for insert with check (true);
create policy categories_delete_anon on public.categories for delete using (true);

-- ========== REQUIRED GRANTS ==========
-- Supabase (as of May 2026) no longer auto-exposes new tables to the REST API.
-- Without these grants, the RLS policies above are never even evaluated — every
-- request gets rejected before that. This step is easy to miss.

grant select, insert, update, delete on public.products to anon;
grant select, insert, update, delete on public.gallery to anon;
grant select, insert, update, delete on public.orders to anon;
grant select, insert, update, delete on public.promos to anon;
grant select, insert, delete on public.categories to anon;

-- ========== STORAGE POLICIES ==========
-- Scoped to the "media" bucket only. Create the bucket first (dashboard step above)
-- or these will silently apply to a bucket that doesn't exist yet.

create policy media_public_read on storage.objects for select
  using (bucket_id = 'media');

create policy media_anon_insert on storage.objects for insert
  with check (bucket_id = 'media');

create policy media_anon_update on storage.objects for update
  using (bucket_id = 'media') with check (bucket_id = 'media');

create policy media_anon_delete on storage.objects for delete
  using (bucket_id = 'media');

-- ========== MIGRATIONS (run only if your project already existed before this line was added) ==========
-- Adds the "Collection" boolean flag support. Safe to run even if the column already exists
-- elsewhere — Postgres will just error harmlessly on a duplicate column name.

alter table public.products add column collection boolean not null default false;

-- Adds the "orders" table + admin Orders tab support (5-stage pipeline: paid -> ordered ->
-- preparing -> shipped -> delivered). Safe to run against an existing project.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  items jsonb not null default '[]',
  total numeric(10,2) not null default 0,
  status text not null default 'paid' check (status in ('paid','ordered','preparing','shipped','delivered','cancelled','refunded')),
  notes text,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy orders_select_anon on public.orders for select using (true);
create policy orders_insert_anon on public.orders for insert with check (true);
create policy orders_update_anon on public.orders for update using (true) with check (true);
create policy orders_delete_anon on public.orders for delete using (true);

grant select, insert, update, delete on public.orders to anon;

-- Adds the "promos" table + admin Promos tab support (discount codes). Safe to run
-- against an existing project.

create table if not exists public.promos (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null default 'percent' check (discount_type in ('percent','amount')),
  discount_value numeric(10,2) not null,
  min_subtotal numeric(10,2),
  max_uses integer,
  uses integer not null default 0,
  one_per_email boolean not null default false,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.promos enable row level security;

create policy promos_select_anon on public.promos for select using (true);
create policy promos_insert_anon on public.promos for insert with check (true);
create policy promos_update_anon on public.promos for update using (true) with check (true);
create policy promos_delete_anon on public.promos for delete using (true);

grant select, insert, update, delete on public.promos to anon;


-- Adds the "Cancelled" and "Refunded" order statuses (surfaced as filter chips in
-- admin.html's Orders search row, alongside Paid/Ordered/Preparing/Shipped/Delivered).
-- Safe to run against an existing project -- drops and recreates the status check
-- constraint with 'cancelled' and 'refunded' included.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('paid','ordered','preparing','shipped','delivered','cancelled','refunded'));

-- Adds the "tracking_number" column (set by admin once an order reaches Preparing,
-- surfaced on index.html's customer-facing order tracker). Safe to run against an
-- existing project.

alter table public.orders add column if not exists tracking_number text;

-- Adds the "categories" table + admin Categories tab support (custom product
-- categories beyond the 5 built-in ones). Safe to run against an existing project.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy categories_select_anon on public.categories for select using (true);
create policy categories_insert_anon on public.categories for insert with check (true);
create policy categories_delete_anon on public.categories for delete using (true);

grant select, insert, delete on public.categories to anon;

-- The "products" table originally hardcoded a check constraint limiting category to
-- the 5 built-in slugs. Drop it so admin-added custom categories (above) can be
-- assigned to products. Safe to run against an existing project.

alter table public.products drop constraint if exists products_category_check;

-- Adds the "shipping_settings" table + admin Shipping tab support (editable flat
-- shipping rate, free-shipping threshold, and store-pickup option shown at
-- checkout). Single-row table (id fixed at 1) rather than a key/value store, since
-- there's currently only one shipping method plus one pickup location. Safe to run
-- against an existing project.

create table if not exists public.shipping_settings (
  id integer primary key default 1,
  flat_rate numeric(10,2) not null default 150,
  free_shipping_threshold numeric(10,2) not null default 3000,
  pickup_enabled boolean not null default true,
  pickup_name text not null default 'CARPE Flagship Store',
  pickup_address text not null default '123 Poblacion Ave, Makati City, Metro Manila',
  pickup_hours text not null default 'Mon–Sat, 11AM–8PM',
  updated_at timestamptz not null default now(),
  constraint shipping_settings_single_row check (id = 1)
);

insert into public.shipping_settings (id) values (1) on conflict (id) do nothing;

alter table public.shipping_settings enable row level security;

create policy shipping_settings_select_anon on public.shipping_settings for select using (true);
create policy shipping_settings_update_anon on public.shipping_settings for update using (true) with check (true);

grant select, update on public.shipping_settings to anon;

-- Adds the "reviews" table + customer review submission (tied to a completed order)
-- and admin approval workflow. A review only shows in the storefront Testimonials
-- section once approved=true. Safe to run against an existing project.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  product_name text not null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  image_url text,
  image_path text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- select is public (true) rather than "approved = true" because admin.html has no
-- real Supabase Auth (same tradeoff as every other table here) and needs to see
-- pending reviews too — the storefront filters to approved=true client-side instead.
create policy reviews_select_anon on public.reviews for select using (true);
create policy reviews_insert_anon on public.reviews for insert with check (true);
create policy reviews_update_anon on public.reviews for update using (true) with check (true);
create policy reviews_delete_anon on public.reviews for delete using (true);

grant select, insert, update, delete on public.reviews to anon;

-- Adds multi-photo support for products (gallery of images per product, shown in
-- the quick-view modal's thumbnail strip). "image_url"/"image_path" remain the
-- single cover photo used everywhere else (product cards, cart, orders) and are
-- always kept equal to image_urls[1]/image_paths[1] by the admin panel. Safe to
-- run against an existing project.

alter table public.products add column if not exists image_urls text[] not null default '{}';
alter table public.products add column if not exists image_paths text[] not null default '{}';

-- Seed the 3 hardcoded testimonials that used to be static HTML on index.html, now
-- rendered dynamically from this table.
insert into public.reviews (order_number, product_name, customer_name, rating, comment, approved) values
  ('SEED-0001', 'CARPE Apparel', 'Marco D.', 5, 'Fit is exactly true to size and the fabric feels genuinely premium. Fastest shipping I''ve had from a local brand.', true),
  ('SEED-0002', 'CARPE Apparel', 'Jasmine R.', 5, 'Copped the limited drop within the first hour. Quality justifies the price completely — this is the streetwear I''ve been waiting for.', true),
  ('SEED-0003', 'CARPE Apparel', 'Kevin T.', 5, 'Customer service helped me size down for the oversized fit. Exceeded expectations, will be a repeat customer.', true)
on conflict do nothing;

-- Adds the "admin_settings" table for admin.html's password override, replacing the
-- old localStorage-based storage. localStorage for local files is tied to the exact
-- folder path, so the custom password silently stopped working whenever admin.html
-- was moved/copied to a different folder. Single-row table (id fixed at 1), same
-- pattern as shipping_settings. Safe to run against an existing project.

create table if not exists public.admin_settings (
  id integer primary key default 1,
  password_override text,
  updated_at timestamptz not null default now(),
  constraint admin_settings_single_row check (id = 1)
);

insert into public.admin_settings (id) values (1) on conflict (id) do nothing;

alter table public.admin_settings enable row level security;

create policy admin_settings_select_anon on public.admin_settings for select using (true);
create policy admin_settings_update_anon on public.admin_settings for update using (true) with check (true);

grant select, update on public.admin_settings to anon;
