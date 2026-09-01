-- LINE予約ツール 初期スキーマ（MVPスコープ：F-01〜F-11）

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- メニュー（F-01, F-10）
create table menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price integer check (price is null or price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 営業時間（曜日ごと。F-09）
create table business_hours (
  weekday integer primary key check (weekday between 0 and 6), -- 0=日,1=月,...6=土
  is_closed boolean not null default false,
  open_time time,
  close_time time,
  constraint business_hours_time_check check (
    is_closed or (open_time is not null and close_time is not null and open_time < close_time)
  )
);

insert into business_hours (weekday, is_closed, open_time, close_time) values
  (0, true, null, null),
  (1, false, '10:00', '19:00'),
  (2, false, '10:00', '19:00'),
  (3, false, '10:00', '19:00'),
  (4, false, '10:00', '19:00'),
  (5, false, '10:00', '19:00'),
  (6, false, '10:00', '18:00');

-- 定休日・臨時休業日（特定日の例外。F-09）
create table closed_dates (
  date date primary key,
  reason text
);

-- 予約（F-02, F-04）
create table reservations (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id),
  line_user_id text not null,
  customer_name text not null,
  phone text not null,
  time_range tstzrange not null,
  -- time_rangeの上下限をアプリ側で扱いやすいtimestamptzとして取り出しておく（クエリ・表示・並び替え用）
  start_at timestamptz generated always as (lower(time_range)) stored,
  end_at timestamptz generated always as (upper(time_range)) stored,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  -- 確定済み予約同士の時間帯重複を、DBレベルで確実に防止する（同時アクセスでも二重予約は発生しない）
  exclude using gist (time_range with &&) where (status = 'confirmed')
);

create index reservations_time_range_idx on reservations using gist (time_range);
create index reservations_line_user_id_idx on reservations (line_user_id);
create index reservations_start_at_idx on reservations (start_at);

alter table menus enable row level security;
alter table business_hours enable row level security;
alter table closed_dates enable row level security;
alter table reservations enable row level security;

-- 公開: 有効なメニューのみ閲覧可（顧客側LIFFがメニュー一覧を表示するため）
create policy "menus_public_select_active" on menus
  for select using (is_active = true);

-- ログイン済み（店舗スタッフ）は全メニューを閲覧・編集可
create policy "menus_admin_all" on menus
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "business_hours_admin_all" on business_hours
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "closed_dates_admin_all" on closed_dates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 予約は匿名クライアントから直接読み書きさせず、必ずAPIルート(service role)経由にする
create policy "reservations_admin_all" on reservations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
