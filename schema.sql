create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  username text not null check (char_length(username) between 1 and 32),
  caption text not null default '' check (char_length(caption) <= 140),
  filename text not null,
  url text not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

create policy "public can read submissions" on public.submissions
for select to anon, authenticated using (true);

-- The serverless API uses the service role, so browser users never receive it.
-- Create a public Storage bucket named exactly: maggies-world
