-- Create sources table
create table if not exists sources (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null check (type in ('google_photos', 'icloud', 'dropbox')),
    url text not null,
    name text,
    last_scraped_at timestamptz,
    status text default 'pending' check (status in ('active', 'error', 'pending')),
    error_message text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, url)
);

-- Create source_items table
create table if not exists source_items (
    id uuid primary key default gen_random_uuid(),
    source_id uuid references sources(id) on delete cascade not null,
    external_id text not null,
    url text not null,
    width integer,
    height integer,
    captured_at timestamptz,
    created_at timestamptz default now(),
    unique(source_id, external_id)
);

-- Enable RLS
alter table sources enable row level security;
alter table source_items enable row level security;

-- Sources Policies
create policy "Users can view receive their own sources"
    on sources for select
    using (auth.uid() = user_id);

create policy "Users can insert their own sources"
    on sources for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own sources"
    on sources for update
    using (auth.uid() = user_id);

create policy "Users can delete their own sources"
    on sources for delete
    using (auth.uid() = user_id);

-- Source Items Policies
-- Users can see items if they own the source
create policy "Users can view items from their sources"
    on source_items for select
    using (
        exists (
            select 1 from sources
            where sources.id = source_items.source_id
            and sources.user_id = auth.uid()
        )
    );

-- We might not need insert/update policies for source_items from the client if only the backend (Edge Function) populates them.
-- However, if we want to allow the client to potentially manage them (unlikely for scraping), we can add them.
-- For now, read-only for client is safer. Service role will bypass RLS.

-- Indexes for performance
create index if not exists idx_sources_user_id on sources(user_id);
create index if not exists idx_source_items_source_id on source_items(source_id);
create index if not exists idx_source_items_created_at on source_items(created_at desc);
