create table user_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agreed_to_terms boolean default false,
  agreed_to_privacy boolean default false,
  agreed_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table user_consents enable row level security;

create policy "Users can insert their own consent records"
  on user_consents for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own consent records"
  on user_consents for select
  using (auth.uid() = user_id);
