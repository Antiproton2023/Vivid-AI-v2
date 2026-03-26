# Supabase Setup for VividAI

## 1. Project Setup
1. Create a new project in your Supabase dashboard.
2. Go to **Project Settings -> API** and copy your `Project URL` and `anon public` keys.
3. Paste these keys into your local `.env.local` file as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Authentication Setup
1. Go to **Authentication -> Providers** and make sure Email provider is enabled.
2. Note: Disable "Confirm email" if you want to allow users to sign in immediately without verification during development.

## 3. Database Schema
Run the following SQL commands in your Supabase SQL Editor to create the required tables:

```sql
-- 1. Users Table (Extension of Supabase Auth)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: We use an Auth Trigger to automatically insert users into our public table
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Projects Table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  overview text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Project Versions Table
create table public.project_versions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  data jsonb not null,
  prompts text,
  rules text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Setup Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;

-- Policies
create policy "Users can view their own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

create policy "Users can view their own projects" on public.projects for select using (auth.uid() = user_id);
create policy "Users can insert their own projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update their own projects" on public.projects for update using (auth.uid() = user_id);
create policy "Users can delete their own projects" on public.projects for delete using (auth.uid() = user_id);

create policy "Users can view their own project versions" on public.project_versions for select
  using (exists (select 1 from public.projects where id = project_versions.project_id and user_id = auth.uid()));
create policy "Users can insert their own project versions" on public.project_versions for insert
  with check (exists (select 1 from public.projects where id = project_versions.project_id and user_id = auth.uid()));
create policy "Users can update their own project versions" on public.project_versions for update
  using (exists (select 1 from public.projects where id = project_versions.project_id and user_id = auth.uid()));
```
