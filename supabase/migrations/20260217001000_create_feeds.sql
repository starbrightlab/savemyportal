-- Create feeds table
create table if not exists feeds (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create feed_sources junction table
create table if not exists feed_sources (
    feed_id uuid references feeds(id) on delete cascade not null,
    source_id uuid references sources(id) on delete cascade not null,
    created_at timestamptz default now(),
    primary key (feed_id, source_id)
);

-- Enable RLS
alter table feeds enable row level security;
alter table feed_sources enable row level security;

-- Feeds Policies
create policy "Users can view their own feeds"
    on feeds for select
    using (auth.uid() = user_id);

create policy "Users can insert their own feeds"
    on feeds for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own feeds"
    on feeds for update
    using (auth.uid() = user_id);

create policy "Users can delete their own feeds"
    on feeds for delete
    using (auth.uid() = user_id);

-- Feed Sources Policies
create policy "Users can view their own feed sources"
    on feed_sources for select
    using (
        exists (
            select 1 from feeds
            where feeds.id = feed_sources.feed_id
            and feeds.user_id = auth.uid()
        )
    );

create policy "Users can insert their own feed sources"
    on feed_sources for insert
    with check (
        exists (
            select 1 from feeds
            where feeds.id = feed_sources.feed_id
            and feeds.user_id = auth.uid()
        )
    );

create policy "Users can delete their own feed sources"
    on feed_sources for delete
    using (
        exists (
            select 1 from feeds
            where feeds.id = feed_sources.feed_id
            and feeds.user_id = auth.uid()
        )
    );

-- Indexes
create index if not exists idx_feeds_user_id on feeds(user_id);
create index if not exists idx_feed_sources_feed_id on feed_sources(feed_id);
create index if not exists idx_feed_sources_source_id on feed_sources(source_id);
