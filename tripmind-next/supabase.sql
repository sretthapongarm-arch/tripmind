-- วางใน Supabase > SQL Editor > Run
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  dest text,
  budget numeric,
  data jsonb not null,
  created_at timestamptz default now()
);
-- เปิด RLS โดยไม่มี policy = เบราว์เซอร์อ่าน/เขียนตรงไม่ได้ ต้องผ่าน API ของเราเท่านั้น
alter table trips enable row level security;
